# MCP Twitter Manager - AI-Powered Twitter/X Management Platform

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/mcp-twitter-nextjs&env=BETTER_AUTH_SECRET&env=POLAR_ACCESS_TOKEN&env=UPSTASH_REDIS_REST_URL&env=UPSTASH_REDIS_REST_TOKEN&env=UPSTASH_QSTASH_URL&env=UPSTASH_QSTASH_TOKEN&envDescription=Learn+more+about+how+to+get+the+API+Keys+for+the+application&envLink=https://github.com/your-username/mcp-twitter-nextjs/blob/main/.env.example&demo-title=MCP+Twitter+Manager&demo-description=AI-powered+Twitter/X+management+platform+with+Claude+MCP+integration.&products=[{"type":"integration","protocol":"storage","productSlug":"neon","integrationSlug":"neon"}])

[![GitHub Sponsors](https://img.shields.io/github/sponsors/prosamik?style=for-the-badge&logo=github&logoColor=white&labelColor=black&color=pink)](https://github.com/sponsors/prosamik)

**The ultimate AI-powered Twitter/X management platform with Claude MCP integration, OAuth 2.0 authentication, and comprehensive social media automation.**

## 🚀 What Makes This Special

- **🤖 Claude MCP Integration** - First-class support for Claude Desktop with OAuth 2.0 authentication
- **🐦 Multi-Account Twitter Management** - Connect and manage multiple Twitter/X accounts seamlessly
- **⚡ Real-time Scheduling** - Reliable tweet scheduling with Upstash QStash and retry logic
- **🔐 Enterprise Authentication** - OAuth 2.0 MCP server with PKCE, Better Auth, and API key management
- **📊 Analytics Dashboard** - Track performance, engagement, and optimize your social media strategy
- **🎨 20+ Premium Themes** - Beautiful, customizable interface with dark mode support
- **💳 Integrated Payments** - Polar.sh integration for seamless subscription management

## ✨ Core Features

### 🤖 Claude MCP Integration
- **OAuth 2.0 Authentication** - Secure integration with Claude Desktop using industry-standard OAuth
- **MCP Server** - Full Model Context Protocol implementation with Twitter management tools
- **AI-Powered Content** - Generate, optimize, and schedule tweets with Claude's assistance
- **Real-time Synchronization** - WebSocket support for live updates across all clients

### 🐦 Advanced Twitter Management
- **User OAuth Credentials** - Users provide their own Twitter Developer credentials for enhanced security
- **Multi-Account Support** - Connect and manage multiple Twitter/X accounts from one dashboard
- **Smart Composer** - Character counting, hashtag extraction, and mention suggestions
- **Thread Creation** - Build and schedule complex tweet threads with ease
- **Bulk Operations** - Schedule hundreds of tweets with batch processing
- **Analytics Integration** - Track impressions, engagement, and performance metrics

### ⏰ Intelligent Scheduling
- **Timezone-Aware Posting** - Schedule tweets for optimal engagement across time zones
- **Retry Logic** - Automatic retry for failed posts with exponential backoff
- **Queue Management** - Visual queue management with drag-and-drop reordering
- **Performance Optimization** - AI-suggested optimal posting times

### 🔐 Enterprise Security
- **OAuth 2.0 MCP Server** - Industry-standard authentication for Claude Desktop
- **User OAuth Credentials** - Encrypted storage of user-provided Twitter credentials
- **API Key Management** - Secure API keys with scoped permissions and rotation
- **Rate Limiting** - Intelligent rate limiting to respect Twitter API limits
- **Session Management** - Secure 7-day sessions with automatic refresh
- **Credential Encryption** - AES-256-CBC encryption for Twitter client secrets

## 🏗️ Tech Stack

### Frontend & Framework
- **Next.js 15** - React framework with App Router and Turbopack
- **TypeScript** - Full type safety with strict mode
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern, accessible component library
- **Biome** - Fast linting and formatting

### Backend & API
- **Twitter API v2** - Complete Twitter/X integration with node-twitter-api-v2
- **Better Auth** - Modern authentication with OAuth providers
- **MCP Server** - Model Context Protocol implementation
- **PostgreSQL** - Robust relational database
- **Drizzle ORM** - Type-safe database operations

### Infrastructure & Services
- **Upstash Redis** - High-performance caching and session storage
- **Upstash QStash** - Reliable message queuing for tweet scheduling
- **Polar.sh** - Modern payment processing
- **Vercel** - Seamless deployment and hosting

## 🚀 Quick Start

### Prerequisites

```bash
# Install pnpm (recommended)
npm install -g pnpm

# Verify Node.js version (18+ required)
node --version
```

### 1. Clone and Install

```bash
git clone https://github.com/your-username/mcp-twitter-nextjs.git
cd mcp-twitter-nextjs
pnpm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Or use the built-in script
pnpm initial:env
```

### 3. Configure Environment Variables

#### 🔐 Authentication (Required)
```env
BETTER_AUTH_SECRET=your-super-secret-key-here-32-characters-min
BETTER_AUTH_URL=http://localhost:3000  # Update for production
```

#### 💳 Payments (Required)
```env
POLAR_ACCESS_TOKEN=polar_at_xxxxxxxxxxxxx
POLAR_LIFETIME_PRODUCT_ID=prod_xxxxxxxxxxxxx
```

#### 🗄️ Database (Required)
```env
# Local development
POSTGRES_URL=postgres://postgres:password@localhost:5432/mcp_twitter

# Production (NeonDB recommended)
POSTGRES_URL=postgresql://username:password@your-db.neon.tech/db?sslmode=require
```

#### 🐦 Twitter Integration (User-Provided)
Users now provide their own Twitter OAuth credentials through the OAuth Setup page instead of environment variables.
No Twitter environment variables are required - users bring their own developer credentials for enhanced security.

#### ⏰ Upstash Services (Required)
```env
UPSTASH_REDIS_REST_URL=https://your-redis-endpoint.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
UPSTASH_QSTASH_URL=https://qstash.upstash.io
UPSTASH_QSTASH_TOKEN=your-qstash-token
```

#### 🌐 OAuth Providers (Optional)
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 4. Database Setup

#### Local Development (Docker)
```bash
# Start PostgreSQL
pnpm docker:pg

# Run migrations
pnpm db:migrate

# Open database studio
pnpm db:studio
```

#### Production (NeonDB)
```bash
# Sign up at neon.tech
# Create project and copy connection string
# Update POSTGRES_URL in .env

# Run migrations
pnpm db:migrate
```

### 5. Start Development

```bash
# Start development server
pnpm dev

# Or with Turbopack for faster builds
pnpm dev:turbo

# Open http://localhost:3000
```

## 🐦 Twitter OAuth Setup

### User-Provided Credentials
This platform uses user-provided OAuth credentials instead of environment variables for enhanced security and user control.

### Setup Process

#### 1. Access OAuth Setup
- Navigate to Settings → OAuth Setup in the application
- Or visit `/oauth-user-setup` directly

#### 2. Create Twitter Developer Account
- Visit [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
- Create a developer account if you don't have one

#### 3. Create Twitter App
- Click "Create App" in the Developer Portal
- Fill out required information about your application

#### 4. Configure OAuth 2.0
- In your app settings, enable OAuth 2.0
- Set the redirect URI to: `http://localhost:3000/api/auth/twitter/callback` (or your domain)
- Copy your Client ID and Client Secret

#### 5. Save Credentials
- Enter your Client ID and Client Secret in the OAuth Setup page
- Credentials are automatically encrypted and stored securely
- The system automatically tests your credentials by initiating a Twitter connection

### Features
- **Encrypted Storage**: Client secrets encrypted using AES-256-CBC
- **Automatic Testing**: Credentials verified through actual OAuth flows
- **Error Handling**: Clear error messages with actionable guidance
- **Account Isolation**: Each user's Twitter accounts linked to their OAuth credentials

## 🔐 MCP Integration Guide

### OAuth 2.0 Setup (Recommended)

The MCP server supports OAuth 2.0 with PKCE for secure Claude Desktop integration:

#### 1. Client Registration

```bash
curl -X POST http://localhost:3000/api/auth/mcp/register \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "Claude Desktop",
    "redirect_uris": ["http://localhost:3000/oauth/callback"]
  }'
```

#### 2. Claude Desktop Configuration

```json
{
  "mcpServers": {
    "twitter-manager": {
      "command": "npx",
      "args": ["@anthropic/mcp-client", "http://localhost:3000/api/mcp"],
      "oauth": {
        "authorization_endpoint": "http://localhost:3000/api/auth/mcp/authorize",
        "token_endpoint": "http://localhost:3000/api/auth/mcp/token",
        "client_id": "your_registered_client_id",
        "redirect_uri": "http://localhost:3000/oauth/callback",
        "scopes": ["openid", "profile", "email"]
      }
    }
  }
}
```

#### 3. OAuth Endpoints

| Endpoint | Description |
|----------|-------------|
| `/.well-known/oauth-authorization-server` | OAuth server metadata |
| `/.well-known/oauth-protected-resource` | Resource server info |
| `/api/auth/mcp/register` | Client registration |
| `/api/auth/mcp/authorize` | Authorization endpoint |
| `/api/auth/mcp/token` | Token endpoint |
| `/api/auth/mcp/userinfo` | User information |
| `/api/auth/mcp/jwks` | JSON Web Key Set |

#### 4. Supported Scopes

- `openid` - OpenID Connect authentication
- `profile` - User profile information
- `email` - User email address
- `offline_access` - token refresh


#### 2. Use with MCP Client

```json
{
  "mcpServers": {
    "twitter-manager": {
      "url": "http://localhost:3000/api/mcp"
    }
  }
}
```


## 🎨 Theme System

Choose from 20+ beautiful themes:

### Base Themes
- **Default** - Clean and modern
- **Zinc** - Professional gray tones
- **Slate** - Cool blue-gray
- **Stone** - Warm neutrals
- **Blue** - Vibrant blue accents
- **Orange** - Energetic highlights
- **Pink** - Soft aesthetics

### Special Themes
- **Cyberpunk Neon** - Electric blues and magentas
- **Tropical Paradise** - Ocean blues and sunset orange
- **Retro Arcade** - 80s gaming nostalgia
- **Zen Garden** - Natural greens and earth tones
- **Space Odyssey** - Deep space blues
- **Steampunk Cogs** - Industrial brass and copper

Access theme settings in the sidebar under Settings.

## 📊 Analytics & Insights

### Real-time Metrics
- **Engagement Rate** - Track likes, retweets, and replies
- **Impression Analytics** - Monitor reach and visibility
- **Follower Growth** - Track audience expansion
- **Optimal Timing** - AI-suggested posting times
- **Content Performance** - Identify top-performing content

### Dashboard Features
- **Performance Graphs** - Visual analytics with charts
- **Trend Analysis** - Identify patterns and opportunities
- **Competitor Insights** - Compare performance metrics
- **Export Reports** - Download detailed analytics

## 🌐 Deployment

### Vercel (Recommended)

1. **Deploy with one click:**
   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/mcp-twitter-nextjs)

2. **Configure environment variables** in Vercel dashboard

3. **Update domain settings:**
   ```env
   BETTER_AUTH_URL=https://your-domain.vercel.app
   ```

### Docker Deployment

```bash
# Build and run
pnpm docker-compose:up

# Or manual build
docker build -t mcp-twitter .
docker run -p 3000:3000 mcp-twitter
```

### Manual Deployment

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## 🛠️ Development Commands

### Core Development
```bash
pnpm dev              # Start development server
pnpm dev:turbo        # Start with Turbopack
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run linting
pnpm format           # Format code
pnpm check-types      # TypeScript checking
```

### Database Operations
```bash
pnpm db:generate      # Generate migrations
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open database studio
pnpm db:push          # Push schema changes
pnpm db:pull          # Pull schema from DB
pnpm db:reset         # Reset database (destructive)
```

### Testing & Quality
```bash
pnpm test             # Run tests
pnpm test:watch       # Watch mode testing
pnpm clean            # Clean build artifacts
pnpm prepare          # Setup pre-commit hooks
```

### Docker Operations
```bash
pnpm docker:pg        # Start PostgreSQL only
pnpm docker:app       # Start app only
pnpm docker-compose:up    # Full stack
pnpm docker-compose:down  # Stop services
pnpm docker-compose:logs  # View logs
```

## 📁 Project Structure

```
mcp-twitter-nextjs/
├── 📁 src/
│   ├── 📁 app/                 # Next.js App Router
│   │   ├── 📁 (auth)/         # Authentication pages
│   │   ├── 📁 (premium)/      # Protected features + OAuth setup
│   │   ├── 📁 (psec)/         # Secure routes
│   │   └── 📁 api/            # API endpoints + OAuth management
│   ├── 📁 components/         # React components
│   │   ├── 📁 ui/             # Reusable components
│   │   ├── 📁 twitter/        # Twitter components
│   │   └── 📁 layouts/        # Layout components
│   ├── 📁 lib/                # Core libraries
│   │   ├── 📁 auth/           # Authentication + OAuth credentials
│   │   ├── 📁 db/             # Database operations + repositories
│   │   ├── 📁 twitter/        # Twitter API with user credentials
│   │   └── 📁 upstash/        # Redis & QStash
│   ├── 📁 hooks/              # Custom hooks
│   └── 📁 types/              # TypeScript types
├── 📁 scripts/                # Build scripts
├── 📁 docker/                 # Docker config
├── .cursorrules               # Development rules
├── CLAUDE.md                  # Claude instructions
└── README.md                  # This file
```

## 🔧 API Reference

### Authentication Endpoints
```
POST /api/auth/sign-in         # Sign in
POST /api/auth/sign-up         # Sign up
POST /api/auth/sign-out        # Sign out
GET  /api/auth/session         # Get session
```

### OAuth Credentials Management
```
GET  /api/oauth/credentials       # Get user's OAuth credentials
POST /api/oauth/credentials       # Save encrypted OAuth credentials
DELETE /api/oauth/credentials     # Delete OAuth credentials
```

### Twitter Management
```
GET  /api/twitter/accounts        # List connected accounts
POST /api/twitter/accounts        # Connect account
GET  /api/twitter/tweets          # List tweets
POST /api/twitter/tweets          # Create tweet
PUT  /api/twitter/tweets/:id      # Update tweet
DELETE /api/twitter/tweets/:id    # Delete tweet
POST /api/twitter/schedule        # Schedule tweet
GET  /api/auth/twitter/callback   # OAuth callback with error handling
```

### MCP Server
```
POST /api/mcp                  # MCP JSON-RPC endpoint
GET  /.well-known/oauth-*      # OAuth discovery
POST /api/auth/mcp/*           # OAuth endpoints
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** following our coding standards
4. **Run tests and linting** (`pnpm test && pnpm lint`)
5. **Commit your changes** (`git commit -m 'Add amazing feature'`)
6. **Push to the branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

### Development Guidelines
- Follow TypeScript strict mode
- Use Biome for code formatting
- Write tests for new features
- Update documentation as needed
- Follow semantic commit messages

## 📧 Support & Community

- **Documentation**: Comprehensive guides in `/docs`
- **Issues**: [GitHub Issues](https://github.com/your-username/mcp-twitter-nextjs/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/mcp-twitter-nextjs/discussions)
- **Discord**: Join our [Discord community](https://discord.gg/your-server)

## 🔒 Security

- **Security Policy**: See [SECURITY.md](SECURITY.md)
- **Vulnerability Reports**: security@your-domain.com
- **Bug Bounty**: Available for critical security issues

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org) - The React framework for production
- [Better Auth](https://better-auth.com) - Modern authentication
- [Polar.sh](https://polar.sh) - Developer payments
- [Drizzle ORM](https://orm.drizzle.team) - TypeScript ORM
- [Upstash](https://upstash.com) - Redis and QStash services
- [Vercel](https://vercel.com) - Deployment platform

## 💖 Sponsor

If this project helps you build amazing applications, consider sponsoring:

[![GitHub Sponsors](https://img.shields.io/github/sponsors/prosamik?style=for-the-badge&logo=github&logoColor=white&labelColor=black&color=pink)](https://github.com/sponsors/prosamik)

Your support helps maintain and improve this project for everyone.

---

**Built with ❤️ by [prosamik](https://github.com/prosamik)**