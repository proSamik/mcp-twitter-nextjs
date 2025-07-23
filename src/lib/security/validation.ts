import { z } from "zod";

/**
 * Security validation schemas for preventing cache poisoning and data injection
 */

// Subscription validation schema
export const SubscriptionStateSchema = z.object({
  hasValidSubscription: z.boolean(),
  tier: z.enum(["monthly", "yearly"]),
  error: z.string().optional(),
  validatedAt: z.number().optional(), // timestamp for freshness check
});

// Customer state validation schema
export const CustomerStateSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  activeSubscriptions: z
    .array(
      z.object({
        id: z.string(),
        status: z.enum(["active", "inactive", "cancelled", "past_due"]),
        productId: z.string(),
        startedAt: z.string().optional(),
        currentPeriodStart: z.string().optional(),
        currentPeriodEnd: z.string().optional(),
      }),
    )
    .optional(),
});

// Rate limit data validation schema
export const RateLimitDataSchema = z.object({
  count: z.number().int().min(0),
  resetTime: z.number().int().min(0),
  windowStart: z.number().int().min(0),
});

// Twitter account cache validation schema
export const TwitterAccountCacheSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string(),
  profileImageUrl: z.string().url().optional(),
  isVerified: z.boolean().optional(),
  followersCount: z.number().int().min(0).optional(),
  followingCount: z.number().int().min(0).optional(),
  tweetCount: z.number().int().min(0).optional(),
  cachedAt: z.number().int(),
});

// Generic cache validation wrapper
export const CacheDataSchema = z.object({
  data: z.any(),
  timestamp: z.number().int(),
  ttl: z.number().int().min(1),
});

/**
 * Validate and sanitize cached subscription data
 */
export function validateSubscriptionCache(
  data: unknown,
): z.infer<typeof SubscriptionStateSchema> | null {
  try {
    const result = SubscriptionStateSchema.safeParse(data);
    if (!result.success) {
      console.warn("Invalid subscription cache data:", result.error.issues);
      return null;
    }

    // Check data freshness (max 5 minutes old)
    const maxAge = 5 * 60 * 1000; // 5 minutes in milliseconds
    const now = Date.now();
    if (result.data.validatedAt && now - result.data.validatedAt > maxAge) {
      console.warn("Subscription cache data is stale");
      return null;
    }

    return result.data;
  } catch (error) {
    console.error("Subscription cache validation error:", error);
    return null;
  }
}

/**
 * Safe JSON parsing with schema validation
 */
export function safeParseWithSchema<T>(
  data: string | unknown,
  schema: z.ZodSchema<T>,
): T | null {
  try {
    let parsed: unknown;

    if (typeof data === "string") {
      // Prevent prototype pollution
      parsed = JSON.parse(data, (key, value) => {
        if (
          key === "__proto__" ||
          key === "constructor" ||
          key === "prototype"
        ) {
          return undefined;
        }
        return value;
      });
    } else {
      parsed = data;
    }

    const result = schema.safeParse(parsed);
    if (!result.success) {
      console.warn("Schema validation failed:", result.error.issues);
      return null;
    }

    return result.data;
  } catch (error) {
    console.error("Safe parse error:", error);
    return null;
  }
}

/**
 * Validate rate limit data from cache
 */
export function validateRateLimitData(
  data: unknown,
): z.infer<typeof RateLimitDataSchema> | null {
  return safeParseWithSchema(data, RateLimitDataSchema);
}

/**
 * Validate Twitter account cache data
 */
export function validateTwitterAccountCache(
  data: unknown,
): z.infer<typeof TwitterAccountCacheSchema> | null {
  const result = safeParseWithSchema(data, TwitterAccountCacheSchema);

  if (result) {
    // Additional security check: ensure cached data is not too old (max 1 hour)
    const maxAge = 60 * 60 * 1000; // 1 hour
    const now = Date.now();
    if (now - result.cachedAt > maxAge) {
      console.warn("Twitter account cache data is stale");
      return null;
    }
  }

  return result;
}

/**
 * Create timestamp for cache validation
 */
export function createCacheTimestamp(): number {
  return Date.now();
}

/**
 * Sanitize user input to prevent injection attacks
 */
export function sanitizeUserInput(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
    .replace(/javascript:/gi, "") // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, "") // Remove event handlers
    .trim()
    .slice(0, 10000); // Limit length to prevent DoS
}

/**
 * Rate limiting validation and enforcement
 */
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export class SecureRateLimiter {
  private inMemoryStore: Map<string, { count: number; resetTime: number }> =
    new Map();

  /**
   * Check rate limit with in-memory fallback
   */
  async checkRateLimit(
    identifier: string,
    config: RateLimitConfig,
    redisData?: unknown,
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    source: "redis" | "memory";
  }> {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Try to use validated Redis data first
    let count = 0;
    let resetTime = now + config.windowMs;
    let source: "redis" | "memory" = "memory";

    if (redisData) {
      const validatedData = validateRateLimitData(redisData);
      if (validatedData && validatedData.windowStart > windowStart) {
        count = validatedData.count;
        resetTime = validatedData.resetTime;
        source = "redis";
      }
    }

    // Fallback to in-memory store if Redis data is invalid or missing
    if (source === "memory") {
      const existing = this.inMemoryStore.get(identifier);
      if (existing && existing.resetTime > now) {
        count = existing.count + 1;
        resetTime = existing.resetTime;
      } else {
        count = 1;
        resetTime = now + config.windowMs;
      }

      this.inMemoryStore.set(identifier, { count, resetTime });

      // Clean up old entries periodically
      this.cleanupOldEntries();
    }

    const allowed = count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - count);

    return {
      allowed,
      remaining,
      resetTime,
      source,
    };
  }

  private cleanupOldEntries(): void {
    const now = Date.now();
    for (const [key, value] of this.inMemoryStore.entries()) {
      if (value.resetTime < now) {
        this.inMemoryStore.delete(key);
      }
    }
  }
}
