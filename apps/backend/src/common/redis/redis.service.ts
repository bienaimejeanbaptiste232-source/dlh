import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private subscriber: Redis | null = null;
  private isConnected = false;

  // Fallback en mémoire au cas où Redis n'est pas actif localement
  private memoryStore = new Map<string, { value: string; expiresAt?: number }>();
  private memorySubscribers = new Map<string, Set<(message: string) => void>>();

  onModuleInit() {
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
    const redisPassword = process.env.REDIS_PASSWORD || undefined;

    try {
      this.client = new Redis({
        host: redisHost,
        port: redisPort,
        password: redisPassword,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.warn(`Redis non joignable sur ${redisHost}:${redisPort}. Utilisation du fallback mémoire in-process.`);
            return null; // Arrêter les tentatives automatiques
          }
          return Math.min(times * 1000, 3000);
        },
      });

      this.client.connect().then(() => {
        this.isConnected = true;
        this.logger.log(`Connecté avec succès à Redis [${redisHost}:${redisPort}]`);

        // Initialiser le subscriber
        this.subscriber = this.client!.duplicate();
      }).catch((err) => {
        this.isConnected = false;
        this.logger.warn(`Mode Standalone: Redis indisponible (${err.message}). Bascule automatique sur MemoryStore haute performance.`);
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        this.logger.debug(`Redis ping notice: ${err.message}`);
      });
    } catch (e: any) {
      this.logger.warn(`Initialisation Redis fallback: ${e.message}`);
    }
  }

  async onModuleDestroy() {
    if (this.client && this.isConnected) {
      await this.client.quit();
    }
    if (this.subscriber && this.isConnected) {
      await this.subscriber.quit();
    }
  }

  // Stocker une clé avec TTL optionnel (en secondes)
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch (err) {
        this.logger.warn(`Erreur Redis set, bascule mémoire: ${err}`);
      }
    }

    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.memoryStore.set(key, { value, expiresAt });
  }

  // Récupérer une clé
  async get(key: string): Promise<string | null> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.get(key);
      } catch (err) {
        this.logger.warn(`Erreur Redis get, bascule mémoire: ${err}`);
      }
    }

    const item = this.memoryStore.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.memoryStore.delete(key);
      return null;
    }
    return item.value;
  }

  // Supprimer une clé
  async del(key: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
        return;
      } catch (_) {}
    }
    this.memoryStore.delete(key);
  }

  // Publier un événement sur un canal Redis
  async publish(channel: string, message: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.publish(channel, message);
        return;
      } catch (_) {}
    }

    const listeners = this.memorySubscribers.get(channel);
    if (listeners) {
      listeners.forEach((cb) => cb(message));
    }
  }

  // Souscrire à un canal
  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    if (this.isConnected && this.subscriber) {
      try {
        await this.subscriber.subscribe(channel);
        this.subscriber.on('message', (ch, msg) => {
          if (ch === channel) callback(msg);
        });
        return;
      } catch (_) {}
    }

    if (!this.memorySubscribers.has(channel)) {
      this.memorySubscribers.set(channel, new Set());
    }
    this.memorySubscribers.get(channel)!.add(callback);
  }
}
