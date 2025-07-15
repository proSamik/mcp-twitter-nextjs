# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `pnpm dev` - Start development server with Turbopack (fast refresh)
- `pnpm build` - Build for production
- `pnpm start` - Start production server
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

### Setup & Utilities
- `pnpm initial:env` - Generate .env from .env.example
- `pnpm postinstall` - Post-installation setup script
- `pnpm clean` - Clean build artifacts

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 with App Router and Turbopack
- **Twitter Integration**: Twitter API v2 with `twitter-api-v2` client
- **AI Integration**: Claude MCP (Model Context Protocol) for AI-powered features
- **Scheduling**: Upstash QStash for reliable tweet scheduling
- **Caching**: Upstash Redis for high-performance data caching
- **Authentication**: Better Auth with Google OAuth + Twitter OAuth support
- **Payments**: Polar.sh for lifetime deals and one-time payments
- **Database**: PostgreSQL with Drizzle ORM (TypeScript-first)
- **Styling**: Tailwind CSS with 20+ theme variants
- **Code Quality**: Biome for linting/formatting, TypeScript strict mode
- **Testing**: Vitest for unit testing

### Key Directories
- `src/app/` - Next.js App Router with route groups:
  - `(auth)/` - Public authentication pages
  - `(premium)/` - Protected premium features including Twitter dashboard
  - `api/` - API routes for Twitter integration, webhooks, and MCP
- `src/components/` - React components organized by feature:
  - `twitter/` - Twitter-specific components (ConnectedAccounts, TweetComposer)
  - `ui/` - Reusable UI components
  - `layouts/` - Layout components including AppSidebar
- `src/lib/` - Core libraries:
  - `twitter/` - Twitter API client and utilities
  - `upstash/` - Redis caching and QStash scheduling
  - `auth/` - Authentication including Twitter OAuth
  - `db/` - Database schemas and utilities
- `src/hooks/` - Custom React hooks
- `scripts/` - Build and utility scripts

### Database Schema (Drizzle + PostgreSQL)
- **UserSchema**: User accounts with preferences (theme, settings)
- **SessionSchema**: Authentication sessions with device tracking
- **AccountSchema**: OAuth provider accounts
- **VerificationSchema**: Email verification tokens
- **TwitterAccountSchema**: Connected Twitter/X accounts with OAuth tokens
- **TweetSchema**: Tweet management (drafts, scheduled, posted) with analytics
- **TweetThreadSchema**: Thread management for multi-tweet sequences
- **ApiKeySchema**: API keys for MCP authentication

### Authentication Flow (Better Auth)
- Email/password authentication with 7-day sessions
- Google OAuth with automatic account linking
- Twitter OAuth 2.0 for connecting Twitter/X accounts
- Multi-account Twitter management per user
- Protected route groups for premium features
- User preferences stored in database JSON column

### Payment Integration (Polar.sh)
- One-time payments for lifetime access
- Automatic customer creation and linking
- Environment variables: `POLAR_ACCESS_TOKEN`, `POLAR_LIFETIME_PRODUCT_ID`

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
- **TwitterAccountSchema**: Connected Twitter accounts with OAuth tokens and profile data
- **TweetSchema**: Comprehensive tweet management with status tracking (draft, scheduled, posted, failed)
- **TweetThreadSchema**: Thread management for multi-tweet sequences
- **ApiKeySchema**: API keys for MCP authentication

### API Endpoints
- `GET/POST /api/twitter/accounts` - Manage connected Twitter accounts
- `POST /api/twitter/post` - Post tweets immediately
- `POST/DELETE /api/twitter/schedule` - Schedule and cancel tweets
- `POST /api/auth/twitter/connect` - Initiate Twitter OAuth connection
- `POST /api/mcp` - Claude MCP server for AI-powered features
- `POST /api/webhooks/qstash/tweet` - QStash webhook for scheduled tweets

### Components Structure
- **ConnectedAccounts** (`src/components/twitter/connected-accounts.tsx`):
  - Multi-account display with profile information
  - Connect/disconnect functionality
  - Real-time account status
- **TweetComposer** (`src/components/twitter/tweet-composer.tsx`):
  - Rich text composer with character counting
  - Hashtag and mention extraction
  - Schedule functionality with date/time picker
  - Draft saving capabilities
- **AppSidebar** (`src/components/layouts/app-sidebar.tsx`):
  - Navigation with API Keys page integration
  - Theme-aware Twitter branding

### Twitter API Integration
- **TwitterClient** (`src/lib/twitter/client.ts`):
  - OAuth 2.0 and OAuth 1.0a support
  - Tweet posting with media upload
  - Thread creation and management
  - User profile and analytics access
- **TwitterAuth** (`src/lib/twitter/auth.ts`):
  - OAuth flow management
  - Token storage and refresh
  - Multi-account session handling

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

## New Files Created During Transformation

### Core Twitter Integration
- **`src/lib/twitter/client.ts`** - Comprehensive Twitter API client with OAuth 2.0/1.0a support
- **`src/lib/twitter/auth.ts`** - Twitter OAuth flow management and token handling
- **`src/lib/twitter/types.ts`** - TypeScript types for Twitter API responses

### Upstash Integration
- **`src/lib/upstash/redis.ts`** - Redis caching utilities for Twitter data and rate limiting
- **`src/lib/upstash/qstash.ts`** - QStash scheduling for tweet automation and webhooks

### UI Components
- **`src/components/twitter/connected-accounts.tsx`** - Multi-account Twitter management component
- **`src/components/twitter/tweet-composer.tsx`** - Full-featured tweet composer with scheduling

### API Routes
- **`src/app/api/twitter/accounts/route.ts`** - Twitter account management endpoints
- **`src/app/api/twitter/post/route.ts`** - Immediate tweet posting
- **`src/app/api/twitter/schedule/route.ts`** - Tweet scheduling and cancellation
- **`src/app/api/auth/twitter/connect/route.ts`** - Twitter OAuth connection initiation
- **`src/app/api/auth/twitter/callback/route.ts`** - Twitter OAuth callback handling
- **`src/app/api/webhooks/qstash/tweet/route.ts`** - QStash webhook for scheduled tweets

### Database Repositories
- **`src/lib/db/repositories/twitter-accounts.ts`** - Twitter account data operations
- **`src/lib/db/repositories/tweets.ts`** - Tweet CRUD operations and queries

### WebSocket Integration
- **`src/lib/websocket/server.ts`** - Real-time broadcasting for tweet updates
- **`src/lib/websocket/client.ts`** - Client-side WebSocket management

### Additional Files
- **`.env.example`** - Updated with all Twitter API, Upstash, and MCP environment variables
- **`src/app/(psec)/api-keys/page.tsx`** - API keys management page for MCP integration

## Package Manager
- Uses pnpm as primary package manager
- `onlyBuiltDependencies` specified for Biome, Tailwind, and other native packages
- Node.js 18+ required