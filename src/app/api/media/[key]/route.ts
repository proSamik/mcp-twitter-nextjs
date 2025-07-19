import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";
import { getR2Client } from "@/lib/r2/client";

/**
 * Generate signed URLs for secure media access
 * Requires CORS configuration on R2 bucket
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  try {
    // Authentication required
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { key: paramKey } = await params;
    const key = decodeURIComponent(paramKey);

    // Validate the key format to prevent path traversal
    if (!key.match(/^[a-zA-Z0-9\/\-_\.]+$/)) {
      return NextResponse.json(
        { error: "Invalid key format" },
        { status: 400 },
      );
    }

    const r2Client = getR2Client();

    // Generate presigned URL (expires in 1 hour)
    const signedUrl = await r2Client.getPresignedUrl(key, 3600);
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

    return NextResponse.json({
      success: true,
      url: signedUrl,
      expiresAt,
      key,
    });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return NextResponse.json(
      { error: "Failed to generate signed URL" },
      { status: 500 },
    );
  }
}
