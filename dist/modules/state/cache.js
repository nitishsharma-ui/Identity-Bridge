"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCache = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
class MemoryCache {
    cache = new Map();
    async get(key) {
        const item = this.cache.get(key);
        if (!item)
            return null;
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        return item.value;
    }
    async set(key, value, ttlSeconds = 3600) {
        this.cache.set(key, {
            value,
            expiry: Date.now() + ttlSeconds * 1000,
        });
    }
    async del(key) {
        this.cache.delete(key);
    }
}
class RedisCache {
    client;
    constructor(redisUrl) {
        this.client = new ioredis_1.default(redisUrl);
    }
    async get(key) {
        const data = await this.client.get(key);
        if (!data)
            return null;
        try {
            return JSON.parse(data);
        }
        catch {
            return data;
        }
    }
    async set(key, value, ttlSeconds = 3600) {
        const serialized = typeof value === 'string' ? value : JSON.stringify(value);
        await this.client.set(key, serialized, 'EX', ttlSeconds);
    }
    async del(key) {
        await this.client.del(key);
    }
}
let activeCache;
const getCache = () => {
    if (activeCache)
        return activeCache;
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
        activeCache = new RedisCache(redisUrl);
        console.log('CacheProvider initialized: RedisCache');
    }
    else {
        activeCache = new MemoryCache();
        console.warn('CacheProvider initialized: MemoryCache (Not for Production)');
    }
    return activeCache;
};
exports.getCache = getCache;
