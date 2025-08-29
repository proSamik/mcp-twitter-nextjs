import { NextRequest, NextResponse } from "next/server";
import { QStashWebhookVerifier } from "@/lib/upstash/qstash";
import { twitterAuthManager } from "@/lib/auth/twitter-oauth";
import { mediaProcessor } from "@/lib/twitter/media-processor";
import { pgDb as db } from "@/lib/db/pg/db.pg";
import { TweetSchema } from "@/lib/db/pg/schema.pg";
import { eq } from "drizzle-orm";
import { broadcastTweetUpdated } from "@/lib/websocket/server";

/**
 * QStash webhook handler for scheduled tweet posting
 */
export async function POST(request: NextRequest) {
  try {
    // // Check if request is from allowed QStash URL
    // const origin = request.headers.get('origin') || request.headers.get('referer') || '';
    // const qstashUrl = process.env.QSTASH_URL;
    // if (qstashUrl && !origin.includes(qstashUrl)) {
    //   console.error('Request not from allowed QStash URL:', origin, 'Expected:', qstashUrl);
    //   return NextResponse.json({ error: 'Unauthorized origin' }, { status: 403 });
    // }

    // Get headers for signature verification
    const signature = request.headers.get("upstash-signature");
    if (!signature) {
      console.error("Missing QStash signature");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    // Get raw body for signature verification
    const body = await request.text();
    const url = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhooks/qstash/tweet`;

    // Verify QStash signature with proper URL
    if (!(await QStashWebhookVerifier.verifySignature(body, signature, url))) {
      console.error("Invalid QStash signature");
      console.error("Signature:", signature);
      console.error("Body length:", body.length);
      console.error("URL:", url);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse webhook payload
    const payload = QStashWebhookVerifier.parseWebhookPayload(body);

    if (payload.type !== "tweet") {
      console.error("Invalid webhook payload type:", payload.type);
      return NextResponse.json(
        { error: "Invalid payload type" },
        { status: 400 },
      );
    }

    const { tweetId, userId, twitterAccountId } = payload;

    console.log(`Processing scheduled tweet: ${tweetId} for user: ${userId}`);
    console.log("Webhook payload:", JSON.stringify(payload, null, 2));

    try {
      // Get the tweet from database
      const [tweet] = await db
        .select()
        .from(TweetSchema)
        .where(eq(TweetSchema.nanoId, tweetId))
        .limit(1);

      if (!tweet) {
        console.error(`Tweet not found: ${tweetId}`);
        return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
      }

      if (tweet.status !== "scheduled") {
        console.error(
          `Tweet ${tweetId} is not in scheduled status: ${tweet.status}`,
        );
        return NextResponse.json(
          { error: "Tweet is not scheduled" },
          { status: 400 },
        );
      }

      // Extract tweet data from database
      const content = tweet.content;
      const mediaIds = tweet.mediaUrls || [];
      const isThread = tweet.tweetType === "thread";
      const threadData = tweet.threadTweets || [];

      // Get Twitter client for the account
      const twitterClient = await twitterAuthManager.getTwitterClient(
        userId,
        twitterAccountId,
      );

      // Helper function to post with retry logic for rate limit errors
      // Retries up to 3 times with exponential backoff (30s, 60s, 90s)
      const postWithRetry = async (
        postFunction: () => Promise<any>,
        maxRetries = 3,
      ) => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            return await postFunction();
          } catch (error) {
            const isRateLimitError =
              error instanceof Error &&
              (error.message.includes("429") ||
                error.message.includes("Rate limit exceeded"));

            if (isRateLimitError && attempt < maxRetries) {
              console.log(
                `Rate limit hit, retrying in ${attempt * 30} seconds... (attempt ${attempt}/${maxRetries})`,
              );
              await new Promise((resolve) =>
                setTimeout(resolve, attempt * 30 * 1000),
              );
              continue;
            }
            throw error;
          }
        }
      };

      // Process media files if any
      let twitterMediaIds: string[] = [];
      if (mediaIds && mediaIds.length > 0) {
        console.log("Processing media files for scheduled tweet:", mediaIds);
        twitterMediaIds = await mediaProcessor.processMediaForTwitter(
          mediaIds,
          twitterClient,
        );
        console.log("Twitter media IDs for scheduled tweet:", twitterMediaIds);
      }

      let twitterTweetId: string;
      let postedTweets: any[] = [];

      if (isThread && threadData && threadData.length > 1) {
        // Post as thread with proper thread data structure
        console.log(`Posting thread with ${threadData.length} tweets`);

        const tweetsToPost: string[] = [];
        const mediaIdsPerTweet: string[][] = [];

        // Process each tweet in the thread
        for (const tweetData of threadData) {
          tweetsToPost.push(tweetData.content);

          if (tweetData.mediaIds && tweetData.mediaIds.length > 0) {
            const processedMediaIds =
              await mediaProcessor.processMediaForTwitter(
                tweetData.mediaIds,
                twitterClient,
              );
            mediaIdsPerTweet.push(processedMediaIds);
          } else {
            mediaIdsPerTweet.push([]);
          }
        }

        const threadOptions: any = {
          mediaIds: mediaIdsPerTweet,
        };

        const results = await postWithRetry(() =>
          twitterClient.postThread(tweetsToPost, threadOptions),
        );
        postedTweets = results;
        twitterTweetId = results[0].data.id; // Use first tweet ID as primary
      } else {
        // Post single tweet
        console.log(`Posting single tweet: ${content.substring(0, 50)}...`);
        const tweetOptions: any = {};
        if (twitterMediaIds.length > 0) {
          tweetOptions.mediaIds = twitterMediaIds;
        }
        // Add community ID if present
        if (tweet.communityId && tweet.communityId !== "none") {
          tweetOptions.communityId = tweet.communityId;
        }
        const result = await postWithRetry(() =>
          twitterClient.postTweet(content, tweetOptions),
        );
        postedTweets = [result];
        twitterTweetId = result.data.id;
      }

      // Update tweet status in database
      const [updatedTweet] = await db
        .update(TweetSchema)
        .set({
          status: "posted",
          postedAt: new Date(),
          twitterTweetId,
          updatedAt: new Date(),
        })
        .where(eq(TweetSchema.id, tweet.id))
        .returning();

      // Broadcast update to connected clients
      try {
        broadcastTweetUpdated(updatedTweet as any, userId);
      } catch (error) {
        console.warn("Failed to broadcast tweet update:", error);
      }

      // Clean up media files from Cloudflare R2 after successful posting
      const allMediaKeys: string[] = [];

      // Add main tweet media
      if (mediaIds && mediaIds.length > 0) {
        allMediaKeys.push(...mediaIds);
      }

      // Add thread media
      if (isThread && threadData) {
        for (const tweetData of threadData) {
          if (tweetData.mediaIds && tweetData.mediaIds.length > 0) {
            allMediaKeys.push(...tweetData.mediaIds);
          }
        }
      }

      // Clean up all media files
      if (allMediaKeys.length > 0) {
        try {
          await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/media/delete`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                keys: allMediaKeys,
              }),
            },
          );
          console.log(
            `Cleaned up ${allMediaKeys.length} media files for tweet ${tweetId}`,
          );
        } catch (cleanupError) {
          console.warn("Failed to cleanup media files:", cleanupError);
        }
      }

      console.log(
        `Successfully posted tweet ${tweetId} as Twitter tweet ${twitterTweetId}`,
      );

      return NextResponse.json({
        success: true,
        tweetId,
        twitterTweetId,
        postedAt: updatedTweet.postedAt,
        threadCount: postedTweets.length,
      });
    } catch (twitterError) {
      console.error(`Failed to post tweet ${tweetId}:`, twitterError);

      // Update tweet status to failed
      let updatedTweet;
      try {
        [updatedTweet] = await db
          .update(TweetSchema)
          .set({
            status: "failed",
            updatedAt: new Date(),
          })
          .where(eq(TweetSchema.nanoId, tweetId))
          .returning();
      } catch (dbError) {
        console.error("Failed to update tweet status to failed:", dbError);
      }

      // Broadcast failure to connected clients
      if (updatedTweet) {
        try {
          broadcastTweetUpdated(updatedTweet as any, userId);
        } catch (broadcastError) {
          console.warn("Failed to broadcast tweet failure:", broadcastError);
        }
      }

      // Check if it's a rate limit error
      const isRateLimitError =
        twitterError instanceof Error &&
        (twitterError.message.includes("429") ||
          twitterError.message.includes("Too Many Requests"));

      const errorMessage = isRateLimitError
        ? "Rate limit exceeded. Please try again later."
        : twitterError instanceof Error
          ? twitterError.message
          : "Unknown error";

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          tweetId,
          isRateLimitError,
        },
        { status: isRateLimitError ? 429 : 500 },
      );
    }
  } catch (error) {
    console.error("QStash tweet webhook error:", error);
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
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, upstash-signature",
      },
    },
  );
}
