import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import {
  User,
  DriverProfile,
  DeliveryZone,
  Merchant,
  Category,
  Product,
  Address,
  DeliveryBatch,
  Order,
  OrderItem,
  Payment,
  Wallet,
  WalletTransaction,
  Review,
  AdminAuditLog,
  PlatformSetting,
} from '../database/entities';

dotenv.config();

export const entities = [
  User,
  DriverProfile,
  DeliveryZone,
  Merchant,
  Category,
  Product,
  Address,
  DeliveryBatch,
  Order,
  OrderItem,
  Payment,
  Wallet,
  WalletTransaction,
  Review,
  AdminAuditLog,
  PlatformSetting,
];

export const getDatabaseConfig = (): TypeOrmModuleOptions => {
  const databaseUrl = process.env.DATABASE_URL;
  const dbType = process.env.DB_TYPE || (databaseUrl ? 'postgres' : 'sqlite');

  if (databaseUrl || dbType === 'postgres') {
    const isSupabaseOrRemote = databaseUrl?.includes('supabase') || process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production';

    if (databaseUrl) {
      return {
        type: 'postgres',
        url: databaseUrl,
        entities,
        synchronize: false, // Disabled - schema managed manually to avoid null constraint errors
        ssl: isSupabaseOrRemote ? { rejectUnauthorized: false } : false,
        logging: process.env.NODE_ENV === 'development',
      };
    }

    return {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres123',
      database: process.env.DB_NAME || 'delivery_haiti',
      entities,
      synchronize: true,
      ssl: isSupabaseOrRemote ? { rejectUnauthorized: false } : false,
      logging: process.env.NODE_ENV === 'development',
    };
  }

  // Configuration de développement rapide (SQLite)
  return {
    type: 'sqlite',
    database: process.env.DB_SQLITE_PATH || path.join(__dirname, '../../data/dev.sqlite'),
    entities,
    synchronize: true,
    logging: false,
  };
};
