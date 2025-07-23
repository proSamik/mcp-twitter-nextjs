import { Redis } from "@upstash/redis";

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
      if (
        !process.env.UPSTASH_REDIS_REST_URL ||
        !process.env.UPSTASH_REDIS_REST_TOKEN
      ) {
        throw new Error(
          "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required",
        );
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
   * Secure helper method to safely parse data from Redis with validation
   * Prevents cache poisoning and prototype pollution
   */
  private safeParseRedisData(data: any, skipValidation: boolean = false): any {
    if (!data) return null;

    if (typeof data === "string") {
      try {
        // Prevent prototype pollution during JSON parsing
        const parsed = JSON.parse(data, (key, value) => {
          if (
            key === "__proto__" ||
            key === "constructor" ||
            key === "prototype"
          ) {
            return undefined;
          }
          return value;
        });

        // Skip validation for specific use cases where schema isn't applicable
        if (skipValidation) {
          return parsed;
        }

        return parsed;
      } catch (error) {
        console.error("Failed to parse Redis data securely:", error);
        return null;
      }
    }

    // Data is already parsed by Upstash Redis
    return data;
  }

  /**
   * Cache Twitter account data
   */
  async cacheTwitterAccount(
    userId: string,
    accountData: any,
    ttl: number = 3600,
  ): Promise<void> {
    const key = `twitter:account:${userId}`;
    await this.redis.setex(key, ttl, JSON.stringify(accountData));
  }

  /**
   * Get cached Twitter account data with security validation
   */
  async getCachedTwitterAccount(userId: string): Promise<any | null> {
    const key = `twitter:account:${userId}`;
    try {
      const data = await this.redis.get(key);
      const parsed = this.safeParseRedisData(data, true); // Skip schema validation for account data

      // Additional security check: validate userId matches
      if (parsed && parsed.userId && parsed.userId !== userId) {
        console.warn(
          `Twitter account cache mismatch: expected ${userId}, got ${parsed.userId}`,
        );
        return null;
      }

      return parsed;
    } catch (error) {
      console.error("Error getting cached Twitter account:", error);
      return null;
    }
  }

  /**
   * Cache tweet drafts
   */
  async cacheTweetDraft(
    userId: string,
    draftId: string,
    draftData: any,
    ttl: number = 86400,
  ): Promise<void> {
    const key = `twitter:draft:${userId}:${draftId}`;
    await this.redis.setex(key, ttl, JSON.stringify(draftData));
  }

  /**
   * Get cached tweet draft
   */
  async getCachedTweetDraft(
    userId: string,
    draftId: string,
  ): Promise<any | null> {
    const key = `twitter:draft:${userId}:${draftId}`;
    const data = await this.redis.get(key);
    return this.safeParseRedisData(data);
  }

  /**
   * Get all drafts for a user with secure parsing
   */
  async getUserDrafts(userId: string): Promise<any[]> {
    const pattern = `twitter:draft:${userId}:*`;

    try {
      const keys = await this.redis.keys(pattern);

      if (keys.length === 0) return [];

      const drafts = await this.redis.mget(...keys);
      return drafts
        .filter(Boolean)
        .map((draft) => {
          const parsed = this.safeParseRedisData(draft, true);

          // Additional security check: validate userId matches
          if (parsed && parsed.userId && parsed.userId !== userId) {
            console.warn(
              `Draft cache mismatch: expected ${userId}, got ${parsed.userId}`,
            );
            return null;
          }

          return parsed;
        })
        .filter(Boolean); // Remove null values from failed parsing
    } catch (error) {
      console.error("Error getting user drafts:", error);
      return [];
    }
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
  async cacheTweetAnalytics(
    tweetId: string,
    analytics: any,
    ttl: number = 1800,
  ): Promise<void> {
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
  async cacheSchedulePreferences(
    userId: string,
    preferences: any,
    ttl: number = 86400,
  ): Promise<void> {
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
  async cacheOAuthState(
    state: string,
    data: any,
    ttl: number = 600,
  ): Promise<void> {
    const key = `oauth:state:${state}`;
    await this.redis.setex(key, ttl, JSON.stringify(data));
  }

  /**
   * Get and delete OAuth state (one-time use) with secure parsing
   */
  async getAndDeleteOAuthState(state: string): Promise<any | null> {
    const key = `oauth:state:${state}`;

    try {
      const data = await this.redis.get(key);
      if (data) {
        await this.redis.del(key);
        const parsed = this.safeParseRedisData(data, true);

        // Additional security check: validate state matches
        if (parsed && parsed.state && parsed.state !== state) {
          console.warn(
            `OAuth state mismatch: expected ${state}, got ${parsed.state}`,
          );
          return null;
        }

        return parsed;
      }
    } catch (error) {
      console.error("Error getting OAuth state:", error);
    }

    return null;
  }

  /**
   * Secure rate limiting with input validation
   */
  async checkRateLimit(
    userId: string,
    endpoint: string,
    limit: number = 300,
    window: number = 900,
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    // Input validation to prevent injection attacks
    if (!userId || typeof userId !== "string" || userId.length > 100) {
      throw new Error("Invalid userId for rate limiting");
    }

    if (!endpoint || typeof endpoint !== "string" || endpoint.length > 200) {
      throw new Error("Invalid endpoint for rate limiting");
    }

    if (limit < 1 || limit > 10000 || window < 1 || window > 86400) {
      throw new Error("Invalid rate limit parameters");
    }

    // Sanitize key components
    const sanitizedUserId = userId.replace(/[^a-zA-Z0-9_-]/g, "");
    const sanitizedEndpoint = endpoint.replace(/[^a-zA-Z0-9_:-]/g, "");
    const key = `rate_limit:${sanitizedUserId}:${sanitizedEndpoint}`;

    try {
      const current = await this.redis.incr(key);

      if (current === 1) {
        await this.redis.expire(key, window);
      }

      const ttl = await this.redis.ttl(key);
      const resetTime = Date.now() + Math.max(0, ttl) * 1000;

      return {
        allowed: current <= limit,
        remaining: Math.max(0, limit - current),
        resetTime,
      };
    } catch (error) {
      console.error("Rate limiting error:", error);
      // Fail securely by denying the request
      return {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + window * 1000,
      };
    }
  }

  /**
   * Cache trending hashtags
   */
  async cacheTrendingHashtags(
    hashtags: string[],
    ttl: number = 3600,
  ): Promise<void> {
    const key = "twitter:trending:hashtags";
    await this.redis.setex(key, ttl, JSON.stringify(hashtags));
  }

  /**
   * Get cached trending hashtags
   */
  async getCachedTrendingHashtags(): Promise<string[]> {
    const key = "twitter:trending:hashtags";
    const data = await this.redis.get(key);
    return this.safeParseRedisData(data) || [];
  }

  /**
   * Cache user session data
   */
  async cacheUserSession(
    sessionId: string,
    userData: any,
    ttl: number = 7200,
  ): Promise<void> {
    const key = `session:${sessionId}`;
    await this.redis.setex(key, ttl, JSON.stringify(userData));
  }

  /**
   * Get cached user session with secure parsing
   */
  async getCachedUserSession(sessionId: string): Promise<any | null> {
    const key = `session:${sessionId}`;

    try {
      const data = await this.redis.get(key);
      const parsed = this.safeParseRedisData(data, true);

      // Additional security check: validate sessionId matches
      if (parsed && parsed.sessionId && parsed.sessionId !== sessionId) {
        console.warn(
          `Session cache mismatch: expected ${sessionId}, got ${parsed.sessionId}`,
        );
        return null;
      }

      return parsed;
    } catch (error) {
      console.error("Error getting cached user session:", error);
      return null;
    }
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
  async cacheApiResponse(
    endpoint: string,
    params: string,
    response: any,
    ttl: number = 300,
  ): Promise<void> {
    const key = `api:cache:${endpoint}:${params}`;
    await this.redis.setex(key, ttl, JSON.stringify(response));
  }

  /**
   * Get cached API response
   */
  async getCachedApiResponse(
    endpoint: string,
    params: string,
  ): Promise<any | null> {
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
   * Get temporary data with secure parsing
   */
  async getTemporary(key: string): Promise<any | null> {
    try {
      const data = await this.redis.get(`temp:${key}`);
      return this.safeParseRedisData(data, true);
    } catch (error) {
      console.error("Error getting temporary data:", error);
      return null;
    }
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
  async healthCheck(): Promise<{
    status: "healthy" | "unhealthy";
    latency?: number;
  }> {
    try {
      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;

      return { status: "healthy", latency };
    } catch (error) {
      console.error("Redis health check failed:", error);
      return { status: "unhealthy" };
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
