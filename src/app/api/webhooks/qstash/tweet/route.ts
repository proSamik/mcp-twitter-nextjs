import { NextRequest, NextResponse } from 'next/server';
import { QStashWebhookVerifier } from '@/lib/upstash/qstash';
import { twitterAuthManager } from '@/lib/auth/twitter-oauth';
import { pgDb as db } from '@/lib/db/pg/db.pg';
import { TweetSchema } from '@/lib/db/pg/schema.pg';
import { eq } from 'drizzle-orm';
import { broadcastTweetUpdated } from '@/lib/websocket/server';

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
    const signature = request.headers.get('upstash-signature');
    if (!signature) {
      console.error('Missing QStash signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // Get raw body for signature verification
    const body = await request.text();
    const url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/qstash/tweet`;
    
    // Verify QStash signature with proper URL
    if (!(await QStashWebhookVerifier.verifySignature(body, signature, url))) {
      console.error('Invalid QStash signature');
      console.error('Signature:', signature);
      console.error('Body length:', body.length);
      console.error('URL:', url);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse webhook payload
    const payload = QStashWebhookVerifier.parseWebhookPayload(body);
    
    if (payload.type !== 'tweet') {
      console.error('Invalid webhook payload type:', payload.type);
      return NextResponse.json({ error: 'Invalid payload type' }, { status: 400 });
    }

    const { tweetId, content, userId, twitterAccountId, mediaIds, isThread, threadTweets } = payload;

    console.log(`Processing scheduled tweet: ${tweetId} for user: ${userId}`);

    try {
      // Get the tweet from database
      const [tweet] = await db
        .select()
        .from(TweetSchema)
        .where(eq(TweetSchema.nanoId, tweetId))
        .limit(1);

      if (!tweet) {
        console.error(`Tweet not found: ${tweetId}`);
        return NextResponse.json({ error: 'Tweet not found' }, { status: 404 });
      }

      if (tweet.status !== 'scheduled') {
        console.error(`Tweet ${tweetId} is not in scheduled status: ${tweet.status}`);
        return NextResponse.json({ error: 'Tweet is not scheduled' }, { status: 400 });
      }

      // Get Twitter client for the account
      const twitterClient = await twitterAuthManager.getTwitterClient(userId, twitterAccountId);

      let twitterTweetId: string;
      let postedTweets: any[] = [];

      if (isThread && threadTweets && threadTweets.length > 1) {
        // Post as thread
        console.log(`Posting thread with ${threadTweets.length} tweets`);
        const results = await twitterClient.postThread(threadTweets);
        postedTweets = results;
        twitterTweetId = results[0].data.id; // Use first tweet ID as primary
      } else {
        // Post single tweet
        console.log(`Posting single tweet: ${content.substring(0, 50)}...`);
        const result = await twitterClient.postTweet(content, {
          mediaIds: mediaIds || [],
        });
        postedTweets = [result];
        twitterTweetId = result.data.id;
      }

      // Update tweet status in database
      const [updatedTweet] = await db
        .update(TweetSchema)
        .set({
          status: 'posted',
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
        console.warn('Failed to broadcast tweet update:', error);
      }

      console.log(`Successfully posted tweet ${tweetId} as Twitter tweet ${twitterTweetId}`);

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
      try {
        await db
          .update(TweetSchema)
          .set({
            status: 'failed',
            updatedAt: new Date(),
          })
          .where(eq(TweetSchema.nanoId, tweetId));
      } catch (dbError) {
        console.error('Failed to update tweet status to failed:', dbError);
      }

      return NextResponse.json({
        success: false,
        error: twitterError instanceof Error ? twitterError.message : 'Unknown error',
        tweetId,
      }, { status: 500 });
    }

  } catch (error) {
    console.error('QStash tweet webhook error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, upstash-signature',
    },
  });
}