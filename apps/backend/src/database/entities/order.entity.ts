import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Merchant } from './merchant.entity';
import { DriverProfile } from './driver.entity';
import { DeliveryBatch } from './batch.entity';
import { Address } from './address.entity';

export enum OrderStatus {
  PENDING = 'PENDING',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  CONFIRMED = 'CONFIRMED',
  RESTAURANT_ACCEPTED = 'RESTAURANT_ACCEPTED',
  PREPARING = 'PREPARING',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  DRIVER_ASSIGNED = 'DRIVER_ASSIGNED',
  DRIVER_ARRIVING = 'DRIVER_ARRIVING',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
  MONCASH = 'MONCASH',
  NATCASH = 'NATCASH',
  CREDIT_CARD = 'CREDIT_CARD',
  WALLET = 'WALLET',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  AUTHORIZED = 'AUTHORIZED',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderNumber: string; // Ex: "HT-2026-0001"

  @Column('uuid')
  customerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @Column('uuid')
  merchantId: string;

  @ManyToOne(() => Merchant)
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant;

  @Column('uuid', { nullable: true })
  driverId: string;

  @ManyToOne(() => DriverProfile, { nullable: true })
  @JoinColumn({ name: 'driverId' })
  driver: DriverProfile;

  @Column('uuid', { nullable: true })
  batchId: string;

  @ManyToOne(() => DeliveryBatch, { nullable: true })
  @JoinColumn({ name: 'batchId' })
  batch: DeliveryBatch;

  @Column('uuid', { nullable: true })
  deliveryAddressId: string;

  @ManyToOne(() => Address, { nullable: true })
  @JoinColumn({ name: 'deliveryAddressId' })
  deliveryAddress: Address;

  @Column({
    type: 'simple-enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  // Ventilation financière
  @Column({ type: 'float', default: 0.0 })
  subtotalAmount: number;

  @Column({ type: 'float', default: 0.0 })
  serviceFee: number;

  @Column({ type: 'float', default: 0.0 })
  deliveryFee: number;

  @Column({ type: 'float', default: 0.0 })
  discountAmount: number;

  @Column({ type: 'float', default: 0.0 })
  totalAmount: number;

  @Column({ type: 'float', default: 0.0 })
  merchantEarnings: number;

  @Column({ type: 'float', default: 0.0 })
  driverEarnings: number;

  @Column({ type: 'float', default: 0.0 })
  platformCommission: number;

  @Column({ default: 'HTG' })
  currency: string;

  @Column({
    type: 'simple-enum',
    enum: PaymentMethod,
    default: PaymentMethod.CASH_ON_DELIVERY,
  })
  paymentMethod: PaymentMethod;

  @Column({
    type: 'simple-enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Column({ default: 20 })
  prepTimeEstimateMin: number;

  @Column({ nullable: true })
  pickupEta: Date;

  @Column({ nullable: true })
  deliveryEta: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  cancellationReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
