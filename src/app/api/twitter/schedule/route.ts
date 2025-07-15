import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/server';
import { pgDb as db } from '@/lib/db/pg/db.pg';
import { TweetSchema } from '@/lib/db/pg/schema.pg';
import { eq } from 'drizzle-orm';
import { getTweetScheduler } from '@/lib/upstash/qstash';
import { broadcastTweetUpdated } from '@/lib/websocket/server';

/**
 * Schedule a tweet for future posting
 */
export async function POST(request: NextRequest) {
  try {
        // Get current user session
        const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    
    const { 
      content, 
      twitterAccountId, 
      scheduledFor,
      mediaIds,
      isThread,
      threadTweets,
      tags = []
    } = body;

    // Validate required fields
    if (!content && !threadTweets?.length) {
      return NextResponse.json(
        { error: 'Tweet content is required' },
        { status: 400 }
      );
    }

    if (!twitterAccountId) {
      return NextResponse.json(
        { error: 'Twitter account ID is required' },
        { status: 400 }
      );
    }

    if (!scheduledFor) {
      return NextResponse.json(
        { error: 'Scheduled time is required' },
        { status: 400 }
      );
    }

    const scheduleDate = new Date(scheduledFor);
    if (scheduleDate <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      );
    }

    // Create tweet record in database
    const { nanoid } = await import('nanoid');
    
    const [dbTweet] = await db
      .insert(TweetSchema)
      .values({
        nanoId: nanoid(8),
        content: isThread ? threadTweets.join('\n\n') : content,
        tweetType: isThread ? 'thread' : 'single',
        status: 'scheduled',
        scheduledFor: scheduleDate,
        mediaUrls: mediaIds || [],
        hashtags: extractHashtags(content),
        mentions: extractMentions(content),
        tags,
        twitterAccountId,
        userId,
      })
      .returning();

    // Schedule with QStash
    const scheduleResult = await getTweetScheduler().scheduleTweet(
      dbTweet.nanoId,
      scheduleDate,
      {
        content: isThread ? threadTweets.join('\n\n') : content,
        userId,
        twitterAccountId,
        mediaIds,
        isThread,
        threadTweets,
      }
    );

    // Broadcast to connected clients
    try {
      broadcastTweetUpdated(dbTweet as any, userId);
    } catch (error) {
      console.warn('Failed to broadcast tweet update:', error);
    }

    console.log(`Successfully scheduled tweet ${dbTweet.nanoId} for ${scheduleDate.toISOString()}`);

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
    console.error('Error scheduling tweet:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
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
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const tweetId = searchParams.get('tweetId');

    if (!tweetId) {
      return NextResponse.json(
        { error: 'Tweet ID is required' },
        { status: 400 }
      );
    }

    // Get the tweet from database
    const [tweet] = await db
      .select()
      .from(TweetSchema)
      .where(eq(TweetSchema.nanoId, tweetId))
      .limit(1);

    if (!tweet) {
      return NextResponse.json(
        { error: 'Tweet not found' },
        { status: 404 }
      );
    }

    if (tweet.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (tweet.status !== 'scheduled') {
      return NextResponse.json(
        { error: 'Tweet is not scheduled' },
        { status: 400 }
      );
    }

    // Get scheduled messages and find the one for this tweet
    const scheduledTweets = await getTweetScheduler().getScheduledTweets(userId);
    const scheduledTweet = scheduledTweets.find((msg: any) => {
      try {
        const body = JSON.parse(msg.body);
        return body.tweetId === tweetId;
      } catch {
        return false;
      }
    });

    // Cancel the scheduled message if found
    if (scheduledTweet) {
      try {
        await getTweetScheduler().cancelScheduledTweet(scheduledTweet.messageId);
      } catch (error) {
        console.warn('Failed to cancel QStash message:', error);
      }
    }

    // Update tweet status to cancelled or delete it
    await db
      .update(TweetSchema)
      .set({
        status: 'draft', // Convert back to draft
        scheduledFor: null,
        updatedAt: new Date(),
      })
      .where(eq(TweetSchema.id, tweet.id));

    console.log(`Successfully cancelled scheduled tweet ${tweetId}`);

    return NextResponse.json({
      success: true,
      message: 'Scheduled tweet cancelled successfully',
    });

  } catch (error) {
    console.error('Error cancelling scheduled tweet:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Utility functions
 */
function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w]+/g;
  const matches = text.match(hashtagRegex);
  return matches ? matches.map(tag => tag.substring(1)) : [];
}

function extractMentions(text: string): string[] {
  const mentionRegex = /@[\w]+/g;
  const matches = text.match(mentionRegex);
  return matches ? matches.map(mention => mention.substring(1)) : [];
}

// Handle preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}