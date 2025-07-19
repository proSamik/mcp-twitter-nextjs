import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";
import { pgDb as db } from "@/lib/db/pg/db.pg";
import { TweetSchema } from "@/lib/db/pg/schema.pg";
import { eq } from "drizzle-orm";
import { scheduleTweetInternal } from "@/lib/twitter/schedule-tweet";
import { broadcastTweetUpdated } from "@/lib/websocket/server";

/**
 * Schedule a tweet for future posting
 */
export async function POST(request: NextRequest) {
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
      content,
      twitterAccountId,
      scheduledFor,
      timezone = "UTC", // User's timezone
      mediaIds,
      isThread,
      threadTweets,
      threadData, // New format: [{ content: string, mediaIds: string[] }]
      tags = [],
    } = body;

    // Validate required fields
    if (!content && !threadTweets?.length && !threadData?.length) {
      return NextResponse.json(
        { error: "Tweet content is required" },
        { status: 400 },
      );
    }

    if (!twitterAccountId) {
      return NextResponse.json(
        { error: "Twitter account ID is required" },
        { status: 400 },
      );
    }

    if (!scheduledFor) {
      return NextResponse.json(
        { error: "Scheduled time is required" },
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
      const localDate = new Date(scheduledFor);
      const utcDate = new Date(
        localDate.toLocaleString("en-US", { timeZone: "UTC" }),
      );
      const userDate = new Date(
        localDate.toLocaleString("en-US", { timeZone: timezone }),
      );
      const timezoneOffset = userDate.getTime() - utcDate.getTime();
      scheduleDate = new Date(localDate.getTime() - timezoneOffset);
    } else {
      // Already UTC or has timezone info
      scheduleDate = new Date(scheduledFor);
    }

    const now = new Date();
    const delaySeconds = Math.floor(
      (scheduleDate.getTime() - now.getTime()) / 1000,
    );

    // Debug logging for scheduling
    console.log("scheduledFor:", scheduledFor);
    console.log("timezone:", timezone);
    console.log("scheduleDate UTC:", scheduleDate.toISOString());
    console.log("calculated delaySeconds:", delaySeconds);

    // Check 7-day limit
    if (delaySeconds > 604800) {
      return NextResponse.json(
        { error: "You can only schedule tweets up to 7 days in advance." },
        { status: 400 },
      );
    }

    // Warn about media expiry for schedules > 24 hours
    if (mediaIds && mediaIds.length > 0 && delaySeconds > 86400) {
      console.warn(
        `Media files will expire before scheduled time. Schedule: ${delaySeconds}s, Media expires: 86400s`,
      );
      return NextResponse.json(
        {
          error:
            "Media files expire after 24 hours. Please schedule within 24 hours or upload media closer to posting time.",
        },
        { status: 400 },
      );
    }

    // Create tweet record in database
    const { nanoid } = await import("nanoid");
    const nanoId = nanoid(8);
    // Schedule with QStash (internal lib)
    const scheduleResult = await scheduleTweetInternal({
      nanoId,
      scheduleDate,
      content: isThread
        ? threadData
          ? threadData.map((t) => t.content).join("\n\n")
          : threadTweets?.join("\n\n")
        : content,
      userId,
      twitterAccountId,
      mediaIds,
      isThread,
      threadTweets,
      threadData,
      delaySeconds, // Pass client-calculated delay
    });
    if (!scheduleResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: scheduleResult.error,
        },
        { status: 500 },
      );
    }
    // Only after scheduling, create tweet record in database
    const [dbTweet] = await db
      .insert(TweetSchema)
      .values({
        nanoId,
        content: isThread ? threadTweets.join("\n\n") : content,
        tweetType: isThread ? "thread" : "single",
        status: "scheduled",
        scheduledFor: scheduleDate,
        qstashMessageId: scheduleResult.messageId, // Store QStash message ID
        mediaUrls: mediaIds || [],
        hashtags: extractHashtags(content),
        mentions: extractMentions(content),
        tags,
        twitterAccountId,
        userId,
      })
      .returning();

    // Broadcast to connected clients
    try {
      broadcastTweetUpdated(dbTweet as any, userId);
    } catch (error) {
      console.warn("Failed to broadcast tweet update:", error);
    }

    console.log(
      `Successfully scheduled tweet ${dbTweet.nanoId} for ${scheduleDate.toISOString()}`,
    );

    return NextResponse.json({
      success: true,
      tweet: {
        id: dbTweet.nanoId,
        content: dbTweet.content,
        scheduledFor: dbTweet.scheduledFor,
        status: dbTweet.status,
        tweetType: dbTweet.tweetType,
      },
      qstashMessageId: scheduleResult.messageId,
    });
  } catch (error) {
    console.error("Error scheduling tweet:", error);
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
 * Cancel a scheduled tweet
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

    // Get the tweet from database
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

    if (tweet.status !== "scheduled") {
      return NextResponse.json(
        { error: "Tweet is not scheduled" },
        { status: 400 },
      );
    }

    // Get scheduled messages and find the one for this tweet
    // const scheduledTweets = await getTweetScheduler().getScheduledTweets(userId); // This line is no longer needed
    // const scheduledTweet = scheduledTweets.find((msg: any) => { // This line is no longer needed
    //   try { // This line is no longer needed
    //     const body = JSON.parse(msg.body); // This line is no longer needed
    //     return body.tweetId === tweetId; // This line is no longer needed
    //   } catch { // This line is no longer needed
    //     return false; // This line is no longer needed
    //   } // This line is no longer needed
    // }); // This line is no longer needed

    // Cancel the scheduled message if found
    // if (scheduledTweet) { // This line is no longer needed
    //   try { // This line is no longer needed
    //     await getTweetScheduler().cancelScheduledTweet(scheduledTweet.messageId); // This line is no longer needed
    //   } catch (error) { // This line is no longer needed
    //     console.warn('Failed to cancel QStash message:', error); // This line is no longer needed
    //   } // This line is no longer needed
    // } // This line is no longer needed

    // Update tweet status to cancelled or delete it
    await db
      .update(TweetSchema)
      .set({
        status: "draft", // Convert back to draft
        scheduledFor: null,
        updatedAt: new Date(),
      })
      .where(eq(TweetSchema.id, tweet.id));

    console.log(`Successfully cancelled scheduled tweet ${tweetId}`);

    return NextResponse.json({
      success: true,
      message: "Scheduled tweet cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling scheduled tweet:", error);
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
 * Utility functions
 */
function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w]+/g;
  const matches = text.match(hashtagRegex);
  return matches ? matches.map((tag) => tag.substring(1)) : [];
}

function extractMentions(text: string): string[] {
  const mentionRegex = /@[\w]+/g;
  const matches = text.match(mentionRegex);
  return matches ? matches.map((mention) => mention.substring(1)) : [];
}

// Handle preflight requests
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    },
  );
}
