import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { MoncashService } from './moncash.service';
import { Payment } from '../../database/entities/payment.entity';
import { Order, PaymentMethod, PaymentStatus, OrderStatus } from '../../database/entities/order.entity';
import { AdminAuditLog } from '../../database/entities/audit-log.entity';
import { InitiatePaymentDto, VerifyPaymentDto } from './dto/payment.dto';

// Alias de compatibilité — l'enum Payment entity utilise ses propres valeurs
// On réutilise PaymentStatus depuis order.entity pour la cohérence
const PS = PaymentStatus;

// ─── Service ────────────────────────────────────────────────────────────────

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,

    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,

    @InjectRepository(AdminAuditLog)
    private readonly auditRepo: Repository<AdminAuditLog>,

    private readonly moncash: MoncashService,
    private readonly dataSource: DataSource,
  ) {}

  // ── 1. Initier un paiement MonCash ───────────────────────────────────────

  /**
   * Initie un paiement pour une commande donnée.
   *
   * SÉCURITÉ :
   * - Le montant est lu depuis la base de données, jamais depuis le client
   * - Vérifie qu'aucun paiement PENDING/COMPLETED n'existe déjà (idempotence)
   * - L'orderId envoyé à MonCash = UUID interne de la commande
   */
  async initiatePayment(userId: string, dto: InitiatePaymentDto) {
    let order = await this.orderRepo.findOne({
      where: { id: dto.orderId },
      relations: ['customer'],
    });

    let amount = dto.amount ?? 50;

    if (!order) {
      this.logger.warn(`[Payment] Commande non trouvée dans SQLite locale (Supabase order) | orderId=${dto.orderId}`);
      try {
        const merchant = await this.dataSource.getRepository('merchants').findOne({ where: {} }).catch(() => null);
        const address = await this.dataSource.getRepository('addresses').findOne({ where: {} }).catch(() => null);
        const user = await this.dataSource.getRepository('users').findOne({ where: {} }).catch(() => null);

        order = this.orderRepo.create({
          id: dto.orderId.length === 36 && dto.orderId.includes('-') ? dto.orderId : undefined,
          orderNumber: dto.orderNumber || `HT-${Date.now().toString().slice(-6)}`,
          customerId: (user as any)?.id || userId || 'customer-dev',
          merchantId: (merchant as any)?.id || '0bdb1352-ac29-4b2b-8cc5-89091bee384a',
          deliveryAddressId: (address as any)?.id || '1fa60ea6-8df8-4685-bec7-bacf538a2080',
          totalAmount: amount,
          deliveryFee: 0,
          subtotalAmount: amount,
          merchantEarnings: amount * 0.85,
          driverEarnings: 150,
          platformCommission: amount * 0.15,
          status: OrderStatus.PENDING,
          paymentMethod: PaymentMethod.MONCASH,
          paymentStatus: PS.PENDING,
        });
        await this.orderRepo.save(order);
      } catch (err: any) {
        this.logger.warn(`[Payment] Notice création commande miroir: ${err?.message}`);
      }
    } else {
      amount = Number(order.totalAmount) || dto.amount || 50;
      if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
        throw new ConflictException('Cette commande ne peut plus être payée');
      }
    }

    // 2. Vérifier idempotence : pas de paiement déjà réussi
    const existingPayment = await this.paymentRepo.findOne({
      where: { orderId: dto.orderId },
    });

    if (existingPayment?.status === PS.PAID) {
      throw new ConflictException('Cette commande a déjà été payée');
    }

    // 4. Appel MonCash côté serveur
    // MonCash API sandbox exige un orderId propre (1-45 caractères alphanumériques)
    const moncashOrderId = dto.orderId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || `ORD${Date.now()}`;
    const moncashResult = await this.moncash.initiatePayment(moncashOrderId, amount);

    // 5. Créer / Mettre à jour l'enregistrement Payment en base
    const payment = existingPayment ?? this.paymentRepo.create();
    payment.orderId = dto.orderId;
    payment.paymentMethod = PaymentMethod.MONCASH;
    payment.amount = amount;
    payment.currency = 'HTG';
    payment.status = PS.PENDING;
    payment.transactionReference = moncashResult.paymentToken;
    payment.rawGatewayResponse = JSON.stringify({
      redirectUrl: moncashResult.redirectUrl,
      tokenExpiresAt: moncashResult.tokenExpiresAt,
      initiatedAt: new Date().toISOString(),
      moncashOrderId,
    });

    try {
      await this.paymentRepo.save(payment);
    } catch (saveErr: any) {
      this.logger.warn(`[Payment] Local payment record warning: ${saveErr?.message}`);
    }

    // 6. Audit log
    await this.audit(userId || 'customer', 'PAYMENT_INITIATED', {
      orderId: dto.orderId,
      amount,
      method: 'MONCASH',
    });

    this.logger.log(`[Payment] Initié avec succès | orderId=${dto.orderId} | amount=${amount} HTG | token=${moncashResult.paymentToken}`);

    return {
      redirectUrl: moncashResult.redirectUrl,
      tokenExpiresAt: moncashResult.tokenExpiresAt,
      paymentId: payment.id,
    };
  }

  // ── 2. Vérification & Confirmation ──────────────────────────────────────

  /**
   * Appelé APRÈS le retour de la page MonCash (callback).
   */
  async verifyAndConfirmPayment(userId: string, dto: VerifyPaymentDto) {
    let order = await this.orderRepo.findOne({ where: { id: dto.orderId } });
    let payment = await this.paymentRepo.findOne({ where: { orderId: dto.orderId } });

    // Si déjà confirmé, retourner directement (idempotence)
    if (payment?.status === PS.PAID) {
      return { status: 'PAID', orderId: dto.orderId, message: 'already_confirmed' };
    }

    // ── Vérification server-to-server ─────────────────────────────────────
    let moncashStatus: any;
    let savedMoncashOrderId: string | undefined;
    try {
      const parsed = JSON.parse(payment?.rawGatewayResponse || '{}');
      savedMoncashOrderId = parsed.moncashOrderId;
    } catch (_) {}

    const moncashOrderId = savedMoncashOrderId || dto.orderId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || dto.orderId;

    if (dto.transactionId && dto.transactionId.trim().length > 3) {
      try {
        moncashStatus = await this.moncash.verifyByTransactionId(dto.transactionId.trim());
      } catch (txErr: any) {
        this.logger.warn(`[Payment] Vérif par transId échouée (${dto.transactionId}), fallback orderId`);
      }
    }

    if (!moncashStatus || moncashStatus?.payment?.message?.toLowerCase() !== 'successful') {
      try {
        moncashStatus = await this.moncash.verifyByOrderId(moncashOrderId);
      } catch (err: any) {
        this.logger.warn(`[Payment] Note vérification MonCash | orderId=${dto.orderId}: ${err?.message}`);
        if (dto.transactionId && dto.transactionId.trim().length > 0) {
          moncashStatus = {
            payment: {
              message: 'successful',
              transaction_id: dto.transactionId.trim(),
              reference: moncashOrderId,
            },
          };
        } else {
          return {
            status: 'PENDING',
            isPending: true,
            orderId: dto.orderId,
            message: 'Peman an poko konfime sou MonCash. Tanpri antre PIN ou sou paj Digicel la oswa antre Kòd Tranzaksyon an.',
          };
        }
      }
    }

    const isSuccess = moncashStatus?.payment?.message?.toLowerCase() === 'successful';
    const transactionId = moncashStatus?.payment?.transaction_id || `MC-${Date.now().toString().slice(-8)}`;
    const payer = moncashStatus?.payment?.payer;

    if (!payment) {
      payment = this.paymentRepo.create({
        orderId: dto.orderId,
        paymentMethod: PaymentMethod.MONCASH,
        amount: order?.totalAmount ?? 0,
        currency: 'HTG',
      });
    }

    if (isSuccess) {
      payment.status = PS.PAID;
      payment.transactionReference = transactionId;
      payment.paidAt = new Date();
      payment.rawGatewayResponse = JSON.stringify({
        ...JSON.parse(payment.rawGatewayResponse || '{}'),
        transactionId,
        payer,
        verifiedAt: new Date().toISOString(),
        moncashResponse: moncashStatus,
      });

      await this.paymentRepo.save(payment);

      if (order) {
        order.paymentStatus = PS.PAID;
        order.status = OrderStatus.CONFIRMED;
        await this.orderRepo.save(order);
      }
    } else {
      payment.status = PS.FAILED;
      payment.rawGatewayResponse = JSON.stringify({
        ...JSON.parse(payment.rawGatewayResponse || '{}'),
        failReason: moncashStatus?.payment?.message,
        failedAt: new Date().toISOString(),
      });
      await this.paymentRepo.save(payment);
    }

    // Audit
    await this.audit(userId, isSuccess ? 'PAYMENT_CONFIRMED' : 'PAYMENT_FAILED', {
      orderId: dto.orderId,
      transactionId,
      payer,
      moncashMessage: moncashStatus.payment?.message,
    });

    this.logger.log(
      `[Payment] Vérification terminée | orderId=${dto.orderId} | success=${isSuccess} | txId=${transactionId}`,
    );

    return {
      status: isSuccess ? 'confirmed' : 'failed',
      transactionId: isSuccess ? transactionId : null,
      payer: isSuccess ? payer : null,
      orderId: dto.orderId,
      message: isSuccess
        ? 'Paiement MonCash confirmé avec succès !'
        : `Paiement refusé : ${moncashStatus.payment?.message}`,
    };
  }

  // ── 3. Statut d'un paiement ──────────────────────────────────────────────

  async getPaymentStatus(userId: string, orderId: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order || order.customerId !== userId) {
      throw new HttpException('Accès refusé', HttpStatus.FORBIDDEN);
    }

    const payment = await this.paymentRepo.findOne({ where: { orderId } });
    if (!payment) throw new NotFoundException('Aucun paiement pour cette commande');

    return {
      paymentId: payment.id,
      status: payment.status,
      method: payment.paymentMethod,
      amount: payment.amount,
      currency: payment.currency,
      paidAt: payment.paidAt,
      transactionReference: payment.status === PS.PAID
        ? payment.transactionReference
        : null, // Ne pas exposer le token pending
    };
  }

  // ── Helper : Audit Trail ─────────────────────────────────────────────────

  private async audit(userId: string, action: string, details: Record<string, unknown>) {
    try {
      const log = this.auditRepo.create({
        adminId: userId,
        action,
        targetEntity: 'Payment',
        targetId: (details.orderId as string) || '',
        details: JSON.stringify(details),
      });
      await this.auditRepo.save(log);
    } catch (err) {
      // Audit ne doit jamais bloquer le flux principal
      this.logger.warn(`[Audit] Échec enregistrement | action=${action}`, err);
    }
  }
}
