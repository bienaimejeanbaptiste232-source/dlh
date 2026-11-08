import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../../database/entities/order.entity';
import { Wallet } from '../../database/entities/wallet.entity';
import { WalletTransaction } from '../../database/entities/wallet-transaction.entity';
import { User, UserRole } from '../../database/entities/user.entity';
import { DriverProfile } from '../../database/entities/driver.entity';
import { Merchant } from '../../database/entities/merchant.entity';
import { Payment, } from '../../database/entities/payment.entity';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private readonly txRepo: Repository<WalletTransaction>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(DriverProfile)
    private readonly driverRepo: Repository<DriverProfile>,
    @InjectRepository(Merchant)
    private readonly merchantRepo: Repository<Merchant>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
  ) {}

  async getDashboardStats() {
    const totalOrders = await this.orderRepo.count();
    const deliveredOrders = await this.orderRepo.count({ where: { status: OrderStatus.DELIVERED } });
    const pendingOrders = await this.orderRepo.count({ where: { status: OrderStatus.PENDING } });
    const activeDrivers = await this.driverRepo.count({ where: { isVerified: true } });
    const totalMerchants = await this.merchantRepo.count({ where: { isVerified: true } });
    const totalUsers = await this.userRepo.count({ where: { role: UserRole.CUSTOMER } });

    // Calcul du chiffre d'affaires (commandes DELIVERED)
    const revenueResult = await this.orderRepo
      .createQueryBuilder('o')
      .select('SUM(o.platformCommission)', 'platformRevenue')
      .addSelect('SUM(o.totalAmount)', 'grossRevenue')
      .addSelect('SUM(o.merchantEarnings)', 'merchantPayouts')
      .addSelect('SUM(o.driverEarnings)', 'driverPayouts')
      .where('o.status = :status', { status: OrderStatus.DELIVERED })
      .getRawOne();

    return {
      orders: {
        total: totalOrders,
        delivered: deliveredOrders,
        pending: pendingOrders,
        completionRate: totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(1) : '0',
      },
      users: {
        totalCustomers: totalUsers,
        activeDrivers,
        totalMerchants,
      },
      revenue: {
        grossRevenue: parseFloat(revenueResult?.grossRevenue || '0'),
        platformRevenue: parseFloat(revenueResult?.platformRevenue || '0'),
        merchantPayouts: parseFloat(revenueResult?.merchantPayouts || '0'),
        driverPayouts: parseFloat(revenueResult?.driverPayouts || '0'),
        currency: 'HTG',
      },
    };
  }

  async getTransactions(page = 1, limit = 20) {
    const [data, total] = await this.txRepo.findAndCount({
      relations: ['wallet'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrders(page = 1, limit = 20, status?: OrderStatus) {
    const where: any = {};
    if (status) where.status = status;

    const [data, total] = await this.orderRepo.findAndCount({
      where,
      relations: ['customer', 'merchant', 'driver', 'driver.user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getWallets(page = 1, limit = 20) {
    const [data, total] = await this.walletRepo.findAndCount({
      relations: ['user'],
      order: { updatedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getDriversReport() {
    const drivers = await this.driverRepo.find({
      relations: ['user'],
      order: { ratingAvg: 'DESC' },
    });

    const report = await Promise.all(
      drivers.map(async (d) => {
        const delivered = await this.orderRepo.count({
          where: { driverId: d.id, status: OrderStatus.DELIVERED },
        });

        const earningsResult = await this.orderRepo
          .createQueryBuilder('o')
          .select('SUM(o.driverEarnings)', 'total')
          .where('o.driverId = :id AND o.status = :status', {
            id: d.id,
            status: OrderStatus.DELIVERED,
          })
          .getRawOne();

        return {
          driverId: d.id,
          fullName: `${d.user?.firstName} ${d.user?.lastName}`,
          phone: d.user?.phoneNumber,
          status: d.status,
          rating: d.ratingAvg,
          totalDeliveries: delivered,
          totalEarnings: parseFloat(earningsResult?.total || '0'),
          walletBalance: d.walletBalance,
          vehicleType: d.vehicleType,
          isVerified: d.isVerified,
        };
      }),
    );

    return report;
  }
}
