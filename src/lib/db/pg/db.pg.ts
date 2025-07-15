import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

/**
 * PostgreSQL connection pool configured for NeonDB
 * Supports both local development and production NeonDB connections
 */
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL!,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * Drizzle ORM instance connected to PostgreSQL
 * Configured for NeonDB with SSL support
 */
export const pgDb = drizzle(pool);
