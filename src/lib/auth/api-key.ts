import { createHash, randomBytes } from "crypto";
import { pgDb as db } from "@/lib/db/pg/db.pg";
import { ApiKeySchema } from "@/lib/db/pg/schema.pg";
import { eq, and } from "drizzle-orm";

export interface ApiKeyPermissions {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  keyPrefix: string;
  permissions: ApiKeyPermissions;
  userId: string;
}

export function generateApiKey(): {
  key: string;
  keyHash: string;
  keyPrefix: string;
} {
  const key = `mcp_${randomBytes(32).toString("hex")}`;
  const keyHash = createHash("sha256").update(key).digest("hex");
  const keyPrefix = key.substring(0, 12);

  return { key, keyHash, keyPrefix };
}

export async function createApiKey(
  userId: string,
  name: string,
  permissions: Partial<ApiKeyPermissions> = {},
): Promise<ApiKey> {
  const { key, keyHash, keyPrefix } = generateApiKey();

  const defaultPermissions: ApiKeyPermissions = {
    read: true,
    create: true,
    update: true,
    delete: false,
  };

  const finalPermissions = { ...defaultPermissions, ...permissions };

  const [apiKey] = await db
    .insert(ApiKeySchema)
    .values({
      name,
      keyHash,
      keyPrefix,
      userId,
      permissions: finalPermissions,
    })
    .returning();

  return {
    id: apiKey.id,
    name: apiKey.name,
    key,
    keyPrefix: apiKey.keyPrefix,
    permissions: apiKey.permissions as ApiKeyPermissions,
    userId: apiKey.userId,
  };
}

export async function validateApiKey(key: string): Promise<{
  userId: string;
  permissions: ApiKeyPermissions;
  apiKeyId: string;
} | null> {
  const keyHash = createHash("sha256").update(key).digest("hex");

  const [result] = await db
    .select({
      id: ApiKeySchema.id,
      userId: ApiKeySchema.userId,
      permissions: ApiKeySchema.permissions,
      isActive: ApiKeySchema.isActive,
      expiresAt: ApiKeySchema.expiresAt,
    })
    .from(ApiKeySchema)
    .where(
      and(eq(ApiKeySchema.keyHash, keyHash), eq(ApiKeySchema.isActive, true)),
    );

  if (!result) {
    return null;
  }

  if (result.expiresAt && new Date() > result.expiresAt) {
    return null;
  }

  // Update last used timestamp
  await db
    .update(ApiKeySchema)
    .set({ lastUsedAt: new Date() })
    .where(eq(ApiKeySchema.id, result.id));

  return {
    userId: result.userId,
    permissions: result.permissions as ApiKeyPermissions,
    apiKeyId: result.id,
  };
}

export async function revokeApiKey(
  userId: string,
  apiKeyId: string,
): Promise<boolean> {
  const [result] = await db
    .update(ApiKeySchema)
    .set({ isActive: false })
    .where(and(eq(ApiKeySchema.id, apiKeyId), eq(ApiKeySchema.userId, userId)))
    .returning();

  return !!result;
}

export async function updateApiKeyPermissions(
  userId: string,
  apiKeyId: string,
  permissions: Partial<ApiKeyPermissions>,
): Promise<boolean> {
  const [existing] = await db
    .select()
    .from(ApiKeySchema)
    .where(and(eq(ApiKeySchema.id, apiKeyId), eq(ApiKeySchema.userId, userId)));

  if (!existing) {
    return false;
  }

  const updatedPermissions: ApiKeyPermissions = {
    read: permissions.read ?? existing.permissions?.read ?? true,
    create: permissions.create ?? existing.permissions?.create ?? true,
    update: permissions.update ?? existing.permissions?.update ?? true,
    delete: permissions.delete ?? existing.permissions?.delete ?? false,
  };

  const [result] = await db
    .update(ApiKeySchema)
    .set({ permissions: updatedPermissions })
    .where(eq(ApiKeySchema.id, apiKeyId))
    .returning();

  return !!result;
}

export async function getUserApiKeys(userId: string) {
  return await db
    .select({
      id: ApiKeySchema.id,
      name: ApiKeySchema.name,
      keyPrefix: ApiKeySchema.keyPrefix,
      permissions: ApiKeySchema.permissions,
      isActive: ApiKeySchema.isActive,
      lastUsedAt: ApiKeySchema.lastUsedAt,
      createdAt: ApiKeySchema.createdAt,
    })
    .from(ApiKeySchema)
    .where(eq(ApiKeySchema.userId, userId))
    .orderBy(ApiKeySchema.createdAt);
}
