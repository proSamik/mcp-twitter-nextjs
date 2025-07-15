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
 * Schedule a tweet for posting at a specific time.
 */
async function scheduleTweet(args: any, userId: string) {
  try {
    const { nanoId, scheduledFor } = args;

    // Find the tweet by nanoId
    const [tweet] = await db
      .select()
      .from(TweetSchema)
      .where(and(eq(TweetSchema.userId, userId), eq(TweetSchema.nanoId, nanoId)))
      .limit(1);

    if (!tweet) {
      throw new Error(`Tweet with nanoId "${nanoId}" not found`);
    }

    const [updatedTweet] = await db
      .update(TweetSchema)
      .set({
        status: "scheduled",
        scheduledFor: new Date(scheduledFor),
        updatedAt: new Date(),
      })
      .where(eq(TweetSchema.id, tweet.id))
      .returning({
        nanoId: TweetSchema.nanoId,
        content: TweetSchema.content,
        status: TweetSchema.status,
        scheduledFor: TweetSchema.scheduledFor,
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
          text: `Tweet scheduled successfully for ${scheduledFor}!\n\n${JSON.stringify(updatedTweet, null, 2)}`,
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
              {
                name: "create_tweet",
                description:
                  "Create a new tweet or draft for the authenticated user",
                inputSchema: {
                  type: "object",
                  properties: {
                    content: {
                      type: "string",
                      description: "Tweet content (max 280 characters)",
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
                      description: "ISO date string for when to post the tweet",
                    },
                  },
                  required: ["nanoId", "scheduledFor"],
                },
              },
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