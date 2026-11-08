import {
  Entity,
  PrimaryColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum VehicleType {
  MOTORCYCLE = 'MOTORCYCLE',
  BICYCLE = 'BICYCLE',
  CAR = 'CAR',
  VAN = 'VAN',
}

export enum DriverStatus {
  OFFLINE = 'OFFLINE',
  ONLINE = 'ONLINE',
  BUSY = 'BUSY',
  SUSPENDED = 'SUSPENDED',
}

@Entity('drivers')
export class DriverProfile {
  @PrimaryColumn('uuid')
  id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id' })
  user: User;

  @Column({
    type: 'simple-enum',
    enum: VehicleType,
    default: VehicleType.MOTORCYCLE,
  })
  vehicleType: VehicleType;

  @Column({ nullable: true })
  licensePlate: string;

  @Column({ nullable: true })
  identityCardNumber: string;

  @Column({ nullable: true })
  identityCardPhoto: string;

  @Column({ nullable: true })
  driverLicensePhoto: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({
    type: 'simple-enum',
    enum: DriverStatus,
    default: DriverStatus.OFFLINE,
  })
  status: DriverStatus;

  @Column({ type: 'float', default: 5.0 })
  ratingAvg: number;

  @Column({ default: 0 })
  totalRatings: number;

  @Column({ type: 'float', nullable: true })
  currentLatitude: number;

  @Column({ type: 'float', nullable: true })
  currentLongitude: number;

  @Column({ nullable: true })
  lastLocationUpdate: Date;

  @Column({ default: 3 })
  maxActiveOrders: number;

  @Column({ type: 'float', default: 0.0 })
  walletBalance: number;

  @CreateDateColumn()
  createdAt: Date;
}
