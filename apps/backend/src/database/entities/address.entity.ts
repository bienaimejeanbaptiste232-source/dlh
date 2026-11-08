import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { DeliveryZone } from './zone.entity';

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ default: 'Maison' })
  title: string;

  @Column()
  streetAddress: string;

  @Column({ type: 'text', nullable: true })
  landmarkDirections: string; // Repères visuels en Haïti (ex: "En face de la pharmacie, portail vert")

  @Column({ type: 'float' })
  latitude: number;

  @Column({ type: 'float' })
  longitude: number;

  @Column('uuid', { nullable: true })
  zoneId: string;

  @ManyToOne(() => DeliveryZone, { nullable: true })
  @JoinColumn({ name: 'zoneId' })
  zone: DeliveryZone;

  @CreateDateColumn()
  createdAt: Date;
}
