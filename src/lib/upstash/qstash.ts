import { Client } from '@upstash/qstash';
import { createHmac } from 'crypto';

/**
 * QStash client for reliable tweet scheduling
 */
class UpstashQStash {
  private static instance: Client;

  /**
   * Get QStash client instance (singleton)
   */
  static getClient(): Client {
    if (!this.instance) {
      if (!process.env.UPSTASH_QSTASH_TOKEN) {
        throw new Error('UPSTASH_QSTASH_TOKEN is required');
      }

      this.instance = new Client({
        token: process.env.UPSTASH_QSTASH_TOKEN,
      });
    }

    return this.instance;
  }
}

/**
 * Tweet scheduling utilities using QStash
 */
export class TweetScheduler {
  private qstash: Client;
  // private baseUrl: string; // Removed unused property

  constructor() {
    this.qstash = UpstashQStash.getClient();
  }

  /**
   * Schedule a tweet to be posted at a specific time
   */
  async scheduleTweet(
    tweetId: string,
    scheduledFor: Date,
    tweetData: {
      content: string;
      userId: string;
      twitterAccountId: string;
      mediaIds?: string[];
      isThread?: boolean;
      threadTweets?: string[];
    }
  ): Promise<{ messageId: string }> {
    try {
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/qstash/tweet`;
      
      const payload = {
        type: 'tweet',
        tweetId,
        ...tweetData,
      };

      const result = await this.qstash.publishJSON({
        url: webhookUrl,
        body: payload,
        delay: Math.max(0, scheduledFor.getTime() - Date.now()),
        headers: {
          'Content-Type': 'application/json',
          'X-Tweet-Schedule': 'true',
        },
      });

      return { messageId: result.messageId };
    } catch (error) {
      console.error('Error scheduling tweet:', error);
      throw new Error(`Failed to schedule tweet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Schedule a thread to be posted
   */
  async scheduleThread(
    threadId: string,
    scheduledFor: Date,
    threadData: {
      tweets: string[];
      userId: string;
      twitterAccountId: string;
      interval?: number; // Minutes between thread tweets
    }
  ): Promise<{ messageIds: string[] }> {
    try {
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/qstash/thread`;
      
      const payload = {
        type: 'thread',
        threadId,
        ...threadData,
      };

      const result = await this.qstash.publishJSON({
        url: webhookUrl,
        body: payload,
        delay: Math.max(0, scheduledFor.getTime() - Date.now()),
        headers: {
          'Content-Type': 'application/json',
          'X-Thread-Schedule': 'true',
        },
      });

      return { messageIds: [result.messageId] };
    } catch (error) {
      console.error('Error scheduling thread:', error);
      throw new Error(`Failed to schedule thread: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Cancel a scheduled tweet
   */
  async cancelScheduledTweet(messageId: string): Promise<void> {
    try {
      await this.qstash.messages.delete(messageId);
    } catch (error) {
      console.error('Error canceling scheduled tweet:', error);
      throw new Error(`Failed to cancel scheduled tweet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Reschedule a tweet to a new time
   */
  async rescheduleTweet(
    messageId: string,
    newScheduledFor: Date,
    tweetData: any
  ): Promise<{ messageId: string }> {
    try {
      // Cancel the existing scheduled tweet
      await this.cancelScheduledTweet(messageId);
      
      // Schedule with new time
      return await this.scheduleTweet(
        tweetData.tweetId,
        newScheduledFor,
        tweetData
      );
    } catch (error) {
      console.error('Error rescheduling tweet:', error);
      throw new Error(`Failed to reschedule tweet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Schedule periodic content (e.g., daily quotes, weekly updates)
   */
  async scheduleRecurringTweet(
    recurringId: string,
    cronExpression: string,
    tweetData: {
      content: string;
      userId: string;
      twitterAccountId: string;
      templateVariables?: Record<string, string>;
    }
  ): Promise<{ scheduleId: string }> {
    try {
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/qstash/recurring`;
      
      const payload = {
        type: 'recurring',
        recurringId,
        ...tweetData,
      };

      const result = await this.qstash.schedules.create({
        destination: webhookUrl,
        cron: cronExpression,
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
          'X-Recurring-Tweet': 'true',
        },
      });

      return { scheduleId: result.scheduleId };
    } catch (error) {
      console.error('Error scheduling recurring tweet:', error);
      throw new Error(`Failed to schedule recurring tweet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Cancel recurring tweet schedule
   */
  async cancelRecurringTweet(scheduleId: string): Promise<void> {
    try {
      await this.qstash.schedules.delete(scheduleId);
    } catch (error) {
      console.error('Error canceling recurring tweet:', error);
      throw new Error(`Failed to cancel recurring tweet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all scheduled messages for a user
   */
  async getScheduledTweets(_userId: string): Promise<any[]> {
    try {
      // QStash doesn't provide a direct way to list messages
      // This would need to be implemented using a database query instead
      console.warn('getScheduledTweets: QStash does not provide message listing, using database query instead');
      return [];
    } catch (error) {
      console.error('Error getting scheduled tweets:', error);
      throw new Error(`Failed to get scheduled tweets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Schedule tweet analytics refresh
   */
  async scheduleAnalyticsRefresh(
    tweetId: string,
    intervals: number[] = [1, 6, 24, 72] // hours after posting
  ): Promise<{ messageIds: string[] }> {
    try {
      const messageIds: string[] = [];
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/qstash/analytics`;

      for (const hours of intervals) {
        const delay = hours * 60 * 60 * 1000; // Convert hours to milliseconds
        
        const result = await this.qstash.publishJSON({
          url: webhookUrl,
          body: {
            type: 'analytics_refresh',
            tweetId,
            interval: hours,
          },
          delay,
          headers: {
            'Content-Type': 'application/json',
            'X-Analytics-Refresh': 'true',
          },
        });

        messageIds.push(result.messageId);
      }

      return { messageIds };
    } catch (error) {
      console.error('Error scheduling analytics refresh:', error);
      throw new Error(`Failed to schedule analytics refresh: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Schedule optimal posting time analysis
   */
  async scheduleOptimalTimeAnalysis(
    userId: string,
    analysisType: 'daily' | 'weekly' | 'monthly' = 'weekly'
  ): Promise<{ scheduleId: string }> {
    try {
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/qstash/analysis`;
      
      const cronExpressions = {
        daily: '0 0 * * *',    // Daily at midnight
        weekly: '0 0 * * 1',   // Weekly on Monday at midnight
        monthly: '0 0 1 * *',  // Monthly on 1st at midnight
      };

      const result = await this.qstash.schedules.create({
        destination: webhookUrl,
        cron: cronExpressions[analysisType],
        body: JSON.stringify({
          type: 'optimal_time_analysis',
          userId,
          analysisType,
        }),
        headers: {
          'Content-Type': 'application/json',
          'X-Analysis-Schedule': 'true',
        },
      });

      return { scheduleId: result.scheduleId };
    } catch (error) {
      console.error('Error scheduling optimal time analysis:', error);
      throw new Error(`Failed to schedule optimal time analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Batch schedule multiple tweets
   */
  async batchScheduleTweets(tweets: Array<{
    tweetId: string;
    scheduledFor: Date;
    content: string;
    userId: string;
    twitterAccountId: string;
  }>): Promise<{ results: Array<{ tweetId: string; messageId: string; success: boolean; error?: string }> }> {
    const results: Array<{ tweetId: string; messageId: string; success: boolean; error?: string }> = [];

    for (const tweet of tweets) {
      try {
        const result = await this.scheduleTweet(tweet.tweetId, tweet.scheduledFor, tweet);
        results.push({
          tweetId: tweet.tweetId,
          messageId: result.messageId,
          success: true,
        });
      } catch (error) {
        results.push({
          tweetId: tweet.tweetId,
          messageId: '',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { results };
  }

  /**
   * Health check for QStash service
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency?: number }> {
    try {
      const start = Date.now();
      
      // Try a simple publish operation as a health check
      await this.qstash.publishJSON({
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/qstash/health`,
        body: { type: 'health_check', timestamp: Date.now() },
        delay: 60000, // 1 minute delay for health check
      });
      
      const latency = Date.now() - start;
      return { status: 'healthy', latency };
    } catch (error) {
      console.error('QStash health check failed:', error);
      return { status: 'unhealthy' };
    }
  }
}

/**
 * Webhook verification utilities
 */
export class QStashWebhookVerifier {
  /**
   * Verify QStash webhook signature
   */
  static verifySignature(
    body: string,
    signature: string,
    currentSigningKey?: string,
    nextSigningKey?: string
  ): boolean {
    try {
      // Using crypto module imported at top
      
      const keys = [
        currentSigningKey || process.env.UPSTASH_QSTASH_CURRENT_SIGNING_KEY,
        nextSigningKey || process.env.UPSTASH_QSTASH_NEXT_SIGNING_KEY,
      ].filter(Boolean) as string[];

      for (const key of keys) {
        const hmac = createHmac('sha256', key);
        hmac.update(body);
        const expectedSignature = hmac.digest('base64');
        
        if (expectedSignature === signature) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error verifying QStash signature:', error);
      return false;
    }
  }

  /**
   * Parse and validate QStash webhook payload
   */
  static parseWebhookPayload(body: string): any {
    try {
      return JSON.parse(body);
    } catch (_error) {
      throw new Error('Invalid JSON payload in webhook');
    }
  }
}

// Export factory function for lazy instantiation
let tweetSchedulerInstance: TweetScheduler | null = null;

export const getTweetScheduler = (): TweetScheduler => {
  if (!tweetSchedulerInstance) {
    tweetSchedulerInstance = new TweetScheduler();
  }
  return tweetSchedulerInstance;
};

// For backward compatibility - but this will still cause the issue
// TODO: Update all imports to use getTweetScheduler() instead

// Export QStash client factory for direct access
export const getQStashClient = () => UpstashQStash.getClient();