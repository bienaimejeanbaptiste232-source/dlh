import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('admin_audit_logs')
export class AdminAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  adminId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'adminId' })
  admin: User;

  @Column()
  action: string; // Ex: 'UPDATE_COMMISSION', 'VERIFY_DRIVER', 'REFUND_ORDER'

  @Column()
  targetEntity: string;

  @Column({ nullable: true })
  targetId: string;

  @Column({ type: 'text', nullable: true })
  details: string; // JSON

  @Column({ nullable: true })
  ipAddress: string;

  @CreateDateColumn()
  createdAt: Date;
}
