import { pgDb as db } from "@/lib/db/pg/db.pg";
import { TweetSchema, TwitterAccountSchema } from "@/lib/db/pg/schema.pg";
import { eq, and, gte, lte, like, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  broadcastTweetCreated,
  broadcastTweetUpdated,
  broadcastTweetDeleted,
} from "@/lib/websocket/server";
import { scheduleTweetInternal } from "@/lib/twitter/schedule-tweet";
import { postTweetInternal } from "@/lib/twitter/post-tweet";
import { CommunitySchema } from "@/lib/db/pg/schema.pg";
import { z } from "zod";
import { fromZonedTime } from "date-fns-tz";

// Zod schemas for argument validation
const listTweetsSchema = z.object({
  status: z.enum(["draft", "scheduled", "posted", "failed"]).optional(),
  limit: z.number().optional(),
  page: z.number().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  text: z.string().optional(),
});

const createTweetSchema = z.object({
  content: z.string().optional(),
  tweetType: z.enum(["single", "thread"]).optional(),
  status: z.enum(["draft", "posted"]).optional(),
  tags: z.array(z.string()).optional(),
  twitterAccountId: z.string().optional(),
  communityId: z.string().optional(),
  isThread: z.boolean().optional(),
  threadTweets: z.array(z.string()).optional(),
  threadData: z
    .array(
      z.object({
        content: z.string(),
        mediaIds: z.array(z.string()).optional(),
      }),
    )
    .optional(),
  mediaIds: z.array(z.string()).optional(),
  scheduledFor: z.string().optional(),
});

const scheduleTweetSchema = z.object({
  nanoId: z.string(),
  scheduledFor: z.string(),
  timezone: z.string().optional(),
});

const deleteTweetSchema = z.object({
  nanoId: z.string(),
});

const postTweetSchema = z.object({
  nanoId: z.string(),
});

const rescheduleTweetSchema = z.object({
  nanoId: z.string(),
  newScheduledFor: z.string(),
  timezone: z.string().optional(),
});

const convertDraftToScheduledSchema = z.object({
  nanoId: z.string(),
  scheduledFor: z.string(),
  timezone: z.string().optional(),
});

const addCommunitySchema = z.object({
  communityId: z.string(),
  name: z.string(),
  description: z.string().optional(),
});

/**
 * List all tweets for the authenticated user.
 * Now validates args using Zod before querying the database.
 */
export async function listTweets(
  args: {
    status?: string;
    limit?: number;
    page?: number;
    fromDate?: string;
    toDate?: string;
    text?: string;
  },
  userId: string,
) {
  // Validate input
  const parsed = listTweetsSchema.safeParse(args);
  if (!parsed.success) {
    return {
      content: [
        { type: "text", text: `Invalid input: ${parsed.error.message}` },
      ],
      isError: true,
    };
  }
  args = parsed.data;
  try {
    const { status, limit = 10, page = 1, fromDate, toDate, text } = args;
    const offset = (page - 1) * limit;
    const whereConditions = [eq(TweetSchema.userId, userId)];
    if (status) {
      whereConditions.push(eq(TweetSchema.status, status));
    }
    if (fromDate) {
      const fromDateTime = new Date(fromDate);
      if (!isNaN(fromDateTime.getTime())) {
        whereConditions.push(gte(TweetSchema.createdAt, fromDateTime));
      }
    }
    if (toDate) {
      const toDateTime = new Date(toDate);
      if (!isNaN(toDateTime.getTime())) {
        toDateTime.setHours(23, 59, 59, 999);
        whereConditions.push(lte(TweetSchema.createdAt, toDateTime));
      }
    }
    if (text) {
      whereConditions.push(
        or(
          like(TweetSchema.content, `%${text}%`),
          sql`${TweetSchema.threadTweets}::text ILIKE ${`%${text}%`}`,
        )!,
      );
    }
    const tweets = await db
      .select({
        nanoId: TweetSchema.nanoId,
        content: TweetSchema.content,
        tweetType: TweetSchema.tweetType,
        status: TweetSchema.status,
        scheduledFor: TweetSchema.scheduledFor,
        postedAt: TweetSchema.postedAt,
        twitterTweetId: TweetSchema.twitterTweetId,
        hashtags: TweetSchema.hashtags,
        mentions: TweetSchema.mentions,
        tags: TweetSchema.tags,
        analytics: TweetSchema.analytics,
        createdAt: TweetSchema.createdAt,
      })
      .from(TweetSchema)
      .where(
        whereConditions.length > 1
          ? and(...whereConditions)
          : whereConditions[0],
      )
      .orderBy(TweetSchema.createdAt)
      .limit(limit)
      .offset(offset);
    return {
      content: [
        {
          type: "text",
          text: `Found ${tweets.length} tweets${status ? ` with status \"${status}\"` : ""}${text ? ` matching \"${text}\"` : ""} (page ${page}):\n\n${JSON.stringify(tweets, null, 2)}`,
        },
      ],
      tweets,
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Create a new tweet/draft for the authenticated user.
 * Now validates args using Zod before querying the database.
 */
export async function createTweet(args: any, userId: string) {
  // Validate input
  const parsed = createTweetSchema.safeParse(args);
  if (!parsed.success) {
    return {
      content: [
        { type: "text", text: `Invalid input: ${parsed.error.message}` },
      ],
      isError: true,
    };
  }
  args = parsed.data;
  try {
    const {
      content,
      status = "draft",
      scheduledFor,
      tags = [],
      twitterAccountId,
      communityId,
      // Thread support - supports both old and new formats
      threadTweets, // Legacy format: string[]
      threadData, // New format: { content: string, mediaIds: string[] }[]
      isThread = false,
      // Media support (note: media files not uploaded through MCP, only references)
      mediaIds = [],
    } = args;

    // Validate Twitter account belongs to user
    if (twitterAccountId) {
      const [account] = await db
        .select()
        .from(TwitterAccountSchema)
        .where(
          and(
            eq(TwitterAccountSchema.userId, userId),
            eq(TwitterAccountSchema.id, twitterAccountId),
          ),
        );

      if (!account) {
        throw new Error("Twitter account not found or doesn't belong to user");
      }
    }

    // If no account specified, get the first active account
    let accountId = twitterAccountId;
    if (!accountId) {
      const [account] = await db
        .select()
        .from(TwitterAccountSchema)
        .where(
          and(
            eq(TwitterAccountSchema.userId, userId),
            eq(TwitterAccountSchema.isActive, true),
          ),
        )
        .limit(1);

      if (!account) {
        throw new Error(
          "No active Twitter account found. Please connect a Twitter account first.",
        );
      }
      accountId = account.id;
    }

    // Determine if this is a thread
    const finalIsThread =
      isThread || threadTweets?.length > 1 || threadData?.length > 1;
    const finalTweetType = finalIsThread ? "thread" : "single";

    // Process content and thread data
    let finalContent: string;
    let processedThreadTweets: { content: string; mediaIds: string[] }[] = [];

    if (finalIsThread) {
      if (threadData && threadData.length > 0) {
        // Use new threadData format
        processedThreadTweets = threadData;
        finalContent = threadData
          .map((tweet: any) => tweet.content)
          .join("\n\n");
      } else if (threadTweets && threadTweets.length > 0) {
        // Convert legacy threadTweets format
        processedThreadTweets = threadTweets.map((tweetContent: string) => ({
          content: tweetContent,
          mediaIds: [] as string[],
        }));
        finalContent = threadTweets.join("\n\n");
      } else {
        throw new Error("Thread content is required for thread tweets");
      }
    } else {
      finalContent = content;
      if (mediaIds && mediaIds.length > 0) {
        processedThreadTweets = [{ content: finalContent, mediaIds }];
      }
    }

    const [dbTweet] = await db
      .insert(TweetSchema)
      .values({
        nanoId: nanoid(8),
        content: finalContent,
        tweetType: finalTweetType,
        status,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        tags,
        mediaUrls: finalIsThread
          ? processedThreadTweets.flatMap((t) => t.mediaIds || [])
          : mediaIds,
        threadTweets: finalIsThread ? processedThreadTweets : [],
        communityId: communityId || null,
        twitterAccountId: accountId,
        userId,
      })
      .returning({
        id: TweetSchema.id,
        nanoId: TweetSchema.nanoId,
        content: TweetSchema.content,
        tweetType: TweetSchema.tweetType,
        status: TweetSchema.status,
        scheduledFor: TweetSchema.scheduledFor,
        hashtags: TweetSchema.hashtags,
        mentions: TweetSchema.mentions,
        tags: TweetSchema.tags,
        mediaUrls: TweetSchema.mediaUrls,
        threadTweets: TweetSchema.threadTweets,
        communityId: TweetSchema.communityId,
        userId: TweetSchema.userId,
        createdAt: TweetSchema.createdAt,
        updatedAt: TweetSchema.updatedAt,
      });

    // Broadcast tweet creation to WebSocket clients
    try {
      broadcastTweetCreated(dbTweet as any, userId);
    } catch (error) {
      console.warn("Failed to broadcast tweet creation:", error);
    }

    // Return only public fields to MCP client
    const {
      id,
      userId: userIdField,
      createdAt,
      updatedAt,
      ...publicTweet
    } = dbTweet;

    return {
      content: [
        {
          type: "text",
          text: `${finalIsThread ? "Thread" : "Tweet"} created successfully!\n\nType: ${finalTweetType}\nStatus: ${status}\n${finalIsThread ? `Thread tweets: ${processedThreadTweets.length}\n` : ""}${mediaIds?.length > 0 ? `Media files: ${mediaIds.length}\n` : ""}\n${JSON.stringify(publicTweet, null, 2)}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Schedule a tweet for posting at a specific time using QStash.
 * Now validates args using Zod before querying the database.
 */
export async function scheduleTweet(args: any, userId: string) {
  // Validate input
  const parsed = scheduleTweetSchema.safeParse(args);
  if (!parsed.success) {
    return {
      content: [
        { type: "text", text: `Invalid input: ${parsed.error.message}` },
      ],
      isError: true,
    };
  }
  args = parsed.data;
  try {
    const { nanoId, scheduledFor, timezone = "UTC" } = args;

    // Find the tweet by nanoId
    const [tweet] = await db
      .select()
      .from(TweetSchema)
      .where(
        and(eq(TweetSchema.userId, userId), eq(TweetSchema.nanoId, nanoId)),
      )
      .limit(1);

    if (!tweet) {
      throw new Error(`Tweet with nanoId "${nanoId}" not found`);
    }

    if (tweet.status !== "draft") {
      throw new Error("Only draft tweets can be scheduled");
    }

    // Parse the scheduled time in user's timezone using date-fns-tz
    let scheduleDate: Date;
    if (
      scheduledFor.includes("T") &&
      !scheduledFor.includes("Z") &&
      !scheduledFor.includes("+")
    ) {
      // Local datetime format - convert from user's timezone to UTC using date-fns-tz
      scheduleDate = fromZonedTime(scheduledFor, timezone);
    } else {
      // Already UTC or has timezone info
      scheduleDate = new Date(scheduledFor);
    }

    const now = new Date();

    // Check if the scheduled time is valid
    if (isNaN(scheduleDate.getTime())) {
      throw new Error("Invalid scheduled time format");
    }

    const delaySeconds = Math.floor(
      (scheduleDate.getTime() - now.getTime()) / 1000,
    );
    console.log(
      `MCP Schedule: ${scheduledFor} (${timezone}) -> ${scheduleDate.toISOString()}, delay: ${delaySeconds}s`,
    );

    if (delaySeconds < 0) {
      throw new Error("Scheduled time must be in the future");
    }

    if (delaySeconds > 604800) {
      throw new Error("You can only schedule tweets up to 7 days in advance");
    }

    // Schedule with QStash using internal logic
    const scheduleResult = await scheduleTweetInternal({
      nanoId: tweet.nanoId,
      scheduleDate,
      content: tweet.content,
      userId,
      twitterAccountId: tweet.twitterAccountId,
      mediaIds: tweet.mediaUrls || undefined,
      isThread: tweet.tweetType === "thread",
      threadTweets:
        tweet.tweetType === "thread" &&
        (!tweet.threadTweets || tweet.threadTweets.length === 0)
          ? tweet.content.split("\n\n")
          : undefined,
      threadData:
        tweet.threadTweets && tweet.threadTweets.length > 0
          ? tweet.threadTweets
          : undefined,
      delaySeconds, // Pass calculated delay to QStash
    });

    if (!scheduleResult.success) {
      throw new Error(scheduleResult.error || "Failed to schedule tweet");
    }

    // Update tweet to scheduled in database
    const [updatedTweet] = await db
      .update(TweetSchema)
      .set({
        status: "scheduled",
        scheduledFor: scheduleDate,
        qstashMessageId: scheduleResult.messageId, // Store QStash message ID
        updatedAt: new Date(),
      })
      .where(eq(TweetSchema.id, tweet.id))
      .returning({
        nanoId: TweetSchema.nanoId,
        content: TweetSchema.content,
        status: TweetSchema.status,
        scheduledFor: TweetSchema.scheduledFor,
        tweetType: TweetSchema.tweetType,
      });

    // Broadcast tweet update to WebSocket clients
    try {
      broadcastTweetUpdated(updatedTweet as any, userId);
    } catch (error) {
      console.warn("Failed to broadcast tweet update:", error);
    }

    return {
      content: [
        {
          type: "text",
          text: `Tweet scheduled successfully for ${scheduledFor}!\n\nQStash Message ID: ${scheduleResult.messageId}\n\n${JSON.stringify(updatedTweet, null, 2)}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Delete a tweet by nanoId for the authenticated user.
 * Now validates args using Zod before querying the database.
 */
export async function deleteTweet(args: any, userId: string) {
  // Validate input
  const parsed = deleteTweetSchema.safeParse(args);
  if (!parsed.success) {
    return {
      content: [
        { type: "text", text: `Invalid input: ${parsed.error.message}` },
      ],
      isError: true,
    };
  }
  args = parsed.data;
  try {
    const { nanoId } = args;

    // Find the tweet by nanoId
    const [tweet] = await db
      .select({
        id: TweetSchema.id,
        nanoId: TweetSchema.nanoId,
        status: TweetSchema.status,
        qstashMessageId: TweetSchema.qstashMessageId,
      })
      .from(TweetSchema)
      .where(
        and(eq(TweetSchema.userId, userId), eq(TweetSchema.nanoId, nanoId)),
      )
      .limit(1);

    if (!tweet) {
      throw new Error(`Tweet with nanoId "${nanoId}" not found`);
    }

    // Cancel QStash message if it's a scheduled tweet
    if (tweet.status === "scheduled" && tweet.qstashMessageId) {
      try {
        const { getTweetScheduler } = await import("@/lib/upstash/qstash");
        console.log(`Cancelling QStash message: ${tweet.qstashMessageId}`);
        await getTweetScheduler().cancelScheduledTweet(tweet.qstashMessageId);
      } catch (error) {
        console.warn("Failed to cancel QStash message:", error);
        // Continue with deletion even if QStash cancellation fails
      }
    }

    // Delete the tweet
    await db.delete(TweetSchema).where(eq(TweetSchema.id, tweet.id));

    // Broadcast tweet deletion to WebSocket clients
    try {
      broadcastTweetDeleted(tweet.nanoId, userId);
    } catch (error) {
      console.warn("Failed to broadcast tweet deletion:", error);
    }

    return {
      content: [
        {
          type: "text",
          text: `Tweet "${nanoId}" deleted successfully!`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Convert a draft tweet to posted (immediately post to Twitter)
 * Now validates args using Zod before querying the database.
 */
export async function postTweet(args: any, userId: string) {
  // Validate input
  const parsed = postTweetSchema.safeParse(args);
  if (!parsed.success) {
    return {
      content: [
        { type: "text", text: `Invalid input: ${parsed.error.message}` },
      ],
      isError: true,
    };
  }
  args = parsed.data;
  try {
    const { nanoId } = args;

    // Find the tweet by nanoId
    const [tweet] = await db
      .select()
      .from(TweetSchema)
      .where(
        and(eq(TweetSchema.userId, userId), eq(TweetSchema.nanoId, nanoId)),
      )
      .limit(1);

    if (!tweet) {
      throw new Error(`Tweet with nanoId "${nanoId}" not found`);
    }

    if (tweet.status !== "draft") {
      throw new Error("Only draft tweets can be posted");
    }

    // Post the tweet using internal logic with retry
    let postSuccess = false;
    let postResult: any = null;
    let lastError: any = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      postResult = await postTweetInternal({
        content: tweet.content,
        twitterAccountId: tweet.twitterAccountId,
        mediaIds: tweet.mediaUrls || undefined,
        isThread: tweet.tweetType === "thread",
        threadTweets:
          tweet.tweetType === "thread" &&
          (!tweet.threadTweets || tweet.threadTweets.length === 0)
            ? tweet.content.split("\n\n")
            : undefined,
        threadData:
          tweet.threadTweets && tweet.threadTweets.length > 0
            ? tweet.threadTweets
            : undefined,
        userId,
        communityId: tweet.communityId || undefined,
      });

      if (postResult.success && postResult.twitterTweetId) {
        postSuccess = true;
        break;
      } else {
        lastError = postResult.error || "Unknown error";
        console.warn(`Post attempt ${attempt} failed:`, lastError);
      }
    }

    if (!postSuccess) {
      throw new Error(`Failed to post tweet after 3 attempts: ${lastError}`);
    }

    // Update tweet to posted in database
    const [updatedTweet] = await db
      .update(TweetSchema)
      .set({
        status: "posted",
        postedAt: new Date(),
        twitterTweetId: postResult.twitterTweetId,
        updatedAt: new Date(),
      })
      .where(eq(TweetSchema.id, tweet.id))
      .returning();

    try {
      broadcastTweetUpdated(updatedTweet as any, userId);
    } catch (error) {
      console.warn("Failed to broadcast tweet update:", error);
    }

    return {
      content: [
        {
          type: "text",
          text: `Draft posted successfully to Twitter!\n\nTwitter Tweet ID: ${postResult.twitterTweetId}\nPosted Tweets: ${postResult.postedTweets?.length || 1}\n\n${JSON.stringify(updatedTweet, null, 2)}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Reschedule an existing scheduled tweet to a new time
 * Now validates args using Zod before querying the database.
 */
export async function rescheduleTweet(args: any, userId: string) {
  // Validate input
  const parsed = rescheduleTweetSchema.safeParse(args);
  if (!parsed.success) {
    return {
      content: [
        { type: "text", text: `Invalid input: ${parsed.error.message}` },
      ],
      isError: true,
    };
  }
  args = parsed.data;
  try {
    const { nanoId, newScheduledFor, timezone = "UTC" } = args;

    // Find the tweet by nanoId
    const [tweet] = await db
      .select()
      .from(TweetSchema)
      .where(
        and(eq(TweetSchema.userId, userId), eq(TweetSchema.nanoId, nanoId)),
      )
      .limit(1);

    if (!tweet) {
      throw new Error(`Tweet with nanoId "${nanoId}" not found`);
    }

    if (tweet.status !== "scheduled") {
      throw new Error("Only scheduled tweets can be rescheduled");
    }

    // Parse the scheduled time in user's timezone using date-fns-tz
    let newScheduleDate: Date;
    if (
      newScheduledFor.includes("T") &&
      !newScheduledFor.includes("Z") &&
      !newScheduledFor.includes("+")
    ) {
      // Local datetime format - convert from user's timezone to UTC using date-fns-tz
      newScheduleDate = fromZonedTime(newScheduledFor, timezone);
    } else {
      // Already UTC or has timezone info
      newScheduleDate = new Date(newScheduledFor);
    }

    const now = new Date();

    // Check if the scheduled time is valid
    if (isNaN(newScheduleDate.getTime())) {
      throw new Error("Invalid scheduled time format");
    }

    const delaySeconds = Math.floor(
      (newScheduleDate.getTime() - now.getTime()) / 1000,
    );
    console.log(
      `MCP Reschedule: ${newScheduledFor} (${timezone}) -> ${newScheduleDate.toISOString()}, delay: ${delaySeconds}s`,
    );

    if (delaySeconds < 0) {
      throw new Error("New scheduled time must be in the future");
    }

    if (delaySeconds > 604800) {
      throw new Error("You can only schedule tweets up to 7 days in advance");
    }

    // Cancel existing QStash message if it exists
    if (tweet.qstashMessageId) {
      try {
        const { getTweetScheduler } = await import("@/lib/upstash/qstash");
        console.log(`Cancelling old QStash message: ${tweet.qstashMessageId}`);
        await getTweetScheduler().cancelScheduledTweet(tweet.qstashMessageId);
      } catch (error) {
        console.warn("Failed to cancel old QStash message:", error);
        // Continue with rescheduling even if cancellation fails
      }
    }

    // Reschedule with QStash using internal logic
    const scheduleResult = await scheduleTweetInternal({
      nanoId: tweet.nanoId,
      scheduleDate: newScheduleDate,
      content: tweet.content,
      userId,
      twitterAccountId: tweet.twitterAccountId,
      mediaIds: tweet.mediaUrls || undefined,
      isThread: tweet.tweetType === "thread",
      threadTweets:
        tweet.tweetType === "thread" &&
        (!tweet.threadTweets || tweet.threadTweets.length === 0)
          ? tweet.content.split("\n\n")
          : undefined,
      threadData:
        tweet.threadTweets && tweet.threadTweets.length > 0
          ? tweet.threadTweets
          : undefined,
    });

    if (!scheduleResult.success) {
      throw new Error(scheduleResult.error || "Failed to reschedule tweet");
    }

    // Update tweet with new schedule time
    const [updatedTweet] = await db
      .update(TweetSchema)
      .set({
        scheduledFor: newScheduleDate,
        qstashMessageId: scheduleResult.messageId, // Store new QStash message ID
        updatedAt: new Date(),
      })
      .where(eq(TweetSchema.id, tweet.id))
      .returning();

    try {
      broadcastTweetUpdated(updatedTweet as any, userId);
    } catch (error) {
      console.warn("Failed to broadcast tweet update:", error);
    }

    return {
      content: [
        {
          type: "text",
          text: `Tweet rescheduled successfully for ${newScheduledFor}!\n\nNew QStash Message ID: ${scheduleResult.messageId}\n\n${JSON.stringify(updatedTweet, null, 2)}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Convert a draft to scheduled tweet
 * Now validates args using Zod before querying the database.
 */
export async function convertDraftToScheduled(args: any, userId: string) {
  // Validate input
  const parsed = convertDraftToScheduledSchema.safeParse(args);
  if (!parsed.success) {
    return {
      content: [
        { type: "text", text: `Invalid input: ${parsed.error.message}` },
      ],
      isError: true,
    };
  }
  args = parsed.data;
  try {
    const { nanoId, scheduledFor, timezone = "UTC" } = args;

    // Find the tweet by nanoId
    const [tweet] = await db
      .select()
      .from(TweetSchema)
      .where(
        and(eq(TweetSchema.userId, userId), eq(TweetSchema.nanoId, nanoId)),
      )
      .limit(1);

    if (!tweet) {
      throw new Error(`Tweet with nanoId "${nanoId}" not found`);
    }

    if (tweet.status !== "draft") {
      throw new Error("Only draft tweets can be converted to scheduled");
    }

    // Parse the scheduled time in user's timezone using date-fns-tz
    let scheduleDate: Date;
    if (
      scheduledFor.includes("T") &&
      !scheduledFor.includes("Z") &&
      !scheduledFor.includes("+")
    ) {
      // Local datetime format - convert from user's timezone to UTC using date-fns-tz
      scheduleDate = fromZonedTime(scheduledFor, timezone);
    } else {
      // Already UTC or has timezone info
      scheduleDate = new Date(scheduledFor);
    }

    const now = new Date();

    // Check if the scheduled time is valid
    if (isNaN(scheduleDate.getTime())) {
      throw new Error("Invalid scheduled time format");
    }

    const delaySeconds = Math.floor(
      (scheduleDate.getTime() - now.getTime()) / 1000,
    );
    console.log(
      `MCP Convert to Schedule: ${scheduledFor} (${timezone}) -> ${scheduleDate.toISOString()}, delay: ${delaySeconds}s`,
    );

    if (delaySeconds < 0) {
      throw new Error("Scheduled time must be in the future");
    }

    if (delaySeconds > 604800) {
      throw new Error("You can only schedule tweets up to 7 days in advance");
    }

    // Schedule with QStash using internal logic
    const scheduleResult = await scheduleTweetInternal({
      nanoId: tweet.nanoId,
      scheduleDate,
      content: tweet.content,
      userId,
      twitterAccountId: tweet.twitterAccountId,
      mediaIds: tweet.mediaUrls || undefined,
      isThread: tweet.tweetType === "thread",
      threadTweets:
        tweet.tweetType === "thread" &&
        (!tweet.threadTweets || tweet.threadTweets.length === 0)
          ? tweet.content.split("\n\n")
          : undefined,
      threadData:
        tweet.threadTweets && tweet.threadTweets.length > 0
          ? tweet.threadTweets
          : undefined,
    });

    if (!scheduleResult.success) {
      throw new Error(scheduleResult.error || "Failed to schedule tweet");
    }

    // Update tweet to scheduled
    const [updatedTweet] = await db
      .update(TweetSchema)
      .set({
        status: "scheduled",
        scheduledFor: scheduleDate,
        qstashMessageId: scheduleResult.messageId, // Store QStash message ID
        updatedAt: new Date(),
      })
      .where(eq(TweetSchema.id, tweet.id))
      .returning();

    try {
      broadcastTweetUpdated(updatedTweet as any, userId);
    } catch (error) {
      console.warn("Failed to broadcast tweet update:", error);
    }

    return {
      content: [
        {
          type: "text",
          text: `Draft converted to scheduled tweet for ${scheduledFor}!\n\nQStash Message ID: ${scheduleResult.messageId}\n\n${JSON.stringify(updatedTweet, null, 2)}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Convert a draft to posted tweet (same as postTweet but with different name for clarity)
 * Now validates args using Zod before querying the database.
 */
export async function convertDraftToPosted(args: any, userId: string) {
  // Validate input
  const parsed = postTweetSchema.safeParse(args);
  if (!parsed.success) {
    return {
      content: [
        { type: "text", text: `Invalid input: ${parsed.error.message}` },
      ],
      isError: true,
    };
  }
  args = parsed.data;
  return await postTweet(args, userId);
}

/**
 * List all Twitter accounts for the authenticated user (for MCP selection)
 */
export async function listTwitterAccounts(_args: any, userId: string) {
  // Fetch all Twitter accounts for the user
  const accounts = await db
    .select({
      id: TwitterAccountSchema.id,
      username: TwitterAccountSchema.username,
      displayName: TwitterAccountSchema.displayName,
      isActive: TwitterAccountSchema.isActive,
      createdAt: TwitterAccountSchema.createdAt,
    })
    .from(TwitterAccountSchema)
    .where(eq(TwitterAccountSchema.userId, userId));

  // Return the list in a user-friendly format
  return {
    content: [
      {
        type: "text" as const,
        text:
          accounts.length === 0
            ? "No Twitter accounts connected. Please connect an account first."
            : `Your Twitter accounts (for selection):\n\n${accounts
                .map(
                  (a, i) =>
                    `${i + 1}. Account ID: ${a.id}\n   Username: @${a.username}\n   Display Name: ${a.displayName}\n   Active: ${a.isActive ? "Yes" : "No"}\n   Created: ${a.createdAt}`,
                )
                .join("\n\n")}`,
      },
    ],
    accounts, // Also return as JSON for programmatic use
  };
}

/**
 * List all communities for the authenticated user.
 */
export async function listCommunities(_args: any, userId: string) {
  try {
    const communities = await db
      .select({
        id: CommunitySchema.id,
        name: CommunitySchema.name,
        communityId: CommunitySchema.communityId,
        description: CommunitySchema.description,
        isActive: CommunitySchema.isActive,
        createdAt: CommunitySchema.createdAt,
        updatedAt: CommunitySchema.updatedAt,
      })
      .from(CommunitySchema)
      .where(
        and(
          eq(CommunitySchema.userId, userId),
          eq(CommunitySchema.isActive, true),
        ),
      )
      .orderBy(CommunitySchema.createdAt);
    return {
      content: [
        {
          type: "text" as const,
          text:
            communities.length === 0
              ? "No communities found."
              : `Your communities (active):\n\n${communities
                  .map(
                    (c, i) =>
                      `${i + 1}. Community ID: ${c.communityId}\n   Name: ${c.name}\n   Description: ${c.description || "-"}\n   Created: ${c.createdAt}`,
                  )
                  .join("\n\n")}`,
        },
      ],
      communities,
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Add a community for the authenticated user.
 * Now validates args using Zod before querying the database.
 */
export async function addCommunity(args: any, userId: string) {
  // Validate input
  const parsed = addCommunitySchema.safeParse(args);
  if (!parsed.success) {
    return {
      content: [
        { type: "text", text: `Invalid input: ${parsed.error.message}` },
      ],
      isError: true,
    };
  }
  args = parsed.data;
  try {
    const { communityId, name, description } = args;
    if (!communityId || !name) {
      return {
        content: [{ type: "text", text: "communityId and name are required." }],
        isError: true,
      };
    }
    // Check for duplicate
    const existing = await db
      .select()
      .from(CommunitySchema)
      .where(
        and(
          eq(CommunitySchema.userId, userId),
          eq(CommunitySchema.communityId, communityId),
        ),
      )
      .limit(1);
    if (existing.length > 0) {
      return {
        content: [
          { type: "text", text: "Community ID already exists for this user." },
        ],
        isError: true,
      };
    }
    const [community] = await db
      .insert(CommunitySchema)
      .values({
        communityId,
        name,
        description: description || null,
        userId,
      })
      .returning();
    return {
      content: [
        {
          type: "text",
          text: `Community added: ${community.name} (${community.communityId})`,
        },
      ],
      community,
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
      isError: true,
    };
  }
}
