import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from '../../database/entities/order.entity';
import { OrderItem } from '../../database/entities/order-item.entity';
import { Product } from '../../database/entities/product.entity';
import { Address } from '../../database/entities/address.entity';
import { Merchant } from '../../database/entities/merchant.entity';
import { Payment } from '../../database/entities/payment.entity';
import { PricingModule } from '../pricing/pricing.module';
import { TrackingModule } from '../tracking/tracking.module';
import { DeliveriesModule } from '../deliveries/deliveries.module';
import { BatchDeliveryModule } from '../batch-delivery/batch-delivery.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Product, Address, Merchant, Payment]),
    PricingModule,
    TrackingModule,
    DeliveriesModule,
    BatchDeliveryModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
