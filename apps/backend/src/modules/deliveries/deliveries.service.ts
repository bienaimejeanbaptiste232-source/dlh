import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverProfile, DriverStatus } from '../../database/entities/driver.entity';
import { Order, OrderStatus } from '../../database/entities/order.entity';
import { User } from '../../database/entities/user.entity';
import { Wallet } from '../../database/entities/wallet.entity';
import { WalletTransaction } from '../../database/entities/wallet-transaction.entity';
import { PricingService } from '../pricing/pricing.service';
import { TrackingGateway } from '../tracking/tracking.gateway';

export interface ScoredDriver {
  driver: DriverProfile;
  score: number;
  distanceKm: number;
}

@Injectable()
export class DeliveriesService {
  private readonly logger = new Logger(DeliveriesService.name);

  constructor(
    @InjectRepository(DriverProfile)
    private readonly driverRepo: Repository<DriverProfile>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private readonly txRepo: Repository<WalletTransaction>,
    private readonly pricingService: PricingService,
    private readonly trackingGateway: TrackingGateway,
  ) {}

  /**
   * Algorithme de Matching Intelligent : Trouve les meilleurs livreurs selon les 10 critères
   */
  async findBestDrivers(order: Order): Promise<ScoredDriver[]> {
    const onlineDrivers = await this.driverRepo.find({
      where: {
        status: DriverStatus.ONLINE,
        isVerified: true,
      },
      relations: ['user'],
    });

    if (onlineDrivers.length === 0) {
      this.logger.warn(`Aucun livreur en ligne disponible pour la commande #${order.orderNumber}`);
      return [];
    }

    const scoredList: ScoredDriver[] = [];

    for (const driver of onlineDrivers) {
      if (!driver.currentLatitude || !driver.currentLongitude) continue;

      // 1. Distance au restaurant
      const distKm = this.pricingService.calculateHaversineDistance(
        driver.currentLatitude,
        driver.currentLongitude,
        order.merchant.latitude,
        order.merchant.longitude,
      );

      // Si le livreur est à plus de 7 km dans Port-au-Prince, on l'écarte
      if (distKm > 7.0) continue;

      // Calcul du score de proximité (max 30 pts)
      const distScore = Math.max(0, 30 - distKm * 4);

      // Calcul du score de réputation (max 20 pts)
      const ratingScore = ((driver.ratingAvg || 5.0) / 5.0) * 20;

      // Calcul du score de disponibilité / charge (max 30 pts)
      // Comptage des commandes en cours pour ce livreur
      const activeOrdersCount = await this.orderRepo.count({
        where: {
          driverId: driver.id,
          status: OrderStatus.DRIVER_ASSIGNED,
        },
      });

      if (activeOrdersCount >= (driver.maxActiveOrders || 3)) {
        continue; // Capacité maximale atteinte
      }

      const loadScore = Math.max(0, 30 - activeOrdersCount * 12);

      // Score d'ancienneté / performance (max 20 pts)
      const expScore = Math.min(20, (driver.totalRatings || 0) * 0.2);

      const totalScore = Math.round(distScore + ratingScore + loadScore + expScore);

      scoredList.push({
        driver,
        score: totalScore,
        distanceKm: distKm,
      });
    }

    // Tri par score décroissant
    return scoredList.sort((a, b) => b.score - a.score);
  }

  async updateLocation(driverId: string, lat: number, lng: number) {
    const driver = await this.driverRepo.findOne({ where: { id: driverId } });
    if (!driver) throw new NotFoundException('Profil livreur introuvable');

    driver.currentLatitude = lat;
    driver.currentLongitude = lng;
    driver.lastLocationUpdate = new Date();
    await this.driverRepo.save(driver);

    // Propager via WebSocket pour les cartes actives
    this.trackingGateway.handleDriverLocation(null as any, {
      driverId,
      latitude: lat,
      longitude: lng,
    });

    return { success: true };
  }

  async setStatus(driverId: string, status: DriverStatus) {
    const driver = await this.driverRepo.findOne({ where: { id: driverId } });
    if (!driver) throw new NotFoundException('Profil livreur introuvable');

    driver.status = status;
    return await this.driverRepo.save(driver);
  }

  /**
   * Retourne UNIQUEMENT la mission active assignée à CE livreur spécifique.
   * UN LIVREUR NE PEUT PAS VOIR LES COMMANDES DES AUTRES.
   */
  async getMyActiveMission(driverId: string): Promise<Order | null> {
    const order = await this.orderRepo.findOne({
      where: [
        { driverId, status: OrderStatus.DRIVER_ASSIGNED },
        { driverId, status: OrderStatus.IN_TRANSIT },
        { driverId, status: OrderStatus.PREPARING },
      ] as any,
      relations: ['merchant', 'deliveryAddress'],
      order: { createdAt: 'DESC' },
    });

    return order || null;
  }

  /**
   * Retourne la mission en attente d'acceptation envoyée à CE livreur par le dispatch.
   * Utilisé uniquement si le livreur était hors ligne lors de la notification WebSocket.
   */
  async getPendingDispatchedMission(driverId: string): Promise<Order | null> {
    const order = await this.orderRepo.findOne({
      where: {
        driverId,
        status: OrderStatus.READY_FOR_PICKUP,
      },
      relations: ['merchant', 'deliveryAddress'],
    });

    return order || null;
  }

  async acceptMission(driverId: string, orderId: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['merchant', 'customer'],
    });

    if (!order) throw new NotFoundException('Commande introuvable');
    if (order.driverId && order.driverId !== driverId) {
      throw new BadRequestException('Cette commande a déjà été acceptée par un autre livreur.');
    }

    order.driverId = driverId;
    order.status = OrderStatus.DRIVER_ASSIGNED;
    const saved = await this.orderRepo.save(order);

    // Notifier le client instantanément via WebSocket
    this.trackingGateway.notifyOrderStatusChange(order.id, OrderStatus.DRIVER_ASSIGNED, {
      driverId,
    });

    return saved;
  }

  async confirmPickup(driverId: string, orderId: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId, driverId } });
    if (!order) throw new NotFoundException('Commande non assignée à ce livreur');

    order.status = OrderStatus.IN_TRANSIT;
    const saved = await this.orderRepo.save(order);

    this.trackingGateway.notifyOrderStatusChange(order.id, OrderStatus.IN_TRANSIT);
    return saved;
  }

  async confirmDelivery(driverId: string, orderId: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, driverId },
      relations: ['merchant'],
    });

    if (!order) throw new NotFoundException('Commande introuvable pour ce livreur');
    if (order.status === OrderStatus.DELIVERED) {
      return order;
    }

    order.status = OrderStatus.DELIVERED;
    const savedOrder = await this.orderRepo.save(order);

    // Règlement automatique des soldes (Comptabilité Double-Entrée)
    // 1. Créditer le livreur de ses gains
    const driverWallet = await this.walletRepo.findOne({ where: { userId: driverId } });
    if (driverWallet) {
      driverWallet.balance += order.driverEarnings;
      await this.walletRepo.save(driverWallet);

      await this.txRepo.save({
        walletId: driverWallet.id,
        orderId: order.id,
        type: 'EARNING',
        amount: order.driverEarnings,
        balanceAfter: driverWallet.balance,
        description: `Rémunération course commande #${order.orderNumber}`,
      });
    }

    // 2. Créditer le restaurant de sa part nette
    const merchantWallet = await this.walletRepo.findOne({ where: { userId: order.merchant.ownerId } });
    if (merchantWallet) {
      merchantWallet.balance += order.merchantEarnings;
      await this.walletRepo.save(merchantWallet);

      await this.txRepo.save({
        walletId: merchantWallet.id,
        orderId: order.id,
        type: 'EARNING',
        amount: order.merchantEarnings,
        balanceAfter: merchantWallet.balance,
        description: `Vente nette commande #${order.orderNumber} (après commission)`,
      });
    }

    this.trackingGateway.notifyOrderStatusChange(order.id, OrderStatus.DELIVERED);
    return savedOrder;
  }
  /** Retounen profil chofe pa ID (pou manualAssignDriver) */
  async getDriverProfile(driverId: string): Promise<DriverProfile | null> {
    return this.driverRepo.findOne({
      where: { id: driverId },
      relations: ['user'],
    });
  }

}
