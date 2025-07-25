import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";
import { pgDb as db } from "@/lib/db/pg/db.pg";
import { TweetSchema } from "@/lib/db/pg/schema.pg";
// import { eq } from 'drizzle-orm'; // Removed unused import
import { broadcastTweetUpdated } from "@/lib/websocket/server";
import { postTweetInternal } from "@/lib/twitter/post-tweet";

/**
 * Post a tweet immediately
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
      mediaIds,
      replyToTweetId,
      quoteTweetId,
      isThread,
      threadTweets,
      threadData, // New format: [{ content: string, mediaIds: string[] }]
      communityId,
      hasMedia = false,
      saveDraft = true, // Whether to save to database
      status = "posted", // Status: 'draft' or 'posted'
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

    let twitterTweetId: string | null = null;
    let postedTweets: any[] = [];

    // Only post to Twitter if it's not a draft
    if (status !== "draft") {
      const result = await postTweetInternal({
        content,
        twitterAccountId,
        mediaIds,
        isThread,
        threadTweets,
        threadData,
        userId,
        replyToTweetId,
        quoteTweetId,
        communityId,
        hasMedia,
      });
      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error,
          },
          { status: 500 },
        );
      }
      twitterTweetId = result.twitterTweetId || null;
      postedTweets = result.postedTweets || [];
    }

    let dbTweet: any = null;

    // Save to database if requested
    if (saveDraft) {
      const { nanoid } = await import("nanoid");

      [dbTweet] = await db
        .insert(TweetSchema)
        .values({
          nanoId: nanoid(8),
          content: isThread
            ? threadData && threadData.length > 0
              ? threadData.map((tweet: any) => tweet.content).join("\n\n")
              : threadTweets?.join("\n\n") || ""
            : content,
          tweetType: isThread ? "thread" : "single",
          status: status,
          postedAt: status === "posted" ? new Date() : null,
          twitterTweetId,
          mediaUrls: isThread
            ? threadData && threadData.length > 0
              ? threadData.flatMap((tweet: any) => tweet.mediaIds || [])
              : []
            : mediaIds || [],
          hashtags: extractHashtags(
            isThread
              ? threadData && threadData.length > 0
                ? threadData.map((tweet: any) => tweet.content).join("\n\n")
                : threadTweets?.join("\n\n") || ""
              : content,
          ),
          mentions: extractMentions(
            isThread
              ? threadData && threadData.length > 0
                ? threadData.map((tweet: any) => tweet.content).join("\n\n")
                : threadTweets?.join("\n\n") || ""
              : content,
          ),
          threadTweets:
            isThread && threadData && threadData.length > 0
              ? threadData.map((tweet: any) => ({
                  content: tweet.content,
                  mediaIds: tweet.mediaIds || [],
                }))
              : [],
          communityId: communityId || null,
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
    }

    const successMessage =
      status === "draft"
        ? `Successfully saved draft ${dbTweet?.nanoId}`
        : `Successfully posted tweet ${twitterTweetId}`;
    console.log(successMessage);

    return NextResponse.json({
      success: true,
      status,
      twitterTweetId,
      threadCount: postedTweets.length,
      dbTweet,
      postedAt: status === "posted" ? new Date().toISOString() : null,
      draftId: status === "draft" ? dbTweet?.nanoId : null,
    });
  } catch (error) {
    console.error("Error posting tweet:", error);
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
function extractHashtags(text: string | null | undefined): string[] {
  if (!text) return [];
  const hashtagRegex = /#[\w]+/g;
  const matches = text.match(hashtagRegex);
  return matches ? matches.map((tag) => tag.substring(1)) : [];
}

function extractMentions(text: string | null | undefined): string[] {
  if (!text) return [];
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
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    },
  );
}
