import { UserPreferences } from "app-types/user";
import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  json,
  uuid,
  boolean,
  integer,
} from "drizzle-orm/pg-core";

export const UserSchema = pgTable("user", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  normalizedEmail: text("normalized_email").unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  password: text("password"),
  image: text("image"),
  preferences: json("preferences").default({}).$type<UserPreferences>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const SessionSchema = pgTable("session", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: uuid("user_id")
    .notNull()
    .references(() => UserSchema.id, { onDelete: "cascade" }),
});

export const AccountSchema = pgTable("account", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => UserSchema.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    withTimezone: true,
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const VerificationSchema = pgTable("verification", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
export const TwitterAccountSchema = pgTable("twitter_account", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => UserSchema.id, { onDelete: "cascade" }),
  twitterUserId: text("twitter_user_id").notNull().unique(),
  username: text("username").notNull(),
  displayName: text("display_name").notNull(),
  profileImageUrl: text("profile_image_url"),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", {
    withTimezone: true,
  }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const TweetSchema = pgTable("tweet", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  nanoId: text("nano_id").notNull().unique(), // Short unique public ID for MCP
  content: text("content").notNull(),
  tweetType: text("tweet_type").notNull(), // "draft", "scheduled", "posted", "thread"
  status: text("status").notNull().default("draft"), // "draft", "scheduled", "posted", "failed"
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  postedAt: timestamp("posted_at", { withTimezone: true }),
  twitterTweetId: text("twitter_tweet_id"), // ID from Twitter API when posted
  qstashMessageId: text("qstash_message_id"), // QStash message ID for cancellation
  parentTweetId: uuid("parent_tweet_id"), // For threading
  threadOrder: integer("thread_order").default(0),
  mediaUrls: json("media_urls").default([]).$type<string[]>(),
  hashtags: json("hashtags").default([]).$type<string[]>(),
  mentions: json("mentions").default([]).$type<string[]>(),
  communityId: text("community_id"),
  priority: integer("priority").notNull().default(0),
  tags: json("tags").default([]).$type<string[]>(),
  analytics: json("analytics").default({}).$type<{
    likes?: number;
    retweets?: number;
    replies?: number;
    views?: number;
    impressions?: number;
  }>(),
  twitterAccountId: uuid("twitter_account_id")
    .notNull()
    .references(() => TwitterAccountSchema.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => UserSchema.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const TweetThreadSchema = pgTable("tweet_thread", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("draft"), // "draft", "scheduled", "posted", "failed"
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  postedAt: timestamp("posted_at", { withTimezone: true }),
  twitterAccountId: uuid("twitter_account_id")
    .notNull()
    .references(() => TwitterAccountSchema.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => UserSchema.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const ApiKeySchema = pgTable("api_key", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: text("name").notNull(),
  keyHash: text("key_hash").notNull().unique(),
  keyPrefix: text("key_prefix").notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => UserSchema.id, { onDelete: "cascade" }),
  permissions: json("permissions")
    .default({
      read: true,
      create: true,
      update: true,
      delete: false,
    })
    .$type<{
      read: boolean;
      create: boolean;
      update: boolean;
      delete: boolean;
    }>(),
  isActive: boolean("is_active").default(true).notNull(),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const CommunitySchema = pgTable("community", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: text("name").notNull(),
  communityId: text("community_id").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => UserSchema.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const oauthApplication = pgTable("oauth_application", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  icon: text("icon"),
  metadata: text("metadata"),
  clientId: text("client_id").unique(),
  clientSecret: text("client_secret"),
  redirectURLs: text("redirect_u_r_ls"),
  type: text("type"),
  disabled: boolean("disabled"),
  userId: text("user_id"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const oauthAccessToken = pgTable("oauth_access_token", {
  id: uuid("id").primaryKey().defaultRandom(),
  accessToken: text("access_token").unique(),
  refreshToken: text("refresh_token").unique(),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  clientId: text("client_id"),
  userId: text("user_id"),
  scopes: text("scopes"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const oauthConsent = pgTable("oauth_consent", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: text("client_id"),
  userId: text("user_id"),
  scopes: text("scopes"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
  consentGiven: boolean("consent_given"),
});

export type UserEntity = typeof UserSchema.$inferSelect;
export type TwitterAccountEntity = typeof TwitterAccountSchema.$inferSelect;
export type TweetEntity = typeof TweetSchema.$inferSelect;
export type TweetThreadEntity = typeof TweetThreadSchema.$inferSelect;
export type ApiKeyEntity = typeof ApiKeySchema.$inferSelect;
export type CommunityEntity = typeof CommunitySchema.$inferSelect;
export type oauthApplicationEntity = typeof oauthApplication.$inferSelect;
export type oauthAccessTokenEntity = typeof oauthAccessToken.$inferSelect;
export type oauthConsentEntity = typeof oauthConsent.$inferSelect;
