import { Redis } from '@upstash/redis';

/**
 * Upstash Redis client configuration
 */
class UpstashRedis {
  private static instance: Redis;

  /**
   * Get Redis client instance (singleton)
   */
  static getClient(): Redis {
    if (!this.instance) {
      if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required');
      }

      this.instance = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    }

    return this.instance;
  }
}

/**
 * Redis utility functions for Twitter management
 */
export class TwitterRedisCache {
  private redis: Redis;

  constructor() {
    this.redis = UpstashRedis.getClient();
  }

  /**
   * Helper method to safely parse data from Redis
   * Handles both string and already parsed object responses
   */
  private safeParseRedisData(data: any): any {
    if (!data) return null;
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (error) {
        console.error('Failed to parse Redis data:', error);
        return null;
      }
    }
    // Data is already parsed by Upstash Redis
    return data;
  }

  /**
   * Cache Twitter account data
   */
  async cacheTwitterAccount(userId: string, accountData: any, ttl: number = 3600): Promise<void> {
    const key = `twitter:account:${userId}`;
    await this.redis.setex(key, ttl, JSON.stringify(accountData));
  }

  /**
   * Get cached Twitter account data
   */
  async getCachedTwitterAccount(userId: string): Promise<any | null> {
    const key = `twitter:account:${userId}`;
    const data = await this.redis.get(key);
    return this.safeParseRedisData(data);
  }

  /**
   * Cache tweet drafts
   */
  async cacheTweetDraft(userId: string, draftId: string, draftData: any, ttl: number = 86400): Promise<void> {
    const key = `twitter:draft:${userId}:${draftId}`;
    await this.redis.setex(key, ttl, JSON.stringify(draftData));
  }

  /**
   * Get cached tweet draft
   */
  async getCachedTweetDraft(userId: string, draftId: string): Promise<any | null> {
    const key = `twitter:draft:${userId}:${draftId}`;
    const data = await this.redis.get(key);
    return this.safeParseRedisData(data);
  }

  /**
   * Get all drafts for a user
   */
  async getUserDrafts(userId: string): Promise<any[]> {
    const pattern = `twitter:draft:${userId}:*`;
    const keys = await this.redis.keys(pattern);
    
    if (keys.length === 0) return [];

    const drafts = await this.redis.mget(...keys);
    return drafts.filter(Boolean).map(draft => JSON.parse(draft as string));
  }

  /**
   * Delete tweet draft from cache
   */
  async deleteTweetDraft(userId: string, draftId: string): Promise<void> {
    const key = `twitter:draft:${userId}:${draftId}`;
    await this.redis.del(key);
  }

  /**
   * Cache tweet analytics
   */
  async cacheTweetAnalytics(tweetId: string, analytics: any, ttl: number = 1800): Promise<void> {
    const key = `twitter:analytics:${tweetId}`;
    await this.redis.setex(key, ttl, JSON.stringify(analytics));
  }

  /**
   * Get cached tweet analytics
   */
  async getCachedTweetAnalytics(tweetId: string): Promise<any | null> {
    const key = `twitter:analytics:${tweetId}`;
    const data = await this.redis.get(key);
    return this.safeParseRedisData(data);
  }

  /**
   * Cache user's posting schedule preferences
   */
  async cacheSchedulePreferences(userId: string, preferences: any, ttl: number = 86400): Promise<void> {
    const key = `twitter:schedule:${userId}`;
    await this.redis.setex(key, ttl, JSON.stringify(preferences));
  }

  /**
   * Get cached schedule preferences
   */
  async getCachedSchedulePreferences(userId: string): Promise<any | null> {
    const key = `twitter:schedule:${userId}`;
    const data = await this.redis.get(key);
    return this.safeParseRedisData(data);
  }

  /**
   * Cache OAuth state for security
   */
  async cacheOAuthState(state: string, data: any, ttl: number = 600): Promise<void> {
    const key = `oauth:state:${state}`;
    await this.redis.setex(key, ttl, JSON.stringify(data));
  }

  /**
   * Get and delete OAuth state (one-time use)
   */
  async getAndDeleteOAuthState(state: string): Promise<any | null> {
    const key = `oauth:state:${state}`;
    const data = await this.redis.get(key);
    if (data) {
      await this.redis.del(key);
      return this.safeParseRedisData(data);
    }
    return null;
  }

  /**
   * Rate limiting for Twitter API calls
   */
  async checkRateLimit(userId: string, endpoint: string, limit: number = 300, window: number = 900): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const key = `rate_limit:${userId}:${endpoint}`;
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, window);
    }

    const ttl = await this.redis.ttl(key);
    const resetTime = Date.now() + (ttl * 1000);

    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
      resetTime,
    };
  }

  /**
   * Cache trending hashtags
   */
  async cacheTrendingHashtags(hashtags: string[], ttl: number = 3600): Promise<void> {
    const key = 'twitter:trending:hashtags';
    await this.redis.setex(key, ttl, JSON.stringify(hashtags));
  }

  /**
   * Get cached trending hashtags
   */
  async getCachedTrendingHashtags(): Promise<string[]> {
    const key = 'twitter:trending:hashtags';
    const data = await this.redis.get(key);
    return this.safeParseRedisData(data) || [];
  }

  /**
   * Cache user session data
   */
  async cacheUserSession(sessionId: string, userData: any, ttl: number = 7200): Promise<void> {
    const key = `session:${sessionId}`;
    await this.redis.setex(key, ttl, JSON.stringify(userData));
  }

  /**
   * Get cached user session
   */
  async getCachedUserSession(sessionId: string): Promise<any | null> {
    const key = `session:${sessionId}`;
    const data = await this.redis.get(key);
    return this.safeParseRedisData(data);
  }

  /**
   * Delete user session
   */
  async deleteUserSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    await this.redis.del(key);
  }

  /**
   * Cache API response for deduplication
   */
  async cacheApiResponse(endpoint: string, params: string, response: any, ttl: number = 300): Promise<void> {
    const key = `api:cache:${endpoint}:${params}`;
    await this.redis.setex(key, ttl, JSON.stringify(response));
  }

  /**
   * Get cached API response
   */
  async getCachedApiResponse(endpoint: string, params: string): Promise<any | null> {
    const key = `api:cache:${endpoint}:${params}`;
    const data = await this.redis.get(key);
    return this.safeParseRedisData(data);
  }

  /**
   * Store temporary data with expiration
   */
  async setTemporary(key: string, data: any, ttl: number): Promise<void> {
    await this.redis.setex(`temp:${key}`, ttl, JSON.stringify(data));
  }

  /**
   * Get temporary data
   */
  async getTemporary(key: string): Promise<any | null> {
    const data = await this.redis.get(`temp:${key}`);
    return this.safeParseRedisData(data);
  }

  /**
   * Delete temporary data
   */
  async deleteTemporary(key: string): Promise<void> {
    await this.redis.del(`temp:${key}`);
  }

  /**
   * Health check for Redis connection
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency?: number }> {
    try {
      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;
      
      return { status: 'healthy', latency };
    } catch (error) {
      console.error('Redis health check failed:', error);
      return { status: 'unhealthy' };
    }
  }

  /**
   * Clear all cache for a user
   */
  async clearUserCache(userId: string): Promise<void> {
    const patterns = [
      `twitter:account:${userId}`,
      `twitter:draft:${userId}:*`,
      `twitter:schedule:${userId}`,
      `rate_limit:${userId}:*`,
    ];

    for (const pattern of patterns) {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    }
  }
}

// Export factory function for lazy instantiation
let twitterCacheInstance: TwitterRedisCache | null = null;

export const getTwitterCache = (): TwitterRedisCache => {
  if (!twitterCacheInstance) {
    twitterCacheInstance = new TwitterRedisCache();
  }
  return twitterCacheInstance;
};

// For backward compatibility - but this will still cause the issue
// TODO: Update all imports to use getTwitterCache() instead

// Export Redis client factory for direct access
export const getRedisClient = () => UpstashRedis.getClient();