import Redis from 'ioredis';

export class RedisService {
    private static instance: RedisService;
    private client: Redis | null = null;
    private isConnected: boolean = false;

    private constructor() {
        this.initializeClient();
    }

    public static getInstance(): RedisService {
        if (!RedisService.instance) {
            RedisService.instance = new RedisService();
        }
        return RedisService.instance;
    }

    private async initializeClient() {
        // Read REDIS_URL from environment variables
        const redisUrl = process.env.REDIS_URL;

        if (!redisUrl) {
            console.log('ℹ️ REDIS_URL not configured in .env. Caching is disabled.');
            return;
        }

        try {
            this.client = new Redis(redisUrl, {
                maxRetriesPerRequest: 1,
                retryStrategy: (times) => {
                    if (times > 3) {
                        console.warn('⚠️ Could not connect to Redis. Retrying in 5s...');
                        return 5000;
                    }
                    return Math.min(times * 50, 2000);
                }
            });

            this.client.on('connect', () => {
                this.isConnected = true;
                console.log('✅ Connected to Redis cache');
            });

            this.client.on('error', (err) => {
                this.isConnected = false;
                console.error('❌ Redis connection error (Caching disabled):', err.message);
            });
        } catch (error) {
            console.error('Failed to initialize Redis client:', error);
        }
    }

    /**
     * Get a value from cache
     */
    public async get(key: string): Promise<string | null> {
        if (!this.client || !this.isConnected) return null;
        try {
            return await this.client.get(key);
        } catch {
            console.error('Error connecting to Redis');
            return null;
        }
    }

    /**
     * Set a value in cache with optional expiry in seconds
     */
    public async set(key: string, value: string, ttlSeconds: number = 3600): Promise<void> {
        if (!this.client || !this.isConnected) return;
        try {
            await this.client.set(key, value, 'EX', ttlSeconds);
        } catch (error) {
            console.error(`Error setting key ${key} in Redis:`, error);
        }
    }

    /**
     * Delete a value from cache
     */
    public async del(key: string): Promise<void> {
        if (!this.client || !this.isConnected) return;
        try {
            await this.client.del(key);
        } catch (error) {
            console.error(`Error deleting key ${key} from Redis:`, error);
        }
    }

    /**
     * Increment a counter atkey
     */
    public async incr(key: string): Promise<number | null> {
        if (!this.client || !this.isConnected) return null;
        try {
            return await this.client.incr(key);
        } catch (error) {
            console.error(`Error incrementing key ${key} in Redis:`, error);
            return null;
        }
    }

    /**
     * Decrement a counter at key
     */
    public async decr(key: string): Promise<number | null> {
        if (!this.client || !this.isConnected) return null;
        try {
            return await this.client.decr(key);
        } catch (error) {
            console.error(`Error decrementing key ${key} in Redis:`, error);
            return null;
        }
    }

    /**
     * Add or update score of a member in a sorted set (Ranking)
     */
    public async zadd(key: string, score: number, member: string): Promise<void> {
        if (!this.client || !this.isConnected) return;
        try {
            await this.client.zadd(key, score, member);
        } catch (error) {
            console.error(`Error in ZADD for key ${key}:`, error);
        }
    }

    /**
     * Get top N members from a sorted set (descending)
     */
    public async zrevrange(key: string, start: number, stop: number): Promise<string[]> {
        if (!this.client || !this.isConnected) return [];
        try {
            return await this.client.zrevrange(key, start, stop);
        } catch (error) {
            console.error(`Error in ZREVRANGE for key ${key}:`, error);
            return [];
        }
    }

    /**
     * Get top N members from a sorted set with scores (descending)
     */
    public async zrevrangeWithScores(key: string, start: number, stop: number): Promise<{ member: string, score: number }[]> {
        if (!this.client || !this.isConnected) return [];
        try {
            const results = await this.client.zrevrange(key, start, stop, 'WITHSCORES');
            const formatted: { member: string, score: number }[] = [];
            for (let i = 0; i < results.length; i += 2) {
                formatted.push({
                    member: results[i],
                    score: parseFloat(results[i + 1])
                });
            }
            return formatted;
        } catch (error) {
            console.error(`Error in ZREVRANGE WITHSCORES for key ${key}:`, error);
            return [];
        }
    }

    /**
     * Increment score of a member in a sorted set (Votación)
     */
    public async zincrby(key: string, increment: number, member: string): Promise<void> {
        if (!this.client || !this.isConnected) return;
        try {
            await this.client.zincrby(key, increment, member);
        } catch (error) {
            console.error(`Error in ZINCRBY for key ${key}:`, error);
        }
    }

    /**
     * Remove a member from a sorted set
     */
    public async zrem(key: string, member: string): Promise<void> {
        if (!this.client || !this.isConnected) return;
        try {
            await this.client.zrem(key, member);
        } catch (error) {
            console.error(`Error in ZREM for key ${key}:`, error);
        }
    }

    /**
     * Get the raw Redis client
     */
    public getClient(): Redis | null {
        return this.client;
    }
}

export const redisService = RedisService.getInstance();
