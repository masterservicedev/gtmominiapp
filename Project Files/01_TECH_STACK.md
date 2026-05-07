# GTMO Mini App — Tech Stack

## Full Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend | Next.js (App Router) | 14.x | Mini app UI, questionnaire, routing |
| Styling | Tailwind CSS | 3.x | UI styling |
| Database | Neon (serverless Postgres) | Latest | Persistent user storage |
| ORM | Drizzle ORM | Latest | Type-safe DB queries |
| Bot | Node.js + grammY | Latest | Telegram bot, DMs, start params |
| API | Next.js API Routes | Built-in | Scoring, tracking, webhooks |
| Frontend Hosting | Vercel | — | Mini app frontend + API routes |
| Bot Hosting | Railway | — | Persistent bot process |
| Tracking | Voluum | — | Postback attribution |
| CRM | Chatwoot | Existing | Agent conversations |

---

## Why This Stack

### Next.js over plain React
- App Router handles page routing cleanly (landing → questionnaire → result)
- API routes in the same repo — no separate backend server needed
- Vercel deployment is one command
- Server components reduce client bundle size

### Neon over Supabase
- Pure Postgres — no abstraction layer
- Serverless branching for safe testing against production schema
- Scale to zero — no idle cost during build phase
- First-class Vercel integration — env vars set automatically on connect
- Drizzle works better with Neon than Supabase client for complex joins

### Drizzle over Prisma
- Lightweight, no query engine binary
- SQL-like syntax that maps directly to the analytics queries
- TypeScript-first schema definition
- Faster cold starts on serverless (important for Vercel edge)

### grammY over node-telegram-bot-api
- Modern async/await API
- Built-in middleware support
- Handles Telegram WebApp init cleanly
- Active maintenance and good TypeScript support

### Railway over Render for bot hosting
- Persistent process (bots need to stay alive unlike API routes)
- Simple GitHub deploy
- Reasonable free tier for initial deployment

---

## Packages to Install

### Next.js App (root)
```bash
npx create-next-app@latest gtmo-miniapp --typescript --tailwind --app
cd gtmo-miniapp

# Database
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit

# Telegram SDK
npm install @twa-dev/sdk

# Utilities
npm install axios zod
```

### Bot (separate /bot directory)
```bash
mkdir bot && cd bot
npm init -y
npm install grammy dotenv axios
npm install -D typescript @types/node ts-node
```

---

## Repository Structure Overview

```
gtmo-miniapp/
├── app/                        # Next.js App Router pages
│   ├── page.tsx                # Entry / landing page
│   ├── questionnaire/
│   │   └── page.tsx            # Questionnaire flow
│   ├── result/
│   │   └── page.tsx            # Post-score result page
│   ├── analytics/
│   │   └── page.tsx            # Internal analytics dashboard
│   └── api/                    # API routes
│       ├── init/route.ts        # App open — create user record
│       ├── score/route.ts       # Submit answers — calculate score
│       ├── chatwoot/
│       │   └── webhook/route.ts # Incoming Chatwoot webhook
│       └── voluum/
│           └── postback/route.ts
├── bot/                        # grammY bot (separate process)
│   ├── index.ts
│   ├── handlers/
│   │   ├── start.ts
│   │   └── messages.ts
│   └── lib/
│       └── sendLead.ts
├── lib/                        # Shared logic
│   ├── db/
│   │   ├── schema.ts           # Drizzle schema
│   │   └── index.ts            # DB connection
│   ├── scoring.ts              # Scoring engine
│   ├── validation.ts           # initData HMAC validation
│   └── chatwoot.ts             # Chatwoot API client
├── drizzle.config.ts
├── .env.local
└── package.json
```

---

## Environment Variables Required

See `03_ENVIRONMENT_VARIABLES.md` for full list.

---

## Deployment Targets

| Service | What it runs |
|---------|-------------|
| Vercel | Next.js frontend + all API routes |
| Railway | grammY bot process |
| Neon | Postgres database (managed) |
| Chatwoot | Already deployed (client's instance) |

---

## Vercel + Neon Integration

After creating your Neon database:
1. Go to Vercel project → Integrations → Add Neon
2. Select your Neon project
3. `DATABASE_URL` is automatically added to Vercel env vars
4. No manual connection string management needed
