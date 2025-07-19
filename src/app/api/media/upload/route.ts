import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";
import { getR2Client, MEDIA_CONSTRAINTS } from "@/lib/r2/client";

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
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const mediaType = formData.get("mediaType") as string; // 'image' or 'video'

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type and size
    const r2Client = getR2Client();
    const constraints =
      mediaType === "video" ? MEDIA_CONSTRAINTS.VIDEO : MEDIA_CONSTRAINTS.IMAGE;
    const validation = r2Client.validateFile(file, constraints.maxSize, [
      ...constraints.allowedTypes,
    ]);

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Generate unique key
    const key = r2Client.generateFileKey(file.name, userId, "tweet-media");

    // Upload to R2
    const uploadResult = await r2Client.uploadFile(key, buffer, file.type, {
      originalName: file.name,
      userId,
      uploadedAt: new Date().toISOString(),
      mediaType,
    });

    return NextResponse.json({
      success: true,
      file: {
        key: uploadResult.key,
        url: uploadResult.url,
        size: uploadResult.size,
        contentType: uploadResult.contentType,
        originalName: file.name,
        mediaType,
      },
    });
  } catch (error) {
    console.error("Error uploading file:", error);
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
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    },
  );
}
