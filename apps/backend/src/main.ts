import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  // Serve static uploads (both /uploads and /uploads/ supported)
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  // Validation globale des DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // Retire les champs non déclarés dans les DTOs
      forbidNonWhitelisted: false,
      transform: true,          // Conversion automatique des types
    }),
  );

  // CORS ouvert pour le développement (mobile Flutter + dashboard Next.js)
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');

  console.log('');
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   🚀 DELIVERY HAITI - Backend API Démarré     ║');
  console.log(`║   📡 API REST  : http://localhost:${port}/api/v1  ║`);
  console.log(`║   🔌 WebSocket : ws://localhost:${port}           ║`);
  console.log('║   ☁️ Base de données Cloud : Supabase (Postgres)  ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log('');
  console.log('Endpoints disponibles :');
  console.log(`  POST   http://localhost:${port}/api/v1/auth/register`);
  console.log(`  POST   http://localhost:${port}/api/v1/auth/login`);
  console.log(`  POST   http://localhost:${port}/api/v1/auth/otp/send`);
  console.log(`  POST   http://localhost:${port}/api/v1/auth/otp/verify`);
  console.log(`  GET    http://localhost:${port}/api/v1/auth/me`);
  console.log(`  GET    http://localhost:${port}/api/v1/merchants`);
  console.log(`  GET    http://localhost:${port}/api/v1/merchants/:id`);
  console.log(`  POST   http://localhost:${port}/api/v1/pricing/quote`);
  console.log(`  POST   http://localhost:${port}/api/v1/orders`);
  console.log(`  GET    http://localhost:${port}/api/v1/orders/my-orders`);
  console.log(`  GET    http://localhost:${port}/api/v1/orders/:id`);
  console.log(`  PATCH  http://localhost:${port}/api/v1/orders/:id/status`);
  console.log(`  POST   http://localhost:${port}/api/v1/deliveries/location`);
  console.log(`  GET    http://localhost:${port}/api/v1/deliveries/missions/pending`);
  console.log(`  POST   http://localhost:${port}/api/v1/deliveries/missions/:id/accept`);
  console.log(`  POST   http://localhost:${port}/api/v1/deliveries/missions/:id/confirm-pickup`);
  console.log(`  POST   http://localhost:${port}/api/v1/deliveries/missions/:id/confirm-delivery`);
}

bootstrap();
