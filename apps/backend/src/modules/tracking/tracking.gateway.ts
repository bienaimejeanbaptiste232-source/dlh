import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TrackingService } from './tracking.service';
import { DriverLocationDto, SubscribeDeliveryDto } from './dto/tracking.dto';
import { OrderStatus } from '../../database/entities/order.entity';

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    role: string;
    phone?: string;
  };
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/',
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TrackingGateway.name);

  // Registre des souscriptions actives pour chaque client : socketId -> Set<deliveryId>
  private activeSubscriptions = new Map<string, Set<string>>();

  constructor(
    private readonly trackingService: TrackingService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Gestion de la connexion avec authentification JWT
   */
  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (token) {
        try {
          const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_delivery_haiti_2026_secure';
          const payload = this.jwtService.verify(token, { secret });
          client.user = {
            id: payload.sub,
            role: payload.role,
            phone: payload.phone,
          };
          this.logger.log(`Client authentifié connecté : ${client.id} (Utilisateur: ${payload.sub}, Rôle: ${payload.role})`);
        } catch (_) {
          this.logger.debug(`Token invalide pour le client ${client.id}, connexion en mode anonyme/invité.`);
        }
      } else {
        this.logger.debug(`Client connecté sans token : ${client.id}`);
      }

      this.activeSubscriptions.set(client.id, new Set());
    } catch (err: any) {
      this.logger.error(`Erreur connexion socket: ${err.message}`);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client déconnecté du WebSocket : ${client.id}`);
    this.activeSubscriptions.delete(client.id);
  }

  /**
   * Événement 1 : Le livreur envoie sa position GPS en temps réel
   * Nom requis : 'driver:location:update'
   */
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @SubscribeMessage('driver:location:update')
  async handleDriverLocationUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: DriverLocationDto,
  ) {
    try {
      // Déterminer l'ID utilisateur (du token ou du payload si en dev local)
      const userId = client.user?.id || payload.driverId;

      const enriched = await this.trackingService.processDriverLocation(userId, payload);
      if (!enriched) {
        return { status: 'skipped_or_duplicate' };
      }

      // Si le livreur a une commande active, diffuser à la salle de la livraison
      if (payload.orderId) {
        const roomName = `delivery_${payload.orderId}`;
        this.server.to(roomName).emit('delivery:location:updated', {
          deliveryId: payload.orderId,
          driverId: payload.driverId,
          latitude: enriched.latitude,
          longitude: enriched.longitude,
          heading: enriched.heading,
          speed: enriched.speed,
          accuracy: enriched.accuracy,
          distanceRemainingKm: enriched.distanceRemainingKm,
          durationMinutes: enriched.durationMinutes,
          eta: enriched.eta,
          routePolyline: enriched.routePolyline,
          timestamp: enriched.timestamp,
        });
      }

      // Diffuser à la console de supervision Admin globale
      this.server.to('admin_live_dispatch').emit('admin:driver:ping', {
        driverId: payload.driverId,
        orderId: payload.orderId,
        latitude: enriched.latitude,
        longitude: enriched.longitude,
        speed: enriched.speed,
        timestamp: enriched.timestamp,
      });

      return { status: 'acknowledged', timestamp: Date.now() };
    } catch (err: any) {
      this.logger.warn(`Erreur driver:location:update: ${err.message}`);
      return { error: err.message };
    }
  }

  /**
   * Événement 2 : Le client s'abonne au suivi en direct de sa livraison
   * Nom requis : 'delivery:location:subscribe'
   */
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @SubscribeMessage('delivery:location:subscribe')
  async handleSubscribeDelivery(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: SubscribeDeliveryDto,
  ) {
    const deliveryId = payload.deliveryId;
    const userId = client.user?.id;
    const userRole = client.user?.role || 'CUSTOMER';

    // Si authentifié, vérifier les droits d'accès
    if (userId) {
      const allowed = await this.trackingService.canUserTrackOrder(userId, userRole, deliveryId);
      if (!allowed) {
        return { error: 'Accès non autorisé à cette livraison' };
      }
    }

    const roomName = `delivery_${deliveryId}`;
    client.join(roomName);

    const clientSubs = this.activeSubscriptions.get(client.id) || new Set();
    clientSubs.add(deliveryId);
    this.activeSubscriptions.set(client.id, clientSubs);

    this.logger.log(`Client ${client.id} souscrit à la livraison : ${roomName}`);

    // Renvoyer immédiatement l'état actuel de la livraison pour initialiser la carte client
    try {
      const currentState = await this.trackingService.getOrderTrackingState(
        deliveryId,
        userId || 'guest',
        userRole,
      );
      client.emit('delivery:location:updated', {
        deliveryId,
        driverId: currentState.driver?.id,
        latitude: currentState.currentDriverLocation?.latitude,
        longitude: currentState.currentDriverLocation?.longitude,
        distanceRemainingKm: currentState.route?.distanceKm,
        durationMinutes: currentState.route?.durationMinutes,
        eta: currentState.route?.eta,
        routePolyline: currentState.route?.coordinates,
        timestamp: currentState.currentDriverLocation?.timestamp || Date.now(),
        initialState: true,
      });
    } catch (_) {}

    return { status: 'subscribed', deliveryId };
  }

  /**
   * Événement 3 : Le client se désabonne de la livraison
   * Nom requis : 'delivery:location:unsubscribe'
   */
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @SubscribeMessage('delivery:location:unsubscribe')
  handleUnsubscribeDelivery(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: SubscribeDeliveryDto,
  ) {
    const roomName = `delivery_${payload.deliveryId}`;
    client.leave(roomName);

    const clientSubs = this.activeSubscriptions.get(client.id);
    if (clientSubs) {
      clientSubs.delete(payload.deliveryId);
    }

    this.logger.log(`Client ${client.id} a quitté le suivi : ${roomName}`);
    return { status: 'unsubscribed', deliveryId: payload.deliveryId };
  }

  /**
   * Joindre la salle de supervision Admin
   */
  @SubscribeMessage('admin:join')
  @SubscribeMessage('admin:join_dispatch')
  handleJoinAdmin(@ConnectedSocket() client: Socket) {
    client.join('admin_live_dispatch');
    this.logger.log(`Admin client ${client.id} joined admin_live_dispatch`);
    return { status: 'joined_admin_dispatch' };
  }

  /**
   * Notifier le changement de statut de livraison (ex: PREPARING, IN_TRANSIT, DELIVERED)
   * Événement requis : 'delivery:status:updated'
   */
  notifyDeliveryStatusUpdated(deliveryId: string, status: string, metadata?: any) {
    const roomName = `delivery_${deliveryId}`;
    this.server.to(roomName).emit('delivery:status:updated', {
      deliveryId,
      status,
      metadata,
      updatedAt: new Date().toISOString(),
    });

    this.server.to('admin_live_dispatch').emit('admin:order:status_updated', {
      deliveryId,
      status,
      metadata,
    });
    this.server.emit('admin:order:status_updated', {
      deliveryId,
      status,
      metadata,
    });

    if (['DELIVERED', 'CANCELLED'].includes(status)) {
      this.trackingService.finalizeOrderTracking(deliveryId);
    }
  }

  // Alias pour les modules existants (DeliveriesService & OrdersService)
  async handleDriverLocation(client: AuthenticatedSocket, payload: any) {
    return this.handleDriverLocationUpdate(client, payload);
  }

  notifyOrderStatusChange(orderId: string, status: string, additionalData?: any) {
    this.notifyDeliveryStatusUpdated(orderId, status, additionalData);
  }

  notifyDriverNewMission(driverId: string, missionData: any, timeoutSeconds = 25) {
    if (!this.server) return;
    const privateRoom = `driver_private_${driverId}`;
    const payload = {
      ...missionData,
      timeoutSeconds,
      dispatchedAt: new Date().toISOString(),
    };

    // 1. Envoyer dans la salle privée du chauffeur cible
    this.server.to(privateRoom).emit('driver:mission:incoming', payload);

    // 2. Diffuser un broadcast ciblé avec targetDriverId
    this.server.emit('driver:mission:broadcast', {
      ...payload,
      targetDriverId: driverId,
    });

    this.logger.log(`Mission ${missionData.orderId} -> chofe ${driverId} (room: ${privateRoom})`);

    // 3. Informer le tableau de bord Admin Dispatch
    this.server.to('admin_live_dispatch').emit('admin:mission_dispatched', {
      driverId, missionData, timeoutSeconds, dispatchedAt: new Date().toISOString(),
    });
    this.server.emit('admin:mission_dispatched', {
      driverId, missionData, timeoutSeconds, dispatchedAt: new Date().toISOString(),
    });
  }

  @SubscribeMessage('admin:assign_driver')
  async handleAdminAssignDriver(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { orderId: string; driverId: string },
  ) {
    if (!payload.orderId || !payload.driverId) return { error: 'Paramètres manquants' };
    this.logger.log(`⚡ Admin assign_driver via WebSocket: ${payload.driverId} -> ${payload.orderId}`);

    const supabaseUrl = process.env.SUPABASE_URL || 'https://xwmxgpdkmrzoraibdzrf.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3bXhncGRrbXJ6b3JhaWJkenJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTQyMDYxMywiZXhwIjoyMTA2OTk2NjEzfQ.Bg6Sv7HR35FShSu9QiTpYcYKUq8RrH3tg0IPFYq6zQU';
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supa = createClient(supabaseUrl, supabaseKey);
      const { data: ord } = await supa.from('orders')
        .select('*, merchant:merchants(name,address,latitude,longitude), customer:users!orders_customerId_fkey(firstName,lastName,phoneNumber)')
        .eq('id', payload.orderId)
        .maybeSingle();

      if (ord) {
        this.notifyDriverNewMission(payload.driverId, {
          orderId: ord.id,
          orderNumber: ord.orderNumber || ord.id.slice(0, 8),
          merchantName: ord.merchant?.name || 'Restoran Partenaire',
          merchantAddress: ord.merchant?.address || 'Cap-Haïtien',
          merchantLatitude: ord.merchantLatitude || ord.merchant?.latitude || 19.7625,
          merchantLongitude: ord.merchantLongitude || ord.merchant?.longitude || -72.1985,
          customerName: ord.customer ? `${ord.customer.firstName || ''} ${ord.customer.lastName || ''}`.trim() : 'Kliyan',
          customerPhone: ord.customer?.phoneNumber || '',
          customerAddress: ord.deliveryAddress || 'Cap-Haïtien',
          customerLatitude: ord.deliveryLatitude || 19.7594,
          customerLongitude: ord.deliveryLongitude || -72.2008,
          customerNote: ord.notesForDriver || '',
          customerLandmark: ord.notesForDriver || '',
          deliveryFee: Number(ord.deliveryFee || 250),
          totalOrderAmount: Number(ord.total || 0),
          paymentMethod: ord.paymentMethod || 'CASH_ON_DELIVERY',
          pickupDistanceKm: 0,
          timeoutSeconds: 25,
        }, 25);
        return { status: 'dispatched' };
      }
    } catch (e: any) {
      this.logger.warn(`Erè chache lòd Supabase nan handleAdminAssignDriver: ${e.message}`);
    }

    this.notifyDriverNewMission(payload.driverId, {
      orderId: payload.orderId,
      orderNumber: payload.orderId.slice(0, 8),
      merchantName: 'Restoran Lakay Fritay',
      merchantAddress: 'Boulevard du Cap',
      customerName: 'Kliyan Okap',
      customerPhone: '+509 3700 0000',
      customerAddress: 'Rue 18 Santvil',
      customerNote: '',
      deliveryFee: 250,
      totalOrderAmount: 0,
      paymentMethod: 'CASH_ON_DELIVERY',
      pickupDistanceKm: 0,
      timeoutSeconds: 25,
    }, 25);
    return { status: 'dispatched' };
  }

  @SubscribeMessage('driver:join')
  handleDriverJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { driverId?: string; userId?: string },
  ) {
    const driverId = payload.driverId || client.user?.id;
    if (payload.driverId) {
      const room = `driver_private_${payload.driverId}`;
      client.join(room);
      this.logger.log(`Chofe ${payload.driverId} -> sel prive: ${room}`);
    }
    if (payload.userId && payload.userId !== payload.driverId) {
      const room = `driver_private_${payload.userId}`;
      client.join(room);
      this.logger.log(`Chofe user ${payload.userId} -> sel prive: ${room}`);
    }
    if (client.user?.id && client.user.id !== payload.driverId && client.user.id !== payload.userId) {
      client.join(`driver_private_${client.user.id}`);
    }
    return { status: 'joined', driverId };
  }

  @SubscribeMessage('driver:mission:response')
  async handleDriverMissionResponse(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { orderId: string; accepted: boolean; driverId?: string },
  ) {
    const driverId = client.user?.id || payload.driverId;
    if (!driverId) return { error: 'Non authentifie' };
    this.logger.log(`Chofe ${driverId} ${payload.accepted ? 'AKSEPTE' : 'REFIZE'} #${payload.orderId}`);
    if (payload.accepted) {
      const { orderNumber, driverName } = await this.trackingService.setOrderStatus(payload.orderId, OrderStatus.DRIVER_ASSIGNED, driverId);
      this.notifyOrderStatusChange(payload.orderId, OrderStatus.DRIVER_ASSIGNED, { driverId, orderNumber });
      
      const eventData = {
        orderId: payload.orderId,
        orderNumber: orderNumber || payload.orderId.slice(0, 8),
        driverId,
        driverName: driverName || 'Chofè a',
        status: OrderStatus.DRIVER_ASSIGNED,
        accepted: true,
        message: `🎉 Chofè ${driverName || 'a'} aksepte kòmand #${orderNumber || payload.orderId.slice(0, 8)} avèk siksè!`,
        acceptedAt: new Date().toISOString(),
      };
      this.server.to('admin_live_dispatch').emit('admin:mission_accepted', eventData);
      this.server.emit('admin:mission_accepted', eventData);
    } else {
      const { orderNumber } = await this.trackingService.resetOrderDriver(payload.orderId);
      this.notifyOrderStatusChange(payload.orderId, OrderStatus.CONFIRMED, { driverId: null });
      
      const eventData = {
        orderId: payload.orderId,
        orderNumber: orderNumber || payload.orderId.slice(0, 8),
        driverId,
        status: OrderStatus.CONFIRMED,
        accepted: false,
        message: `⚠️ Chofè a pa aksepte kòmand #${orderNumber || payload.orderId.slice(0, 8)} (refize oswa 25s pase).`,
        rejectedAt: new Date().toISOString(),
      };
      this.server.to('admin_live_dispatch').emit('admin:mission_rejected', eventData);
      this.server.emit('admin:mission_rejected', eventData);
    }
    return { status: payload.accepted ? 'accepted' : 'rejected', orderId: payload.orderId };
  }

  @SubscribeMessage('driver:pickup')
  async handleDriverPickup(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { orderId: string; driverId?: string },
  ) {
    const driverId = client.user?.id || payload.driverId;
    this.logger.log(`Chofe ${driverId} rekipere komand #${payload.orderId}`);
    this.notifyOrderStatusChange(payload.orderId, 'PICKED_UP', { driverId });
    this.server.to(`delivery_${payload.orderId}`).emit('delivery:status:updated', {
      orderId: payload.orderId,
      status: 'PICKED_UP',
      driverId,
    });
    this.server.to('admin_live_dispatch').emit('admin:order_status_updated', {
      orderId: payload.orderId,
      status: 'PICKED_UP',
      driverId,
    });
    return { status: 'acknowledged', orderId: payload.orderId };
  }

  @SubscribeMessage('driver:delivered')
  async handleDriverDelivered(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { orderId: string; driverId?: string },
  ) {
    const driverId = client.user?.id || payload.driverId;
    this.logger.log(`Chofe ${driverId} konfime livrezon fini #${payload.orderId}`);
    this.notifyOrderStatusChange(payload.orderId, 'DELIVERED', { driverId });
    this.server.to(`delivery_${payload.orderId}`).emit('delivery:status:updated', {
      orderId: payload.orderId,
      status: 'DELIVERED',
      driverId,
    });
    this.server.to('admin_live_dispatch').emit('admin:order_status_updated', {
      orderId: payload.orderId,
      status: 'DELIVERED',
      driverId,
    });
    return { status: 'acknowledged', orderId: payload.orderId };
  }
}
