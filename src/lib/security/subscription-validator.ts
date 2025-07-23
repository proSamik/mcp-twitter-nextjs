import { PolarFallbackClient } from "@/lib/polar/client";
import { getTwitterCache } from "@/lib/upstash/redis";
import { validateSubscriptionCache } from "./validation";

/**
 * Server-side subscription validation with fallback mechanisms
 * Prevents client-side bypass attempts and cache poisoning
 */

export interface SubscriptionValidationResult {
  hasValidSubscription: boolean;
  tier: "monthly" | "yearly";
  error?: string;
  source: "cache" | "polar" | "fallback";
  validatedAt: number;
}

export class SecureSubscriptionValidator {
  private polarClient: PolarFallbackClient;
  private cache: ReturnType<typeof getTwitterCache>;
  private inMemoryCache: Map<
    string,
    { result: SubscriptionValidationResult; expiresAt: number }
  > = new Map();

  constructor() {
    this.polarClient = new PolarFallbackClient();
    this.cache = getTwitterCache();
  }

  /**
   * Validate subscription with multiple fallback layers
   */
  async validateSubscription(
    userId: string,
  ): Promise<SubscriptionValidationResult> {
    const now = Date.now();
    const cacheKey = `subscription:${userId}`;

    try {
      // Level 1: Check in-memory cache (fastest)
      const memoryResult = this.inMemoryCache.get(userId);
      if (memoryResult && memoryResult.expiresAt > now) {
        return memoryResult.result;
      }

      // Level 2: Check Redis cache with validation
      try {
        const cached = await this.cache["redis"].get(cacheKey);
        if (cached) {
          const validatedCache = validateSubscriptionCache(cached);
          if (validatedCache) {
            const result: SubscriptionValidationResult = {
              ...validatedCache,
              source: "cache",
              validatedAt: now,
            };

            // Store in memory cache for 1 minute
            this.inMemoryCache.set(userId, {
              result,
              expiresAt: now + 60 * 1000,
            });

            return result;
          }
        }
      } catch (cacheError) {
        console.warn(
          "Redis cache error during subscription validation:",
          cacheError,
        );
      }

      // Level 3: Fetch from Polar API with comprehensive validation
      const result = await this.fetchAndValidateFromPolar(userId);

      // Cache the result with timestamp
      const cacheData = {
        ...result,
        validatedAt: now,
      };

      try {
        // Store in Redis with 3-minute TTL (shorter than before for security)
        await this.cache["redis"].setex(
          cacheKey,
          180,
          JSON.stringify(cacheData),
        );
      } catch (cacheError) {
        console.warn("Failed to cache subscription result:", cacheError);
      }

      // Store in memory cache
      this.inMemoryCache.set(userId, {
        result,
        expiresAt: now + 60 * 1000,
      });

      return result;
    } catch (error) {
      console.error("Subscription validation error:", error);

      // Return secure default state
      const fallbackResult: SubscriptionValidationResult = {
        hasValidSubscription: false,
        tier: "monthly",
        error: "Subscription validation failed",
        source: "fallback",
        validatedAt: now,
      };

      // Cache negative result for 1 minute only
      try {
        await this.cache["redis"].setex(
          cacheKey,
          60,
          JSON.stringify(fallbackResult),
        );
      } catch (cacheError) {
        console.warn("Failed to cache fallback result:", cacheError);
      }

      return fallbackResult;
    }
  }

  /**
   * Fetch subscription data from Polar with validation
   */
  private async fetchAndValidateFromPolar(
    userId: string,
  ): Promise<SubscriptionValidationResult> {
    try {
      const customerState = await this.polarClient.getCustomerState(userId, {
        email: "",
        name: "",
      });

      if (!customerState) {
        return {
          hasValidSubscription: false,
          tier: "monthly",
          error: "No customer state available",
          source: "polar",
          validatedAt: Date.now(),
        };
      }

      // Validate product IDs from environment
      const MONTHLY_PRODUCT_ID =
        process.env.NEXT_PUBLIC_POLAR_MONTHLY_PRODUCT_ID;
      const YEARLY_PRODUCT_ID = process.env.NEXT_PUBLIC_POLAR_YEARLY_PRODUCT_ID;

      if (!MONTHLY_PRODUCT_ID || !YEARLY_PRODUCT_ID) {
        console.error("Missing Polar product IDs in environment variables");
        return {
          hasValidSubscription: false,
          tier: "monthly",
          error: "Configuration error",
          source: "polar",
          validatedAt: Date.now(),
        };
      }

      // Validate subscriptions
      const activeSubscription = customerState.activeSubscriptions?.find(
        (sub: any) => {
          return (
            sub &&
            typeof sub === "object" &&
            sub.status === "active" &&
            (sub.productId === MONTHLY_PRODUCT_ID ||
              sub.productId === YEARLY_PRODUCT_ID)
          );
        },
      );

      if (!activeSubscription) {
        return {
          hasValidSubscription: false,
          tier: "monthly",
          error: "No active subscription found",
          source: "polar",
          validatedAt: Date.now(),
        };
      }

      // Additional validation: check subscription dates if available
      if (activeSubscription.currentPeriodEnd) {
        const endDate = new Date(activeSubscription.currentPeriodEnd);
        if (endDate < new Date()) {
          return {
            hasValidSubscription: false,
            tier: "monthly",
            error: "Subscription expired",
            source: "polar",
            validatedAt: Date.now(),
          };
        }
      }

      const tier =
        activeSubscription.productId === MONTHLY_PRODUCT_ID
          ? "monthly"
          : "yearly";

      return {
        hasValidSubscription: true,
        tier,
        source: "polar",
        validatedAt: Date.now(),
      };
    } catch (error) {
      console.error("Polar API error:", error);
      throw new Error(
        `Polar validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Clear all caches for a user (useful for logout/account changes)
   */
  async clearUserSubscriptionCache(userId: string): Promise<void> {
    try {
      // Clear in-memory cache
      this.inMemoryCache.delete(userId);

      // Clear Redis cache
      await this.cache["redis"].del(`subscription:${userId}`);
    } catch (error) {
      console.warn("Failed to clear subscription cache:", error);
    }
  }

  /**
   * Clean up expired in-memory entries
   */
  private cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [userId, entry] of this.inMemoryCache.entries()) {
      if (entry.expiresAt < now) {
        this.inMemoryCache.delete(userId);
      }
    }
  }

  /**
   * Start periodic cleanup of memory cache
   */
  startPeriodicCleanup(): void {
    setInterval(
      () => {
        this.cleanupMemoryCache();
      },
      5 * 60 * 1000,
    ); // Clean up every 5 minutes
  }
}

// Export singleton instance
export const subscriptionValidator = new SecureSubscriptionValidator();

// Start periodic cleanup
subscriptionValidator.startPeriodicCleanup();
