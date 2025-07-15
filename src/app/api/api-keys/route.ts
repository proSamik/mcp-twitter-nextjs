import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";
import { createApiKey, getUserApiKeys } from "@/lib/auth/api-key";

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKeys = await getUserApiKeys(session.user.id);
    return NextResponse.json({ apiKeys });
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, permissions } = await request.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Check if user already has 5 API keys
    const existingKeys = await getUserApiKeys(session.user.id);
    if (existingKeys.length >= 5) {
      return NextResponse.json(
        {
          error: "Maximum of 5 API keys allowed per user",
        },
        { status: 400 },
      );
    }

    const apiKey = await createApiKey(session.user.id, name, permissions);

    return NextResponse.json(
      {
        apiKey: {
          id: apiKey.id,
          name: apiKey.name,
          key: apiKey.key, // Only returned on creation
          keyPrefix: apiKey.keyPrefix,
          permissions: apiKey.permissions,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating API key:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
