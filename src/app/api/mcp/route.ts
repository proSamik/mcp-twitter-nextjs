import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key";
import { pgDb as db } from "@/lib/db/pg/db.pg";
import { TweetSchema, TwitterAccountSchema } from "@/lib/db/pg/schema.pg";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  broadcastTweetCreated,
  broadcastTweetUpdated,
  broadcastTweetDeleted,
} from "@/lib/websocket/server";
import { scheduleTweetInternal } from '@/lib/twitter/schedule-tweet';
import { postTweetInternal } from '@/lib/twitter/post-tweet';

/**
 * Get today's date and time information for the caller's timezone.
 */
async function getTodaysDate(args: { timezone?: string }) {
  try {
    const { timezone } = args;
    const now = new Date();

    // Use provided timezone or default to UTC
    const timeZone = timezone || "UTC";

    // Format date in various useful formats
    const dateInfo = {
      iso: now.toISOString(),
      date: now.toISOString().split("T")[0], // YYYY-MM-DD format
      time: now.toISOString().split("T")[1].split(".")[0], // HH:MM:SS format
      timestamp: now.getTime(),
      timezone: timeZone,
      localDate: timezone
        ? new Intl.DateTimeFormat("en-CA", {
            timeZone: timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(now)
        : now.toISOString().split("T")[0],
      localTime: timezone
        ? new Intl.DateTimeFormat("en-GB", {
            timeZone: timezone,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }).format(now)
        : now.toISOString().split("T")[1].split(".")[0],
      localDateTime: timezone
        ? new Intl.DateTimeFormat("en-CA", {
            timeZone: timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          })
            .format(now)
            .replace(", ", " ")
        : now.toISOString().replace("T", " ").split(".")[0],
      weekday: timezone
        ? new Intl.DateTimeFormat("en-US", {
            timeZone: timezone,
            weekday: "long",
          }).format(now)
        : new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(now),
      month: timezone
        ? new Intl.DateTimeFormat("en-US", {
            timeZone: timezone,
            month: "long",
          }).format(now)
        : new Intl.DateTimeFormat("en-US", { month: "long" }).format(now),
    };

    return {
      content: [
        {
          type: "text",
          text: `Current date and time information:\n\n${JSON.stringify(dateInfo, null, 2)}`,
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
 * List all tweets for the authenticated user.
 */
async function listTweets(args: { status?: string; limit?: number }, userId: string) {
  try {
    const { status, limit = 50 } = args;
    // Build where condition
    const whereConditions = [eq(TweetSchema.userId, userId)];
    if (status) {
      whereConditions.push(eq(TweetSchema.status, status));
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
      .where(whereConditions.length > 1 ? and(...whereConditions) : whereConditions[0])
      .orderBy(TweetSchema.createdAt)
      .limit(limit);

    return {
      content: [
        {
          type: "text",
          text: `Found ${tweets.length} tweets${status ? ` with status "${status}"` : ""}:\n\n${JSON.stringify(tweets, null, 2)}`,
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
 * Create a new tweet/draft for the authenticated user.
 */
async function createTweet(args: any, userId: string) {
  try {
    const {
      content,
      tweetType = "draft",
      status = "draft",
      scheduledFor,
      hashtags = [],
      mentions = [],
      tags = [],
      twitterAccountId,
    } = args;

    // Validate Twitter account belongs to user
    if (twitterAccountId) {
      const [account] = await db
        .select()
        .from(TwitterAccountSchema)
        .where(
          and(eq(TwitterAccountSchema.userId, userId), eq(TwitterAccountSchema.id, twitterAccountId)),
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
        .where(and(eq(TwitterAccountSchema.userId, userId), eq(TwitterAccountSchema.isActive, true)))
        .limit(1);
      
      if (!account) {
        throw new Error("No active Twitter account found. Please connect a Twitter account first.");
      }
      accountId = account.id;
    }

    const [dbTweet] = await db
      .insert(TweetSchema)
      .values({
        nanoId: nanoid(8),
        content,
        tweetType,
        status,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        hashtags,
        mentions,
        tags,
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
          text: `Tweet created successfully!\n\n${JSON.stringify(publicTweet, null, 2)}`,
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
 */
async function scheduleTweet(args: any, userId: string) {
  try {
    const { nanoId, scheduledFor, timezone = 'UTC' } = args;

    // Find the tweet by nanoId
    const [tweet] = await db
      .select()
      .from(TweetSchema)
      .where(and(eq(TweetSchema.userId, userId), eq(TweetSchema.nanoId, nanoId)))
      .limit(1);

    if (!tweet) {
      throw new Error(`Tweet with nanoId "${nanoId}" not found`);
    }

    if (tweet.status !== 'draft') {
      throw new Error('Only draft tweets can be scheduled');
    }

    // Parse the scheduled time in user's timezone
    // If scheduledFor doesn't include timezone info, treat it as user's local time
    let scheduleDate: Date;
    if (scheduledFor.includes('T') && !scheduledFor.includes('Z') && !scheduledFor.includes('+')) {
      // Local datetime format - convert from user's timezone to UTC
      const localDate = new Date(scheduledFor);
      const utcDate = new Date(localDate.toLocaleString('en-US', { timeZone: 'UTC' }));
      const userDate = new Date(localDate.toLocaleString('en-US', { timeZone: timezone }));
      const timezoneOffset = userDate.getTime() - utcDate.getTime();
      scheduleDate = new Date(localDate.getTime() - timezoneOffset);
    } else {
      // Already UTC or has timezone info
      scheduleDate = new Date(scheduledFor);
    }
    
    const now = new Date();
    
    // Check if the scheduled time is valid
    if (isNaN(scheduleDate.getTime())) {
      throw new Error('Invalid scheduled time format');
    }
    
    const delaySeconds = Math.floor((scheduleDate.getTime() - now.getTime()) / 1000);
    console.log(`MCP Schedule: ${scheduledFor} (${timezone}) -> ${scheduleDate.toISOString()}, delay: ${delaySeconds}s`);

    if (delaySeconds < 0) {
      throw new Error('Scheduled time must be in the future');
    }

    if (delaySeconds > 604800) {
      throw new Error('You can only schedule tweets up to 7 days in advance');
    }

    // Schedule with QStash using internal logic
    const scheduleResult = await scheduleTweetInternal({
      nanoId: tweet.nanoId,
      scheduleDate,
      content: tweet.content,
      userId,
      twitterAccountId: tweet.twitterAccountId,
      mediaIds: tweet.mediaUrls || undefined,
      isThread: tweet.tweetType === 'thread',
      threadTweets: tweet.tweetType === 'thread' ? tweet.content.split('\n\n') : undefined,
      delaySeconds, // Pass calculated delay to QStash
    });

    if (!scheduleResult.success) {
      throw new Error(scheduleResult.error || 'Failed to schedule tweet');
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
 */
async function deleteTweet(args: any, userId: string) {
  try {
    const { nanoId } = args;

    // Find the tweet by nanoId
    const [tweet] = await db
      .select({
        id: TweetSchema.id,
        nanoId: TweetSchema.nanoId,
      })
      .from(TweetSchema)
      .where(and(eq(TweetSchema.userId, userId), eq(TweetSchema.nanoId, nanoId)))
      .limit(1);

    if (!tweet) {
      throw new Error(`Tweet with nanoId "${nanoId}" not found`);
    }

    // Delete the tweet
    await db.delete(TweetSchema).where(eq(TweetSchema.id, tweet.id));

    // Broadcast tweet deletion to WebSocket clients
    try {
      broadcastTweetDeleted(tweet.id, userId);
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
 */
async function postTweet(args: any, userId: string) {
  try {
    const { nanoId } = args;
    
    // Find the tweet by nanoId
    const [tweet] = await db
      .select()
      .from(TweetSchema)
      .where(and(eq(TweetSchema.userId, userId), eq(TweetSchema.nanoId, nanoId)))
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
        isThread: tweet.tweetType === 'thread',
        threadTweets: tweet.tweetType === 'thread' ? tweet.content.split('\n\n') : undefined,
        userId,
      });
      
      if (postResult.success && postResult.twitterTweetId) {
        postSuccess = true;
        break;
      } else {
        lastError = postResult.error || 'Unknown error';
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
      .returning({
        nanoId: TweetSchema.nanoId,
        content: TweetSchema.content,
        status: TweetSchema.status,
        postedAt: TweetSchema.postedAt,
        twitterTweetId: TweetSchema.twitterTweetId,
        tweetType: TweetSchema.tweetType,
      });
      
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
 */
async function rescheduleTweet(args: any, userId: string) {
  try {
    const { nanoId, newScheduledFor, timezone = 'UTC' } = args;
    
    // Find the tweet by nanoId
    const [tweet] = await db
      .select()
      .from(TweetSchema)
      .where(and(eq(TweetSchema.userId, userId), eq(TweetSchema.nanoId, nanoId)))
      .limit(1);
      
    if (!tweet) {
      throw new Error(`Tweet with nanoId "${nanoId}" not found`);
    }
    
    if (tweet.status !== "scheduled") {
      throw new Error("Only scheduled tweets can be rescheduled");
    }

    // Parse the scheduled time in user's timezone
    let newScheduleDate: Date;
    if (newScheduledFor.includes('T') && !newScheduledFor.includes('Z') && !newScheduledFor.includes('+')) {
      // Local datetime format - convert from user's timezone to UTC
      const localDate = new Date(newScheduledFor);
      const utcDate = new Date(localDate.toLocaleString('en-US', { timeZone: 'UTC' }));
      const userDate = new Date(localDate.toLocaleString('en-US', { timeZone: timezone }));
      const timezoneOffset = userDate.getTime() - utcDate.getTime();
      newScheduleDate = new Date(localDate.getTime() - timezoneOffset);
    } else {
      // Already UTC or has timezone info
      newScheduleDate = new Date(newScheduledFor);
    }
    
    const now = new Date();
    
    // Check if the scheduled time is valid
    if (isNaN(newScheduleDate.getTime())) {
      throw new Error('Invalid scheduled time format');
    }
    
    const delaySeconds = Math.floor((newScheduleDate.getTime() - now.getTime()) / 1000);
    console.log(`MCP Reschedule: ${newScheduledFor} (${timezone}) -> ${newScheduleDate.toISOString()}, delay: ${delaySeconds}s`);

    if (delaySeconds < 0) {
      throw new Error('New scheduled time must be in the future');
    }

    if (delaySeconds > 604800) {
      throw new Error('You can only schedule tweets up to 7 days in advance');
    }

    // Cancel existing QStash message if it exists
    if (tweet.qstashMessageId) {
      try {
        const { getTweetScheduler } = await import('@/lib/upstash/qstash');
        console.log(`Cancelling old QStash message: ${tweet.qstashMessageId}`);
        await getTweetScheduler().cancelScheduledTweet(tweet.qstashMessageId);
      } catch (error) {
        console.warn('Failed to cancel old QStash message:', error);
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
      isThread: tweet.tweetType === 'thread',
      threadTweets: tweet.tweetType === 'thread' ? tweet.content.split('\n\n') : undefined,
    });

    if (!scheduleResult.success) {
      throw new Error(scheduleResult.error || 'Failed to reschedule tweet');
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
      .returning({
        nanoId: TweetSchema.nanoId,
        content: TweetSchema.content,
        status: TweetSchema.status,
        scheduledFor: TweetSchema.scheduledFor,
        tweetType: TweetSchema.tweetType,
      });
      
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
 */
async function convertDraftToScheduled(args: any, userId: string) {
  try {
    const { nanoId, scheduledFor, timezone = 'UTC' } = args;
    
    // Find the tweet by nanoId
    const [tweet] = await db
      .select()
      .from(TweetSchema)
      .where(and(eq(TweetSchema.userId, userId), eq(TweetSchema.nanoId, nanoId)))
      .limit(1);
      
    if (!tweet) {
      throw new Error(`Tweet with nanoId "${nanoId}" not found`);
    }
    
    if (tweet.status !== "draft") {
      throw new Error("Only draft tweets can be converted to scheduled");
    }

    // Parse the scheduled time in user's timezone
    let scheduleDate: Date;
    if (scheduledFor.includes('T') && !scheduledFor.includes('Z') && !scheduledFor.includes('+')) {
      // Local datetime format - convert from user's timezone to UTC
      const localDate = new Date(scheduledFor);
      const utcDate = new Date(localDate.toLocaleString('en-US', { timeZone: 'UTC' }));
      const userDate = new Date(localDate.toLocaleString('en-US', { timeZone: timezone }));
      const timezoneOffset = userDate.getTime() - utcDate.getTime();
      scheduleDate = new Date(localDate.getTime() - timezoneOffset);
    } else {
      // Already UTC or has timezone info
      scheduleDate = new Date(scheduledFor);
    }
    
    const now = new Date();
    
    // Check if the scheduled time is valid
    if (isNaN(scheduleDate.getTime())) {
      throw new Error('Invalid scheduled time format');
    }
    
    const delaySeconds = Math.floor((scheduleDate.getTime() - now.getTime()) / 1000);
    console.log(`MCP Convert to Schedule: ${scheduledFor} (${timezone}) -> ${scheduleDate.toISOString()}, delay: ${delaySeconds}s`);

    if (delaySeconds < 0) {
      throw new Error('Scheduled time must be in the future');
    }

    if (delaySeconds > 604800) {
      throw new Error('You can only schedule tweets up to 7 days in advance');
    }

    // Schedule with QStash using internal logic
    const scheduleResult = await scheduleTweetInternal({
      nanoId: tweet.nanoId,
      scheduleDate,
      content: tweet.content,
      userId,
      twitterAccountId: tweet.twitterAccountId,
      mediaIds: tweet.mediaUrls || undefined,
      isThread: tweet.tweetType === 'thread',
      threadTweets: tweet.tweetType === 'thread' ? tweet.content.split('\n\n') : undefined,
    });

    if (!scheduleResult.success) {
      throw new Error(scheduleResult.error || 'Failed to schedule tweet');
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
      .returning({
        nanoId: TweetSchema.nanoId,
        content: TweetSchema.content,
        status: TweetSchema.status,
        scheduledFor: TweetSchema.scheduledFor,
        tweetType: TweetSchema.tweetType,
      });
      
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
 */
async function convertDraftToPosted(args: any, userId: string) {
  return await postTweet(args, userId);
}

/**
 * Authenticate API requests using Bearer token and return user info.
 * @param request Next.js request object
 * @returns user object or null
 */
async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7);
  const user = await validateApiKey(token);
  if (!user) return null;
  return user;
}

/**
 * POST handler for direct JSON-RPC requests
 * Handles MCP methods directly without transport layer to avoid compatibility issues.
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          error: {
            code: -32001,
            message:
              "Authentication required: Please provide a valid API key in Authorization header",
          },
          id: null,
        },
        { status: 401 },
      );
    }

    // Parse the JSON-RPC request
    const body = await request.json();
    const { method, params, id } = body;

    // Debug logging
    console.log(`MCP Request: ${method}`, {
      method,
      params,
      id,
      headers: Object.fromEntries(request.headers.entries()),
    });

    // Handle MCP protocol methods directly
    switch (method) {
      case "initialize":
        return NextResponse.json({
          jsonrpc: "2.0",
          result: {
            protocolVersion: params.protocolVersion || "2025-06-18",
            capabilities: {
              tools: {},
              prompts: {},
              resources: {},
              logging: {},
            },
            serverInfo: {
              name: "twitter-mcp-server",
              version: "1.0.0",
            },
          },
          id,
        });

      case "tools/list":
        return NextResponse.json({
          jsonrpc: "2.0",
          result: {
            tools: [
              // today's date
              {
                name: "todays_date",
                description:
                  "Get current date and time information in caller's timezone",
                inputSchema: {
                  type: "object",
                  properties: {
                    timezone: {
                      type: "string",
                      description:
                        "IANA timezone name (e.g., 'America/New_York', 'Europe/London'). Defaults to UTC if not provided.",
                    },
                  },
                  required: [],
                },
              },
              // list tweets
              {
                name: "list_tweets",
                description:
                  "List all tweets for the authenticated user",
                inputSchema: {
                  type: "object",
                  properties: {
                    status: {
                      type: "string",
                      enum: ["draft", "scheduled", "posted", "failed"],
                      description: "Filter tweets by status",
                    },
                    limit: {
                      type: "number",
                      description: "Maximum number of tweets to return (default: 50)",
                    },
                  },
                  required: [],
                },
              },
              // create tweets
              {
                name: "create_tweet",
                description:
                  "Create a new tweet or draft for the authenticated user",
                inputSchema: {
                  type: "object",
                  properties: {
                    content: {
                      type: "string",
                      description: "Tweet content",
                    },
                    tweetType: {
                      type: "string",
                      enum: ["draft", "single", "thread"],
                      description: "Type of tweet",
                      default: "draft",
                    },
                    status: {
                      type: "string",
                      enum: ["draft", "scheduled", "posted"],
                      description: "Tweet status",
                      default: "draft",
                    },
                    scheduledFor: {
                      type: "string",
                      format: "date-time",
                      description: "ISO date string for when to post (for scheduled tweets)",
                    },
                    hashtags: {
                      type: "array",
                      items: { type: "string" },
                      description: "Hashtags to include",
                    },
                    mentions: {
                      type: "array",
                      items: { type: "string" },
                      description: "Usernames to mention",
                    },
                    tags: {
                      type: "array",
                      items: { type: "string" },
                      description: "Organizational tags",
                    },
                    twitterAccountId: {
                      type: "string",
                      description: "ID of Twitter account to use (optional, uses first active account if not provided)",
                    },
                  },
                  required: ["content"],
                },
              },
              // schedule tweets
              {
                name: "schedule_tweet",
                description:
                  "Schedule an existing tweet for posting at a specific time",
                inputSchema: {
                  type: "object",
                  properties: {
                    nanoId: {
                      type: "string",
                      description: "Unique nanoId of the tweet to schedule",
                    },
                    scheduledFor: {
                      type: "string",
                      format: "date-time",
                      description: "Date string for when to post the tweet (YYYY-MM-DDTHH:MM format for local time)",
                    },
                    timezone: {
                      type: "string",
                      description: "User's timezone (e.g., 'America/New_York', 'Europe/London'). Defaults to UTC if not provided.",
                      default: "UTC"
                    },
                  },
                  required: ["nanoId", "scheduledFor"],
                },
              },
              // delete tweets
              {
                name: "delete_tweet",
                description: "Delete a tweet by nanoId (authenticated user)",
                inputSchema: {
                  type: "object",
                  properties: {
                    nanoId: {
                      type: "string",
                      description: "Unique nanoId of the tweet to delete",
                    },
                  },
                  required: ["nanoId"],
                },
              },
              // post tweet
              {
                name: "post_tweet",
                description: "Convert a draft tweet to posted (immediately post to Twitter)",
                inputSchema: {
                  type: "object",
                  properties: {
                    nanoId: {
                      type: "string",
                      description: "Unique nanoId of the draft tweet to post",
                    },
                  },
                  required: ["nanoId"],
                },
              },
              // reschedule tweet
              {
                name: "reschedule_tweet",
                description: "Reschedule an existing scheduled tweet to a new time",
                inputSchema: {
                  type: "object",
                  properties: {
                    nanoId: {
                      type: "string",
                      description: "Unique nanoId of the scheduled tweet to reschedule",
                    },
                    newScheduledFor: {
                      type: "string",
                      format: "date-time",
                      description: "New date string for when to post the tweet (YYYY-MM-DDTHH:MM format for local time)",
                    },
                    timezone: {
                      type: "string",
                      description: "User's timezone (e.g., 'America/New_York', 'Europe/London'). Defaults to UTC if not provided.",
                      default: "UTC"
                    },
                  },
                  required: ["nanoId", "newScheduledFor"],
                },
              },
              // convert draft to scheduled
              {
                name: "convert_draft_to_scheduled",
                description: "Convert a draft tweet to a scheduled tweet",
                inputSchema: {
                  type: "object",
                  properties: {
                    nanoId: {
                      type: "string",
                      description: "Unique nanoId of the draft tweet to convert",
                    },
                    scheduledFor: {
                      type: "string",
                      format: "date-time",
                      description: "Date string for when to post the tweet (YYYY-MM-DDTHH:MM format for local time)",
                    },
                    timezone: {
                      type: "string",
                      description: "User's timezone (e.g., 'America/New_York', 'Europe/London'). Defaults to UTC if not provided.",
                      default: "UTC"
                    },
                  },
                  required: ["nanoId", "scheduledFor"],
                },
              },
              // convert draft to posted
              {
                name: "convert_draft_to_posted",
                description: "Convert a draft tweet to posted (immediately post to Twitter)",
                inputSchema: {
                  type: "object",
                  properties: {
                    nanoId: {
                      type: "string",
                      description: "Unique nanoId of the draft tweet to post",
                    },
                  },
                  required: ["nanoId"],
                },
              },
            ],
          },
          id,
        });

      case "tools/call":
        try {
          const { name: toolName, arguments: toolArgs } = params;

          // Execute tools directly based on their name
          let result: any;
          switch (toolName) {
            case "todays_date":
              result = await getTodaysDate(toolArgs);
              break;
            case "list_tweets":
              result = await listTweets(toolArgs, user.userId);
              break;
            case "create_tweet":
              result = await createTweet(toolArgs, user.userId);
              break;
            case "schedule_tweet":
              result = await scheduleTweet(toolArgs, user.userId);
              break;
            case "delete_tweet":
              result = await deleteTweet(toolArgs, user.userId);
              break;
            case "post_tweet":
              result = await postTweet(toolArgs, user.userId);
              break;
            case "reschedule_tweet":
              result = await rescheduleTweet(toolArgs, user.userId);
              break;
            case "convert_draft_to_scheduled":
              result = await convertDraftToScheduled(toolArgs, user.userId);
              break;
            case "convert_draft_to_posted":
              result = await convertDraftToPosted(toolArgs, user.userId);
              break;
            default:
              throw new Error(`Tool ${toolName} not found`);
          }

          return NextResponse.json({
            jsonrpc: "2.0",
            result,
            id,
          });
        } catch (error) {
          return NextResponse.json({
            jsonrpc: "2.0",
            error: {
              code: -32603,
              message:
                error instanceof Error
                  ? error.message
                  : "Tool execution failed",
            },
            id,
          });
        }

      default:
        return NextResponse.json({
          jsonrpc: "2.0",
          error: {
            code: -32601,
            message: `Method ${method} not found`,
          },
          id,
        });
    }
  } catch (error) {
    console.error("MCP POST request error:", error);
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: null,
      },
      { status: 500 },
    );
  }
}

/**
 * GET handler for Streamable HTTP transport - establishes SSE stream
 * Required by MCP Inspector and other clients using Streamable HTTP
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        {
          error:
            "Authentication required: Please provide a valid API key in Authorization header",
        },
        { status: 401 },
      );
    }

    // Check if client accepts Server-Sent Events
    const acceptHeader = request.headers.get("accept") || "";
    if (!acceptHeader.includes("text/event-stream")) {
      return new NextResponse("Method Not Allowed", { status: 405 });
    }

    // Create SSE stream
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection event
        const encoder = new TextEncoder();
        const data = `data: ${JSON.stringify({
          type: "connection",
          timestamp: new Date().toISOString(),
          sessionId: crypto.randomUUID(),
        })}\n\n`;
        controller.enqueue(encoder.encode(data));
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, Accept, Mcp-Session-Id",
        "Access-Control-Expose-Headers": "Mcp-Session-Id",
      },
    });
  } catch (error) {
    console.error("MCP GET request error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(_: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, Accept, Mcp-Session-Id",
      "Access-Control-Expose-Headers": "Mcp-Session-Id",
    },
  });
}