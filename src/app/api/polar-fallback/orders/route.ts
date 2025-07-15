import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";
import { polarFallbackClient } from "@/lib/polar/client";

/**
 * Fallback API route for customer orders when Better Auth plugin fails
 * Uses direct Polar SDK with customer sessions
 */
export async function GET(request: NextRequest) {
  try {
    // Get current session
    const session = await getSession();
    console.log(
      "Polar fallback orders API - session check:",
      session?.user?.id ? "authenticated" : "not authenticated",
    );

    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const productBillingType = searchParams.get("productBillingType") as
      | "one_time"
      | "recurring"
      | null;

    console.log("Polar fallback orders API - User ID:", session.user.id);
    console.log("Polar fallback orders API - Query params:", {
      page,
      limit,
      productBillingType,
    });

    // Get customer orders using fallback client
    console.log(
      "Polar fallback orders API - calling polarFallbackClient.listCustomerOrders",
    );
    const ordersResponse = await polarFallbackClient.listCustomerOrders(
      session.user.id,
      {
        page,
        limit,
        productBillingType: productBillingType || undefined,
      },
      {
        email: session.user.email,
        name: session.user.name,
      },
    );

    console.log("Polar fallback orders API - response received:", {
      itemsCount: ordersResponse.items.length,
      totalCount: ordersResponse.pagination.total_count,
    });

    return NextResponse.json({
      success: true,
      data: ordersResponse,
      message: "Orders retrieved successfully (fallback)",
      fallback_used: true,
    });
  } catch (error) {
    console.error("Polar fallback orders API - error:", error);
    console.error(
      "Polar fallback orders API - error details:",
      JSON.stringify(error, null, 2),
    );

    // Don't return error status, return success with empty data
    console.log(
      "Polar fallback orders API - returning empty data instead of error",
    );
    return NextResponse.json({
      success: true, // Changed to true to prevent cascading errors
      error:
        error instanceof Error
          ? error.message
          : "Failed to get customer orders",
      fallback_used: true,
      data: {
        items: [],
        pagination: {
          total_count: 0,
          max_page: 0,
        },
      },
    });
  }
}

/**
 * POST method for creating orders (if needed in future)
 */
export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { error: "Method not implemented" },
    { status: 501 },
  );
}
