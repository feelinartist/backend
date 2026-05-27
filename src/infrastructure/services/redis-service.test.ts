import { describe, it, expect, vi, beforeEach } from 'vitest';
import Redis from 'ioredis';

// Mock ioredis with dynamic event triggering capability
const redisEventCallbacks: Record<string, Function> = {};
let mockConstructorOptions: any = null;
let throwOnConstructor = false;

vi.mock('ioredis', () => {
    return {
        default: class MockRedis {
            constructor(url: string, options: any) {
                if (throwOnConstructor) {
                    throw new Error('Constructor error');
                }
                mockConstructorOptions = options;
            }
            on = vi.fn().mockImplementation((event: string, callback: Function) => {
                redisEventCallbacks[event] = callback;
            });
            get = vi.fn().mockResolvedValue('cached_val');
            set = vi.fn().mockResolvedValue('OK');
            del = vi.fn().mockResolvedValue(1);
            incr = vi.fn().mockResolvedValue(1);
            decr = vi.fn().mockResolvedValue(0);
            zadd = vi.fn().mockResolvedValue(1);
            zrevrange = vi.fn().mockImplementation((key, start, stop, withScores) => {
                if (withScores === 'WITHSCORES') {
                    return Promise.resolve(['member1', '10.5', 'member2', '5.2']);
                }
                return Promise.resolve(['member1', 'member2']);
            });
            zincrby = vi.fn().mockResolvedValue('1.0');
            zrem = vi.fn().mockResolvedValue(1);
            hincrby = vi.fn().mockResolvedValue(1);
            hget = vi.fn().mockResolvedValue('10');
            hsetnx = vi.fn().mockResolvedValue(1);
            scan = vi.fn().mockResolvedValue(['0', ['key1']]);
        }
    };
});

import { RedisService } from './redis-service';

describe('RedisService', () => {
    let service: RedisService;

    beforeEach(() => {
        vi.clearAllMocks();
        process.env.REDIS_URL = 'redis://localhost:6379';
        service = RedisService.getInstance();
        (service as any).client = new Redis('redis://localhost:6379', {});
        (service as any).isConnected = true;
    });

    it('should retrieve a singleton instance', () => {
        const instance1 = RedisService.getInstance();
        const instance2 = RedisService.getInstance();
        expect(instance1).toBe(instance2);
    });

    it('should initialize client correctly and register listeners', async () => {
        // Reset singleton to force re-initialization of initializeClient
        (RedisService as any).instance = null;
        process.env.REDIS_URL = 'redis://localhost:6379';
        
        const inst = RedisService.getInstance();
        expect(inst).toBeDefined();
        
        // Trigger listeners
        if (redisEventCallbacks['connect']) {
            redisEventCallbacks['connect']();
            expect(inst.getIsConnected()).toBe(true);
        }
        if (redisEventCallbacks['error']) {
            redisEventCallbacks['error']({ message: 'Test connection error' });
            expect(inst.getIsConnected()).toBe(false);
        }

        // Test retry strategy
        if (mockConstructorOptions?.retryStrategy) {
            const delay1 = mockConstructorOptions.retryStrategy(1);
            expect(delay1).toBe(50);
            
            const delay4 = mockConstructorOptions.retryStrategy(4);
            expect(delay4).toBe(5000);
        }
    });

    it('should print notice and not initialize client if REDIS_URL is not configured', () => {
        (RedisService as any).instance = null;
        delete process.env.REDIS_URL;
        
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        const inst = RedisService.getInstance();
        
        expect(consoleSpy).toHaveBeenCalledWith('ℹ️ REDIS_URL not configured in .env. Caching is disabled.');
        expect(inst.getClient()).toBeNull();
        expect(inst.getIsConnected()).toBe(false);
        consoleSpy.mockRestore();
    });

    it('should execute basic commands safely', async () => {
        await service.set('key', 'value');
        const getVal = await service.get('key');
        expect(getVal).toBe('cached_val');

        await service.del('key');
        const incrVal = await service.incr('key');
        expect(incrVal).toBe(1);

        const decrVal = await service.decr('key');
        expect(decrVal).toBe(0);
    });

    it('should support sorted sets and ranking methods', async () => {
        await service.zadd('ranking', 10, 'player1');
        const range = await service.zrevrange('ranking', 0, -1);
        expect(range).toEqual(['member1', 'member2']);

        const rangeWithScores = await service.zrevrangeWithScores('ranking', 0, -1);
        expect(rangeWithScores).toEqual([
            { member: 'member1', score: 10.5 },
            { member: 'member2', score: 5.2 }
        ]);

        await service.zincrby('ranking', 1, 'player1');
        await service.zrem('ranking', 'player1');
    });

    it('should support hash operations', async () => {
        const hincr = await service.hincrby('hash', 'field', 1);
        expect(hincr).toBe(1);

        const hget = await service.hget('hash', 'field');
        expect(hget).toBe('10');

        const hsetnx = await service.hsetnx('hash', 'field', 'val');
        expect(hsetnx).toBe(1);
    });

    it('should support scan and basic properties', async () => {
        const scanResult = await service.scan('0', 'MATCH', '*');
        expect(scanResult).toEqual(['0', ['key1']]);

        expect(service.getClient()).toBeDefined();
        expect(service.getIsConnected()).toBe(true);
    });

    it('should return null or default values when client is not initialized or disconnected', async () => {
        (service as any).isConnected = false;
        
        expect(await service.get('key')).toBeNull();
        
        // set, del, zadd, zincrby, zrem should return void/undefined and not call client
        await service.set('key', 'val');
        await service.del('key');
        await service.zadd('key', 1, 'mem');
        await service.zincrby('key', 1, 'mem');
        await service.zrem('key', 'mem');

        expect(await service.incr('key')).toBeNull();
        expect(await service.decr('key')).toBeNull();
        expect(await service.zrevrange('key', 0, -1)).toEqual([]);
        expect(await service.zrevrangeWithScores('key', 0, -1)).toEqual([]);
        expect(await service.hincrby('key', 'field', 1)).toBeNull();
        expect(await service.hget('key', 'field')).toBeNull();
        expect(await service.hsetnx('key', 'field', 'val')).toBeNull();
        expect(await service.scan('0')).toEqual(['0', []]);
    });

    it('should handle errors gracefully when redis client throws', async () => {
        const err = new Error('Redis error');
        vi.spyOn(console, 'error').mockImplementation(() => {});
        
        (service as any).client.get = vi.fn().mockRejectedValue(err);
        (service as any).client.set = vi.fn().mockRejectedValue(err);
        (service as any).client.del = vi.fn().mockRejectedValue(err);
        (service as any).client.incr = vi.fn().mockRejectedValue(err);
        (service as any).client.decr = vi.fn().mockRejectedValue(err);
        (service as any).client.zadd = vi.fn().mockRejectedValue(err);
        (service as any).client.zrevrange = vi.fn().mockRejectedValue(err);
        (service as any).client.zincrby = vi.fn().mockRejectedValue(err);
        (service as any).client.zrem = vi.fn().mockRejectedValue(err);
        (service as any).client.hincrby = vi.fn().mockRejectedValue(err);
        (service as any).client.hget = vi.fn().mockRejectedValue(err);
        (service as any).client.hsetnx = vi.fn().mockRejectedValue(err);
        (service as any).client.scan = vi.fn().mockRejectedValue(err);

        expect(await service.get('key')).toBeNull();
        await service.set('key', 'val');
        await service.del('key');
        expect(await service.incr('key')).toBeNull();
        expect(await service.decr('key')).toBeNull();
        await service.zadd('key', 1, 'mem');
        expect(await service.zrevrange('key', 0, -1)).toEqual([]);
        expect(await service.zrevrangeWithScores('key', 0, -1)).toEqual([]);
        await service.zincrby('key', 1, 'mem');
        await service.zrem('key', 'mem');
        expect(await service.hincrby('key', 'field', 1)).toBeNull();
        expect(await service.hget('key', 'field')).toBeNull();
        expect(await service.hsetnx('key', 'field', 'val')).toBeNull();
        expect(await service.scan('0')).toEqual(['0', []]);
    });

    it('should handle constructor errors', () => {
        (RedisService as any).instance = null;
        process.env.REDIS_URL = 'redis://localhost:6379';
        throwOnConstructor = true;
        
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const inst = RedisService.getInstance();
        
        expect(consoleSpy).toHaveBeenCalledWith('Failed to initialize Redis client:', expect.any(Error));
        expect(inst.getClient()).toBeNull();
        expect(inst.getIsConnected()).toBe(false);
        
        throwOnConstructor = false;
        consoleSpy.mockRestore();
    });
});
