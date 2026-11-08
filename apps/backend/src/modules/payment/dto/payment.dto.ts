import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class InitiatePaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  orderNumber?: string;
}

export class VerifyPaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsOptional()
  @IsString()
  transactionId?: string;
}

