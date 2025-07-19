import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";
import { getR2Client } from "@/lib/r2/client";

export async function DELETE(request: NextRequest) {
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
    const { keys } = body; // Array of file keys to delete

    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json(
        { error: "No file keys provided" },
        { status: 400 },
      );
    }

    const r2Client = getR2Client();

    // Verify that all files belong to the authenticated user
    for (const key of keys) {
      const fileInfo = r2Client.getFileInfo(key);
      if (fileInfo.userId !== userId) {
        return NextResponse.json(
          { error: "Unauthorized to delete this file" },
          { status: 403 },
        );
      }
    }

    // Delete files from R2
    await r2Client.deleteFiles(keys);

    return NextResponse.json({
      success: true,
      deletedCount: keys.length,
    });
  } catch (error) {
    console.error("Error deleting files:", error);
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
        "Access-Control-Allow-Methods": "DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    },
  );
}
