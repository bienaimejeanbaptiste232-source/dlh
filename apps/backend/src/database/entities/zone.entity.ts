import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('delivery_zones')
export class DeliveryZone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // Ex: "Pétion-Ville & Environs"

  @Column({ type: 'text', nullable: true })
  polygonCoordinates: string; // JSON stringifié des coordonnées

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'float', default: 150.0 })
  baseDeliveryFee: number; // en HTG

  @Column({ type: 'float', default: 35.0 })
  perKmFee: number; // en HTG / km

  @Column({ type: 'float', default: 1.0 })
  surgeMultiplier: number;

  @CreateDateColumn()
  createdAt: Date;
}
