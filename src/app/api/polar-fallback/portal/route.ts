import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";
import { polarFallbackClient } from "@/lib/polar/client";

/**
 * Fallback API route for customer portal when Better Auth plugin fails
 * Uses direct Polar SDK with customer sessions
 */
export async function POST(_request: NextRequest) {
  try {
    // Get current session
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log(
      "Using Polar fallback for customer portal - User ID:",
      session.user.id,
    );

    // Get customer portal URL using fallback client
    const portalUrl = await polarFallbackClient.getCustomerPortalUrl(
      session.user.id,
      {
        email: session.user.email,
        name: session.user.name,
      },
    );

    return NextResponse.json({
      success: true,
      url: portalUrl,
      message: "Customer portal URL retrieved successfully (fallback)",
    });
  } catch (error) {
    console.error("Polar fallback portal error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get customer portal",
        fallback_used: true,
      },
      { status: 500 },
    );
  }
}

/**
 * GET method for debugging portal access
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get customer state to verify access
    const customerState = await polarFallbackClient.getCustomerState(
      session.user.id,
      {
        email: session.user.email,
        name: session.user.name,
      },
    );

    return NextResponse.json({
      success: true,
      customer: customerState,
      message: "Customer state retrieved successfully (fallback)",
    });
  } catch (error) {
    console.error("Polar fallback customer state error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get customer state",
        fallback_used: true,
      },
      { status: 500 },
    );
  }
}
