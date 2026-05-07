# GTMO Mini App — Environment Variables

## .env.local (Next.js app)

```env
# Neon Database
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/gtmo?sslmode=require

# Telegram
TELEGRAM_BOT_TOKEN=your_mini_app_bot_token_here
TELEGRAM_BOT_SECRET=your_webhook_secret_here

# Chatwoot
CHATWOOT_BASE_URL=https://chat.workspacegtmo.com
CHATWOOT_API_TOKEN=your_chatwoot_api_token
CHATWOOT_MINIAPP_INBOX_ID=your_inbox_id_number
CHATWOOT_ACCOUNT_ID=1

# Voluum
VOLUUM_POSTBACK_URL=https://t.voluum.com/postback

# Internal
NEXT_PUBLIC_BOT_USERNAME=YourMiniAppBot
NEXT_PUBLIC_CHANNEL_LINK=https://t.me/your_channel
ANALYTICS_SECRET=long_random_string_for_dashboard_auth
```

## bot/.env (grammY bot on Railway)

```env
# Telegram
TELEGRAM_BOT_TOKEN=your_mini_app_bot_token_here

# Database (same Neon instance)
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/gtmo?sslmode=require

# Chatwoot
CHATWOOT_BASE_URL=https://chat.workspacegtmo.com
CHATWOOT_API_TOKEN=your_chatwoot_api_token
CHATWOOT_MINIAPP_INBOX_ID=your_inbox_id_number
CHATWOOT_ACCOUNT_ID=1

# App URL (for mini app button)
MINI_APP_URL=https://your-vercel-app.vercel.app
```

---

## Where to Get Each Value

### DATABASE_URL
Neon dashboard → your project → Connection Details → Connection string
Select "Pooled connection" for serverless/Vercel use

### TELEGRAM_BOT_TOKEN
BotFather → your mini app bot → /token

### CHATWOOT_API_TOKEN
Chatwoot → Profile Settings → Access Token

### CHATWOOT_MINIAPP_INBOX_ID
Chatwoot → Settings → Inboxes → Mini App Leads → Settings → scroll to bottom → Inbox ID number

### CHATWOOT_ACCOUNT_ID
Found in the Chatwoot URL: /app/accounts/[THIS_NUMBER]/

### VOLUUM_POSTBACK_URL
Voluum dashboard → Campaign → Postback URL
Format: https://t.voluum.com/postback?cid={cid}&payout=0&txid={txid}

---

## Vercel Environment Setup

Set all `.env.local` variables in:
Vercel Dashboard → Project → Settings → Environment Variables

Set for: Production, Preview, Development

Note: DATABASE_URL is set automatically if you use the Neon + Vercel integration.
