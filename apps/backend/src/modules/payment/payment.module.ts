import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { MoncashService } from './moncash.service';
import { Payment } from '../../database/entities/payment.entity';
import { Order } from '../../database/entities/order.entity';
import { AdminAuditLog } from '../../database/entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Order, AdminAuditLog]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, MoncashService],
  exports: [PaymentService, MoncashService],
})
export class PaymentModule {}
