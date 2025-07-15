import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/server';
import { twitterAuthManager } from '@/lib/auth/twitter-oauth';

/**
 * Get user's connected Twitter accounts
 */
export async function GET(request: NextRequest) {
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
    
    // Get user's Twitter accounts
    const accounts = await twitterAuthManager.getUserAccounts(userId);

    return NextResponse.json({
      success: true,
      accounts,
    });

  } catch (error) {
    console.error('Error getting Twitter accounts:', error);
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
 * Disconnect a Twitter account
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
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Disconnect the account
    const result = await twitterAuthManager.disconnectAccount(userId, accountId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Twitter account disconnected successfully',
    });

  } catch (error) {
    console.error('Error disconnecting Twitter account:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}