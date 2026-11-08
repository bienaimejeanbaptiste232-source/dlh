import { Injectable, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisService } from '../../common/redis/redis.service';
import { RoutingService, RouteResult } from './routing.service';
import { DriverLocationDto } from './dto/tracking.dto';
import { DriverProfile } from '../../database/entities/driver.entity';
import { Order, OrderStatus } from '../../database/entities/order.entity';

export interface EnrichedLocationUpdate extends DriverLocationDto {
  distanceRemainingKm?: number;
  durationMinutes?: number;
  eta?: Date;
  routePolyline?: Array<{ latitude: number; longitude: number }>;
  isOutdated?: boolean;
}

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  // Mémoire cache en direct des derniers pings pour le calcul de distance & détection des doublons
  private lastDbSaveMap = new Map<string, { lat: number; lng: number; time: number }>();

  // Seuil de déplacement minimum (en mètres) pour déclencher un commit PostgreSQL
  private readonly DB_PERSIST_DISTANCE_METERS = 30;
  // Intervalle de temps maximal (en secondes) entre deux commits PostgreSQL
  private readonly DB_PERSIST_MAX_INTERVAL_SEC = 45;

  constructor(
    @InjectRepository(DriverProfile)
    private readonly driverRepo: Repository<DriverProfile>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly redisService: RedisService,
    private readonly routingService: RoutingService,
  ) {}

  /**
   * Traiter et diffuser la mise à jour de position GPS d'un livreur
   */
  async processDriverLocation(
    authenticatedUserId: string,
    payload: DriverLocationDto,
  ): Promise<EnrichedLocationUpdate | null> {
    // 1. Sécurité : Vérifier que le livreur ne publie que pour son propre compte
    if (payload.driverId !== authenticatedUserId) {
      throw new ForbiddenException('Un livreur ne peut publier sa position que pour son propre compte.');
    }

    const now = Date.now();
    const payloadTime = typeof payload.timestamp === 'number'
      ? payload.timestamp
      : (payload.timestamp ? new Date(payload.timestamp).getTime() : now);

    // 2. Éviter les coordonnées périmées (antérieures à 2 minutes)
    if (now - payloadTime > 120 * 1000) {
      this.logger.warn(`Position GPS ignorée car trop ancienne (${(now - payloadTime) / 1000}s) pour le livreur ${payload.driverId}`);
      return null;
    }

    // 3. Récupérer la dernière position en cache Redis pour vérifier les doublons
    const redisKey = `geo:driver:${payload.driverId}`;
    const previousStr = await this.redisService.get(redisKey);
    let previous: DriverLocationDto | null = null;
    if (previousStr) {
      try {
        previous = JSON.parse(previousStr);
      } catch (_) {}
    }

    // Si les coordonnées sont exactement identiques au centième de mètre près et envoyées il y a moins de 2s, ignorer le doublon
    if (
      previous &&
      Math.abs(previous.latitude - payload.latitude) < 0.00001 &&
      Math.abs(previous.longitude - payload.longitude) < 0.00001
    ) {
      // Déplacement nul, pas besoin de recalculer la route
      return null;
    }

    // 4. Mettre en cache Redis la dernière position (TTL 1 heure)
    await this.redisService.set(redisKey, JSON.stringify(payload), 3600);

    const enriched: EnrichedLocationUpdate = {
      ...payload,
      timestamp: payloadTime,
    };

    // 5. Si le livreur effectue une livraison active, calculer l'itinéraire et l'ETA vers la destination
    if (payload.orderId) {
      const order = await this.orderRepo.findOne({
        where: { id: payload.orderId },
        relations: ['deliveryAddress', 'merchant'],
      });

      if (order && !['DELIVERED', 'CANCELLED'].includes(order.status)) {
        // Enregistrer la clé spécifique à la livraison
        await this.redisService.set(`geo:order:${order.id}`, JSON.stringify(payload), 3600);

        // Déterminer la destination : le restaurant (si avant PICKED_UP) ou l'adresse client
        let destinationLat: number | null = null;
        let destinationLng: number | null = null;

        if (['DRIVER_ASSIGNED', 'DRIVER_ARRIVING'].includes(order.status)) {
          destinationLat = order.merchant?.latitude || null;
          destinationLng = order.merchant?.longitude || null;
        } else {
          destinationLat = order.deliveryAddress?.latitude || null;
          destinationLng = order.deliveryAddress?.longitude || null;
        }

        if (destinationLat && destinationLng) {
          const route: RouteResult = await this.routingService.calculateRoute(
            { latitude: payload.latitude, longitude: payload.longitude },
            { latitude: destinationLat, longitude: destinationLng },
          );

          enriched.distanceRemainingKm = route.distanceKm;
          enriched.durationMinutes = route.durationMinutes;
          enriched.eta = route.eta;
          enriched.routePolyline = route.coordinates;

          // Mettre à jour l'ETA de la commande si nécessaire
          if (order.deliveryEta !== route.eta) {
            await this.orderRepo.update(order.id, { deliveryEta: route.eta });
          }
        }
      }
    }

    // 6. Stratégie de persistance PostgreSQL optimisée (Throttling)
    await this.conditionallyPersistToDatabase(payload);

    return enriched;
  }

  /**
   * Sauvegarder dans PostgreSQL uniquement si le déplacement ou le temps dépasse les seuils
   */
  private async conditionallyPersistToDatabase(payload: DriverLocationDto): Promise<void> {
    const last = this.lastDbSaveMap.get(payload.driverId);
    const now = Date.now();

    let shouldSave = false;

    if (!last) {
      shouldSave = true;
    } else {
      const distanceMeters = this.calculateDistanceMeters(
        last.lat,
        last.lng,
        payload.latitude,
        payload.longitude,
      );
      const secondsElapsed = (now - last.time) / 1000;

      if (
        distanceMeters >= this.DB_PERSIST_DISTANCE_METERS ||
        secondsElapsed >= this.DB_PERSIST_MAX_INTERVAL_SEC
      ) {
        shouldSave = true;
      }
    }

    if (shouldSave) {
      this.lastDbSaveMap.set(payload.driverId, {
        lat: payload.latitude,
        lng: payload.longitude,
        time: now,
      });

      try {
        await this.driverRepo.update(payload.driverId, {
          currentLatitude: payload.latitude,
          currentLongitude: payload.longitude,
          lastLocationUpdate: new Date(),
        });
      } catch (err: any) {
        this.logger.warn(`Erreur mise à jour position DB livreur ${payload.driverId}: ${err.message}`);
      }
    }
  }

  /**
   * Vérifier si un utilisateur a le droit de suivre une commande
   */
  async canUserTrackOrder(userId: string, role: string, orderId: string): Promise<boolean> {
    if (role === 'ADMIN') return true;

    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      select: ['id', 'customerId', 'driverId', 'status'],
    });

    if (!order) return false;

    // Le client propriétaire de la commande
    if (order.customerId === userId) return true;

    // Le livreur assigné à la commande
    if (order.driverId === userId) return true;

    return false;
  }

  /**
   * Obtenir l'état de suivi actuel d'une commande (pour REST API)
   */
  async getOrderTrackingState(orderId: string, userId: string, role: string) {
    const allowed = await this.canUserTrackOrder(userId, role, orderId);
    if (!allowed) {
      throw new ForbiddenException('Vous n’avez pas l’autorisation de suivre cette commande.');
    }

    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['merchant', 'deliveryAddress', 'driver', 'driver.user'],
    });

    if (!order) {
      throw new NotFoundException('Commande introuvable.');
    }

    // Position du livreur en cache Redis
    const redisKey = `geo:order:${orderId}`;
    let latestLocation: any = null;
    const cached = await this.redisService.get(redisKey);

    if (cached) {
      try {
        latestLocation = JSON.parse(cached);
      } catch (_) {}
    } else if (order.driver && order.driver.currentLatitude && order.driver.currentLongitude) {
      // Fallback sur la dernière position enregistrée en DB
      latestLocation = {
        latitude: order.driver.currentLatitude,
        longitude: order.driver.currentLongitude,
        timestamp: order.driver.lastLocationUpdate,
      };
    }

    // Calcul de l'itinéraire s'il y a un livreur
    let routeInfo: RouteResult | null = null;
    if (latestLocation && order.deliveryAddress?.latitude && order.deliveryAddress?.longitude) {
      routeInfo = await this.routingService.calculateRoute(
        { latitude: latestLocation.latitude, longitude: latestLocation.longitude },
        { latitude: order.deliveryAddress.latitude, longitude: order.deliveryAddress.longitude },
      );
    }

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      driver: order.driver ? {
        id: order.driver.id,
        name: `${order.driver.user?.firstName || ''} ${order.driver.user?.lastName || ''}`.trim(),
        phone: order.driver.user?.phoneNumber,
        vehicleType: order.driver.vehicleType,
        licensePlate: order.driver.licensePlate,
        rating: order.driver.ratingAvg,
      } : null,
      restaurant: order.merchant ? {
        name: order.merchant.name,
        address: order.merchant.address,
        latitude: order.merchant.latitude,
        longitude: order.merchant.longitude,
      } : null,
      deliveryAddress: order.deliveryAddress ? {
        addressLine: order.deliveryAddress.streetAddress,
        landmarkDirections: order.deliveryAddress.landmarkDirections,
        latitude: order.deliveryAddress.latitude,
        longitude: order.deliveryAddress.longitude,
      } : null,
      currentDriverLocation: latestLocation,
      route: routeInfo ? {
        distanceKm: routeInfo.distanceKm,
        durationMinutes: routeInfo.durationMinutes,
        eta: routeInfo.eta,
        coordinates: routeInfo.coordinates,
        isRealRoute: routeInfo.isRealRoute,
      } : null,
    };
  }

  /**
   * Mettre à jour le statut et le chauffeur d'une commande
   */
  async setOrderStatus(orderId: string, status: OrderStatus, driverId?: string): Promise<{ orderNumber?: string; driverName?: string }> {
    const updateData: any = { status };
    if (driverId) updateData.driverId = driverId;
    await this.orderRepo.update({ id: orderId }, updateData);

    let orderNumber: string | undefined;
    let driverName: string | undefined;
    try {
      const order = await this.orderRepo.findOne({
        where: { id: orderId },
        relations: ['driver', 'driver.user'],
      });
      if (order) {
        orderNumber = order.orderNumber;
        if (order.driver?.user) {
          driverName = `${order.driver.user.firstName} ${order.driver.user.lastName}`.trim();
        }
      }
    } catch (_) {}

    // Sync direct to Supabase si configure
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from('orders').update({
          status,
          ...(driverId ? { driverId } : {}),
          updatedAt: new Date().toISOString(),
        }).eq('id', orderId);
      } catch (err: any) {
        this.logger.warn(`Sync Supabase erè: ${err.message}`);
      }
    }

    this.logger.log(`Commande ${orderId} (#${orderNumber}) mise à jour: ${status} (driver: ${driverName || driverId || 'none'})`);
    return { orderNumber, driverName };
  }

  /**
   * Réinitialiser le chauffeur assigné si la mission est rejetée ou expirée
   */
  async resetOrderDriver(orderId: string): Promise<{ orderNumber?: string }> {
    await this.orderRepo.update({ id: orderId }, { driverId: null, status: OrderStatus.CONFIRMED });

    let orderNumber: string | undefined;
    try {
      const order = await this.orderRepo.findOne({ where: { id: orderId } });
      if (order) orderNumber = order.orderNumber;
    } catch (_) {}

    // Sync direct to Supabase si configure
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from('orders').update({
          driverId: null,
          status: 'CONFIRMED',
          updatedAt: new Date().toISOString(),
        }).eq('id', orderId);
      } catch (err: any) {
        this.logger.warn(`Reset Supabase erè: ${err.message}`);
      }
    }

    this.logger.log(`Commande ${orderId} (#${orderNumber}) réinitialisée pour redispatch`);
    return { orderNumber };
  }

  /**
   * Arrêter le suivi et purger la clé Redis quand la livraison est terminée
   */
  async finalizeOrderTracking(orderId: string): Promise<void> {
    await this.redisService.del(`geo:order:${orderId}`);
    this.logger.log(`Suivi GPS terminé et purgé pour la commande ${orderId}`);
  }

  private calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Rayon en mètres
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}
