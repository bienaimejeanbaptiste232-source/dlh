import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';
import { DeliveryZone } from '../../database/entities/zone.entity';
import { Merchant } from '../../database/entities/merchant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DeliveryZone, Merchant])],
  controllers: [PricingController],
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}
