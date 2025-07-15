import { twitterAuthManager } from '@/lib/auth/twitter-oauth';

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
    } = params;
    const twitterClient = await twitterAuthManager.getTwitterClient(userId, twitterAccountId);
    let twitterTweetId: string | undefined;
    let postedTweets: any[] = [];
    if (isThread && threadTweets && threadTweets.length > 1) {
      const results = await twitterClient.postThread(threadTweets);
      postedTweets = results;
      twitterTweetId = results[0].data.id;
    } else {
      const result = await twitterClient.postTweet(content, {
        mediaIds,
        replyToTweetId,
        quoteTweetId,
      });
      postedTweets = [result];
      twitterTweetId = result.data.id;
    }
    return { success: true, twitterTweetId, postedTweets };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
} 