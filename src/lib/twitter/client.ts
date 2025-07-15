import { TwitterApi, TweetV2PostTweetResult, UserV2 } from 'twitter-api-v2';

/**
 * Twitter API client configuration and utilities
 */
export class TwitterClient {
  private client: TwitterApi;

  constructor(accessToken: string) {
    // OAuth 2.0 for user context
    this.client = new TwitterApi(accessToken);
  }

  /**
   * Create a Twitter client with OAuth 2.0 user tokens
   */
  static withUserTokens(accessToken: string): TwitterClient {
    return new TwitterClient(accessToken);
  }

  /**
   * Post a tweet
   */
  async postTweet(text: string, options?: {
    mediaIds?: string[];
    replyToTweetId?: string;
    quoteTweetId?: string;
  }): Promise<TweetV2PostTweetResult> {
    try {
      const tweetData: any = { text };

      if (options?.mediaIds?.length) {
        tweetData.media = { media_ids: options.mediaIds };
      }

      if (options?.replyToTweetId) {
        tweetData.reply = { in_reply_to_tweet_id: options.replyToTweetId };
      }

      if (options?.quoteTweetId) {
        tweetData.quote_tweet_id = options.quoteTweetId;
      }

      const tweet = await this.client.v2.tweet(tweetData);
      return tweet;
    } catch (error) {
      console.error('Error posting tweet:', error);
      throw new Error(`Failed to post tweet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Post a thread of tweets
   */
  async postThread(tweets: string[]): Promise<TweetV2PostTweetResult[]> {
    const results: TweetV2PostTweetResult[] = [];
    let replyToId: string | undefined;

    for (const tweetText of tweets) {
      const result = await this.postTweet(tweetText, {
        replyToTweetId: replyToId,
      });
      results.push(result);
      replyToId = result.data.id;
    }

    return results;
  }

  /**
   * Delete a tweet
   */
  async deleteTweet(tweetId: string): Promise<{ deleted: boolean }> {
    try {
      const result = await this.client.v2.deleteTweet(tweetId);
      return result.data;
    } catch (error) {
      console.error('Error deleting tweet:', error);
      throw new Error(`Failed to delete tweet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get tweet by ID with metrics
   */
  async getTweet(tweetId: string) {
    try {
      const tweet = await this.client.v2.singleTweet(tweetId, {
        'tweet.fields': ['public_metrics', 'created_at', 'author_id', 'context_annotations'],
        expansions: ['author_id'],
        'user.fields': ['username', 'name', 'profile_image_url'],
      });
      return tweet;
    } catch (error) {
      console.error('Error fetching tweet:', error);
      throw new Error(`Failed to fetch tweet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user's own tweets
   */
  async getUserTweets(userId: string, options?: {
    maxResults?: number;
    sinceId?: string;
    untilId?: string;
  }) {
    try {
      const tweets = await this.client.v2.userTimeline(userId, {
        max_results: options?.maxResults || 50,
        since_id: options?.sinceId,
        until_id: options?.untilId,
        'tweet.fields': ['public_metrics', 'created_at', 'context_annotations'],
        expansions: ['author_id'],
      });
      return tweets;
    } catch (error) {
      console.error('Error fetching user tweets:', error);
      throw new Error(`Failed to fetch user tweets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<UserV2> {
    try {
      const user = await this.client.v2.me({
        'user.fields': ['public_metrics', 'description', 'location', 'profile_image_url', 'verified'],
      });
      return user.data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw new Error(`Failed to fetch current user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload media for tweets
   */
  async uploadMedia(buffer: Buffer, mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'video/mp4'): Promise<string> {
    try {
      const mediaId = await this.client.v1.uploadMedia(buffer, { mimeType: mediaType });
      return mediaId;
    } catch (error) {
      console.error('Error uploading media:', error);
      throw new Error(`Failed to upload media: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search tweets
   */
  async searchTweets(query: string, options?: {
    maxResults?: number;
    sortOrder?: 'recency' | 'relevancy';
    startTime?: string;
    endTime?: string;
  }) {
    try {
      const tweets = await this.client.v2.search(query, {
        max_results: options?.maxResults || 50,
        sort_order: options?.sortOrder || 'recency',
        start_time: options?.startTime,
        end_time: options?.endTime,
        'tweet.fields': ['public_metrics', 'created_at', 'author_id'],
        expansions: ['author_id'],
      });
      return tweets;
    } catch (error) {
      console.error('Error searching tweets:', error);
      throw new Error(`Failed to search tweets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

}

/**
 * Calculate tweet character length (simplified version)
 * This is a basic implementation - Twitter's actual algorithm is more complex
 */
function calculateTweetLength(text: string): number {
  // Basic character counting - Twitter's algorithm is more sophisticated
  // but this will work for basic use cases
  return text.length;
}

/**
 * Utility functions for Twitter API
 */
export const TwitterUtils = {
  /**
   * Validate tweet text length
   */
  validateTweetLength(text: string): { valid: boolean; length: number; remaining: number } {
    const length = calculateTweetLength(text);
    return {
      valid: length <= 280,
      length,
      remaining: 280 - length,
    };
  },

  /**
   * Split long text into tweet-sized chunks for threads
   */
  splitIntoTweets(text: string, maxLength: number = 270): string[] {
    const tweets: string[] = [];
    const words = text.split(' ');
    let currentTweet = '';

    for (const word of words) {
      const testTweet = currentTweet ? `${currentTweet} ${word}` : word;
      
      if (calculateTweetLength(testTweet) <= maxLength) {
        currentTweet = testTweet;
      } else {
        if (currentTweet) {
          tweets.push(currentTweet);
          currentTweet = word;
        } else {
          // Single word is too long, split it
          tweets.push(word.substring(0, maxLength));
          currentTweet = word.substring(maxLength);
        }
      }
    }

    if (currentTweet) {
      tweets.push(currentTweet);
    }

    // Add thread numbers if multiple tweets
    if (tweets.length > 1) {
      return tweets.map((tweet, index) => `${tweet} ${index + 1}/${tweets.length}`);
    }

    return tweets;
  },

  /**
   * Extract hashtags from text
   */
  extractHashtags(text: string): string[] {
    const hashtagRegex = /#[\w]+/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  },

  /**
   * Extract mentions from text
   */
  extractMentions(text: string): string[] {
    const mentionRegex = /@[\w]+/g;
    const matches = text.match(mentionRegex);
    return matches ? matches.map(mention => mention.substring(1)) : [];
  },

  /**
   * Format tweet URL
   */
  formatTweetUrl(username: string, tweetId: string): string {
    return `https://twitter.com/${username}/status/${tweetId}`;
  },
};

/**
 * OAuth 2.0 helper for Twitter authentication
 */
export class TwitterOAuth {
  private client: TwitterApi;

  constructor() {
    if (!process.env.TWITTER_CLIENT_ID || !process.env.TWITTER_CLIENT_SECRET) {
      throw new Error('TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET are required');
    }

    this.client = new TwitterApi({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
    });
  }

  /**
   * Generate OAuth 2.0 authorization URL
   */
  generateAuthUrl(redirectUri: string, state?: string): { url: string; codeVerifier: string; state: string } {
    const scopes = ['tweet.read', 'tweet.write', 'users.read', 'offline.access'];
    const { url, codeVerifier, state: generatedState } = this.client.generateOAuth2AuthLink(
      redirectUri,
      {
        scope: scopes,
        state,
      }
    );

    return { url, codeVerifier, state: state || generatedState };
  }

  /**
   * Exchange authorization code for access tokens
   */
  async exchangeCodeForTokens(
    code: string,
    codeVerifier: string,
    redirectUri: string
  ): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
  }> {
    try {
      const { accessToken, refreshToken, expiresIn } = await this.client.loginWithOAuth2({
        code,
        codeVerifier,
        redirectUri,
      });

      return {
        accessToken,
        refreshToken,
        expiresIn,
      };
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw new Error(`Failed to exchange code for tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
  }> {
    try {
      const result = await this.client.refreshOAuth2Token(refreshToken);
      return {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
      };
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw new Error(`Failed to refresh access token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}