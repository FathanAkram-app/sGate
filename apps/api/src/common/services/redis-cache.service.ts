import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  serialize?: boolean; // Whether to JSON serialize/deserialize
}

@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private redis: Redis;
  private connected = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeRedis();
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.disconnect();
    }
  }

  private async initializeRedis() {
    const redisUrl = this.configService.get<string>('redis.url');
    
    if (!redisUrl) {
      this.logger.warn('Redis URL not configured, caching disabled');
      return;
    }

    try {
      this.redis = new Redis(redisUrl, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: this.configService.get<number>('redis.connectTimeout'),
        keyPrefix: this.configService.get<string>('redis.prefix') + ':cache:',
      });

      this.redis.on('connect', () => {
        this.connected = true;
        this.logger.log('Redis cache connected');
      });

      this.redis.on('error', (error) => {
        this.connected = false;
        this.logger.error('Redis cache error:', error);
      });

      this.redis.on('close', () => {
        this.connected = false;
        this.logger.warn('Redis cache connection closed');
      });

      // Test connection
      await this.redis.ping();
      this.logger.log('Redis cache service initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Redis cache:', error);
    }
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const ttl = options?.ttl;
      const serialize = options?.serialize !== false;
      const cacheValue = serialize ? JSON.stringify(value) : (value as string);

      if (ttl) {
        await this.redis.setex(key, ttl, cacheValue);
      } else {
        await this.redis.set(key, cacheValue);
      }

      return true;
    } catch (error) {
      this.logger.error(`Error setting cache key ${key}:`, error);
      return false;
    }
  }

  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const value = await this.redis.get(key);
      
      if (value === null) {
        return null;
      }

      const serialize = options?.serialize !== false;
      return serialize ? JSON.parse(value) : (value as T);
    } catch (error) {
      this.logger.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const result = await this.redis.del(key);
      return result > 0;
    } catch (error) {
      this.logger.error(`Error deleting cache key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking cache key ${key}:`, error);
      return false;
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const result = await this.redis.expire(key, ttl);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error setting expiry for cache key ${key}:`, error);
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    if (!this.isAvailable()) {
      return -1;
    }

    try {
      return await this.redis.ttl(key);
    } catch (error) {
      this.logger.error(`Error getting TTL for cache key ${key}:`, error);
      return -1;
    }
  }

  async mget<T>(keys: string[], options?: CacheOptions): Promise<(T | null)[]> {
    if (!this.isAvailable() || keys.length === 0) {
      return keys.map(() => null);
    }

    try {
      const values = await this.redis.mget(...keys);
      const serialize = options?.serialize !== false;

      return values.map((value) => {
        if (value === null) {
          return null;
        }
        return serialize ? JSON.parse(value) : (value as T);
      });
    } catch (error) {
      this.logger.error('Error getting multiple cache keys:', error);
      return keys.map(() => null);
    }
  }

  async mset(pairs: Array<{ key: string; value: any; ttl?: number }>, options?: CacheOptions): Promise<boolean> {
    if (!this.isAvailable() || pairs.length === 0) {
      return false;
    }

    try {
      const serialize = options?.serialize !== false;
      const pipeline = this.redis.pipeline();

      for (const { key, value, ttl } of pairs) {
        const cacheValue = serialize ? JSON.stringify(value) : (value as string);
        
        if (ttl) {
          pipeline.setex(key, ttl, cacheValue);
        } else {
          pipeline.set(key, cacheValue);
        }
      }

      await pipeline.exec();
      return true;
    } catch (error) {
      this.logger.error('Error setting multiple cache keys:', error);
      return false;
    }
  }

  async clear(pattern?: string): Promise<number> {
    if (!this.isAvailable()) {
      return 0;
    }

    try {
      const searchPattern = pattern || '*';
      const keys = await this.redis.keys(searchPattern);
      
      if (keys.length === 0) {
        return 0;
      }

      const result = await this.redis.del(...keys);
      this.logger.log(`Cleared ${result} cache keys matching pattern: ${searchPattern}`);
      return result;
    } catch (error) {
      this.logger.error(`Error clearing cache with pattern ${pattern}:`, error);
      return 0;
    }
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions,
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, options);
    
    if (cached !== null) {
      return cached;
    }

    // Not in cache, generate value
    const value = await factory();
    
    // Cache the result
    await this.set(key, value, options);
    
    return value;
  }

  async increment(key: string, by: number = 1): Promise<number> {
    if (!this.isAvailable()) {
      return 0;
    }

    try {
      return await this.redis.incrby(key, by);
    } catch (error) {
      this.logger.error(`Error incrementing cache key ${key}:`, error);
      return 0;
    }
  }

  async decrement(key: string, by: number = 1): Promise<number> {
    if (!this.isAvailable()) {
      return 0;
    }

    try {
      return await this.redis.decrby(key, by);
    } catch (error) {
      this.logger.error(`Error decrementing cache key ${key}:`, error);
      return 0;
    }
  }

  async lock(key: string, ttl: number = 30): Promise<string | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const lockKey = `lock:${key}`;
      const lockValue = Math.random().toString(36).substring(2, 15);
      const result = await this.redis.set(lockKey, lockValue, 'EX', ttl, 'NX');
      
      return result === 'OK' ? lockValue : null;
    } catch (error) {
      this.logger.error(`Error acquiring lock for ${key}:`, error);
      return null;
    }
  }

  async unlock(key: string, lockValue: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const lockKey = `lock:${key}`;
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      
      const result = await this.redis.eval(script, 1, lockKey, lockValue);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error releasing lock for ${key}:`, error);
      return false;
    }
  }

  // Health check method
  async healthCheck(): Promise<{ status: string; responseTime?: number; error?: string }> {
    if (!this.redis) {
      return { status: 'unhealthy', error: 'Redis not configured' };
    }

    if (!this.connected) {
      return { status: 'unhealthy', error: 'Redis not connected' };
    }

    try {
      const startTime = Date.now();
      await this.redis.ping();
      const responseTime = Date.now() - startTime;
      
      return { status: 'healthy', responseTime };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  // Get cache statistics
  async getStats(): Promise<{
    connected: boolean;
    usedMemory?: string;
    totalConnections?: number;
    totalCommands?: number;
  }> {
    const stats = { connected: this.connected };

    if (!this.isAvailable()) {
      return stats;
    }

    try {
      const info = await this.redis.info();
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const connectionsMatch = info.match(/total_connections_received:(\d+)/);
      const commandsMatch = info.match(/total_commands_processed:(\d+)/);

      return {
        ...stats,
        usedMemory: memoryMatch ? memoryMatch[1] : undefined,
        totalConnections: connectionsMatch ? parseInt(connectionsMatch[1]) : undefined,
        totalCommands: commandsMatch ? parseInt(commandsMatch[1]) : undefined,
      };
    } catch (error) {
      this.logger.error('Error getting Redis stats:', error);
      return stats;
    }
  }

  private isAvailable(): boolean {
    return this.redis && this.connected;
  }
}