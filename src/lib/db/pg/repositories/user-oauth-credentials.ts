import { and, eq } from "drizzle-orm";
import { pgDb } from "../db.pg";
import {
  UserOAuthCredentialsSchema,
  type UserOAuthCredentialsEntity,
} from "../schema.pg";

export class UserOAuthCredentialsRepository {
  constructor(private db = pgDb) {}

  async create(data: {
    userId: string;
    provider: string;
    clientId: string;
    clientSecretHash: string;
    redirectUri: string;
  }): Promise<UserOAuthCredentialsEntity> {
    const [created] = await this.db
      .insert(UserOAuthCredentialsSchema)
      .values({
        userId: data.userId,
        provider: data.provider,
        clientId: data.clientId,
        clientSecretHash: data.clientSecretHash,
        redirectUri: data.redirectUri,
        isActive: true,
      })
      .returning();

    if (!created) {
      throw new Error("Failed to create OAuth credentials");
    }

    return created;
  }

  async findByUserIdAndProvider(
    userId: string,
    provider: string,
  ): Promise<UserOAuthCredentialsEntity | null> {
    const [credentials] = await this.db
      .select()
      .from(UserOAuthCredentialsSchema)
      .where(
        and(
          eq(UserOAuthCredentialsSchema.userId, userId),
          eq(UserOAuthCredentialsSchema.provider, provider),
          eq(UserOAuthCredentialsSchema.isActive, true),
        ),
      )
      .limit(1);

    return credentials || null;
  }

  async findByUserId(userId: string): Promise<UserOAuthCredentialsEntity[]> {
    return await this.db
      .select()
      .from(UserOAuthCredentialsSchema)
      .where(
        and(
          eq(UserOAuthCredentialsSchema.userId, userId),
          eq(UserOAuthCredentialsSchema.isActive, true),
        ),
      );
  }

  async update(
    id: string,
    data: {
      clientId?: string;
      clientSecretHash?: string;
      redirectUri?: string;
      isActive?: boolean;
    },
  ): Promise<UserOAuthCredentialsEntity | null> {
    const [updated] = await this.db
      .update(UserOAuthCredentialsSchema)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(UserOAuthCredentialsSchema.id, id))
      .returning();

    return updated || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .update(UserOAuthCredentialsSchema)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(UserOAuthCredentialsSchema.id, id));

    return (result.rowCount || 0) > 0;
  }

  async deleteByUserIdAndProvider(
    userId: string,
    provider: string,
  ): Promise<boolean> {
    const result = await this.db
      .update(UserOAuthCredentialsSchema)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(UserOAuthCredentialsSchema.userId, userId),
          eq(UserOAuthCredentialsSchema.provider, provider),
        ),
      );

    return (result.rowCount || 0) > 0;
  }
}
