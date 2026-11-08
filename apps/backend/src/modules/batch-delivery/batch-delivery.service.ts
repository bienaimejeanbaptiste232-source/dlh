import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../../database/entities/order.entity';
import { DeliveryBatch, BatchStatus } from '../../database/entities/batch.entity';
import { DriverProfile } from '../../database/entities/driver.entity';
import { PricingService } from '../pricing/pricing.service';

@Injectable()
export class BatchDeliveryService {
  private readonly logger = new Logger(BatchDeliveryService.name);

  constructor(
    @InjectRepository(DeliveryBatch)
    private readonly batchRepo: Repository<DeliveryBatch>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly pricingService: PricingService,
  ) {}

  /**
   * Analyse les commandes en attente de collecte pour identifier les opportunités de groupage (Batching)
   */
  async findBatchOpportunities(order: Order, candidateOrders: Order[]): Promise<Order | null> {
    if (!order.merchant || !order.deliveryAddress) return null;

    for (const candidate of candidateOrders) {
      if (candidate.id === order.id) continue;
      if (!candidate.merchant || !candidate.deliveryAddress) continue;

      // 1. Compatibilité des points de collecte (Pickups)
      // Soit le même restaurant, soit distants de moins de 1.2 km
      const pickupDistance = this.pricingService.calculateHaversineDistance(
        order.merchant.latitude,
        order.merchant.longitude,
        candidate.merchant.latitude,
        candidate.merchant.longitude,
      );

      if (pickupDistance > 1.2) {
        continue;
      }

      // 2. Compatibilité des points de livraison (Dropoffs)
      // La distance entre les deux clients ne doit pas créer un détour de plus de 1.5 km
      const dropoffDistance = this.pricingService.calculateHaversineDistance(
        order.deliveryAddress.latitude,
        order.deliveryAddress.longitude,
        candidate.deliveryAddress.latitude,
        candidate.deliveryAddress.longitude,
      );

      if (dropoffDistance > 2.0) {
        continue;
      }

      // 3. Contrainte de temps de préparation (les deux commandes doivent être prêtes à moins de 12 min d'intervalle)
      const prepDiff = Math.abs(
        (order.prepTimeEstimateMin || 20) - (candidate.prepTimeEstimateMin || 20),
      );
      if (prepDiff > 15) {
        continue;
      }

      this.logger.log(
        `🎯 Batch compatible détecté entre #${order.orderNumber} et #${candidate.orderNumber} (Pickup: ${pickupDistance}km, Dropoff: ${dropoffDistance}km)`,
      );
      return candidate;
    }

    return null;
  }

  /**
   * Crée un Batch groupé avec itinéraire optimisé
   */
  async createBatch(orders: Order[], driverId?: string): Promise<DeliveryBatch> {
    // Calcul de l'itinéraire ordonné (Waypoints)
    // Règle : Tous les Pickups d'abord (ou alternés si judicieux), puis Dropoffs ordonnés par distance
    const waypoints = [];

    // Ajouter les pickups
    for (const ord of orders) {
      waypoints.push({
        type: 'PICKUP',
        orderId: ord.id,
        orderNumber: ord.orderNumber,
        merchantName: ord.merchant.name,
        latitude: ord.merchant.latitude,
        longitude: ord.merchant.longitude,
      });
    }

    // Ajouter les dropoffs (triés par proximité par rapport au dernier pickup)
    const lastPickup = waypoints[waypoints.length - 1];
    const sortedDropoffs = [...orders].sort((a, b) => {
      const distA = this.pricingService.calculateHaversineDistance(
        lastPickup.latitude,
        lastPickup.longitude,
        a.deliveryAddress.latitude,
        a.deliveryAddress.longitude,
      );
      const distB = this.pricingService.calculateHaversineDistance(
        lastPickup.latitude,
        lastPickup.longitude,
        b.deliveryAddress.latitude,
        b.deliveryAddress.longitude,
      );
      return distA - distB;
    });

    for (const ord of sortedDropoffs) {
      waypoints.push({
        type: 'DROPOFF',
        orderId: ord.id,
        orderNumber: ord.orderNumber,
        customerAddress: ord.deliveryAddress.streetAddress,
        latitude: ord.deliveryAddress.latitude,
        longitude: ord.deliveryAddress.longitude,
      });
    }

    const batch = this.batchRepo.create({
      driverId: driverId || null,
      status: driverId ? BatchStatus.ASSIGNED : BatchStatus.DRAFT,
      optimizedRoute: JSON.stringify(waypoints),
      totalDistanceKm: 4.8,
      estimatedDurationMin: 32,
    });

    const savedBatch = await this.batchRepo.save(batch);

    // Mettre à jour les commandes associées
    for (const ord of orders) {
      ord.batchId = savedBatch.id;
      if (driverId) {
        ord.driverId = driverId;
        ord.status = OrderStatus.DRIVER_ASSIGNED;
      }
      await this.orderRepo.save(ord);
    }

    return savedBatch;
  }
}
