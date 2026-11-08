import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus, PaymentStatus } from '../../database/entities/order.entity';
import { OrderItem } from '../../database/entities/order-item.entity';
import { Product } from '../../database/entities/product.entity';
import { Address } from '../../database/entities/address.entity';
import { Merchant } from '../../database/entities/merchant.entity';
import { Payment } from '../../database/entities/payment.entity';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/orders.dto';
import { PricingService } from '../pricing/pricing.service';
import { TrackingGateway } from '../tracking/tracking.gateway';
import { DeliveriesService } from '../deliveries/deliveries.service';
import { BatchDeliveryService } from '../batch-delivery/batch-delivery.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Address)
    private readonly addressRepo: Repository<Address>,
    @InjectRepository(Merchant)
    private readonly merchantRepo: Repository<Merchant>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly pricingService: PricingService,
    private readonly trackingGateway: TrackingGateway,
    private readonly deliveriesService: DeliveriesService,
    private readonly batchService: BatchDeliveryService,
  ) {}

  async createOrder(customerId: string, dto: CreateOrderDto) {
    let address = dto.deliveryAddressId
      ? await this.addressRepo.findOne({ where: { id: dto.deliveryAddressId } }).catch(() => null)
      : null;
    if (!address) {
      address = await this.addressRepo.findOne({ where: { userId: customerId } }).catch(() => null);
      if (!address) {
        address = await this.addressRepo.save({
          userId: customerId,
          title: 'Livrezon',
          streetAddress: typeof dto.deliveryAddressId === 'string' && dto.deliveryAddressId.length > 3 ? dto.deliveryAddressId : 'Cap-Haïtien, Haïti',
          latitude: 19.7550,
          longitude: -72.2050,
        });
      }
    }

    const merchant = await this.merchantRepo.findOne({ where: { id: dto.merchantId } });
    if (!merchant) throw new NotFoundException('Restaurant introuvable');

    if (!merchant.isOpen) {
      throw new BadRequestException('Cet établissement est actuellement fermé.');
    }

    // Récupérer et vérifier chaque produit
    const quoteItems = [];
    const fullProducts = [];

    for (const itemDto of dto.items) {
      const prod = await this.productRepo.findOne({ where: { id: itemDto.productId, merchantId: merchant.id } });
      if (!prod || !prod.isAvailable) {
        throw new BadRequestException(`Le produit sélectionné (${itemDto.productId}) n'est plus disponible.`);
      }
      quoteItems.push({ productId: prod.id, price: prod.price, quantity: itemDto.quantity });
      fullProducts.push({ product: prod, quantity: itemDto.quantity, options: itemDto.selectedOptions });
    }

    // Calcul dynamique officiel du prix
    const quote = await this.pricingService.calculateQuote({
      merchantId: merchant.id,
      items: quoteItems,
      customerLat: address.latitude,
      customerLng: address.longitude,
      promoCode: dto.promoCode,
    });

    // Génération du numéro de commande unique (ex: HT-2026-00481)
    const count = await this.orderRepo.count();
    const orderNumber = `HT-2026-${String(count + 101).padStart(6, '0')}`;

    const order = this.orderRepo.create({
      orderNumber,
      customerId,
      merchantId: merchant.id,
      deliveryAddressId: address.id,
      status: OrderStatus.CONFIRMED,
      subtotalAmount: quote.subtotal,
      deliveryFee: quote.deliveryFee,
      serviceFee: quote.serviceFee,
      discountAmount: quote.discountAmount,
      totalAmount: quote.total,
      merchantEarnings: quote.merchantEarnings,
      driverEarnings: quote.driverEarnings,
      platformCommission: quote.platformCommission,
      currency: quote.currency,
      paymentMethod: dto.paymentMethod,
      paymentStatus: PaymentStatus.PENDING,
      prepTimeEstimateMin: quote.estimatedDurationMin,
      notes: dto.notes,
    });

    const savedOrder = await this.orderRepo.save(order);

    // Sauvegarde des lignes de commande
    for (const item of fullProducts) {
      await this.orderItemRepo.save({
        orderId: savedOrder.id,
        productId: item.product.id,
        productName: item.product.name,
        unitPrice: item.product.price,
        quantity: item.quantity,
        selectedOptions: item.options ? JSON.stringify(item.options) : null,
        totalItemPrice: item.product.price * item.quantity,
      });
    }

    // Création de l'enregistrement de paiement
    await this.paymentRepo.save({
      orderId: savedOrder.id,
      paymentMethod: dto.paymentMethod,
      amount: quote.total,
      currency: quote.currency,
      status: PaymentStatus.PENDING,
    });

    // Notification WebSocket vers le restaurant et l'administration
    this.trackingGateway.notifyOrderStatusChange(savedOrder.id, OrderStatus.CONFIRMED, {
      orderNumber: savedOrder.orderNumber,
      total: quote.total,
      merchantId: merchant.id,
    });

    // Dispatch automatik: chèche meilleur chofè dès creation kòmand
    // (pa tann restoran — se "Push-Only" model la)
    const fullOrder = await this.orderRepo.findOne({
      where: { id: savedOrder.id },
      relations: ['merchant', 'deliveryAddress', 'customer'],
    });
    if (fullOrder) {
      this.triggerDispatch(fullOrder);
    }

    return await this.findOne(savedOrder.id);
  }

  /**
   * Dispatch otomatik: jwenn meilleur chofè epi voye alèt ba li via WebSocket.
   * Rele chak fwa yon kòmand kreye oswa restoran aksepte.
   */
  private async triggerDispatch(order: Order) {
    const bestDrivers = await this.deliveriesService.findBestDrivers(order);
    if (bestDrivers.length > 0) {
      const topDriver = bestDrivers[0];
      this.logger.log(
        `Dispatch #${order.orderNumber} -> Chofè ${topDriver.driver.id} (Score: ${topDriver.score}, ${topDriver.distanceKm}km)`,
      );
      // Voye done KONPLÈ ba chofè a — tout champ yo bezwen nan dialog la
      this.trackingGateway.notifyDriverNewMission(topDriver.driver.id, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        merchantName: (order.merchant as any)?.name || 'Restoran',
        merchantAddress: (order.merchant as any)?.address || 'Okap',
        merchantLatitude: (order.merchant as any)?.latitude || 19.7625,
        merchantLongitude: (order.merchant as any)?.longitude || -72.1985,
        customerName: (order as any).customer
          ? `${(order as any).customer.firstName} ${(order as any).customer.lastName}`.trim()
          : 'Kliyan',
        customerPhone: (order as any).customer?.phoneNumber || '',
        customerAddress: (order.deliveryAddress as any)?.fullAddress || (order.deliveryAddress as any)?.streetAddress || '',
        customerLatitude: (order.deliveryAddress as any)?.latitude || (order as any)?.latitude || 19.7594,
        customerLongitude: (order.deliveryAddress as any)?.longitude || (order as any)?.longitude || -72.2008,
        customerNote: order.notes || '',
        customerLandmark: (order.deliveryAddress as any)?.landmarkDirections || '',
        deliveryFee: order.driverEarnings || 0,
        totalOrderAmount: order.totalAmount || 0,
        paymentMethod: order.paymentMethod || 'CASH_ON_DELIVERY',
        pickupDistanceKm: topDriver.distanceKm,
        timeoutSeconds: 25,
      }, 25);
    } else {
      this.logger.warn(`Pa gen chofè disponib pou kòmand #${order.orderNumber} — ap tann...`);
    }
  }

  async findOne(id: string) {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['merchant', 'deliveryAddress', 'driver', 'driver.user'],
    });

    if (!order) throw new NotFoundException('Commande introuvable');

    const items = await this.orderItemRepo.find({ where: { orderId: id } });
    return {
      order,
      items,
    };
  }

  async findMyOrders(userId: string) {
    return await this.orderRepo.find({
      where: { customerId: userId },
      relations: ['merchant', 'deliveryAddress'],
      order: { createdAt: 'DESC' },
    });
  }

  async findMerchantOrders(merchantId: string) {
    return await this.orderRepo.find({
      where: { merchantId },
      relations: ['deliveryAddress', 'driver', 'driver.user'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['merchant', 'deliveryAddress'],
    });

    if (!order) throw new NotFoundException('Commande introuvable');

    order.status = dto.status;
    if (dto.reason) {
      order.cancellationReason = dto.reason;
    }

    const saved = await this.orderRepo.save(order);

    // Diffusion du nouvel état en temps réel
    this.trackingGateway.notifyOrderStatusChange(order.id, dto.status);

    // Déclenchement automatique de l'algorithme de Matching quand restoran aksepte
    if (dto.status === OrderStatus.RESTAURANT_ACCEPTED || dto.status === OrderStatus.READY_FOR_PICKUP) {
      // Rele dispatch sou lòd konplè ak relasyon merchant + deliveryAddress + customer
      const fullOrder = await this.orderRepo.findOne({
        where: { id: saved.id },
        relations: ['merchant', 'deliveryAddress', 'customer'],
      });
      if (fullOrder) {
        this.triggerDispatch(fullOrder);
      }
    }

    return saved;
  }

  /**
   * Admin deklanch dispatch manyèlman pou yon kòmand espesifik.
   * Retounen rezilta dispatch la (chofè jwenn oswa non).
   */
  async manualDispatch(orderId: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['merchant', 'deliveryAddress', 'customer'],
    });
    if (!order) throw new NotFoundException(`Kòmand ${orderId} pa jwenn`);

    const bestDrivers = await this.deliveriesService.findBestDrivers(order);
    if (bestDrivers.length === 0) {
      return { dispatched: false, orderId, driverName: null, score: 0 };
    }

    const topDriver = bestDrivers[0];
    await this.triggerDispatch(order);

    return {
      dispatched: true,
      orderId,
      driverId: topDriver.driver.id,
      driverName: topDriver.driver.user
        ? `${topDriver.driver.user.firstName} ${topDriver.driver.user.lastName}`
        : 'Chofè',
      score: topDriver.score,
      distanceKm: topDriver.distanceKm,
    };
  }

  /**
   * Admin asinye yon chofè espesifik ba yon kòmand epi voye alèt WebSocket ba li.
   * Sipòte tou de bazdone lokal SQLite ak Supabase cloud pou zewo erè.
   */
  async manualAssignDriver(orderId: string, driverId: string) {
    let order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['merchant', 'deliveryAddress', 'customer'],
    }).catch(() => null);

    let orderData: any = order;

    // Supabase fallback si kòmand lan te kreye sou Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    let supaClient: any = null;
    if (supabaseUrl && supabaseKey) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        supaClient = createClient(supabaseUrl, supabaseKey);
      } catch (_) {}
    }

    if (!orderData && supaClient) {
      const { data: supaOrder } = await supaClient
        .from('orders')
        .select(`*,
          merchant:merchants(id, name, address, phone),
          customer:users!orders_customerId_fkey(id, firstName, lastName, phoneNumber)`)
        .eq('id', orderId)
        .maybeSingle();

      if (supaOrder) {
        orderData = supaOrder;
      }
    }

    if (!orderData) {
      throw new NotFoundException(`Kòmand ${orderId} pa jwenn`);
    }

    // Chèche non chofè a nan TypeORM oswa Supabase
    let driverName = 'Chofè';
    try {
      const driver = await this.deliveriesService.getDriverProfile(driverId);
      if (driver && driver.user) {
        driverName = `${driver.user.firstName} ${driver.user.lastName}`.trim();
      }
    } catch (_) {}

    if (driverName === 'Chofè' && supaClient) {
      try {
        const { data: sDriver } = await supaClient
          .from('driver_profiles')
          .select('*, user:users(firstName, lastName, phoneNumber)')
          .eq('id', driverId)
          .maybeSingle();
        if (sDriver?.user) {
          driverName = `${sDriver.user.firstName} ${sDriver.user.lastName}`.trim();
        }
      } catch (_) {}
    }

    // 1. Mete a jou baz done lokal si li la
    if (order) {
      order.driverId = driverId;
      order.status = OrderStatus.DRIVER_ASSIGNED;
      await this.orderRepo.save(order);
    }

    // 2. Toujou mete a jou nan Supabase
    if (supaClient) {
      try {
        await supaClient
          .from('orders')
          .update({
            driverId,
            status: 'DRIVER_ASSIGNED',
            updatedAt: new Date().toISOString(),
          })
          .eq('id', orderId);
      } catch (e: any) {
        this.logger.warn(`Erè update Supabase lòd: ${e.message}`);
      }
    }

    const orderNumber = orderData.orderNumber || orderId.slice(0, 8);
    const merchantName = (orderData.merchant as any)?.name || 'Restoran';
    const merchantAddress = (orderData.merchant as any)?.address || 'Okap';
    const merchantLatitude = (orderData.merchant as any)?.latitude || 19.7625;
    const merchantLongitude = (orderData.merchant as any)?.longitude || -72.1985;
    const customerName = (orderData.customer as any)
      ? `${(orderData.customer as any).firstName || ''} ${(orderData.customer as any).lastName || ''}`.trim()
      : 'Kliyan';
    const customerPhone = (orderData.customer as any)?.phoneNumber || '';
    const customerAddress = (orderData.deliveryAddress as any)?.fullAddress || (orderData.deliveryAddress as any)?.streetAddress || orderData.deliveryAddress || 'Adres livrezon';
    const customerLatitude = (orderData.deliveryAddress as any)?.latitude || (orderData as any)?.latitude || 19.7594;
    const customerLongitude = (orderData.deliveryAddress as any)?.longitude || (orderData as any)?.longitude || -72.2008;
    const customerNote = orderData.notes || orderData.notesForDriver || '';
    const customerLandmark = (orderData.deliveryAddress as any)?.landmarkDirections || '';
    const deliveryFee = orderData.driverEarnings || orderData.deliveryFee || 0;
    const totalOrderAmount = orderData.totalAmount || orderData.total || 0;
    const paymentMethod = orderData.paymentMethod || 'CASH_ON_DELIVERY';

    // 3. Notifye chofè a via WebSocket kanal prive
    this.trackingGateway.notifyDriverNewMission(driverId, {
      orderId: orderData.id,
      orderNumber,
      merchantName,
      merchantAddress,
      merchantLatitude,
      merchantLongitude,
      customerName,
      customerPhone,
      customerAddress,
      customerLatitude,
      customerLongitude,
      customerNote,
      customerLandmark,
      deliveryFee,
      totalOrderAmount,
      paymentMethod,
      pickupDistanceKm: 0,
      timeoutSeconds: 25,
    }, 25);

    this.trackingGateway.notifyOrderStatusChange(orderData.id, OrderStatus.DRIVER_ASSIGNED, {
      driverId,
      orderNumber,
      driverName,
    });

    this.logger.log(`⚡ Admin asinye chofè ${driverId} (${driverName}) ba kòmand #${orderNumber}`);
    return {
      id: orderData.id,
      orderNumber,
      driverId,
      driverName,
      status: OrderStatus.DRIVER_ASSIGNED,
    };
  }
}
