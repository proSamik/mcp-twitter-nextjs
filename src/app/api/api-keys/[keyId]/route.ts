import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";
import { revokeApiKey, updateApiKeyPermissions } from "@/lib/auth/api-key";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string }> },
) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { permissions, revoke } = await request.json();

    if (revoke) {
      const success = await revokeApiKey(session.user.id, resolvedParams.keyId);

      if (!success) {
        return NextResponse.json(
          { error: "API key not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({ message: "API key revoked successfully" });
    }

    if (permissions) {
      const success = await updateApiKeyPermissions(
        session.user.id,
        resolvedParams.keyId,
        permissions,
      );

      if (!success) {
        return NextResponse.json(
          { error: "API key not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({ message: "Permissions updated successfully" });
    }

    return NextResponse.json({ error: "No action specified" }, { status: 400 });
  } catch (error) {
    console.error("Error updating API key:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
