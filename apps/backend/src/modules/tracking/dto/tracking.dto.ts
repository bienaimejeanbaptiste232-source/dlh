import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsUUID,
} from 'class-validator';

export class DriverLocationDto {
  @IsUUID()
  driverId: string;

  @IsOptional()
  @IsUUID()
  orderId?: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  accuracy?: number; // En mètres

  @IsOptional()
  @IsNumber()
  @Min(0)
  speed?: number; // En m/s

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  heading?: number; // Cap en degrés (0-360)

  @IsOptional()
  timestamp?: number | string;
}

export class SubscribeDeliveryDto {
  @IsUUID()
  deliveryId: string;
}
