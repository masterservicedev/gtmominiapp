# GTMO Mini App — Build Order

Follow this exactly. Do not jump ahead. Each step builds on the last.
If you skip a step and something breaks, you will not know where the failure is.

---

## Pre-Build Checklist (Do Before Opening Cursor)

- [ ] Neon account created, database provisioned, connection string saved
- [ ] Mini app bot created via BotFather, token saved
- [ ] Bot domain set in BotFather to future Vercel URL (can update after deploy)
- [ ] Chatwoot: mini app bot connected as new inbox named "Mini App Leads"
- [ ] Chatwoot: "Closers" team created
- [ ] Chatwoot: all labels created (see 09_CHATWOOT_INTEGRATION.md)
- [ ] Chatwoot: automation rules configured
- [ ] Chatwoot: quick replies created
- [ ] Voluum campaign set up, postback URL noted
- [ ] Railway account created (for bot hosting)

---

## Step 1 — Scaffold Next.js App

```bash
npx create-next-app@latest gtmo-miniapp --typescript --tailwind --app --no-src-dir
cd gtmo-miniapp
```

Install dependencies:
```bash
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
npm install @twa-dev/sdk axios zod
```

Create `.env.local` with all variables from `02_ENVIRONMENT_VARIABLES.md`.

**Verify**: app runs at localhost:3000

---

## Step 2 — Database Schema

1. Create `lib/db/schema.ts` — full content from `03_DATABASE_SCHEMA.md`
2. Create `lib/db/index.ts` — Neon + Drizzle connection
3. Create `drizzle.config.ts`

Push schema to Neon:
```bash
npx drizzle-kit push:pg
```

**Verify**: open Neon dashboard, confirm all tables exist with correct columns

Seed the offers table with initial variants:
```sql
INSERT INTO offers (name, type, weight, active) VALUES
('vid1', 'video', 1, true),
('lp1', 'lp', 1, true),
('lp2', 'lp', 1, true),
('vid2', 'video', 1, true);
```

---

## Step 3 — initData Validation

1. Create `lib/validation.ts` — full content from `04_INIT_DATA_VALIDATION.md`

Write a test to verify the function works:
```typescript
// This should throw — fake data
validateInitData('query_id=fake&user=fake&auth_date=fake&hash=fake');

// Real initData from your Telegram account will validate correctly
```

**Do not proceed until this function is tested with real initData.**
Use ngrok + real Telegram to generate a real initData string.

---

## Step 4 — API Route: /api/init

1. Create `app/api/init/route.ts` — content from `07_API_ROUTES.md`

Test with curl (replace initData with a real validated string):
```bash
curl -X POST http://localhost:3000/api/init \
  -H "Content-Type: application/json" \
  -d '{"initData":"...real_init_data...","voluumCid":"test123","entryVariant":"lp1"}'
```

**Verify**: user record appears in Neon database with telegram_id, country, variant

---

## Step 5 — Scoring Engine

1. Create `lib/scoring.ts` — full content from `06_SCORING_ENGINE.md`

Test all scoring examples from the spec:
```typescript
// User A — should be HIGH (6)
calculateScore({ capital: '1000_plus', experience: 'some_experience', goal: 'full_time', readiness: 'seven_days' })
// Expected: { cappedScore: 6, segment: 'HIGH' }

// User D — cap should apply (2)
calculateScore({ capital: 'under_100', experience: 'trades_already', goal: 'full_time', readiness: 'ready_now' })
// Expected: { cappedScore: 2, segment: 'LOW', cappingApplied: true }

// Floor protection
calculateScore({ capital: '300_1000', experience: 'beginner', goal: 'exploring', readiness: 'this_month' })
// Expected: { cappedScore: 4, segment: 'MID', floorApplied: true }
```

**Verify**: all three examples return correct values

---

## Step 6 — API Route: /api/score

1. Create `app/api/score/route.ts` — content from `07_API_ROUTES.md`

Test with a HIGH intent answer set:
```bash
curl -X POST http://localhost:3000/api/score \
  -H "Content-Type: application/json" \
  -d '{
    "initData": "...real...",
    "answers": {
      "ageVerified": true,
      "capital": "1000_plus",
      "experience": "some_experience",
      "goal": "full_time",
      "readiness": "ready_now"
    }
  }'
```

**Verify**:
- Response contains `{ segment: 'HIGH', requiresConfirmation: true }`
- questionnaire_answers record created in DB
- users table updated with score and segment
- No nurture queue entries for HIGH users
- MID users: 3 nurture_queue entries created with correct scheduled times

---

## Step 7 — Entry Page UI

1. Create `app/page.tsx` — content from `08_MINI_APP_PAGES.md`
2. Create entry experience components:
   - `components/VideoEntry.tsx` — video player + positioning copy + continue button
   - `components/LPEntry.tsx` — text-based landing page + continue button

Entry experience copy (use this as the positioning screen):
```
This is not a free signals group.

This is for traders who are ready to execute, manage risk, and fund accounts with structure.

If you're here to watch from the sidelines — this isn't the right fit.

[Continue →]
```

**Verify**: page loads in Telegram, /api/init fires, user record created

---

## Step 8 — Questionnaire UI

1. Create `app/qualify/page.tsx` — content from `08_MINI_APP_PAGES.md`

**Verify**:
- Progress bar advances correctly (Steps 1–5)
- Age = No → redirects to /result?exit=age
- 800ms delay fires on final step submission
- /api/score called with correct answer payload
- Redirect to /result?segment=HIGH/MID/LOW

---

## Step 9 — Result Pages

1. Create `app/result/page.tsx` — content from `08_MINI_APP_PAGES.md`

**Verify**:
- HIGH result shows "pre-approved" copy and READY instruction
- MID result shows channel link
- LOW result shows channel link (softer copy)
- Soft exit screens work for age and not_ready

---

## Step 10 — Bot Setup

In the repo root, create a `/bot` directory:

```bash
mkdir bot && cd bot
npm init -y
npm install grammy dotenv axios
npm install -D typescript @types/node ts-node
```

1. Create `bot/index.ts`
2. Create `bot/handlers/start.ts`
3. Create `bot/handlers/messages.ts`
4. Create `bot/lib/sendLead.ts`
5. Create `bot/lib/nurture.ts`
6. Create `bot/lib/db.ts` (import from shared schema)
7. Create `bot/.env` with bot environment variables

Test locally:
```bash
cd bot && npx ts-node index.ts
```

Open your bot in Telegram → `/start` → verify launch button appears

**Verify**:
- /start sends mini app launch button
- Deep link `?start=ref_123` is parsed correctly
- Replying READY triggers sendLeadCard

---

## Step 11 — Chatwoot Connection Test

This is the most critical integration test. Do not skip.

1. Make sure the mini app bot token is connected to Chatwoot as "Mini App Leads" inbox
2. Run through the full flow end to end:
   - Open bot in Telegram
   - Launch mini app
   - Complete questionnaire with HIGH intent answers
   - Reply READY to the bot
3. Open Chatwoot — verify:
   - Conversation appears in Mini App Leads inbox
   - Lead card message is visible
   - Automation rule has applied "qualified-lead" label
   - Conversation has been assigned to Closers team

**If this does not work, do not proceed to deployment.**
Debug the bot token, the inbox ID, and the sendLead function.

---

## Step 12 — Event Tracking API

1. Create `app/api/event/route.ts`
2. Add offer_view event fire to entry page (after /api/init returns)
3. Add offer_complete event fire when user taps Continue on entry page

**Verify**: events table populates with app_open, offer_view events

---

## Step 13 — Chatwoot Webhook

1. Create `app/api/chatwoot/webhook/route.ts`
2. Add webhook URL in Chatwoot settings (after Vercel deployment)

---

## Step 14 — Analytics Dashboard

1. Create `app/api/analytics/route.ts`
2. Create `app/analytics/page.tsx` — simple table display of analytics data

The analytics page should be protected:
```typescript
// Check for analytics secret in query param or header
const secret = searchParams.get('secret');
if (secret !== process.env.ANALYTICS_SECRET) {
  return <div>Access denied</div>;
}
```

---

## Step 15 — Deploy

### Frontend + API to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add DATABASE_URL
# ... add all variables from 02_ENVIRONMENT_VARIABLES.md
```

Connect Neon integration in Vercel dashboard for automatic DATABASE_URL management.

Update BotFather with live Vercel URL:
- `/setdomain` → your bot → `your-app.vercel.app`
- `/setmenubutton` → update URL to `https://your-app.vercel.app`

### Bot to Railway

1. Push bot code to GitHub
2. Railway → New → Deploy from GitHub
3. Set root to `/bot`
4. Add environment variables
5. Deploy

**Verify**: bot stays online, nurture queue processing fires every 5 minutes

---

## Step 16 — Chatwoot Webhook (Post-Deploy)

Now that you have a live URL:
1. Chatwoot → Settings → Integrations → Webhooks
2. Add: `https://your-app.vercel.app/api/chatwoot/webhook`
3. Enable: Conversation Created, Message Created

---

## Step 17 — End-to-End Final Test

Run the full user journey from a real Telegram account:

1. Click ad deep link (or use `t.me/YourBot/app?startapp=cid_TEST_lp1`)
2. Complete full questionnaire as HIGH intent user
3. Verify Neon: user record created with correct score and segment
4. Reply READY
5. Verify Chatwoot: lead card appears, labels applied, assigned to Closers
6. Check Voluum: postback received for questionnaire_complete and crm_triggered
7. Run the full flow again as MID intent — verify nurture queue entries created
8. Check analytics endpoint returns data

Only when all 7 points pass is the build complete.

---

## Common Failure Points

| Symptom | Likely cause |
|---------|-------------|
| initData validation fails | Bot token mismatch — verify TELEGRAM_BOT_TOKEN matches the bot the mini app is opened from |
| User record not created | /api/init not firing — check WebApp.initData is populated (only works inside Telegram) |
| Lead card not in Chatwoot | Bot token in Chatwoot inbox doesn't match mini app bot — must be same token |
| Automation rule not firing | Message text must contain exactly `[GTMO QUALIFIED LEAD]` — check formatting |
| Nurture messages not sending | Railway bot not running, or nurtureQueue polling interval not started |
| Country showing null | ipapi.co rate limit hit — add error handling, fallback to language_code |
