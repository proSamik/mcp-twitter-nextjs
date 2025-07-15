import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/server';
import { twitterAuthManager } from '@/lib/auth/twitter-oauth';
import { pgDb as db } from '@/lib/db/pg/db.pg';
import { TweetSchema } from '@/lib/db/pg/schema.pg';
// import { eq } from 'drizzle-orm'; // Removed unused import
import { broadcastTweetUpdated } from '@/lib/websocket/server';

/**
 * Post a tweet immediately
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
      mediaIds, 
      replyToTweetId, 
      quoteTweetId,
      isThread,
      threadTweets,
      saveDraft = true, // Whether to save to database
      status = 'posted' // Status: 'draft' or 'posted'
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

    let twitterTweetId: string | null = null;
    let postedTweets: any[] = [];

    // Only post to Twitter if it's not a draft
    if (status !== 'draft') {
      // Get Twitter client for the account
      const twitterClient = await twitterAuthManager.getTwitterClient(userId, twitterAccountId);

      if (isThread && threadTweets && threadTweets.length > 1) {
        // Post as thread
        console.log(`Posting thread with ${threadTweets.length} tweets`);
        const results = await twitterClient.postThread(threadTweets);
        postedTweets = results;
        twitterTweetId = results[0].data.id; // Use first tweet ID as primary
      } else {
        // Post single tweet
        console.log(`Posting single tweet for user ${userId}`);
        const result = await twitterClient.postTweet(content, {
          mediaIds,
          replyToTweetId,
          quoteTweetId,
        });
        postedTweets = [result];
        twitterTweetId = result.data.id;
      }
    }

    let dbTweet: any = null;

    // Save to database if requested
    if (saveDraft) {
      const { nanoid } = await import('nanoid');
      
      [dbTweet] = await db
        .insert(TweetSchema)
        .values({
          nanoId: nanoid(8),
          content: isThread ? threadTweets.join('\n\n') : content,
          tweetType: isThread ? 'thread' : 'single',
          status: status,
          postedAt: status === 'posted' ? new Date() : null,
          twitterTweetId,
          mediaUrls: mediaIds || [],
          hashtags: extractHashtags(content),
          mentions: extractMentions(content),
          twitterAccountId,
          userId,
        })
        .returning();

      // Broadcast to connected clients
      try {
        broadcastTweetUpdated(dbTweet as any, userId);
      } catch (error) {
        console.warn('Failed to broadcast tweet update:', error);
      }
    }

    // Schedule analytics refresh only for posted tweets
    if (status === 'posted' && twitterTweetId) {
      try {
        const { getTweetScheduler } = await import('@/lib/upstash/qstash');
        await getTweetScheduler().scheduleAnalyticsRefresh(twitterTweetId);
      } catch (error) {
        console.warn('Failed to schedule analytics refresh:', error);
      }
    }

    const successMessage = status === 'draft' 
      ? `Successfully saved draft ${dbTweet?.nanoId}` 
      : `Successfully posted tweet ${twitterTweetId}`;
    console.log(successMessage);

    return NextResponse.json({
      success: true,
      status,
      twitterTweetId,
      threadCount: postedTweets.length,
      dbTweet,
      postedAt: status === 'posted' ? new Date().toISOString() : null,
      draftId: status === 'draft' ? dbTweet?.nanoId : null,
    });

  } catch (error) {
    console.error('Error posting tweet:', error);
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}