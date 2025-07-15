# MCP Twitter Manager - AI-Powered Twitter/X Management Platform

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/mcp-twitter-nextjs&env=BETTER_AUTH_SECRET&env=POLAR_ACCESS_TOKEN&env=UPSTASH_REDIS_REST_URL&env=UPSTASH_REDIS_REST_TOKEN&env=UPSTASH_QSTASH_URL&env=UPSTASH_QSTASH_TOKEN&envDescription=Learn+more+about+how+to+get+the+API+Keys+for+the+application&envLink=https://github.com/your-username/mcp-twitter-nextjs/blob/main/.env.example&demo-title=MCP+Twitter+Manager&demo-description=AI-powered+Twitter/X+management+platform+with+Claude+MCP+integration.&products=[{"type":"integration","protocol":"storage","productSlug":"neon","integrationSlug":"neon"}])

[![GitHub Sponsors](https://img.shields.io/github/sponsors/prosamik?style=for-the-badge&logo=github&logoColor=white&labelColor=black&color=pink)](https://github.com/sponsors/prosamik)

**The ultimate AI-powered Twitter/X management platform with Claude MCP integration for automated content creation, scheduling, and analytics.**

🚀 **Built with the latest and greatest:**
- ⚡ **Next.js 15** - React framework with App Router
- 🐦 **Twitter API v2** - Full Twitter/X integration with node-twitter-api-v2
- 🤖 **Claude MCP Integration** - AI-powered content suggestions and automation
- ⏰ **Upstash Redis + QStash** - Smart scheduling and caching system
- 💳 **Polar.sh** - Modern payments for lifetime access plans
- 🔐 **Better Auth** - Authentication with Google OAuth and Twitter OAuth
- 🗄️ **PostgreSQL + Drizzle ORM** - Type-safe database operations
- 🎨 **20+ Theme Variants** - Beautiful theming system with dark mode

Perfect for content creators, social media managers, and anyone who wants to automate their Twitter/X presence with AI.

## ✨ Features

### 🐦 **Twitter/X Management**
- Connect multiple Twitter/X accounts with OAuth
- Create, edit, and manage tweet drafts
- Schedule tweets for optimal posting times
- Create and manage tweet threads
- Real-time analytics and engagement tracking
- Bulk operations for mass scheduling

### 🤖 **AI-Powered Features (Claude MCP)**
- AI-generated tweet content and suggestions
- Smart hashtag and mention recommendations
- Content optimization for engagement
- Automated thread creation from long-form content
- Performance analysis and improvement suggestions

### ⏰ **Smart Scheduling (Upstash)**
- Redis caching for fast data access
- QStash for reliable tweet scheduling
- Timezone-aware posting
- Queue management for high-volume posting
- Retry mechanisms for failed posts

### 🔐 **Authentication & User Management**
- Email/password authentication with Better Auth
- Google OAuth and Twitter OAuth providers
- Secure session management (7-day expiration)
- Multi-account Twitter management
- Protected route groups for premium features

### 💳 **Payments & Billing (Polar.sh)**
- One-time payments (lifetime deals)
- Automatic customer creation and linking
- Graceful error handling for payment failures
- Customer portal managed by Polar

### 🎨 **Premium UI & Theming**
- **20+ built-in themes**: Default, Cyberpunk Neon, Tropical Paradise, Zen Garden, etc.
- Responsive sidebar navigation with collapsible design
- Theme-aware components using CSS custom properties
- Dark/light mode support for all themes
- Mobile-first responsive design

### 📊 **Analytics & Insights**
- Tweet performance tracking
- Engagement metrics and trends
- Best posting time analysis
- Follower growth tracking
- Content performance insights

### 🛠️ **Developer Experience**
- TypeScript everywhere with strict mode
- Biome for fast linting and formatting
- Hot reload development server
- Docker support for easy deployment
- Comprehensive error handling

## 🚀 Quick Start

### Prerequisites

```bash
# Install pnpm (recommended package manager)
npm install -g pnpm

# Verify Node.js version (18+ required)
node --version
```

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/cgoinglove/nextjs-polar-starter-kit.git
cd nextjs-polar-starter-kit

# Install dependencies
pnpm install

# Run post-install setup
pnpm postinstall
```

### 2. Environment Setup

Create your environment file:

```bash
# Copy the example environment file
cp .env.example .env

# Or use the built-in script
pnpm initial:env
```

### 3. Configure Environment Variables

Open `.env` and configure the following:

#### 🔐 **Required - Authentication**
```env
# Generate a random secret key (32+ characters)
BETTER_AUTH_SECRET=your-super-secret-key-here-make-it-long-and-random

# Base URL for authentication callbacks
BETTER_AUTH_URL=http://localhost:3000  # Local development
# BETTER_AUTH_URL=https://yourdomain.com  # Production
```

#### 💳 **Required - Polar.sh Payments**
```env
# Get your Polar access token (see setup guide below)
POLAR_ACCESS_TOKEN=polar_at_xxxxxxxxxxxxx

# Product ID from your Polar dashboard
POLAR_LIFETIME_PRODUCT_ID=prod_xxxxxxxxxxxxx
```

#### 🗄️ **Required - Database**
```env
# Local development (using Docker)
POSTGRES_URL=postgres://postgres:password@localhost:5432/polar_saas

# NeonDB (Recommended for production)
# POSTGRES_URL=postgresql://username:password@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require

# Or use other cloud providers (Supabase, Railway, etc.)
# POSTGRES_URL=postgresql://username:password@your-db-host:5432/database
```

#### 🔗 **Required - OAuth Providers**
```env
# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Twitter/X OAuth (required for Twitter functionality)
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
```

#### ⏰ **Required - Upstash (Redis & QStash)**
```env
# Upstash Redis for caching and session storage
UPSTASH_REDIS_REST_URL=https://your-redis-endpoint.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Upstash QStash for reliable tweet scheduling
UPSTASH_QSTASH_URL=https://qstash.upstash.io
UPSTASH_QSTASH_TOKEN=your-qstash-token
```

#### ⚙️ **Optional - Additional Settings**
```env
# Disable user registration (default: false)
DISABLE_SIGN_UP=false

# Allow non-HTTPS cookies for local development
NO_HTTPS=true
```

### 4. Database Setup

#### Option A: Local PostgreSQL with Docker (Recommended)

```bash
# Start PostgreSQL container
pnpm docker:pg

# Run database migrations
pnpm db:migrate

# (Optional) Open Drizzle Studio to view/edit data
pnpm db:studio
```

#### Option B: NeonDB (Recommended for Production)

NeonDB is a serverless PostgreSQL database perfect for modern applications:

1. **Quick Setup:**
   ```bash
   # Follow the detailed NeonDB setup guide
   cat NEON_SETUP.md
   ```

2. **Get your NeonDB connection string** and add it to `.env`:
   ```env
   POSTGRES_URL=postgresql://username:password@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

3. **Run migrations:**
   ```bash
   pnpm db:migrate
   ```

#### Option C: Other Cloud Database Providers

- [Supabase](https://supabase.com)
- [Railway](https://railway.app)
- [PlanetScale](https://planetscale.com)

Follow the same process as NeonDB but without the SSL requirement.

### 5. Polar.sh Setup (Payment Provider)

#### Step 1: Create Polar Account
1. Visit [polar.sh](https://polar.sh) and sign up
2. Complete your organization setup
3. Verify your account

#### Step 2: Get Access Token
1. Go to **Settings** → **API Keys** in your Polar dashboard
2. Click **Create new token**
3. Name it "SaaS Kit Development"
4. Copy the token (starts with `polar_at_`)
5. Add it to your `.env` file:
   ```env
   POLAR_ACCESS_TOKEN=polar_at_xxxxxxxxxxxxx
   ```

#### Step 3: Create Products
1. Go to **Products** in your Polar dashboard
2. Create one product:

   **Lifetime Deal:**
   - Name: "Lifetime Access"
   - Type: One-time
   - Price: $299
   - Copy the Product ID to `POLAR_LIFETIME_PRODUCT_ID`

### 6. Twitter/X Developer Setup

#### Step 1: Create Twitter Developer Account
1. Visit [developer.twitter.com](https://developer.twitter.com) and apply for access
2. Create a new project and app
3. Enable OAuth 2.0 with PKCE
4. Set your callback URL to: `https://yourdomain.com/api/auth/callback/twitter`

#### Step 2: Get Twitter API Keys
1. Go to your Twitter app dashboard
2. Navigate to **Keys and Tokens**
3. Copy your **Client ID** and **Client Secret**
4. Add them to your `.env` file:
   ```env
   TWITTER_CLIENT_ID=your_twitter_client_id
   TWITTER_CLIENT_SECRET=your_twitter_client_secret
   ```

### 7. Upstash Setup (Redis & QStash)

Upstash provides Redis for caching and QStash for reliable tweet scheduling. Both are essential for the Twitter management features.

#### Step 1: Create Upstash Account
1. Visit [upstash.com](https://upstash.com) and sign up
2. Verify your email and complete setup

#### Step 2: Create Redis Database
1. Go to your Upstash console
2. Click **Create Database**
3. Choose:
   - **Name**: `twitter-manager-cache`
   - **Type**: Regional (or Global for worldwide access)
   - **Region**: Choose closest to your users
4. Click **Create**
5. Copy the **REST URL** and **REST Token** from the database details
6. Add them to your `.env` file:
   ```env
   UPSTASH_REDIS_REST_URL=https://your-redis-endpoint.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-redis-token
   ```

#### Step 3: Set Up QStash for Tweet Scheduling
1. In your Upstash console, go to **QStash**
2. Enable QStash if not already enabled
3. Copy your **QStash URL** and **QStash Token**
4. Add them to your `.env` file:
   ```env
   UPSTASH_QSTASH_URL=https://qstash.upstash.io
   UPSTASH_QSTASH_TOKEN=your-qstash-token
   ```

#### Step 4: Configure Webhook Endpoint (Important!)
1. In QStash settings, add your webhook endpoint:
   ```
   https://yourdomain.com/api/webhooks/qstash
   ```
2. This endpoint will handle scheduled tweet posting
3. For local development, use ngrok or similar to expose your local server

#### Upstash Benefits for Twitter Management:
- **Redis**: Ultra-fast caching for user sessions, tweet drafts, and analytics
- **QStash**: Reliable tweet scheduling with automatic retries
- **Global Edge**: Reduced latency for worldwide users
- **Serverless**: Pay-per-use pricing, perfect for growing applications

### 8. Start Development

Common commands:
```bash
# Start the development server
pnpm dev

# Open your browser
# http://localhost:3000
```

## 🏗️ Project Structure

```
polar-saaskit/
├── 📁 src/
│   ├── 📁 app/                     # Next.js App Router
│   │   ├── 📁 (auth)/             # Public authentication pages
│   │   │   ├── sign-in/           # Sign in page
│   │   │   └── sign-up/           # Sign up page  
│   │   ├── 📁 (premium)/          # Protected premium features
│   │   │   ├── app/               # Main app interface
│   │   │   │   └── page.tsx       # Dashboard with sidebar
│   │   │   └── layout.tsx         # Premium layout
│   │   ├── 📁 api/                # API routes
│   │   │   └── auth/              # Better Auth endpoints
│   │   ├── pricing/               # Landing page pricing
│   │   ├── page.tsx               # Landing page
│   │   └── layout.tsx             # Root layout
│   ├── 📁 components/             # React components
│   │   ├── 📁 ui/                 # Reusable UI components
│   │   ├── 📁 layouts/            # Layout components
│   │   ├── 📁 landing/            # Landing page sections
│   │   ├── dashboard.tsx          # Dashboard with stats
│   │   ├── profile.tsx            # User profile
│   │   └── settings.tsx           # Settings with themes
│   ├── 📁 lib/                    # Core libraries
│   │   ├── 📁 auth/               # Authentication config
│   │   ├── 📁 db/                 # Database & migrations
│   │   ├── utils.ts               # Utility functions
│   │   └── const.ts               # App constants
│   └── 📁 types/                  # TypeScript definitions
├── 📁 messages/                   # Internationalization
├── 📁 public/                     # Static assets
├── 📁 docker/                     # Docker configuration
└── 📁 scripts/                    # Build scripts
```

## 🎨 Theme System

This starter includes **20+ beautiful themes** with full dark mode support:

### Base Themes
- **Default** - Clean and modern
- **Zinc** - Subtle and professional  
- **Slate** - Cool blue-gray tones
- **Stone** - Warm neutral palette
- **Gray** - Classic grayscale
- **Blue** - Vibrant blue accents
- **Orange** - Energetic orange highlights
- **Pink** - Soft pink aesthetics

### Special Themes
- **Bubblegum Pop** - Playful pink and purple
- **Cyberpunk Neon** - Electric blues and magentas
- **Retro Arcade** - 80s gaming nostalgia
- **Tropical Paradise** - Ocean blues and sunset orange
- **Steampunk Cogs** - Industrial brass and copper
- **Neon Synthwave** - Retro-futuristic neon
- **Pastel Kawaii** - Soft pastel cuteness
- **Space Odyssey** - Deep space blues and stars
- **Vintage Vinyl** - Classic record warmth
- **Misty Harbor** - Foggy blues and grays
- **Zen Garden** - Natural greens and earth tones

Users can switch themes instantly via the Settings page in the sidebar.

## 🌐 Deployment

### Vercel Deployment (Recommended)

1. **Deploy to Vercel:**
   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/cgoinglove/nextjs-polar-starter-kit)

2. **Configure Environment Variables:**
   - Add all required environment variables from your `.env` file
   - Update `BETTER_AUTH_URL` to your Vercel domain
   - Use a production database (Neon recommended)

3. **Database Setup for Production:**
   ```bash
   # Option 1: Use Neon (Recommended)
   # 1. Sign up at neon.tech
   # 2. Create a new project
   # 3. Copy connection string to POSTGRES_URL
   
   # Option 2: Use Vercel Postgres
   # 1. Go to Vercel Dashboard → Storage → Create Database
   # 2. Choose PostgreSQL
   # 3. Environment variables are auto-added
   ```

4. **Run Production Migrations:**
   ```bash
   # Connect to your production database
   pnpm db:migrate
   ```

### Docker Deployment

```bash
# Build and start with Docker Compose
pnpm docker-compose:up

# Or build manually
docker build -t polar-saas-kit .
docker run -p 3000:3000 polar-saas-kit
```

### Manual Deployment

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## 🛠️ Development Commands

### Core Commands
```bash
pnpm dev                  # Start development server
pnpm build               # Build for production  
pnpm start               # Start production server
pnpm lint                # Run Biome linter
pnpm format              # Format code
```

### Database Commands
```bash
pnpm db:generate         # Generate new migrations
pnpm db:migrate          # Run pending migrations
pnpm db:studio           # Open Drizzle Studio
pnpm db:push            # Push schema changes (dev only)
```

### Docker Commands
```bash
pnpm docker:pg           # Start PostgreSQL only
pnpm docker:app          # Start app only
pnpm docker-compose:up   # Start full stack
pnpm docker-compose:down # Stop all services
```

### Utility Commands
```bash
pnpm initial:env         # Generate .env from .env.example
pnpm postinstall         # Post-installation setup
pnpm clean               # Clean build artifacts
```

## 🏛️ Architecture

### Authentication Flow
1. **User signs up/in** → Better Auth handles authentication
2. **Polar customer created** → Automatic customer linking
3. **Session established** → 7-day session with refresh
4. **Route protection** → Access to premium features

### Payment Flow
1. **User selects plan** → Redirected to Polar checkout
2. **Payment processed** → Polar handles payment securely
3. **Webhook received** → Subscription status updated
4. **Access granted** → Premium features unlocked

### Database Schema
- **User table** - User accounts and preferences
- **Session table** - Authentication sessions
- **Account table** - OAuth provider accounts
- **Verification table** - Email verification codes

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style (Biome formatting)
- Add TypeScript types for all new code
- Write JSDoc comments for functions
- Test authentication flows thoroughly
- Use theme-aware CSS custom properties

## 📧 Support

- **Documentation**: Check the [cursor rules](.cursorrules) for detailed development guidelines
- **Issues**: [GitHub Issues](https://github.com/cgoinglove/nextjs-polar-starter-kit/issues)
- **Discussions**: [GitHub Discussions](https://github.com/cgoinglove/nextjs-polar-starter-kit/discussions)

## 💖 Sponsor

If this starter kit helps you build amazing SaaS applications, consider sponsoring the development:

[![GitHub Sponsors](https://img.shields.io/github/sponsors/prosamik?style=for-the-badge&logo=github&logoColor=white&labelColor=black&color=pink)](https://github.com/sponsors/prosamik)

Your support helps maintain and improve this project for the entire community.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org) - The React framework for production
- [Better Auth](https://better-auth.com) - Modern authentication for web apps
- [Polar.sh](https://polar.sh) - Simple, powerful payments for developers
- [Drizzle ORM](https://orm.drizzle.team) - TypeScript ORM for SQL databases
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- [Radix UI](https://radix-ui.com) - Accessible component primitives

---

**Built with ❤️ by [prosamik](https://github.com/prosamik)**

## Using the MCP Server with API Key Authentication

Your MCP server is protected by API key authentication. Every request must include a valid API key in the `Authorization` header as a Bearer token. This ensures that only authenticated users can access and use the MCP tools.

### 1. Obtain an API Key

- Log in to your application.
- Navigate to the **API Keys** section (usually at `/api-keys`).
- Create a new API key if you don't have one.
- **Copy** the API key. Treat it like a password—**do not share it publicly**.

---

### 2. MCP Endpoint

The MCP server is available at:

```
POST /api/mcp
```

- Local development: `http://localhost:3000/api/mcp`
- Production: `https://your-domain.com/api/mcp`

---

### 3. Making Requests

All requests must include your API key in the `Authorization` header:

```
Authorization: Bearer <YOUR_API_KEY>
```

#### Example cURL Request

```bash
curl -X POST https://your-domain.com/api/mcp \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "list_tasks",
    "params": {
      "date": "2024-06-20"
    }
  }'
```

- Replace `<YOUR_API_KEY>` with your actual API key.
- Replace the `method` and `params` as needed for the tool you want to call.

---

### 4. Supported Tools

The MCP server exposes several tools. Example methods include:

- `list_tasks` — List all tasks for a specific date.
- `create_task` — Create a new task.
- `edit_task` — Edit an existing task.
- `delete_task` — Delete a task.

**You do not need to provide your user ID in the request.**  
The server authenticates you based on your API key and injects your user ID automatically.

---

### 5. API Key Security

- **Never share your API key** in public code, forums, or screenshots.
- If you suspect your API key is compromised, **revoke it immediately** and generate a new one.
- You can rotate your API keys at any time from the API Keys section of your app.

For more on API key best practices, see [RapidAPI Docs: API Keys / Key Rotation](https://docs.rapidapi.com/docs/keys-and-key-rotation).

---

### 6. Error Handling

If you make a request without a valid API key, you will receive an error response:

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32001,
    "message": "Authentication required: Please provide a valid API key in Authorization header"
  },
  "id": null
}
```

---

### 7. Integrating with Claude Desktop

You can use Claude Desktop (or any compatible MCP client) with your MCP server. Here’s how:

1. Open Claude Desktop and go to the MCP server configuration.
2. Set the endpoint URL to your MCP server:
   - Example: `https://your-domain.com/api/mcp`
3. In the headers section, add:
   ```
   Authorization: Bearer <YOUR_API_KEY>
   ```
4. Save the configuration and connect.

**Note:** You can manage and rotate your API keys at `/api-keys` in your app.

Example -
```
  "mcpServers": {
    "my-mcp-server": {
      "url": "http://localhost:3000/api/mcp",
      "headers": {
        "Authorization": "Bearer mcp_token"
      }
    }
}
```

---

## Summary

- All requests require an API key in the Authorization header.
- Never send your user ID directly; it is derived from your API key.
- Rotate your API key if it is ever exposed.
- See the `/api-keys` page in your app to manage your keys.

If you have any questions or need help, please contact support or refer to the [RapidAPI API Key documentation](https://docs.rapidapi.com/docs/keys-and-key-rotation).
