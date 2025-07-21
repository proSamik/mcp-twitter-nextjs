import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";
import { UserOAuthCredentialsRepository } from "@/lib/db/pg/repositories/user-oauth-credentials";
import { pgDb } from "@/lib/db/pg/db.pg";
import { TwitterAccountSchema } from "@/lib/db/pg/schema.pg";
import { eq } from "drizzle-orm";
import {
  encryptClientSecret,
  validateTwitterOAuthCredentials,
} from "@/lib/auth/oauth-credentials";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { provider, clientId, clientSecret, redirectUri } = body;

    if (provider !== "twitter") {
      return NextResponse.json(
        { error: "Only Twitter provider is currently supported" },
        { status: 400 },
      );
    }

    // Validate credentials format
    const validation = validateTwitterOAuthCredentials(
      clientId,
      clientSecret,
      redirectUri,
    );
    if (!validation.valid) {
      return NextResponse.json({ errors: validation.errors }, { status: 400 });
    }

    // Skip upfront verification due to X API restrictions
    // Credentials will be tested when user tries to connect Twitter account
    console.log(
      "Skipping OAuth verification - will test when connecting account",
    );

    const repo = new UserOAuthCredentialsRepository();

    // Check if user already has credentials for this provider
    const existing = await repo.findByUserIdAndProvider(
      session.user.id,
      provider,
    );

    // Encrypt the client secret for secure storage
    const clientSecretHash = encryptClientSecret(clientSecret);

    let credentials: any;
    if (existing) {
      // Update existing credentials
      credentials = await repo.update(existing.id, {
        clientId,
        clientSecretHash,
        redirectUri,
        isActive: true,
      });
    } else {
      // Create new credentials
      credentials = await repo.create({
        userId: session.user.id,
        provider,
        clientId,
        clientSecretHash,
        redirectUri,
      });
    }

    if (!credentials) {
      return NextResponse.json(
        { error: "Failed to save credentials" },
        { status: 500 },
      );
    }

    // Invalidate old Twitter accounts that were connected with environment credentials
    await pgDb
      .update(TwitterAccountSchema)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(TwitterAccountSchema.userId, session.user.id));

    // Return credentials without the secret hash
    const { clientSecretHash: _, ...safeCredentials } = credentials;

    return NextResponse.json({
      credentials: safeCredentials,
      message:
        "OAuth credentials saved successfully. Previous Twitter accounts have been invalidated.",
    });
  } catch (error) {
    console.error("Error saving OAuth credentials:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const repo = new UserOAuthCredentialsRepository();

    const credentials = await repo.findByUserId(session.user.id);

    // Remove secret hashes from response
    const safeCredentials = credentials.map(
      ({ clientSecretHash: _, ...cred }) => cred,
    );

    return NextResponse.json({ credentials: safeCredentials });
  } catch (error) {
    console.error("Error fetching OAuth credentials:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { provider } = body;

    if (provider !== "twitter") {
      return NextResponse.json(
        { error: "Only Twitter provider is currently supported" },
        { status: 400 },
      );
    }

    const repo = new UserOAuthCredentialsRepository();

    const deleted = await repo.deleteByUserIdAndProvider(
      session.user.id,
      provider,
    );

    if (!deleted) {
      return NextResponse.json(
        { error: "No credentials found to delete" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "OAuth credentials deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting OAuth credentials:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
