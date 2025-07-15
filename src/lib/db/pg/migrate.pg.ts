import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { join } from "path";
import { Pool } from "pg";
import "load-env";

/**
 * Runs database migrations for NeonDB
 * Includes SSL configuration for secure connections
 */
const runMigrate = async () => {
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL!,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
    max: 1, // Use single connection for migrations
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  const pgDb = drizzle(pool);

  console.log("⏳ Running PostgreSQL migrations...");

  const start = Date.now();

  try {
    await migrate(pgDb, {
      migrationsFolder: join(process.cwd(), "src/lib/db/migrations/pg"),
    });

    const end = Date.now();
    console.log("✅ PostgreSQL migrations completed in", end - start, "ms");

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ PostgreSQL migration failed");
    console.error(error);
    await pool.end();
    process.exit(1);
  }
};

runMigrate().catch((err) => {
  console.error("❌ PostgreSQL migration failed");
  console.error(err);
  process.exit(1);
});
