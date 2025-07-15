# NeonDB Setup Guide

This guide will help you set up NeonDB as your PostgreSQL database for the Polar SaaS Kit.

## Why NeonDB?

NeonDB is a serverless PostgreSQL database that offers:
- ✅ **Serverless**: Pay only for what you use
- ✅ **Branching**: Create database branches for development
- ✅ **Auto-scaling**: Scales to zero when not in use
- ✅ **Fast**: Sub-second startup times
- ✅ **Modern**: Built for modern applications
- ✅ **SSL Required**: Secure by default

## Step 1: Create a NeonDB Account

1. Go to [neon.tech](https://neon.tech)
2. Sign up for a free account
3. Create a new project

## Step 2: Get Your Connection String

1. In your NeonDB dashboard, go to your project
2. Navigate to the **Connection Details** section
3. Copy the connection string that looks like:
   ```
   postgresql://username:password@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

## Step 3: Update Your Environment Variables

1. Open your `.env` file (or create one if it doesn't exist)
2. Update the `POSTGRES_URL` with your NeonDB connection string:

```env
# NeonDB Connection String
POSTGRES_URL=postgresql://username:password@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require

# Other environment variables...
BETTER_AUTH_SECRET=your-secret-key
POLAR_ACCESS_TOKEN=your-polar-token
# ... etc
```

## Step 4: Run Database Migrations

Now that you have NeonDB configured, run the migrations:

```bash
# Install dependencies if you haven't already
npm install

# Run database migrations
npm run db:migrate

# Or using pnpm
pnpm db:migrate
```

## Step 5: Verify the Connection

Test that everything is working:

```bash
# Push schema to verify connection
npm run db:push

# Open Drizzle Studio to explore your database
npm run db:studio
```

## Development vs Production

### Development
- For local development, you can use either:
  - A local PostgreSQL instance (without SSL)
  - A NeonDB development branch

### Production
- Always use NeonDB with SSL enabled
- The configuration automatically detects the environment and applies SSL accordingly

## Database Branching (Optional)

NeonDB supports database branching, which is great for development:

1. In your NeonDB dashboard, create a new branch
2. Use the branch connection string for development
3. Keep your main branch for production

## Troubleshooting

### SSL Connection Issues
If you see SSL-related errors, make sure:
- Your connection string includes `?sslmode=require`
- You're using the correct NeonDB connection string
- The SSL configuration in the code matches your environment

### Connection Timeouts
NeonDB may have cold starts. The configuration includes:
- Connection timeout: 5 seconds for migrations, 2 seconds for app
- Idle timeout: 30 seconds
- Connection pooling for better performance

### Migration Issues
If migrations fail:
1. Check your connection string is correct
2. Ensure your NeonDB project is active
3. Verify you have the necessary permissions

## Environment Configuration

The project automatically configures SSL based on the environment:

- **Production** (`NODE_ENV=production`): SSL required
- **Development** (`NODE_ENV=development`): SSL optional

## Connection Pool Settings

The database connection is optimized for NeonDB:

```typescript
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL!,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  max: 20,                    // Maximum connections
  idleTimeoutMillis: 30000,   // 30 seconds
  connectionTimeoutMillis: 2000, // 2 seconds
});
```

## Support

- **NeonDB Documentation**: [docs.neon.tech](https://docs.neon.tech)
- **Drizzle ORM Documentation**: [orm.drizzle.team](https://orm.drizzle.team)
- **Project Issues**: Create an issue in this repository

## Security Notes

- Never commit your `.env` file to version control
- Use environment variables for all sensitive data
- NeonDB connections are encrypted by default
- Connection strings contain sensitive credentials 