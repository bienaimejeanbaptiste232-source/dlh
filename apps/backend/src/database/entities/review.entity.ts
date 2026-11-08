import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { User } from './user.entity';
import { Merchant } from './merchant.entity';
import { DriverProfile } from './driver.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  orderId: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column('uuid')
  customerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @Column('uuid', { nullable: true })
  merchantId: string;

  @ManyToOne(() => Merchant, { nullable: true })
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant;

  @Column('uuid', { nullable: true })
  driverId: string;

  @ManyToOne(() => DriverProfile, { nullable: true })
  @JoinColumn({ name: 'driverId' })
  driver: DriverProfile;

  @Column({ default: 5 })
  merchantRating: number;

  @Column({ default: 5 })
  driverRating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn()
  createdAt: Date;
}
