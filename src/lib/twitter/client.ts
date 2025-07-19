import { TwitterApi, TweetV2PostTweetResult, UserV2 } from "twitter-api-v2";

/**
 * Twitter API client configuration and utilities
 */
export class TwitterClient {
  private client: TwitterApi;
  private accessToken: string;

  constructor(accessToken: string) {
    // OAuth 2.0 for user context
    this.client = new TwitterApi(accessToken);
    this.accessToken = accessToken;
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
  async postTweet(
    text: string,
    options?: {
      mediaIds?: string[];
      replyToTweetId?: string;
      quoteTweetId?: string;
      communityId?: string;
    },
  ): Promise<TweetV2PostTweetResult> {
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

      if (options?.communityId) {
        tweetData.community_id = options.communityId;
      }

      console.log("Twitter API Request Data:", {
        tweetData,
        options,
        textLength: text.length,
        hasMedia: !!options?.mediaIds?.length,
        hasReply: !!options?.replyToTweetId,
        hasCommunity: !!options?.communityId,
      });

      const tweet = await this.client.v2.tweet(tweetData);
      return tweet;
    } catch (error) {
      console.error("Twitter API Error Details:", {
        error,
        code: (error as any)?.code,
        status: (error as any)?.status,
        rateLimit: (error as any)?.rateLimit,
        data: (error as any)?.data,
        headers: (error as any)?.headers,
      });

      // Check if it's a rate limit error
      if ((error as any)?.code === 429) {
        const rateLimit = (error as any)?.rateLimit;
        const resetTime = rateLimit?.reset
          ? new Date(rateLimit.reset * 1000)
          : null;
        const errorMessage = `Rate limit exceeded. Reset time: ${resetTime?.toISOString() || "Unknown"}`;
        throw new Error(errorMessage);
      }

      throw new Error(
        `Failed to post tweet: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Post a thread of tweets
   */
  async postThread(
    tweets: string[],
    options?: {
      communityId?: string;
      mediaIds?: string[][];
    },
  ): Promise<TweetV2PostTweetResult[]> {
    console.log("Posting Thread:", {
      tweetCount: tweets.length,
      options,
      tweets: tweets.map((t, i) => ({
        index: i,
        length: t.length,
        preview: t.substring(0, 50),
      })),
    });

    const results: TweetV2PostTweetResult[] = [];
    let replyToId: string | undefined;

    for (let i = 0; i < tweets.length; i++) {
      const tweetText = tweets[i];
      const tweetOptions: any = {
        replyToTweetId: replyToId,
      };

      // Add community ID only to the first tweet in thread
      if (i === 0 && options?.communityId) {
        tweetOptions.communityId = options.communityId;
      }

      // Add media IDs if provided for this tweet
      if (options?.mediaIds?.[i]?.length) {
        tweetOptions.mediaIds = options.mediaIds[i];
      }

      console.log(`Posting thread tweet ${i + 1}/${tweets.length}:`, {
        tweetOptions,
        textLength: tweetText.length,
      });

      const result = await this.postTweet(tweetText, tweetOptions);
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
      console.error("Error deleting tweet:", error);
      throw new Error(
        `Failed to delete tweet: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get tweet by ID with metrics
   */
  async getTweet(tweetId: string) {
    try {
      const tweet = await this.client.v2.singleTweet(tweetId, {
        "tweet.fields": [
          "public_metrics",
          "created_at",
          "author_id",
          "context_annotations",
        ],
        expansions: ["author_id"],
        "user.fields": ["username", "name", "profile_image_url"],
      });
      return tweet;
    } catch (error) {
      console.error("Error fetching tweet:", error);
      throw new Error(
        `Failed to fetch tweet: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get user's own tweets
   */
  async getUserTweets(
    userId: string,
    options?: {
      maxResults?: number;
      sinceId?: string;
      untilId?: string;
    },
  ) {
    try {
      const tweets = await this.client.v2.userTimeline(userId, {
        max_results: options?.maxResults || 50,
        since_id: options?.sinceId,
        until_id: options?.untilId,
        "tweet.fields": ["public_metrics", "created_at", "context_annotations"],
        expansions: ["author_id"],
      });
      return tweets;
    } catch (error) {
      console.error("Error fetching user tweets:", error);
      throw new Error(
        `Failed to fetch user tweets: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<UserV2> {
    try {
      const user = await this.client.v2.me({
        "user.fields": [
          "public_metrics",
          "description",
          "location",
          "profile_image_url",
          "verified",
        ],
      });
      return user.data;
    } catch (error) {
      console.error("Error fetching current user:", error);
      throw new Error(
        `Failed to fetch current user: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Upload media for tweets using Twitter API v2
   */
  async uploadMedia(
    buffer: Buffer,
    mediaType: "image/jpeg" | "image/png" | "image/gif" | "video/mp4",
  ): Promise<string> {
    try {
      console.log("Uploading media to Twitter v2:", {
        bufferSize: buffer.length,
        mediaType,
        bufferPreview: buffer.slice(0, 100).toString("hex"),
      });

      // Convert buffer to base64
      const base64Data = buffer.toString("base64");

      // Determine media category based on type
      const mediaCategory = mediaType.startsWith("video/")
        ? "tweet_video"
        : "tweet_image";

      const response = await fetch("https://api.twitter.com/2/media/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          media_type: mediaType,
          media_category: mediaCategory,
          shared: false,
          media: base64Data,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Twitter v2 Media Upload Error Response:", {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorText,
        });

        throw new Error(
          `HTTP ${response.status}: ${errorText || response.statusText}`,
        );
      }

      const data = await response.json();
      console.log("Twitter v2 Media Upload Response:", data);

      if (!data.data?.id) {
        throw new Error("No media id in response");
      }

      console.log("Successfully uploaded media to Twitter v2:", data.data.id);
      return data.data.id;
    } catch (error) {
      console.error("Twitter v2 Media Upload Error Details:", {
        error,
        code: (error as any)?.code,
        status: (error as any)?.status,
        bufferSize: buffer.length,
        mediaType,
      });

      // Provide more specific error messages
      let errorMessage = "Unknown error";
      if (error instanceof Error) {
        if ((error as any)?.code === 403 || error.message.includes("403")) {
          errorMessage =
            "Twitter media upload access denied. Please check your app permissions and try reconnecting your Twitter account.";
        } else if (
          (error as any)?.code === 429 ||
          error.message.includes("429")
        ) {
          errorMessage =
            "Media upload rate limit exceeded. Please wait a moment before trying again.";
        } else if (
          (error as any)?.code === 401 ||
          error.message.includes("401")
        ) {
          errorMessage =
            "Twitter media upload authentication failed. Please reconnect your Twitter account.";
        } else {
          errorMessage = error.message;
        }
      }

      throw new Error(`Failed to upload media: ${errorMessage}`);
    }
  }

  /**
   * Initialize chunked media upload (for large videos)
   */
  async initializeChunkedUpload(
    totalBytes: number,
    mediaType: string,
    mediaCategory: "tweet_image" | "tweet_video" | "tweet_gif" = "tweet_video",
  ): Promise<string> {
    try {
      const response = await fetch(
        "https://upload.twitter.com/1.1/media/upload.json",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            command: "INIT",
            total_bytes: totalBytes.toString(),
            media_type: mediaType,
            media_category: mediaCategory,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.media_id_string;
    } catch (error) {
      console.error("Error initializing chunked upload:", error);
      throw new Error(
        `Failed to initialize chunked upload: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Append chunk to media upload
   */
  async appendChunk(
    mediaId: string,
    chunk: Buffer,
    segmentIndex: number,
  ): Promise<void> {
    try {
      const formData = new FormData();
      formData.append("command", "APPEND");
      formData.append("media_id", mediaId);
      formData.append("segment_index", segmentIndex.toString());
      formData.append("media", new Blob([chunk]));

      const response = await fetch(
        "https://upload.twitter.com/1.1/media/upload.json",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error appending chunk:", error);
      throw new Error(
        `Failed to append chunk: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Finalize chunked media upload
   */
  async finalizeChunkedUpload(
    mediaId: string,
  ): Promise<{ processing_info?: any }> {
    try {
      const response = await fetch(
        "https://upload.twitter.com/1.1/media/upload.json",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            command: "FINALIZE",
            media_id: mediaId,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error finalizing chunked upload:", error);
      throw new Error(
        `Failed to finalize chunked upload: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Check status of media processing
   */
  async getMediaStatus(mediaId: string): Promise<any> {
    try {
      const response = await fetch(
        `https://upload.twitter.com/1.1/media/upload.json?command=STATUS&media_id=${mediaId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting media status:", error);
      throw new Error(
        `Failed to get media status: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Upload large video with chunked upload
   */
  async uploadLargeVideo(buffer: Buffer, mediaType: string): Promise<string> {
    try {
      const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
      const totalBytes = buffer.length;

      // Initialize upload
      const mediaId = await this.initializeChunkedUpload(
        totalBytes,
        mediaType,
        "tweet_video",
      );

      // Upload chunks
      let segmentIndex = 0;
      for (let i = 0; i < totalBytes; i += CHUNK_SIZE) {
        const chunk = buffer.slice(i, Math.min(i + CHUNK_SIZE, totalBytes));
        await this.appendChunk(mediaId, chunk, segmentIndex);
        segmentIndex++;
      }

      // Finalize upload
      const finalizeResult = await this.finalizeChunkedUpload(mediaId);

      // Wait for processing if needed
      if (finalizeResult.processing_info) {
        await this.waitForProcessing(mediaId);
      }

      return mediaId;
    } catch (error) {
      console.error("Error uploading large video:", error);
      throw new Error(
        `Failed to upload large video: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Wait for media processing to complete
   */
  private async waitForProcessing(mediaId: string): Promise<void> {
    const maxRetries = 30;
    let retries = 0;

    while (retries < maxRetries) {
      const status = await this.getMediaStatus(mediaId);

      if (status.processing_info.state === "succeeded") {
        return;
      }

      if (status.processing_info.state === "failed") {
        throw new Error("Media processing failed");
      }

      // Wait before next check
      const checkAfterSecs = status.processing_info.check_after_secs || 5;
      await new Promise((resolve) =>
        setTimeout(resolve, checkAfterSecs * 1000),
      );
      retries++;
    }

    throw new Error("Media processing timeout");
  }

  /**
   * Search tweets
   */
  async searchTweets(
    query: string,
    options?: {
      maxResults?: number;
      sortOrder?: "recency" | "relevancy";
      startTime?: string;
      endTime?: string;
    },
  ) {
    try {
      const tweets = await this.client.v2.search(query, {
        max_results: options?.maxResults || 50,
        sort_order: options?.sortOrder || "recency",
        start_time: options?.startTime,
        end_time: options?.endTime,
        "tweet.fields": ["public_metrics", "created_at", "author_id"],
        expansions: ["author_id"],
      });
      return tweets;
    } catch (error) {
      console.error("Error searching tweets:", error);
      throw new Error(
        `Failed to search tweets: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get Twitter API usage information
   */
  async getUsage(): Promise<any> {
    try {
      const response = await fetch("https://api.twitter.com/2/usage/tweets", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        // Don't throw on 403 - usage endpoint may not be available for all API tiers
        if (response.status === 403) {
          console.warn(
            "Usage endpoint not available (403) - this is normal for basic Twitter API access",
          );
          return {
            error: "Usage data not available for this API tier",
            daily_tweet_count: 0,
            monthly_tweet_count: 0,
          };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting usage:", error);
      // Return mock structure instead of throwing
      return {
        error: error instanceof Error ? error.message : "Unknown error",
        daily_tweet_count: 0,
        monthly_tweet_count: 0,
      };
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
  validateTweetLength(text: string): {
    valid: boolean;
    length: number;
    remaining: number;
  } {
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
    const words = text.split(" ");
    let currentTweet = "";

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
      return tweets.map(
        (tweet, index) => `${tweet} ${index + 1}/${tweets.length}`,
      );
    }

    return tweets;
  },

  /**
   * Extract hashtags from text
   */
  extractHashtags(text: string): string[] {
    const hashtagRegex = /#[\w]+/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map((tag) => tag.substring(1)) : [];
  },

  /**
   * Extract mentions from text
   */
  extractMentions(text: string): string[] {
    const mentionRegex = /@[\w]+/g;
    const matches = text.match(mentionRegex);
    return matches ? matches.map((mention) => mention.substring(1)) : [];
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
      throw new Error(
        "TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET are required",
      );
    }

    this.client = new TwitterApi({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
    });
  }

  /**
   * Generate OAuth 2.0 authorization URL
   */
  generateAuthUrl(
    redirectUri: string,
    state?: string,
  ): { url: string; codeVerifier: string; state: string } {
    const scopes = [
      "tweet.read",
      "tweet.write",
      "users.read",
      "offline.access",
      "media.write",
    ];
    const {
      url,
      codeVerifier,
      state: generatedState,
    } = this.client.generateOAuth2AuthLink(redirectUri, {
      scope: scopes,
      state,
    });

    return { url, codeVerifier, state: state || generatedState };
  }

  /**
   * Exchange authorization code for access tokens
   */
  async exchangeCodeForTokens(
    code: string,
    codeVerifier: string,
    redirectUri: string,
  ): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
  }> {
    try {
      const { accessToken, refreshToken, expiresIn } =
        await this.client.loginWithOAuth2({
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
      console.error("Error exchanging code for tokens:", error);
      throw new Error(
        `Failed to exchange code for tokens: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
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
      console.error("Error refreshing access token:", error);
      throw new Error(
        `Failed to refresh access token: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}
