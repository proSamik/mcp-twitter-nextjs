import { TwitterOAuth } from "../twitter/client";
import { getTwitterCache } from "../upstash/redis";
import { pgDb as db } from "@/lib/db/pg/db.pg";
import { TwitterAccountSchema } from "@/lib/db/pg/schema.pg";
import { UserOAuthCredentialsRepository } from "@/lib/db/pg/repositories/user-oauth-credentials";
import { decryptClientSecret } from "@/lib/auth/oauth-credentials";
import { eq, and } from "drizzle-orm";

/**
 * Twitter OAuth integration for Better Auth
 */
export class TwitterAuthManager {
  private oauthCredentialsRepo: UserOAuthCredentialsRepository;

  constructor() {
    this.oauthCredentialsRepo = new UserOAuthCredentialsRepository();
  }

  /**
   * Get user's Twitter OAuth credentials
   */
  private async getUserOAuthCredentials(userId: string): Promise<{
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  } | null> {
    const credentials = await this.oauthCredentialsRepo.findByUserIdAndProvider(
      userId,
      "twitter",
    );

    if (!credentials) {
      return null;
    }

    // Decrypt the client secret for use in OAuth operations
    try {
      const decryptedSecret = decryptClientSecret(credentials.clientSecretHash);
      return {
        clientId: credentials.clientId,
        clientSecret: decryptedSecret,
        redirectUri: credentials.redirectUri,
      };
    } catch (error) {
      console.error("Error decrypting client secret:", error);
      throw new Error("Failed to decrypt OAuth credentials");
    }
  }

  /**
   * Create TwitterOAuth instance with user's credentials (no env fallback)
   */
  private async createOAuthClient(userId: string): Promise<TwitterOAuth> {
    const userCredentials = await this.getUserOAuthCredentials(userId);
    if (!userCredentials) {
      throw new Error(
        "User OAuth credentials are required. Please set up your Twitter OAuth credentials first.",
      );
    }

    return TwitterOAuth.withUserCredentials(
      userCredentials.clientId,
      userCredentials.clientSecret,
    );
  }

  /**
   * Generate Twitter OAuth URL for account connection
   */
  async generateAuthUrl(
    userId: string,
    redirectUri: string,
  ): Promise<{
    authUrl: string;
    state: string;
  }> {
    try {
      const oauth = await this.createOAuthClient(userId);
      const state = `${userId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Use user's redirect URI if they have custom credentials, otherwise use provided one
      const userCredentials = await this.getUserOAuthCredentials(userId);
      const finalRedirectUri = userCredentials?.redirectUri || redirectUri;

      const { url, codeVerifier } = oauth.generateAuthUrl(
        finalRedirectUri,
        state,
      );

      // Cache the code verifier, user ID, and OAuth credentials ID for later use
      await getTwitterCache().cacheOAuthState(
        state,
        {
          userId,
          codeVerifier,
          redirectUri: finalRedirectUri,
          oauthCredentialsId: userCredentials
            ? (
                await this.oauthCredentialsRepo.findByUserIdAndProvider(
                  userId,
                  "twitter",
                )
              )?.id
            : null,
          timestamp: Date.now(),
        },
        600,
      ); // 10 minutes

      return {
        authUrl: url,
        state,
      };
    } catch (error) {
      console.error("Error generating Twitter auth URL:", error);
      throw new Error(
        `Failed to generate auth URL: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Handle OAuth callback and connect Twitter account
   */
  async handleCallback(
    code: string,
    state: string,
  ): Promise<{
    success: boolean;
    userId?: string;
    twitterAccount?: any;
    error?: string;
  }> {
    try {
      // Retrieve and validate cached OAuth state
      const cachedState = await getTwitterCache().getAndDeleteOAuthState(state);
      if (!cachedState) {
        return {
          success: false,
          error: "Invalid or expired OAuth state",
        };
      }

      const { userId, codeVerifier, redirectUri, oauthCredentialsId } =
        cachedState;

      // Exchange code for tokens using user's OAuth client
      const oauth = await this.createOAuthClient(userId);
      const tokenResult = await oauth.exchangeCodeForTokens(
        code,
        codeVerifier,
        redirectUri,
      );

      // Get user info from Twitter
      const { TwitterClient } = await import("../twitter/client");
      const twitterClient = TwitterClient.withUserTokens(
        tokenResult.accessToken,
      );
      const twitterUser = await twitterClient.getCurrentUser();

      // Check if this Twitter account is already connected to another user
      const [existingAccount] = await db
        .select()
        .from(TwitterAccountSchema)
        .where(eq(TwitterAccountSchema.twitterUserId, twitterUser.id))
        .limit(1);

      if (existingAccount && existingAccount.userId !== userId) {
        return {
          success: false,
          error: "This Twitter account is already connected to another user",
        };
      }

      // Create or update Twitter account record
      const accountData = {
        userId,
        twitterUserId: twitterUser.id,
        username: twitterUser.username,
        displayName: twitterUser.name,
        profileImageUrl: twitterUser.profile_image_url,
        accessToken: tokenResult.accessToken,
        refreshToken: tokenResult.refreshToken,
        accessTokenExpiresAt: tokenResult.expiresIn
          ? new Date(Date.now() + tokenResult.expiresIn * 1000)
          : null,
        oauthCredentialsId: oauthCredentialsId || null, // Link to OAuth credentials if used
        isActive: true,
      };

      let twitterAccount: any;
      if (existingAccount) {
        // Update existing account
        [twitterAccount] = await db
          .update(TwitterAccountSchema)
          .set({
            ...accountData,
            updatedAt: new Date(),
          })
          .where(eq(TwitterAccountSchema.id, existingAccount.id))
          .returning();
      } else {
        // Create new account
        [twitterAccount] = await db
          .insert(TwitterAccountSchema)
          .values(accountData)
          .returning();
      }

      // Cache Twitter account data
      await getTwitterCache().cacheTwitterAccount(userId, {
        ...twitterAccount,
        userInfo: twitterUser,
      });

      return {
        success: true,
        userId,
        twitterAccount,
      };
    } catch (error) {
      console.error("Error handling Twitter OAuth callback:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Disconnect Twitter account
   */
  async disconnectAccount(
    userId: string,
    twitterAccountId: string,
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Verify account belongs to user
      const [account] = await db
        .select()
        .from(TwitterAccountSchema)
        .where(
          and(
            eq(TwitterAccountSchema.id, twitterAccountId),
            eq(TwitterAccountSchema.userId, userId),
          ),
        )
        .limit(1);

      if (!account) {
        return {
          success: false,
          error: "Twitter account not found or does not belong to user",
        };
      }

      // Deactivate account instead of deleting to preserve tweet history
      await db
        .update(TwitterAccountSchema)
        .set({
          isActive: false,
          accessToken: "", // Clear sensitive data
          refreshToken: null,
          updatedAt: new Date(),
        })
        .where(eq(TwitterAccountSchema.id, twitterAccountId));

      // Clear cached data
      await getTwitterCache().clearUserCache(userId);

      return { success: true };
    } catch (error) {
      console.error("Error disconnecting Twitter account:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get user's connected Twitter accounts
   */
  async getUserAccounts(userId: string): Promise<any[]> {
    try {
      const accounts = await db
        .select({
          id: TwitterAccountSchema.id,
          twitterUserId: TwitterAccountSchema.twitterUserId,
          username: TwitterAccountSchema.username,
          displayName: TwitterAccountSchema.displayName,
          profileImageUrl: TwitterAccountSchema.profileImageUrl,
          isActive: TwitterAccountSchema.isActive,
          createdAt: TwitterAccountSchema.createdAt,
        })
        .from(TwitterAccountSchema)
        .where(
          and(
            eq(TwitterAccountSchema.userId, userId),
            eq(TwitterAccountSchema.isActive, true),
          ),
        );

      return accounts;
    } catch (error) {
      console.error("Error getting user Twitter accounts:", error);
      throw new Error(
        `Failed to get Twitter accounts: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get Twitter client for a specific account
   */
  async getTwitterClient(
    userId: string,
    twitterAccountId: string,
  ): Promise<any> {
    try {
      const [account] = await db
        .select()
        .from(TwitterAccountSchema)
        .where(
          and(
            eq(TwitterAccountSchema.id, twitterAccountId),
            eq(TwitterAccountSchema.userId, userId),
            eq(TwitterAccountSchema.isActive, true),
          ),
        )
        .limit(1);

      if (!account) {
        throw new Error("Twitter account not found or inactive");
      }

      // Check if token needs refresh
      if (
        account.accessTokenExpiresAt &&
        account.accessTokenExpiresAt <= new Date()
      ) {
        if (account.refreshToken) {
          // Refresh the token using user's OAuth client
          const oauth = await this.createOAuthClient(userId);
          const refreshResult = await oauth.refreshAccessToken(
            account.refreshToken,
          );

          // Update stored tokens
          await db
            .update(TwitterAccountSchema)
            .set({
              accessToken: refreshResult.accessToken,
              refreshToken: refreshResult.refreshToken || account.refreshToken,
              accessTokenExpiresAt: refreshResult.expiresIn
                ? new Date(Date.now() + refreshResult.expiresIn * 1000)
                : null,
              updatedAt: new Date(),
            })
            .where(eq(TwitterAccountSchema.id, twitterAccountId));

          // Use refreshed token
          const { TwitterClient } = await import("../twitter/client");
          return TwitterClient.withUserTokens(refreshResult.accessToken);
        } else {
          throw new Error(
            "Access token expired and no refresh token available",
          );
        }
      }

      // Use existing valid token
      const { TwitterClient } = await import("../twitter/client");
      return TwitterClient.withUserTokens(account.accessToken);
    } catch (error) {
      console.error("Error getting Twitter client:", error);
      throw new Error(
        `Failed to get Twitter client: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Refresh all expired tokens for a user
   */
  async refreshUserTokens(userId: string): Promise<{
    refreshed: number;
    failed: number;
    errors: string[];
  }> {
    const result = { refreshed: 0, failed: 0, errors: [] as string[] };

    try {
      const accounts = await db
        .select()
        .from(TwitterAccountSchema)
        .where(
          and(
            eq(TwitterAccountSchema.userId, userId),
            eq(TwitterAccountSchema.isActive, true),
          ),
        );

      for (const account of accounts) {
        try {
          // Check if token needs refresh
          if (
            account.refreshToken &&
            account.accessTokenExpiresAt &&
            account.accessTokenExpiresAt <= new Date()
          ) {
            const oauth = await this.createOAuthClient(userId);
            const refreshResult = await oauth.refreshAccessToken(
              account.refreshToken,
            );

            await db
              .update(TwitterAccountSchema)
              .set({
                accessToken: refreshResult.accessToken,
                refreshToken:
                  refreshResult.refreshToken || account.refreshToken,
                accessTokenExpiresAt: refreshResult.expiresIn
                  ? new Date(Date.now() + refreshResult.expiresIn * 1000)
                  : null,
                updatedAt: new Date(),
              })
              .where(eq(TwitterAccountSchema.id, account.id));

            result.refreshed++;
          }
        } catch (error) {
          result.failed++;
          result.errors.push(
            `Account ${account.username}: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }

      return result;
    } catch (error) {
      console.error("Error refreshing user tokens:", error);
      throw new Error(
        `Failed to refresh tokens: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Validate Twitter account access
   */
  async validateAccountAccess(
    userId: string,
    twitterAccountId: string,
  ): Promise<{
    valid: boolean;
    error?: string;
    userInfo?: any;
  }> {
    try {
      const client = await this.getTwitterClient(userId, twitterAccountId);
      const userInfo = await client.getCurrentUser();

      return {
        valid: true,
        userInfo,
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// Export singleton instance
export const twitterAuthManager = new TwitterAuthManager();
