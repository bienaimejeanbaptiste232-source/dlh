import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { MerchantsModule } from './modules/merchants/merchants.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { OrdersModule } from './modules/orders/orders.module';
import { DeliveriesModule } from './modules/deliveries/deliveries.module';
import { BatchDeliveryModule } from './modules/batch-delivery/batch-delivery.module';
import { FinanceModule } from './modules/finance/finance.module';
import { PaymentModule } from './modules/payment/payment.module';
import { PlatformSettingsModule } from './modules/platform-settings/platform-settings.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => getDatabaseConfig(),
    }),
    AuthModule,
    MerchantsModule,
    PricingModule,
    TrackingModule,
    OrdersModule,
    DeliveriesModule,
    BatchDeliveryModule,
    FinanceModule,
    PaymentModule,
    PlatformSettingsModule,
  ],
})
export class AppModule {}
