import { auth } from "@/lib/auth/server";
import { createMcpHandler } from "@vercel/mcp-adapter";
import { withMcpAuth } from "better-auth/plugins";
import { z } from "zod";
import {
  listTweets,
  createTweet,
  scheduleTweet,
  deleteTweet,
  postTweet,
  rescheduleTweet,
  convertDraftToScheduled,
  convertDraftToPosted,
  listTwitterAccounts,
  listCommunities,
  addCommunity,
} from "./actions";
import { getTwitterCache } from "@/lib/upstash/redis";

// Production-ready Redis-based rate limiter
async function checkRateLimit(
  userId: string,
  operation: string,
  limit: number = 60,
  windowSeconds: number = 60,
): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: number;
}> {
  const redis = getTwitterCache();
  return await redis.checkRateLimit(
    userId,
    `mcp:${operation}`,
    limit,
    windowSeconds,
  );
}

// Rate limit error response with details
function createRateLimitResponse(remaining: number, resetTime: number) {
  const resetDate = new Date(resetTime);
  return {
    content: [
      {
        type: "text" as const,
        text: `Rate limit exceeded. ${remaining} requests remaining. Limit resets at ${resetDate.toISOString()}.`,
      },
    ],
    isError: true,
  };
}

const handler = withMcpAuth(auth, (req, session) => {
  // session contains the access token record with scopes and user ID
  return createMcpHandler(
    (server) => {
      // list tweets
      server.tool(
        "list_tweets",
        "🔍 LIST TWEETS: Get all tweets for the authenticated user. Supports filtering by status, date, text search, and pagination.",
        {
          status: z
            .enum(["draft", "scheduled", "posted", "failed"])
            .optional()
            .describe("Filter tweets by status"),
          limit: z
            .number()
            .optional()
            .describe("Maximum number of tweets to return (default: 10)"),
          page: z
            .number()
            .optional()
            .describe("Page number for pagination (default: 1)"),
          fromDate: z
            .string()
            .optional()
            .describe("Filter tweets created after this date (YYYY-MM-DD)"),
          toDate: z
            .string()
            .optional()
            .describe("Filter tweets created before this date (YYYY-MM-DD)"),
          text: z
            .string()
            .optional()
            .describe("Text to search for in tweet content or thread"),
        },
        async (args) => {
          const rateLimitCheck = await checkRateLimit(
            session.userId,
            "list_tweets",
            30,
            60,
          );
          if (!rateLimitCheck.allowed) {
            return createRateLimitResponse(
              rateLimitCheck.remaining,
              rateLimitCheck.resetTime,
            );
          }
          const result = await listTweets(args, session.userId);
          return {
            content: result.content.map((item) => ({
              type: "text" as const,
              text: item.text,
            })),
            isError: result.isError,
          };
        },
      );

      // create tweet
      server.tool(
        "create_tweet",
        "✍️ CREATE TWEET: Create a new tweet or draft for the authenticated user. Supports both single tweets and threads. Use this to create content that can be posted immediately or saved as a draft for later scheduling. Do NOT use this for scheduling - use convert_draft_to_scheduled instead!",
        {
          content: z
            .string()
            .optional()
            .describe("Tweet content (required for single tweets)"),
          tweetType: z
            .enum(["single", "thread"])
            .default("single")
            .describe(
              "Type of tweet: 'single' for regular tweets, 'thread' for multi-tweet threads",
            ),
          status: z
            .enum(["draft", "posted"])
            .default("draft")
            .describe(
              "Tweet status: 'draft' to save, 'posted' to publish immediately",
            ),
          tags: z
            .array(z.string())
            .optional()
            .describe("Organizational tags for categorization"),
          twitterAccountId: z
            .string()
            .optional()
            .describe(
              "ID of Twitter account to use (optional, uses first active account if not provided)",
            ),
          communityId: z
            .string()
            .optional()
            .describe("Community ID to post to (optional)"),
          // Thread support
          isThread: z
            .boolean()
            .optional()
            .describe(
              "Set to true to create a thread (automatically detected if threadData/threadTweets provided)",
            ),
          threadTweets: z
            .array(z.string())
            .optional()
            .describe(
              "Legacy format: Array of tweet content strings for threads",
            ),
          threadData: z
            .array(
              z.object({
                content: z
                  .string()
                  .describe("Content of this tweet in the thread"),
                mediaIds: z
                  .array(z.string())
                  .optional()
                  .describe("Media IDs for this tweet (not supported in MCP)"),
              }),
            )
            .optional()
            .describe(
              "New format: Array of tweet objects with content and media for threads",
            ),
          // Media support (note: media files cannot be uploaded via MCP)
          mediaIds: z
            .array(z.string())
            .optional()
            .describe(
              "Array of media IDs (note: media upload not supported via MCP)",
            ),
        },
        async (args) => {
          const rateLimitCheck = await checkRateLimit(
            session.userId,
            "create_tweet",
            15,
            60,
          );
          if (!rateLimitCheck.allowed) {
            return createRateLimitResponse(
              rateLimitCheck.remaining,
              rateLimitCheck.resetTime,
            );
          }

          const result = await createTweet(args, session.userId);
          return {
            content: result.content.map((item) => ({
              type: "text" as const,
              text: item.text,
            })),
            isError: result.isError,
          };
        },
      );

      // schedule tweet
      server.tool(
        "schedule_tweet",
        "⏰ SCHEDULE EXISTING TWEET: Schedule an existing DRAFT tweet for posting at a specific time. This is the PREFERRED way to schedule new content - first create a draft, then convert it to scheduled.",
        {
          nanoId: z.string().describe("Unique nanoId of the tweet to schedule"),
          scheduledFor: z
            .string()
            .describe(
              "Date string for when to post the tweet (YYYY-MM-DDTHH:MM format for local time)",
            ),
          timezone: z
            .string()
            .default("UTC")
            .describe(
              "User's timezone (e.g., 'America/New_York', 'Europe/London'). Defaults to UTC if not provided.",
            ),
        },
        async (args) => {
          const rateLimitCheck = await checkRateLimit(
            session.userId,
            "schedule_tweet",
            10,
            60,
          );
          if (!rateLimitCheck.allowed) {
            return createRateLimitResponse(
              rateLimitCheck.remaining,
              rateLimitCheck.resetTime,
            );
          }

          const result = await scheduleTweet(args, session.userId);
          return {
            content: result.content.map((item) => ({
              type: "text" as const,
              text: item.text,
            })),
            isError: result.isError,
          };
        },
      );

      // delete tweet
      server.tool(
        "delete_tweet",
        "🗑️ DELETE TWEET: Permanently delete a tweet by nanoId. Works for drafts, scheduled tweets (will cancel QStash scheduling), and posted tweets. Use this to remove unwanted content.",
        {
          nanoId: z.string().describe("Unique nanoId of the tweet to delete"),
        },
        async (args) => {
          const rateLimitCheck = await checkRateLimit(
            session.userId,
            "delete_tweet",
            20,
            60,
          );
          if (!rateLimitCheck.allowed) {
            return createRateLimitResponse(
              rateLimitCheck.remaining,
              rateLimitCheck.resetTime,
            );
          }

          const result = await deleteTweet(args, session.userId);
          return {
            content: result.content.map((item) => ({
              type: "text" as const,
              text: item.text,
            })),
            isError: result.isError,
          };
        },
      );

      // post tweet
      server.tool(
        "post_tweet",
        "🚀 POST TWEET NOW: Immediately post a DRAFT tweet to Twitter. Only works with tweets that have status='draft'. Use this to publish content right away.",
        {
          nanoId: z
            .string()
            .describe("Unique nanoId of the draft tweet to post"),
        },
        async (args) => {
          const rateLimitCheck = await checkRateLimit(
            session.userId,
            "post_tweet",
            10,
            60,
          );
          if (!rateLimitCheck.allowed) {
            return createRateLimitResponse(
              rateLimitCheck.remaining,
              rateLimitCheck.resetTime,
            );
          }

          const result = await postTweet(args, session.userId);
          return {
            content: result.content.map((item) => ({
              type: "text" as const,
              text: item.text,
            })),
            isError: result.isError,
          };
        },
      );

      // reschedule tweet
      server.tool(
        "reschedule_tweet",
        "🔄 RESCHEDULE TWEET: Change the scheduled time of an existing SCHEDULED tweet. Only works with tweets that have status='scheduled'. Automatically cancels old QStash scheduling. Note: Requires NEXT_PUBLIC_APP_URL to be set to a publicly accessible URL for QStash webhooks to work (localhost URLs will fail).",
        {
          nanoId: z
            .string()
            .describe("Unique nanoId of the scheduled tweet to reschedule"),
          newScheduledFor: z
            .string()
            .describe(
              "New date string for when to post the tweet (YYYY-MM-DDTHH:MM format for local time)",
            ),
          timezone: z
            .string()
            .default("UTC")
            .describe(
              "User's timezone (e.g., 'America/New_York', 'Europe/London'). Defaults to UTC if not provided.",
            ),
        },
        async (args) => {
          const rateLimitCheck = await checkRateLimit(
            session.userId,
            "reschedule_tweet",
            10,
            60,
          );
          if (!rateLimitCheck.allowed) {
            return createRateLimitResponse(
              rateLimitCheck.remaining,
              rateLimitCheck.resetTime,
            );
          }

          const result = await rescheduleTweet(args, session.userId);
          return {
            content: result.content.map((item) => ({
              type: "text" as const,
              text: item.text,
            })),
            isError: result.isError,
          };
        },
      );

      // convert draft to scheduled
      server.tool(
        "convert_draft_to_scheduled",
        "📅 CONVERT DRAFT TO SCHEDULED: Transform a DRAFT tweet into a SCHEDULED tweet for future posting. This is the PREFERRED way to schedule new content - first create a draft, then convert it to scheduled. Note: Requires NEXT_PUBLIC_APP_URL to be set to a publicly accessible URL for QStash webhooks to work (localhost URLs will fail).",
        {
          nanoId: z
            .string()
            .describe("Unique nanoId of the draft tweet to convert"),
          scheduledFor: z
            .string()
            .describe(
              "Date string for when to post the tweet (YYYY-MM-DDTHH:MM format for local time)",
            ),
          timezone: z
            .string()
            .default("UTC")
            .describe(
              "User's timezone (e.g., 'America/New_York', 'Europe/London'). Defaults to UTC if not provided.",
            ),
        },
        async (args) => {
          const rateLimitCheck = await checkRateLimit(
            session.userId,
            "convert_draft_to_scheduled",
            10,
            60,
          );
          if (!rateLimitCheck.allowed) {
            return createRateLimitResponse(
              rateLimitCheck.remaining,
              rateLimitCheck.resetTime,
            );
          }

          const result = await convertDraftToScheduled(args, session.userId);
          return {
            content: result.content.map((item) => ({
              type: "text" as const,
              text: item.text,
            })),
            isError: result.isError,
          };
        },
      );

      // convert draft to posted
      server.tool(
        "convert_draft_to_posted",
        "📢 CONVERT DRAFT TO POSTED: Transform a DRAFT tweet into a POSTED tweet (immediately publish to Twitter). This is the PREFERRED way to post new content - first create a draft, then convert it to posted.",
        {
          nanoId: z
            .string()
            .describe("Unique nanoId of the draft tweet to post"),
        },
        async (args) => {
          const rateLimitCheck = await checkRateLimit(
            session.userId,
            "convert_draft_to_posted",
            10,
            60,
          );
          if (!rateLimitCheck.allowed) {
            return createRateLimitResponse(
              rateLimitCheck.remaining,
              rateLimitCheck.resetTime,
            );
          }

          const result = await convertDraftToPosted(args, session.userId);
          return {
            content: result.content.map((item) => ({
              type: "text" as const,
              text: item.text,
            })),
            isError: result.isError,
          };
        },
      );

      // create thread
      server.tool(
        "create_thread",
        "🧵 CREATE THREAD: Create a multi-tweet thread draft. This is a specialized tool for thread creation with simplified interface.",
        {
          threadTweets: z
            .array(z.string())
            .min(2)
            .describe(
              "Array of tweet content strings (minimum 2 tweets for a thread)",
            ),
          status: z
            .enum(["draft", "posted"])
            .default("draft")
            .describe(
              "Thread status: 'draft' to save, 'posted' to publish immediately",
            ),
          twitterAccountId: z
            .string()
            .optional()
            .describe(
              "ID of Twitter account to use (optional, uses first active account if not provided)",
            ),
          communityId: z
            .string()
            .optional()
            .describe("Community ID to post to (optional)"),
          tags: z
            .array(z.string())
            .optional()
            .describe("Organizational tags for categorization"),
        },
        async (args) => {
          const rateLimitCheck = await checkRateLimit(
            session.userId,
            "create_thread",
            15,
            60,
          );
          if (!rateLimitCheck.allowed) {
            return createRateLimitResponse(
              rateLimitCheck.remaining,
              rateLimitCheck.resetTime,
            );
          }

          // Convert to threadData format and call createTweet
          const threadData = args.threadTweets.map((content) => ({
            content,
            mediaIds: [] as string[],
          }));

          const createArgs = {
            tweetType: "thread" as const,
            threadData,
            isThread: true,
            status: args.status,
            twitterAccountId: args.twitterAccountId,
            communityId: args.communityId,
            tags: args.tags,
          };

          const result = await createTweet(createArgs, session.userId);
          return {
            content: result.content.map((item) => ({
              type: "text" as const,
              text: item.text,
            })),
            isError: result.isError,
          };
        },
      );

      // list twitter accounts for selection
      server.tool(
        "list_twitter_accounts",
        "🔍 LIST TWITTER ACCOUNTS: List all Twitter accounts for the authenticated user, including accountId, username, displayName, and active status. Use this to select an account for tweet actions.",
        {},
        async (_args) => {
          const rateLimitCheck = await checkRateLimit(
            session.userId,
            "list_twitter_accounts",
            30,
            60,
          );
          if (!rateLimitCheck.allowed) {
            return createRateLimitResponse(
              rateLimitCheck.remaining,
              rateLimitCheck.resetTime,
            );
          }
          // Pass session.userId to the tool function
          const result = await listTwitterAccounts({}, session.userId);
          return { content: result.content };
        },
      );

      // list communities
      server.tool(
        "list_communities",
        "🔍 LIST COMMUNITIES: List all communities for the authenticated user.",
        {},
        async (_args) => {
          const rateLimitCheck = await checkRateLimit(
            session.userId,
            "list_communities",
            20,
            60,
          );
          if (!rateLimitCheck.allowed) {
            return createRateLimitResponse(
              rateLimitCheck.remaining,
              rateLimitCheck.resetTime,
            );
          }
          const result = await listCommunities({}, session.userId);
          return {
            content: (result.content ?? []).map((item) => ({
              type: "text" as const,
              text: item.text,
            })),
            isError: !!result.isError,
          };
        },
      );
      // add community
      server.tool(
        "add_community",
        "➕ ADD COMMUNITY: Add a community for the authenticated user. Requires communityId and name. Optional: description.",
        {
          communityId: z.string().describe("Community ID (required)"),
          name: z.string().describe("Community name (required)"),
          description: z
            .string()
            .optional()
            .describe("Community description (optional)"),
        },
        async (args) => {
          const rateLimitCheck = await checkRateLimit(
            session.userId,
            "add_community",
            10,
            60,
          );
          if (!rateLimitCheck.allowed) {
            return createRateLimitResponse(
              rateLimitCheck.remaining,
              rateLimitCheck.resetTime,
            );
          }
          const result = await addCommunity(args, session.userId);
          return {
            content: (result.content ?? []).map((item) => ({
              type: "text" as const,
              text: item.text,
            })),
            isError: !!result.isError,
          };
        },
      );
    },
    {
      capabilities: {
        tools: {
          list_tweets: {
            description:
              "Get all tweets for the authenticated user with filtering options",
          },
          create_tweet: {
            description:
              "Create a new tweet or draft with thread and media support",
          },
          create_thread: {
            description:
              "Create a multi-tweet thread with simplified interface",
          },
          schedule_tweet: {
            description:
              "Schedule an existing draft tweet with timezone support",
          },
          delete_tweet: {
            description: "Delete a tweet by nanoId with QStash cancellation",
          },
          post_tweet: {
            description: "Post a draft tweet immediately with retry logic",
          },
          reschedule_tweet: {
            description:
              "Reschedule an existing scheduled tweet with timezone support",
          },
          convert_draft_to_scheduled: {
            description:
              "Convert a draft tweet to scheduled with advanced options",
          },
          convert_draft_to_posted: {
            description: "Convert a draft tweet to posted with thread support",
          },
          list_twitter_accounts: {
            description: "List all Twitter accounts for the authenticated user",
          },
          list_communities: {
            description: "List all communities for the authenticated user",
          },
          add_community: {
            description: "Add a community for the authenticated user",
          },
        },
      },
    },
    {
      redisUrl: process.env.REDIS_URL,
      basePath: "/api",
      maxDuration: 60,
    },
  )(req);
});

export { handler as GET, handler as POST, handler as DELETE };
