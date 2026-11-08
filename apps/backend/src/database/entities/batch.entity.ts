import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DriverProfile } from './driver.entity';

export enum BatchStatus {
  DRAFT = 'DRAFT',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('delivery_batches')
export class DeliveryBatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { nullable: true })
  driverId: string;

  @ManyToOne(() => DriverProfile, { nullable: true })
  @JoinColumn({ name: 'driverId' })
  driver: DriverProfile;

  @Column({
    type: 'simple-enum',
    enum: BatchStatus,
    default: BatchStatus.DRAFT,
  })
  status: BatchStatus;

  @Column({ type: 'text', nullable: true })
  optimizedRoute: string; // JSON: [{type: 'PICKUP', orderId, lat, lng}, {type: 'DROPOFF', ...}]

  @Column({ type: 'float', default: 0.0 })
  totalDistanceKm: number;

  @Column({ default: 0 })
  estimatedDurationMin: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  completedAt: Date;
}
