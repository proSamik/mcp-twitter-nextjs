import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { twitterAuthManager } from '@/lib/auth/twitter-oauth';

/**
 * Initiate Twitter OAuth connection
 */
export async function POST(request: NextRequest) {
  try {
    // Get current user session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    // Get redirect URI from request body or use default
    const body = await request.json().catch(() => ({}));
    const redirectUri = body.redirectUri || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/twitter/callback`;

    // Generate Twitter OAuth URL
    const { authUrl, state } = await twitterAuthManager.generateAuthUrl(userId, redirectUri);

    return NextResponse.json({
      success: true,
      authUrl,
      state,
    });

  } catch (error) {
    console.error('Error initiating Twitter OAuth:', error);
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}