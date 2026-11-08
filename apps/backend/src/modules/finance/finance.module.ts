import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { Order } from '../../database/entities/order.entity';
import { Wallet } from '../../database/entities/wallet.entity';
import { WalletTransaction } from '../../database/entities/wallet-transaction.entity';
import { User } from '../../database/entities/user.entity';
import { DriverProfile } from '../../database/entities/driver.entity';
import { Merchant } from '../../database/entities/merchant.entity';
import { Payment } from '../../database/entities/payment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      Wallet,
      WalletTransaction,
      User,
      DriverProfile,
      Merchant,
      Payment,
    ]),
  ],
  controllers: [FinanceController],
  providers: [FinanceService],
})
export class FinanceModule {}
