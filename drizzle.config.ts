import "load-env";
import type { Config } from "drizzle-kit";

/**
 * Drizzle Kit configuration for NeonDB
 * Supports SSL connections required by NeonDB
 */
export default {
  schema: "./src/lib/db/pg/schema.pg.ts",
  out: "./src/lib/db/migrations/pg",
  dialect: "postgresql",
  migrations: {},
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
    ssl: process.env.NODE_ENV === "production" ? "require" : false,
  },
  verbose: true,
  strict: true,
} satisfies Config;
