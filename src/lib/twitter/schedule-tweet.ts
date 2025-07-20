import { getTweetScheduler } from "@/lib/upstash/qstash";

/**
 * Schedule a tweet for future posting using QStash (internal logic, no HTTP fetch)
 * @param params - nanoId, scheduleDate, content, userId, twitterAccountId, mediaIds, isThread, threadTweets
 * @returns {Promise<{ success: boolean; messageId?: string; error?: string; }>}
 */
export async function scheduleTweetInternal(params: {
  nanoId: string;
  scheduleDate: Date;
  content: string;
  userId: string;
  twitterAccountId: string;
  mediaIds?: string[];
  isThread?: boolean;
  threadTweets?: string[];
  threadData?: { content: string; mediaIds: string[] }[];
  delaySeconds?: number;
}) {
  try {
    const { nanoId, scheduleDate, userId, twitterAccountId, delaySeconds } =
      params;
    const result = await getTweetScheduler().scheduleTweet(
      nanoId,
      scheduleDate,
      {
        userId,
        twitterAccountId,
      },
      delaySeconds,
    );
    return { success: true, messageId: result.messageId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
