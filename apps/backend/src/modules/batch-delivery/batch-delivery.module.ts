import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatchDeliveryService } from './batch-delivery.service';
import { DeliveryBatch } from '../../database/entities/batch.entity';
import { Order } from '../../database/entities/order.entity';
import { DriverProfile } from '../../database/entities/driver.entity';
import { PricingModule } from '../pricing/pricing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeliveryBatch, Order, DriverProfile]),
    PricingModule,
  ],
  providers: [BatchDeliveryService],
  exports: [BatchDeliveryService],
})
export class BatchDeliveryModule {}
