import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";
import { pgDb as db } from "@/lib/db/pg/db.pg";
import { CommunitySchema } from "@/lib/db/pg/schema.pg";
import { eq, and } from "drizzle-orm";

interface Params {
  id: string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<Params> },
) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const userId = session.user.id;
    const { id } = await params;
    const body = await request.json();

    const { name, communityId, description, isActive } = body;

    if (!name || !communityId) {
      return NextResponse.json(
        { error: "Name and community ID are required" },
        { status: 400 },
      );
    }

    // Check if community exists and belongs to user
    const existingCommunity = await db
      .select()
      .from(CommunitySchema)
      .where(
        and(eq(CommunitySchema.id, id), eq(CommunitySchema.userId, userId)),
      )
      .limit(1);

    if (existingCommunity.length === 0) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 },
      );
    }

    // Check if new community ID conflicts with existing ones (excluding current)
    if (communityId !== existingCommunity[0].communityId) {
      const conflictingCommunity = await db
        .select()
        .from(CommunitySchema)
        .where(
          and(
            eq(CommunitySchema.userId, userId),
            eq(CommunitySchema.communityId, communityId),
          ),
        )
        .limit(1);

      if (conflictingCommunity.length > 0) {
        return NextResponse.json(
          { error: "Community ID already exists" },
          { status: 409 },
        );
      }
    }

    const [updatedCommunity] = await db
      .update(CommunitySchema)
      .set({
        name,
        communityId,
        description,
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date(),
      })
      .where(
        and(eq(CommunitySchema.id, id), eq(CommunitySchema.userId, userId)),
      )
      .returning();

    return NextResponse.json({
      success: true,
      community: updatedCommunity,
    });
  } catch (error) {
    console.error("Error updating community:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<Params> },
) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const userId = session.user.id;
    const { id } = await params;

    // Check if community exists and belongs to user
    const existingCommunity = await db
      .select()
      .from(CommunitySchema)
      .where(
        and(eq(CommunitySchema.id, id), eq(CommunitySchema.userId, userId)),
      )
      .limit(1);

    if (existingCommunity.length === 0) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 },
      );
    }

    // Soft delete by setting isActive to false
    await db
      .update(CommunitySchema)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(
        and(eq(CommunitySchema.id, id), eq(CommunitySchema.userId, userId)),
      );

    return NextResponse.json({
      success: true,
      message: "Community deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting community:", error);
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
        "Access-Control-Allow-Methods": "PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    },
  );
}
