DROP TABLE "tweet_thread" CASCADE;--> statement-breakpoint
ALTER TABLE "tweet" DROP COLUMN "parent_tweet_id";--> statement-breakpoint
ALTER TABLE "tweet" DROP COLUMN "thread_order";