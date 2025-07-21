import { NextRequest, NextResponse } from "next/server";
import { twitterAuthManager } from "@/lib/auth/twitter-oauth";

/**
 * Handle Twitter OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle OAuth errors
    if (error) {
      console.error("Twitter OAuth error:", error);
      const errorMessage =
        searchParams.get("error_description") || "OAuth authorization failed";

      // Check if this looks like a credential/setup error
      const isCredentialError =
        error === "invalid_client" ||
        error === "unauthorized_client" ||
        errorMessage.toLowerCase().includes("client") ||
        errorMessage.toLowerCase().includes("credential");

      const redirectUrl = isCredentialError
        ? `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/oauth-user-setup?error=${encodeURIComponent(errorMessage)}`
        : `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/app?twitter_error=${encodeURIComponent(errorMessage)}`;

      return NextResponse.redirect(redirectUrl);
    }

    // Validate required parameters
    if (!code || !state) {
      console.error("Missing required OAuth parameters:", {
        code: !!code,
        state: !!state,
      });
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/oauth-user-setup?error=${encodeURIComponent("Missing OAuth parameters - please check your credentials")}`,
      );
    }

    // Handle the OAuth callback
    const result = await twitterAuthManager.handleCallback(code, state);

    if (!result.success) {
      console.error("Twitter OAuth callback failed:", result.error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/app?twitter_error=${encodeURIComponent(result.error || "OAuth callback failed")}`,
      );
    }

    console.log(
      `Successfully connected Twitter account for user: ${result.userId}`,
    );

    // Redirect to app with success message
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/app?twitter_connected=true&account=${encodeURIComponent(result.twitterAccount?.username || "")}`,
    );
  } catch (error) {
    console.error("Error in Twitter OAuth callback:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/app?twitter_error=${encodeURIComponent("OAuth callback error")}`,
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
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    },
  );
}
