# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `pnpm dev` - Start development server with custom server (tsx src/server.ts)
- `pnpm dev:turbo` - Start development server with Turbopack (fast refresh)
- `pnpm build` - Build for production
- `pnpm start` - Start production server (tsx src/server.ts)
- `pnpm build:local` - Build for local environment (NO_HTTPS=1)

### Code Quality
- `pnpm lint` - Run Next.js lint + Biome lint with auto-fix
- `pnpm lint:fix` - Fix linting issues automatically
- `pnpm format` - Format code with Biome
- `pnpm check-types` - TypeScript type checking (no emit)

### Testing
- `pnpm test` - Run tests with Vitest
- `pnpm test:watch` - Run tests in watch mode

### Database Operations
- `pnpm db:migrate` - Run database migrations (uses tsx scripts/db-migrate.ts)
- `pnpm db:generate` - Generate new Drizzle migrations
- `pnpm db:push` - Push schema changes directly (development only)
- `pnpm db:studio` - Open Drizzle Studio for database management
- `pnpm db:reset` - Drop all tables and push schema (destructive)
- `pnpm db:pull` - Pull schema from database
- `pnpm db:check` - Check migration files

### Docker Operations
- `pnpm docker-compose:up` - Start Docker containers with build
- `pnpm docker-compose:down` - Stop Docker containers
- `pnpm docker-compose:logs` - View Docker logs
- `pnpm docker-compose:ps` - Show running containers
- `pnpm docker-compose:update` - Pull latest code and rebuild containers
- `pnpm docker:pg` - Run PostgreSQL in Docker container
- `pnpm docker:app` - Build and run app in Docker container

### Setup & Utilities
- `pnpm initial:env` - Generate .env from .env.example
- `pnpm postinstall` - Post-installation setup script
- `pnpm clean` - Clean build artifacts
- `pnpm prepare` - Husky pre-commit hooks setup

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 with App Router and Turbopack
- **Twitter Integration**: Twitter API v2 with `twitter-api-v2` client
- **AI Integration**: Claude MCP (Model Context Protocol) for AI-powered features
- **Scheduling**: Upstash QStash for reliable tweet scheduling
- **Caching**: Upstash Redis for high-performance data caching
- **Authentication**: Better Auth with Google OAuth + Twitter OAuth support
- **Payments**: Polar.sh for subscription management ($3/month, $30/year)
- **Database**: PostgreSQL with Drizzle ORM (TypeScript-first)
- **Styling**: Tailwind CSS with 20+ theme variants
- **Code Quality**: Biome for linting/formatting, TypeScript strict mode
- **Testing**: Vitest for unit testing

### Key Directories
- `src/app/` - Next.js App Router with route groups:
  - `(auth)/` - Public authentication pages (sign-in, sign-up, forgot-password)
  - `(premium)/` - Protected premium features (app dashboard, api-keys)
  - `(psec)/` - Protected secure routes with dynamic slug handling
  - `api/` - API routes for Twitter integration, webhooks, and MCP
- `src/components/` - React components organized by feature:
  - `twitter/` - Twitter-specific components (ConnectedAccounts, TweetComposer)
  - `ui/` - Reusable UI components
  - `layouts/` - Layout components including AppSidebar
- `src/lib/` - Core libraries:
  - `twitter/` - Twitter API client and utilities
  - `upstash/` - Redis caching and QStash scheduling
  - `auth/` - Authentication including Twitter OAuth and API keys
  - `db/` - Database schemas, repositories, and utilities
  - `cache/` - Caching interface and memory cache
  - `websocket/` - WebSocket server and client for real-time updates
  - `polar/` - Polar.sh payment integration
  - `plunk/` - Email service integration
- `src/hooks/` - Custom React hooks
- `scripts/` - Build and utility scripts

### Database Schema (Drizzle + PostgreSQL)
- **UserSchema**: User accounts with preferences (theme, settings)
- **SessionSchema**: Authentication sessions with device tracking
- **AccountSchema**: OAuth provider accounts
- **VerificationSchema**: Email verification tokens
- **UserOAuthCredentialsSchema**: User-provided OAuth credentials (encrypted client secrets)
- **TwitterAccountSchema**: Connected Twitter/X accounts with OAuth tokens and credentials reference
- **TweetSchema**: Tweet management (drafts, scheduled, posted) with analytics
- **TweetThreadSchema**: Thread management for multi-tweet sequences
- **ApiKeySchema**: API keys for MCP authentication

### Authentication Flow (Better Auth)
- Email/password authentication with 7-day sessions
- Google OAuth with automatic account linking
- User-provided Twitter OAuth credentials (no environment variables required)
- Multi-account Twitter management per user with credential isolation
- Protected route groups for premium features
- User preferences stored in database JSON column
- OAuth credential encryption using AES-256-CBC with BETTER_AUTH_SECRET

### Payment Integration (Polar.sh)
- Monthly subscription ($3/month) and yearly subscription ($30/year)
- Automatic customer creation and linking
- Environment variables: `POLAR_ACCESS_TOKEN`, `POLAR_MONTHLY_PRODUCT_ID`, `POLAR_YEARLY_PRODUCT_ID`

## Development Patterns

### Environment Configuration
- Uses `load-env` library loaded in drizzle.config.ts
- SSL required for production database connections
- `NO_HTTPS=1` for local development cookie handling

### Code Style
- Biome configuration enforces 2-space indentation, 80-character line width
- Double quotes for JavaScript strings
- TypeScript strict mode enabled
- Import organization enabled

### Theme System
- 20+ built-in themes with CSS custom properties
- Dark/light mode support for all themes
- Theme switching via user preferences in database

### Internationalization
- next-intl for i18n support
- Message files in `/messages/` for 7 languages
- Locale utilities in `src/i18n/`

## Important Files & Patterns

### Configuration Files
- `drizzle.config.ts` - Database configuration with SSL support
- `biome.json` - Linting and formatting rules
- `vitest.config.ts` - Test configuration
- `next.config.ts` - Next.js configuration

### Key Patterns
- Route groups for organizing pages by access level
- Repository pattern for database access (`src/lib/db/repositories/`)
- Custom hooks for common functionality (`src/hooks/`)
- Shared UI components with shadcn/ui base

### Scripts
- `scripts/db-migrate.ts` - Handle database migrations
- `scripts/initial-env.ts` - Environment setup
- `scripts/clean.ts` - Clean build artifacts
- `scripts/postinstall.ts` - Post-installation tasks

## Twitter/X Management Platform

### Overview
Comprehensive Twitter/X management platform with multi-account support and AI integration:
- **Multi-Account Management**: Connect and manage multiple Twitter/X accounts
- **Tweet Composer**: Full-featured composer with character counting, hashtag/mention extraction
- **Tweet Scheduling**: Schedule tweets for future posting using Upstash QStash
- **Draft Management**: Save and manage tweet drafts
- **Thread Creation**: Support for multi-tweet thread creation
- **Real-time Updates**: WebSocket broadcasting for multi-client synchronization
- **Analytics Dashboard**: Track tweet performance and engagement
- **MCP Integration**: Claude AI integration for content optimization

### Database Schema
- **UserOAuthCredentialsSchema**: User-provided OAuth credentials with encrypted client secrets
- **TwitterAccountSchema**: Connected Twitter accounts with OAuth tokens, profile data, and credentials reference
- **TweetSchema**: Comprehensive tweet management with status tracking (draft, scheduled, posted, failed)
- **TweetThreadSchema**: Thread management for multi-tweet sequences
- **ApiKeySchema**: API keys for MCP authentication

### API Endpoints
- `GET/POST/DELETE /api/oauth/credentials` - Manage user OAuth credentials
- `GET/POST /api/twitter/accounts` - Manage connected Twitter accounts
- `POST /api/twitter/post` - Post tweets immediately
- `POST/DELETE /api/twitter/schedule` - Schedule and cancel tweets
- `POST /api/auth/twitter/connect` - Initiate Twitter OAuth connection
- `GET /api/auth/twitter/callback` - Twitter OAuth callback with error handling
- `POST /api/mcp` - Claude MCP server for AI-powered features
- `POST /api/webhooks/qstash/tweet` - QStash webhook for scheduled tweets

### Components Structure
- **ConnectedAccounts** (`src/components/twitter/connected-accounts.tsx`):
  - Multi-account display with profile information
  - Connect/disconnect functionality with user OAuth credentials
  - Real-time account status and OAuth setup warnings
- **OAuthUserSetupPage** (`src/app/(premium)/oauth-user-setup/page.tsx`):
  - User OAuth credentials setup with Twitter Developer Portal instructions
  - Encrypted credential storage and automatic connection testing
  - Error handling for OAuth callback failures
- **TweetComposer** (`src/components/twitter/tweet-composer.tsx`):
  - Rich text composer with character counting
  - Hashtag and mention extraction
  - Schedule functionality with date/time picker
  - Draft saving capabilities
- **AppSidebar** (`src/components/layouts/app-sidebar.tsx`):
  - Navigation with API Keys and OAuth Setup page integration
  - Theme-aware Twitter branding

### Twitter API Integration
- **TwitterClient** (`src/lib/twitter/client.ts`):
  - OAuth 2.0 and OAuth 1.0a support with user-provided credentials
  - Tweet posting with media upload
  - Thread creation and management
  - User profile and analytics access
- **TwitterAuthManager** (`src/lib/auth/twitter-oauth.ts`):
  - User OAuth credentials management (no environment variables)
  - OAuth flow with callback error handling
  - Token storage and refresh with credential association
  - Multi-account session handling per user credentials

### Upstash Integration
- **Redis Caching** (`src/lib/upstash/redis.ts`):
  - Twitter account data caching
  - Rate limiting implementation
  - OAuth state management
- **QStash Scheduling** (`src/lib/upstash/qstash.ts`):
  - Tweet scheduling with retry logic
  - Webhook verification
  - Batch operations support

### MCP (Model Context Protocol) Integration

### OAuth 2.0 Authentication
The MCP server supports OAuth 2.0 with PKCE for secure client authentication:

**OAuth Endpoints:**
- Authorization Server: `/.well-known/oauth-authorization-server`
- Protected Resource: `/.well-known/oauth-protected-resource`
- Client Registration: `/api/auth/mcp/register`
- Authorization: `/api/auth/mcp/authorize`
- Token: `/api/auth/mcp/token`
- User Info: `/api/auth/mcp/userinfo`
- JWKS: `/api/auth/mcp/jwks`

**Supported Scopes:**
- `openid` - OpenID Connect
- `profile` - User profile information
- `email` - User email address

**Known Issues:**
- `offline_access` scope is advertised but not supported due to Better Auth 1.2.10 limitations
- OAuth flows work correctly when `offline_access` is excluded from scope requests

**Configuration:**
```typescript
// src/lib/auth/server.ts
mcp({
  loginPage: "/sign-in",
})
```

### Database Schema
OAuth-related tables with UUID primary keys:
- `oauth_application` - Registered OAuth clients
- `oauth_access_token` - Access tokens and refresh tokens
- `oauth_consent` - User consent records

### API Key Authentication (Legacy)
For clients that don't support OAuth, API key authentication is available via the `ApiKeySchema` table.
- **MCP Server** (`src/app/api/mcp/route.ts`):
  - Tools: `list_tweets`, `create_tweet`, `schedule_tweet`, `delete_tweet`
  - Claude AI integration for content optimization
  - Real-time tweet management through AI

### Key Dependencies
- `twitter-api-v2` - Twitter API v2 client
- `@upstash/redis` - Redis caching
- `@upstash/qstash` - Message queue and scheduling
- `date-fns` - Date formatting and manipulation
- `socket.io` - WebSocket real-time updates
- `better-auth` - Authentication with Twitter OAuth

## User OAuth Credentials System

### Overview
The platform now supports user-provided OAuth credentials instead of requiring environment variables. Users bring their own Twitter Developer credentials for enhanced security and control.

### Key Features
- **No Environment Variables Required**: Users provide their own Twitter OAuth credentials
- **Encrypted Storage**: Client secrets encrypted using AES-256-CBC with BETTER_AUTH_SECRET
- **Automatic Testing**: Credentials verified through actual OAuth flows
- **Error Handling**: Comprehensive OAuth callback error handling and user guidance
- **Account Isolation**: Each user's Twitter accounts linked to their OAuth credentials

### Core Files
- **`src/lib/auth/oauth-credentials.ts`** - OAuth credential encryption, decryption, and validation
- **`src/lib/db/pg/repositories/user-oauth-credentials.ts`** - OAuth credentials database operations
- **`src/app/(premium)/oauth-user-setup/page.tsx`** - OAuth setup page with Twitter Developer instructions
- **`src/app/api/oauth/credentials/route.ts`** - API endpoints for OAuth credentials management
- **`src/lib/auth/twitter-oauth.ts`** - Updated TwitterAuthManager for user credentials
- **`src/app/api/auth/twitter/callback/route.ts`** - Enhanced callback with error handling

### Database Schema Updates
- **`UserOAuthCredentialsSchema`** - Stores encrypted OAuth credentials per user
- **`TwitterAccountSchema.oauthCredentialsId`** - Links Twitter accounts to user credentials
- **Migration 0009** - Adds oauth_credentials_id column to twitter_account table

### API Endpoints
- `POST /api/oauth/credentials` - Save encrypted OAuth credentials
- `GET /api/oauth/credentials` - Retrieve user's OAuth credentials (without secrets)
- `DELETE /api/oauth/credentials` - Delete OAuth credentials
- `GET /api/auth/twitter/callback` - Enhanced callback with credential-specific error handling

### Security Features
- Client secrets encrypted with AES-256-CBC using BETTER_AUTH_SECRET as encryption key
- Format validation for Twitter OAuth credentials
- Server-side only credential operations (no browser exposure)
- Automatic invalidation of old Twitter accounts when new credentials are set

### User Experience
- Step-by-step Twitter Developer Portal setup instructions
- Copy-to-clipboard redirect URI functionality
- Automatic credential testing via OAuth flow initiation
- Clear error messages with actionable guidance for OAuth failures
- Theme-consistent UI components using CSS custom properties

## Legacy Files (Twitter Environment Variables)
The following pattern is no longer used as users now provide their own OAuth credentials:
- Environment variables: `TWITTER_CLIENT_ID`, `TWITTER_CLIENT_SECRET` 
- System-wide Twitter credentials in favor of per-user credentials

## Package Manager
- Uses pnpm as primary package manager
- `onlyBuiltDependencies` specified for Biome, Tailwind, and other native packages
- Node.js 18+ required