import { twitterAuthManager } from "@/lib/auth/twitter-oauth";
import { mediaProcessor } from "@/lib/twitter/media-processor";

/**
 * Post a tweet or thread to Twitter using internal logic (no HTTP fetch)
 * @param params - content, twitterAccountId, mediaIds, isThread, threadTweets, userId, replyToTweetId, quoteTweetId
 * @returns {Promise<{ success: boolean; twitterTweetId?: string; postedTweets?: any[]; error?: string; }>}
 */
export async function postTweetInternal(params: {
  content: string;
  twitterAccountId: string;
  mediaIds?: string[];
  isThread?: boolean;
  threadTweets?: string[];
  userId: string;
  replyToTweetId?: string;
  quoteTweetId?: string;
  communityId?: string;
  hasMedia?: boolean;
}) {
  try {
    const {
      content,
      twitterAccountId,
      mediaIds,
      isThread,
      threadTweets,
      userId,
      replyToTweetId,
      quoteTweetId,
      communityId,
    } = params;
    const twitterClient = await twitterAuthManager.getTwitterClient(
      userId,
      twitterAccountId,
    );

    // Validate account access before posting
    try {
      await twitterClient.getCurrentUser();
    } catch (validationError) {
      console.error("Twitter account validation failed:", validationError);
      return {
        success: false,
        error:
          "Twitter account validation failed. Please reconnect your Twitter account.",
      };
    }

    // Process media files if any
    let twitterMediaIds: string[] = [];
    if (mediaIds && mediaIds.length > 0) {
      console.log("Processing media files for Twitter:", mediaIds);
      twitterMediaIds = await mediaProcessor.processMediaForTwitter(
        mediaIds,
        twitterClient,
      );
      console.log("Twitter media IDs:", twitterMediaIds);
    }

    let twitterTweetId: string | undefined;
    let postedTweets: any[] = [];
    if (isThread && threadTweets && threadTweets.length > 1) {
      const threadOptions: any = {
        mediaIds: twitterMediaIds.length > 0 ? [twitterMediaIds] : undefined, // First tweet gets media
      };

      // Only add communityId if it's not "none"
      if (communityId && communityId !== "none") {
        threadOptions.communityId = communityId;
      }

      const results = await twitterClient.postThread(
        threadTweets,
        threadOptions,
      );
      postedTweets = results;
      twitterTweetId = results[0].data.id;
    } else {
      const tweetOptions: any = {
        mediaIds: twitterMediaIds.length > 0 ? twitterMediaIds : undefined,
        replyToTweetId,
        quoteTweetId,
      };

      // Only add communityId if it's not "none"
      if (communityId && communityId !== "none") {
        tweetOptions.communityId = communityId;
      }

      const result = await twitterClient.postTweet(content, tweetOptions);
      postedTweets = [result];
      twitterTweetId = result.data.id;
    }
    return { success: true, twitterTweetId, postedTweets };
  } catch (error) {
    console.error("Twitter API Error Details:", {
      error,
      code: (error as any)?.code,
      status: (error as any)?.status,
      rateLimit: (error as any)?.rateLimit,
      data: (error as any)?.data,
    });

    // Provide more specific error messages
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      if ((error as any)?.code === 403) {
        errorMessage =
          "Twitter API access denied. Please check your account permissions and try reconnecting your Twitter account.";
      } else if ((error as any)?.code === 429) {
        errorMessage =
          "Rate limit exceeded. Please wait a moment before trying again.";
      } else if ((error as any)?.code === 401) {
        errorMessage =
          "Twitter authentication failed. Please reconnect your Twitter account.";
      } else {
        errorMessage = error.message;
      }
    }

    return { success: false, error: errorMessage };
  }
}
