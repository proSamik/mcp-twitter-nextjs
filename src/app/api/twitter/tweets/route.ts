import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";
import { pgDb as db } from "@/lib/db/pg/db.pg";
import { TweetSchema } from "@/lib/db/pg/schema.pg";
import { eq, desc, and, gte, lte, like, or, count, sql } from "drizzle-orm";
import { broadcastTweetDeleted } from "@/lib/websocket/server";
import { broadcastTweetUpdated } from "@/lib/websocket/server";
import { postTweetInternal } from "@/lib/twitter/post-tweet";
import { scheduleTweetInternal } from "@/lib/twitter/schedule-tweet";
import { getTweetScheduler } from "@/lib/upstash/qstash";

/**
 * Get user's tweets with pagination, search, and filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user session
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);

    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Search and filter parameters
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    // Build where conditions
    const conditions = [eq(TweetSchema.userId, userId)];

    // Add search condition - search in content and thread tweets
    if (search) {
      conditions.push(
        or(
          like(TweetSchema.content, `%${search}%`),
          sql`${TweetSchema.threadTweets}::text ILIKE ${`%${search}%`}`,
        )!,
      );
    }

    // Add status filter
    if (status && ["draft", "scheduled", "posted", "failed"].includes(status)) {
      conditions.push(eq(TweetSchema.status, status as any));
    }

    // Add date range filter
    if (fromDate) {
      const fromDateTime = new Date(fromDate);
      if (!isNaN(fromDateTime.getTime())) {
        conditions.push(gte(TweetSchema.createdAt, fromDateTime));
      }
    }

    if (toDate) {
      const toDateTime = new Date(toDate);
      if (!isNaN(toDateTime.getTime())) {
        // Set to end of day
        toDateTime.setHours(23, 59, 59, 999);
        conditions.push(lte(TweetSchema.createdAt, toDateTime));
      }
    }

    const whereClause = and(...conditions);

    // Get total count for pagination
    const [{ count: totalCount }] = await db
      .select({ count: count() })
      .from(TweetSchema)
      .where(whereClause);

    // Get paginated tweets
    const tweets = await db
      .select()
      .from(TweetSchema)
      .where(whereClause)
      .orderBy(desc(TweetSchema.createdAt))
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      tweets,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error getting tweets:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * Delete a tweet
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get current user session
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const tweetId = searchParams.get("tweetId");

    if (!tweetId) {
      return NextResponse.json(
        { error: "Tweet ID is required" },
        { status: 400 },
      );
    }

    // Get the tweet to verify ownership
    const [tweet] = await db
      .select()
      .from(TweetSchema)
      .where(eq(TweetSchema.nanoId, tweetId))
      .limit(1);

    if (!tweet) {
      return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
    }

    if (tweet.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Cancel QStash message if tweet is scheduled
    if (tweet.status === "scheduled" && tweet.qstashMessageId) {
      try {
        console.log(
          `Cancelling QStash message for deleted tweet: ${tweet.qstashMessageId}`,
        );
        await getTweetScheduler().cancelScheduledTweet(tweet.qstashMessageId);
      } catch (error) {
        console.warn(
          "Failed to cancel QStash message for deleted tweet:",
          error,
        );
        // Continue with deletion even if cancellation fails
      }
    }

    // Delete the tweet
    await db.delete(TweetSchema).where(eq(TweetSchema.id, tweet.id));

    // Broadcast deletion to connected clients
    try {
      broadcastTweetDeleted(tweetId, userId);
    } catch (error) {
      console.warn("Failed to broadcast tweet deletion:", error);
    }

    console.log(`Successfully deleted tweet ${tweetId}`);

    return NextResponse.json({
      success: true,
      message: "Tweet deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting tweet:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Add PATCH endpoint for draft conversion
/**
 * Convert a draft tweet to scheduled or posted
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get current user session
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }
    const userId = session.user.id;
    const body = await request.json();
    const {
      tweetId,
      action,
      scheduledFor,
      content,
      threadData,
      isThread,
      mediaIds,
      timezone,
    } = body;
    if (!tweetId || !action) {
      return NextResponse.json(
        { error: "tweetId and action are required" },
        { status: 400 },
      );
    }
    // Get the tweet to verify ownership and status
    const [tweet] = await db
      .select()
      .from(TweetSchema)
      .where(eq(TweetSchema.nanoId, tweetId))
      .limit(1);
    if (!tweet) {
      return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
    }
    if (tweet.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (action === "schedule" && tweet.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft tweets can be scheduled" },
        { status: 400 },
      );
    }

    if (action === "reschedule" && tweet.status !== "scheduled") {
      return NextResponse.json(
        { error: "Only scheduled tweets can be rescheduled" },
        { status: 400 },
      );
    }

    if (action === "post" && tweet.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft tweets can be posted" },
        { status: 400 },
      );
    }
    let updatedTweet: any = null;
    if (action === "schedule") {
      if (!scheduledFor) {
        return NextResponse.json(
          { error: "scheduledFor is required for scheduling" },
          { status: 400 },
        );
      }
      // Parse the scheduled time in user's timezone
      let scheduleDate: Date;
      if (
        scheduledFor.includes("T") &&
        !scheduledFor.includes("Z") &&
        !scheduledFor.includes("+")
      ) {
        // Local datetime format - convert from user's timezone to UTC
        const dateTimeString = scheduledFor.includes(":")
          ? scheduledFor + ":00"
          : scheduledFor + ":00:00";

        // Create a date by treating the input as UTC first
        const utcDate = new Date(dateTimeString + "Z");

        // Get the current timezone offset for the user's timezone at this date/time
        const tempLocalDate = new Date(dateTimeString);
        const offsetAtDate =
          new Date(
            tempLocalDate.toLocaleString("en-US", { timeZone: "UTC" }),
          ).getTime() -
          new Date(
            tempLocalDate.toLocaleString("en-US", {
              timeZone: timezone || "UTC",
            }),
          ).getTime();

        // Apply the offset to convert from user's timezone to UTC
        scheduleDate = new Date(utcDate.getTime() + offsetAtDate);
      } else {
        // Already UTC or has timezone info
        scheduleDate = new Date(scheduledFor);
      }
      const now = new Date();

      // Check if the scheduled time is valid
      if (isNaN(scheduleDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid scheduled time format" },
          { status: 400 },
        );
      }

      console.log(
        `Schedule request: ${scheduledFor} -> Parsed: ${scheduleDate.toISOString()}`,
      );

      const delaySeconds = Math.floor(
        (scheduleDate.getTime() - now.getTime()) / 1000,
      );
      if (delaySeconds < 0) {
        return NextResponse.json(
          { error: "Scheduled time must be in the future" },
          { status: 400 },
        );
      }
      if (delaySeconds > 604800) {
        return NextResponse.json(
          { error: "You can only schedule tweets up to 7 days in advance." },
          { status: 400 },
        );
      }
      // Use updated content if provided, otherwise use existing content
      const tweetContent = content || tweet.content;

      // Schedule with QStash (internal lib)
      const scheduleResult = await scheduleTweetInternal({
        nanoId: tweet.nanoId,
        scheduleDate,
        content: tweetContent,
        userId,
        twitterAccountId: tweet.twitterAccountId,
        mediaIds: tweet.mediaUrls || undefined,
        isThread: tweet.tweetType === "thread",
        threadTweets:
          tweet.tweetType === "thread" ? tweetContent.split("\n\n") : undefined,
        threadData: threadData || undefined,
      });

      console.log("Schedule result:", scheduleResult);

      if (!scheduleResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: scheduleResult.error,
          },
          { status: 500 },
        );
      }
      // Update tweet to scheduled
      [updatedTweet] = await db
        .update(TweetSchema)
        .set({
          content: tweetContent, // Update content if changed
          status: "scheduled",
          scheduledFor: scheduleDate,
          qstashMessageId: scheduleResult.messageId, // Store QStash message ID
          threadTweets:
            threadData && threadData.length > 0
              ? threadData.map((t: any) => ({
                  content: t.content,
                  mediaIds: t.mediaIds || [],
                }))
              : tweet.threadTweets || [],
          mediaUrls:
            isThread && threadData && threadData.length > 0
              ? threadData.flatMap((t: any) => t.mediaIds || [])
              : mediaIds || tweet.mediaUrls || [],
          updatedAt: new Date(),
        })
        .where(eq(TweetSchema.id, tweet.id))
        .returning();
    } else if (action === "reschedule") {
      if (!scheduledFor) {
        return NextResponse.json(
          { error: "scheduledFor is required for rescheduling" },
          { status: 400 },
        );
      }
      // Parse the scheduled time in user's timezone
      let newScheduleDate: Date;
      if (
        scheduledFor.includes("T") &&
        !scheduledFor.includes("Z") &&
        !scheduledFor.includes("+")
      ) {
        // Local datetime format - convert from user's timezone to UTC
        const dateTimeString = scheduledFor.includes(":")
          ? scheduledFor + ":00"
          : scheduledFor + ":00:00";

        // Create a date by treating the input as UTC first
        const utcDate = new Date(dateTimeString + "Z");

        // Get the current timezone offset for the user's timezone at this date/time
        const tempLocalDate = new Date(dateTimeString);
        const offsetAtDate =
          new Date(
            tempLocalDate.toLocaleString("en-US", { timeZone: "UTC" }),
          ).getTime() -
          new Date(
            tempLocalDate.toLocaleString("en-US", {
              timeZone: timezone || "UTC",
            }),
          ).getTime();

        // Apply the offset to convert from user's timezone to UTC
        newScheduleDate = new Date(utcDate.getTime() + offsetAtDate);
      } else {
        // Already UTC or has timezone info
        newScheduleDate = new Date(scheduledFor);
      }
      const now = new Date();

      // Check if the scheduled time is valid
      if (isNaN(newScheduleDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid scheduled time format" },
          { status: 400 },
        );
      }

      console.log(
        `Reschedule request: ${scheduledFor} -> Parsed: ${newScheduleDate.toISOString()}`,
      );

      const delaySeconds = Math.floor(
        (newScheduleDate.getTime() - now.getTime()) / 1000,
      );
      if (delaySeconds < 0) {
        return NextResponse.json(
          { error: "New scheduled time must be in the future" },
          { status: 400 },
        );
      }
      if (delaySeconds > 604800) {
        return NextResponse.json(
          { error: "You can only schedule tweets up to 7 days in advance." },
          { status: 400 },
        );
      }
      // Cancel existing QStash message if it exists
      if (tweet.qstashMessageId) {
        try {
          console.log(
            `Cancelling old QStash message: ${tweet.qstashMessageId}`,
          );
          await getTweetScheduler().cancelScheduledTweet(tweet.qstashMessageId);
        } catch (error) {
          console.warn("Failed to cancel old QStash message:", error);
          // Continue with rescheduling even if cancellation fails
        }
      }

      // Use updated content if provided, otherwise use existing content
      const tweetContent = content || tweet.content;

      // Schedule with QStash using internal logic (this will create a new schedule)
      const scheduleResult = await scheduleTweetInternal({
        nanoId: tweet.nanoId,
        scheduleDate: newScheduleDate,
        content: tweetContent,
        userId,
        twitterAccountId: tweet.twitterAccountId,
        mediaIds: tweet.mediaUrls || undefined,
        isThread: tweet.tweetType === "thread",
        threadTweets:
          tweet.tweetType === "thread" ? tweetContent.split("\n\n") : undefined,
        threadData: threadData || undefined,
      });

      console.log("Reschedule result:", scheduleResult);

      if (!scheduleResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: scheduleResult.error,
          },
          { status: 500 },
        );
      }
      // Update tweet with new schedule time
      [updatedTweet] = await db
        .update(TweetSchema)
        .set({
          content: tweetContent, // Update content if changed
          scheduledFor: newScheduleDate,
          qstashMessageId: scheduleResult.messageId, // Store new QStash message ID
          threadTweets:
            threadData && threadData.length > 0
              ? threadData.map((t: any) => ({
                  content: t.content,
                  mediaIds: t.mediaIds || [],
                }))
              : tweet.threadTweets || [],
          mediaUrls:
            isThread && threadData && threadData.length > 0
              ? threadData.flatMap((t: any) => t.mediaIds || [])
              : mediaIds || tweet.mediaUrls || [],
          updatedAt: new Date(),
        })
        .where(eq(TweetSchema.id, tweet.id))
        .returning();
    } else if (action === "post") {
      // Cancel existing QStash message if tweet is scheduled
      if (tweet.status === "scheduled" && tweet.qstashMessageId) {
        try {
          console.log(
            `Cancelling scheduled QStash message for immediate posting: ${tweet.qstashMessageId}`,
          );
          await getTweetScheduler().cancelScheduledTweet(tweet.qstashMessageId);
        } catch (error) {
          console.warn(
            "Failed to cancel QStash message for immediate posting:",
            error,
          );
          // Continue with posting even if cancellation fails
        }
      }

      // Use updated content if provided, otherwise use existing content
      const tweetContent = content || tweet.content;

      // Post the tweet using internal logic, retry up to 3 times
      let postSuccess = false;
      let postResult: any = null;
      let lastError: any = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        postResult = await postTweetInternal({
          content: tweetContent,
          twitterAccountId: tweet.twitterAccountId,
          mediaIds: tweet.mediaUrls || undefined,
          isThread: tweet.tweetType === "thread",
          threadTweets:
            tweet.tweetType === "thread"
              ? tweetContent.split("\n\n")
              : undefined,
          threadData: threadData || undefined,
          userId,
        });
        if (postResult.success && postResult.twitterTweetId) {
          postSuccess = true;
          break;
        } else {
          lastError = postResult.error || "Unknown error";
        }
      }
      if (postSuccess) {
        // Update tweet to posted
        [updatedTweet] = await db
          .update(TweetSchema)
          .set({
            content: tweetContent, // Update content if changed
            status: "posted",
            postedAt: new Date(),
            twitterTweetId: postResult.twitterTweetId,
            threadTweets:
              threadData && threadData.length > 0
                ? threadData.map((t: any) => ({
                    content: t.content,
                    mediaIds: t.mediaIds || [],
                  }))
                : tweet.threadTweets || [],
            mediaUrls:
              isThread && threadData && threadData.length > 0
                ? threadData.flatMap((t: any) => t.mediaIds || [])
                : mediaIds || tweet.mediaUrls || [],
            updatedAt: new Date(),
          })
          .where(eq(TweetSchema.id, tweet.id))
          .returning();
      } else {
        // All retries failed, keep as draft and update updatedAt
        [updatedTweet] = await db
          .update(TweetSchema)
          .set({
            status: "draft",
            updatedAt: new Date(),
          })
          .where(eq(TweetSchema.id, tweet.id))
          .returning();
        return NextResponse.json(
          {
            success: false,
            error: `Failed to post tweet after 3 attempts: ${lastError}`,
            tweet: updatedTweet,
          },
          { status: 500 },
        );
      }
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    // Broadcast update to connected clients
    try {
      broadcastTweetUpdated(updatedTweet as any, userId);
    } catch (error) {
      console.warn("Failed to broadcast tweet update:", error);
    }
    return NextResponse.json({
      success: true,
      tweet: updatedTweet,
    });
  } catch (error) {
    console.error("Error converting draft:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    },
  );
}
