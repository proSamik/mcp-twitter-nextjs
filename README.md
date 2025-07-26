# MCP Twitter Manager - AI-Powered Twitter/X Management Platform

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/prosamik/mcp-twitter-nextjs&env=BETTER_AUTH_SECRET&env=BETTER_AUTH_URL&env=NEXT_PUBLIC_APP_URL&env=POSTGRES_URL&env=UPSTASH_REDIS_REST_URL&env=UPSTASH_REDIS_REST_TOKEN&env=QSTASH_URL&env=QSTASH_TOKEN&env=QSTASH_CURRENT_SIGNING_KEY&env=QSTASH_NEXT_SIGNING_KEY&env=POLAR_ACCESS_TOKEN&env=NEXT_PUBLIC_POLAR_MONTHLY_PRODUCT_ID&env=NEXT_PUBLIC_POLAR_YEARLY_PRODUCT_ID&env=GOOGLE_CLIENT_ID&env=GOOGLE_CLIENT_SECRET&env=DISABLE_SIGN_UP&env=NO_HTTPS&env=PLUNK_SECRET_KEY&env=MCP_SERVER_NAME&env=MCP_SERVER_VERSION&env=R2_ACCOUNT_ID&env=R2_ACCESS_KEY_ID&env=R2_SECRET_ACCESS_KEY&env=R2_BUCKET_NAME&env=R2_PUBLIC_URL&envDescription=Learn+more+about+how+to+get+the+API+Keys+for+the+application&envLink=https://github.com/prosamik/mcp-twitter-nextjs/blob/main/.env.example&demo-title=MCP+Twitter+Manager&demo-description=AI-powered+Twitter/X+management+platform+with+Claude+MCP+integration.&products=[{"type":"integration","protocol":"storage","productSlug":"neon","integrationSlug":"neon"}])

[![GitHub Sponsors](https://img.shields.io/github/sponsors/prosamik?style=for-the-badge&logo=github&logoColor=white&labelColor=black&color=pink)](https://github.com/sponsors/prosamik)

# The Ultimate MCP SaaS Starter Kit which works for normal SaaS also

**The ultimate AI-powered Twitter/X management platform with Claude MCP integration, OAuth 2.0 authentication, and comprehensive social media automation.**

## 🚀 What Makes This Special

- **🤖 Claude MCP Integration** - First-class support for Claude Code with OAuth 2.0 authentication
- **🐦 Multi-Account Twitter Management** - Connect and manage multiple Twitter/X accounts seamlessly
- **⚡ Real-time Scheduling** - Reliable tweet scheduling with Upstash QStash and retry logic
- **🔐 Enterprise Authentication** - OAuth 2.0 MCP server with PKCE, Better Auth, and API key management
- **📊 Analytics Dashboard** - Track performance, engagement, and optimize your social media strategy
- **🎨 20+ Premium Themes** - Beautiful, customizable interface with dark mode support
- **💳 Integrated Payments** - Polar.sh integration for seamless subscription management

## ✨ Core Features

### 🤖 Claude MCP Integration
- **OAuth 2.0 Authentication** - Secure integration with Claude using industry-standard OAuth
- **MCP Server** - Full Model Context Protocol implementation with Twitter management tools
- **AI-Powered Content** - Generate, optimize, and schedule tweets with Claude's assistance
- **Real-time Synchronization** - WebSocket support for live updates across all clients
- **Vercel MCP Adapter** - Seamless integration with Vercel's MCP ecosystem

### 🐦 Advanced Twitter Management
- **User OAuth Credentials** - Users provide their own Twitter Developer credentials for enhanced security
- **Multi-Account Support** - Connect and manage multiple Twitter/X accounts from one dashboard
- **Smart Composer** - Character counting, hashtag extraction, and mention suggestions
- **Thread Creation** - Build and schedule complex tweet threads with ease
- **Bulk Operations** - Schedule hundreds of tweets with batch processing
- **Analytics Integration** - Track impressions, engagement, and performance metrics
- **Media Upload** - Support for images, videos, and GIFs with Cloudflare R2 storage
- **Tweet Embedding** - Rich tweet previews and embedded content

### ⏰ Intelligent Scheduling
- **Timezone-Aware Posting** - Schedule tweets for optimal engagement across time zones
- **Retry Logic** - Automatic retry for failed posts with exponential backoff
- **Queue Management** - Visual queue management with drag-and-drop reordering
- **Performance Optimization** - AI-suggested optimal posting times
- **Calendar Integration** - Visual calendar interface for tweet scheduling

### 🔐 Enterprise Security
- **OAuth 2.0 MCP Server** - Industry-standard authentication for Claude
- **User OAuth Credentials** - Encrypted storage of user-provided Twitter credentials
- **API Key Management** - Secure API keys with scoped permissions and rotation
- **Rate Limiting** - Intelligent rate limiting to respect Twitter API limits
- **Session Management** - Secure 7-day sessions with automatic refresh
- **Credential Encryption** - AES-256-CBC encryption for Twitter client secrets
- **Subscription Validation** - Secure payment verification and access control

### 🌐 Internationalization
- **Multi-Language Support** - Built-in support for English, French, Spanish, Chinese, Hindi, Japanese, Korean
- **Locale Management** - Automatic language detection and switching
- **Translation System** - Comprehensive translation files and utilities

### 🎨 Rich User Experience
- **20+ Premium Themes** - Beautiful, customizable interface with dark mode support
- **Advanced UI Components** - Rich text editor, image cropping, drag-and-drop interfaces
- **Real-time Updates** - Live notifications and status updates
- **Responsive Design** - Mobile-first approach with touch-friendly interfaces
- **Accessibility** - WCAG compliant components and keyboard navigation

## 🏗️ Tech Stack

### Frontend & Framework
- **Next.js 15** - React framework with App Router and Turbopack
- **TypeScript** - Full type safety with strict mode
- **Tailwind CSS 4** - Latest utility-first CSS framework
- **shadcn/ui** - Modern, accessible component library
- **Biome** - Fast linting and formatting
- **Framer Motion** - Smooth animations and transitions
- **React Hook Form** - Performant form handling

### Backend & API
- **Twitter API v2** - Complete Twitter/X integration with node-twitter-api-v2
- **Better Auth** - Modern authentication with OAuth providers
- **MCP Server** - Model Context Protocol implementation
- **PostgreSQL** - Robust relational database
- **Drizzle ORM** - Type-safe database operations

### Infrastructure & Services
- **Upstash Redis** - High-performance caching and session storage
- **Upstash QStash** - Reliable message queuing for tweet scheduling
- **Cloudflare R2** - Object storage for media uploads
- **Polar.sh** - Modern payment processing
- **Vercel** - Seamless deployment and hosting
- **Socket.io** - Real-time WebSocket communication

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
git clone https://github.com/prosamik/mcp-twitter-nextjs.git
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
# Secret for Better Auth (generate with: npx @better-auth/cli@latest secret)
BETTER_AUTH_SECRET=your-super-secret-key-here-make-it-long-and-random-32-chars-min
# URL for Better Auth (the URL you access the app from)
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### 🗄️ Database (Required)
```env
# Local development
POSTGRES_URL=postgres://postgres:password@localhost:5432/mcp_twitter

# Production (NeonDB recommended)
POSTGRES_URL=postgresql://username:password@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

#### 🐦 Twitter Integration (User-Provided)
Users now provide their own Twitter OAuth credentials through the OAuth Setup page instead of environment variables.
No Twitter environment variables are required - users bring their own developer credentials for enhanced security.

#### ⏰ Upstash Services (Required)
```env
# Redis for caching
UPSTASH_REDIS_REST_URL=https://your-redis-endpoint.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_rest_token_here

# QStash for tweet scheduling
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=your_qstash_token_here
QSTASH_CURRENT_SIGNING_KEY=your_qstash_signing_key_here
QSTASH_NEXT_SIGNING_KEY=your_qstash_next_signing_key_here
```

#### 💳 Payments (Required)
```env
# Get these from https://polar.sh
POLAR_ACCESS_TOKEN=polar_at_your_access_token_here
NEXT_PUBLIC_POLAR_MONTHLY_PRODUCT_ID=your_monthly_product_id
NEXT_PUBLIC_POLAR_YEARLY_PRODUCT_ID=your_yearly_product_id
```

#### 🌐 OAuth Providers (Optional)
```env
# Google OAuth (optional but recommended)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

#### ☁️ Cloudflare R2 Storage (Required for media uploads)
```env
# Get these from Cloudflare R2 dashboard
R2_ACCOUNT_ID=your_cloudflare_account_id_here
R2_ACCESS_KEY_ID=your_r2_access_key_id_here
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key_here
R2_BUCKET_NAME=your_r2_bucket_name_here
# Optional: Custom domain for R2 bucket
R2_PUBLIC_URL=https://your-custom-domain.com
```

#### ⚙️ Optional Settings
```env
# Disable user registration (default: false)
DISABLE_SIGN_UP=false

# Allow non-HTTPS cookies for local development
NO_HTTPS=true

# Email service (optional)
PLUNK_SECRET_KEY=your_plunk_api_key_here

# MCP Server Configuration (optional)
MCP_SERVER_NAME=twitter-mcp-server
MCP_SERVER_VERSION=1.0.0
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

The MCP server supports OAuth 2.0 with PKCE for secure Claude integration:

#### 1. Client Registration

```bash
claude mcp add --transport http twitter-server http://localhost:3000/api/mcp
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


#### 2. Use with any MCP Client

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
   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/prosamik/mcp-twitter-nextjs)

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
│   │   ├── 📁 layouts/        # Layout components
│   │   ├── 📁 landing/        # Landing page components
│   │   └── 📁 magicui/        # Magic UI components
│   ├── 📁 lib/                # Core libraries
│   │   ├── 📁 auth/           # Authentication + OAuth credentials
│   │   ├── 📁 db/             # Database operations + repositories
│   │   ├── 📁 twitter/        # Twitter API with user credentials
│   │   ├── 📁 upstash/        # Redis & QStash
│   │   ├── 📁 polar/          # Payment integration
│   │   ├── 📁 r2/             # Cloudflare R2 storage
│   │   ├── 📁 security/       # Security & validation
│   │   ├── 📁 websocket/      # Real-time communication
│   │   ├── 📁 planner/        # Content planning tools
│   │   ├── 📁 plunk/          # Email service
│   │   └── 📁 cache/          # Caching utilities
│   ├── 📁 hooks/              # Custom React hooks
│   ├── 📁 i18n/               # Internationalization
│   └── 📁 types/              # TypeScript types
├── 📁 scripts/                # Build scripts
├── 📁 docker/                 # Docker config
├── 📁 messages/               # Translation files
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
GET  /api/twitter/usage           # Usage tracking
GET  /api/auth/twitter/callback   # OAuth callback with error handling
```

### Media Management
```
POST /api/media/upload            # Upload media files
GET  /api/media/[key]             # Serve media files
DELETE /api/media/delete          # Delete media files
```

### Community Management
```
GET  /api/communities             # List communities
GET  /api/communities/[id]        # Get community details
POST /api/communities             # Create community
PUT  /api/communities/[id]        # Update community
DELETE /api/communities/[id]      # Delete community
```

### Webhooks & Integrations
```
POST /api/webhooks/qstash/tweet   # QStash webhook for scheduled tweets
POST /api/polar-fallback/portal   # Polar payment portal fallback
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
- **Issues**: [GitHub Issues](https://github.com/prosamik/mcp-twitter-nextjs/issues)
- **Discussions**: [GitHub Discussions](https://github.com/prosamik/mcp-twitter-nextjs/discussions)
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