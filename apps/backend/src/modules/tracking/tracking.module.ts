import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { TrackingGateway } from './tracking.gateway';
import { TrackingService } from './tracking.service';
import { RoutingService } from './routing.service';
import { TrackingController } from './tracking.controller';
import { DriverProfile } from '../../database/entities/driver.entity';
import { Order } from '../../database/entities/order.entity';
import { RedisModule } from '../../common/redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DriverProfile, Order]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super_secret_jwt_key_delivery_haiti_2026_secure',
    }),
    RedisModule,
  ],
  controllers: [TrackingController],
  providers: [TrackingGateway, TrackingService, RoutingService],
  exports: [TrackingGateway, TrackingService, RoutingService],
})
export class TrackingModule {}
