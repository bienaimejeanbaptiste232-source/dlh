import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { DeliveryZone } from './zone.entity';

@Entity('merchants')
export class Merchant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  ownerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column()
  name: string;

  @Column({ default: 'RESTAURANT' }) // 'RESTAURANT', 'GROCERY', 'PHARMACY'
  type: string;

  @Column()
  address: string;

  @Column({ type: 'float' })
  latitude: number;

  @Column({ type: 'float' })
  longitude: number;

  @Column('uuid', { nullable: true })
  zoneId: string;

  @ManyToOne(() => DeliveryZone, { nullable: true })
  @JoinColumn({ name: 'zoneId' })
  zone: DeliveryZone;

  @Column()
  phone: string;

  @Column({ nullable: true })
  logoUrl: string;

  @Column({ nullable: true })
  bannerUrl: string;

  @Column({ type: 'float', default: 15.0 })
  commissionRate: number; // Ex: 15%

  @Column({ default: 25 })
  avgPrepTimeMinutes: number;

  @Column({ default: true })
  isOpen: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ type: 'text', nullable: true })
  openingHours: string; // JSON

  @CreateDateColumn()
  createdAt: Date;
}
