import { CacheProvider } from '../../types';
import Redis from 'ioredis';

class MemoryCache implements CacheProvider {
  private cache = new Map<string, { value: any; expiry: number }>();

  async get(key: string): Promise<any> {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }
}

class RedisCache implements CacheProvider {
  private client: Redis;

  constructor(redisUrl: string) {
    this.client = new Redis(redisUrl);
  }

  async get(key: string): Promise<any> {
    const data = await this.client.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await this.client.set(key, serialized, 'EX', ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }
}

let activeCache: CacheProvider;

export const getCache = (): CacheProvider => {
  if (activeCache) return activeCache;
  
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    activeCache = new RedisCache(redisUrl);
    console.log('CacheProvider initialized: RedisCache');
  } else {
    activeCache = new MemoryCache();
    console.warn('CacheProvider initialized: MemoryCache (Not for Production)');
  }
  
  return activeCache;
};
