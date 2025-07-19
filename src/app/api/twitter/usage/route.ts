import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";
import { pgDb as db } from "@/lib/db/pg/db.pg";
import { TwitterAccountSchema } from "@/lib/db/pg/schema.pg";
import { eq, and } from "drizzle-orm";
import { TwitterClient } from "@/lib/twitter/client";

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const userId = session.user.id;

    // Get the user's Twitter accounts
    const twitterAccounts = await db
      .select()
      .from(TwitterAccountSchema)
      .where(
        and(
          eq(TwitterAccountSchema.userId, userId),
          eq(TwitterAccountSchema.isActive, true),
        ),
      )
      .limit(1); // Use the first active account for usage data

    if (twitterAccounts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No active Twitter account found",
        },
        { status: 404 },
      );
    }

    const twitterAccount = twitterAccounts[0];

    try {
      // Create Twitter client and get usage data
      const twitterClient = TwitterClient.withUserTokens(
        twitterAccount.accessToken,
      );
      const usageData = await twitterClient.getUsage();

      // If usage data has error field, it means API is not available
      if (usageData.error) {
        return NextResponse.json(
          {
            success: false,
            error: "Usage data not available for this Twitter API tier",
            code: "USAGE_NOT_AVAILABLE",
          },
          { status: 403 },
        );
      }

      // Transform the data to include additional calculated fields
      const today = new Date();
      const processedUsage = {
        cap: usageData.cap || {
          reset: "daily",
          reset_at: new Date(
            today.getTime() + 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
        project_usage: {
          daily: usageData.daily_tweet_count || 0,
          monthly: usageData.monthly_tweet_count || 0,
        },
        usage: usageData.usage || [],
        raw: usageData,
      };

      return NextResponse.json({
        success: true,
        usage: processedUsage,
        account: {
          username: twitterAccount.username,
          displayName: twitterAccount.displayName,
        },
      });
    } catch (twitterError) {
      console.error("Twitter API error:", twitterError);

      return NextResponse.json(
        {
          success: false,
          error: "Twitter API usage endpoint not accessible",
          code: "USAGE_NOT_AVAILABLE",
        },
        { status: 403 },
      );
    }
  } catch (error) {
    console.error("Error fetching Twitter usage:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    },
  );
}
