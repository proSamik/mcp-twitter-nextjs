import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";
import { pgDb as db } from "@/lib/db/pg/db.pg";
import { CommunitySchema } from "@/lib/db/pg/schema.pg";
import { eq, and } from "drizzle-orm";

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

    const communities = await db
      .select()
      .from(CommunitySchema)
      .where(
        and(
          eq(CommunitySchema.userId, userId),
          eq(CommunitySchema.isActive, true),
        ),
      )
      .orderBy(CommunitySchema.createdAt);

    return NextResponse.json({
      success: true,
      communities,
    });
  } catch (error) {
    console.error("Error fetching communities:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const userId = session.user.id;
    const body = await request.json();

    const { name, communityId, description } = body;

    if (!name || !communityId) {
      return NextResponse.json(
        { error: "Name and community ID are required" },
        { status: 400 },
      );
    }

    // Check if community ID already exists for this user
    const existingCommunity = await db
      .select()
      .from(CommunitySchema)
      .where(
        and(
          eq(CommunitySchema.userId, userId),
          eq(CommunitySchema.communityId, communityId),
        ),
      )
      .limit(1);

    if (existingCommunity.length > 0) {
      return NextResponse.json(
        { error: "Community ID already exists" },
        { status: 409 },
      );
    }

    const [newCommunity] = await db
      .insert(CommunitySchema)
      .values({
        name,
        communityId,
        description,
        userId,
      })
      .returning();

    return NextResponse.json({
      success: true,
      community: newCommunity,
    });
  } catch (error) {
    console.error("Error creating community:", error);
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
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    },
  );
}
