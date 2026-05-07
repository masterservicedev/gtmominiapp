# GTMO Mini App — Bot Setup

## BotFather Configuration

Do this before writing any code.

1. Open BotFather in Telegram → `/newbot`
2. Name: GTMO Trading (or client brand name)
3. Username: GTMOMiniAppBot (or chosen username)
4. Save the bot token → goes into `TELEGRAM_BOT_TOKEN`
5. `/setmenubutton` → select your bot → set button text "Open App" → set URL: `https://your-vercel-app.vercel.app`
6. `/setdomain` → select your bot → enter your Vercel domain (without https://)

---

## File: bot/index.ts

```typescript
import { Bot, Context } from 'grammy';
import { handleStart } from './handlers/start';
import { handleMessage } from './handlers/messages';
import { processNurtureQueue } from './lib/nurture';
import 'dotenv/config';

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);

// Handle /start command with deep link params
bot.command('start', handleStart);

// Handle all other messages (for re-scoring triggers)
bot.on('message:text', handleMessage);

// Error handler
bot.catch((err) => {
  console.error('Bot error:', err);
});

// Process nurture queue every 5 minutes
setInterval(async () => {
  await processNurtureQueue(bot);
}, 5 * 60 * 1000);

// Start bot
bot.start();
console.log('GTMO bot running');
```

---

## File: bot/handlers/start.ts

```typescript
import { Context } from 'grammy';
import { db } from '../lib/db';
import { users } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

export async function handleStart(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  // Parse startapp parameter
  // Format from deep link: start=ref_USERID for referrals
  const startParam = ctx.match as string || '';
  const isReferral = startParam.startsWith('ref_');
  const referrerId = isReferral ? startParam.replace('ref_', '') : null;

  // Check if user already exists
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.telegramId, telegramId))
    .limit(1);

  if (existing.length === 0 && referrerId) {
    // Store referral relationship — will be completed when they go through mini app
    // For now just log it; full record created on mini app open via /api/init
    console.log(`Referral: ${telegramId} referred by ${referrerId}`);
  }

  // Send mini app launch button
  await ctx.reply(
    '👋 Welcome to GTMO Trading.\n\nTap below to apply for access to our live trading signals.',
    {
      reply_markup: {
        inline_keyboard: [[
          {
            text: '🚀 Apply Now',
            web_app: { url: process.env.MINI_APP_URL! },
          }
        ]]
      }
    }
  );
}
```

---

## File: bot/handlers/messages.ts

```typescript
import { Context } from 'grammy';
import { db } from '../lib/db';
import { users, events } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendLeadCard } from '../lib/sendLead';

export async function handleMessage(ctx: Context) {
  const telegramId = ctx.from?.id;
  const text = ctx.message?.text?.toLowerCase().trim();
  if (!telegramId || !text) return;

  // Look up user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.telegramId, telegramId))
    .limit(1);

  if (!user) {
    // Unknown user — prompt them to apply
    await ctx.reply(
      'To get started, please complete your application first.',
      {
        reply_markup: {
          inline_keyboard: [[
            {
              text: '📋 Apply Now',
              web_app: { url: process.env.MINI_APP_URL! },
            }
          ]]
        }
      }
    );
    return;
  }

  // READY confirmation from HIGH intent user
  if (text === 'ready' && user.segment === 'HIGH' && !user.crmTriggered) {
    await sendLeadCard(ctx.api, user);
    return;
  }

  // MID user engaging with bot — triggers re-score check
  if (user.segment === 'MID') {
    // Log re-engagement event
    await db.insert(events).values({
      userId: user.id,
      telegramId: user.telegramId,
      eventType: 'rescore',
      metadata: { trigger: 'bot_reply', message: text },
      country: user.country,
    });

    // Check if engagement warrants upgrade
    // Simple rule: if they reply to nurture sequence, bump score by 1
    const newScore = (user.score || 0) + 1;
    if (newScore >= 5) {
      await db
        .update(users)
        .set({ score: newScore, segment: 'HIGH' })
        .where(eq(users.id, user.id));

      await sendLeadCard(ctx.api, { ...user, score: newScore, segment: 'HIGH' });
    }
    return;
  }

  // Default — redirect to mini app
  await ctx.reply('Tap below to continue your application.', {
    reply_markup: {
      inline_keyboard: [[
        { text: '📋 Open App', web_app: { url: process.env.MINI_APP_URL! } }
      ]]
    }
  });
}
```

---

## File: bot/lib/sendLead.ts

```typescript
import { Api } from 'grammy';
import { db } from './db';
import { users, events } from './db/schema';
import { eq } from 'drizzle-orm';
import axios from 'axios';

function getOfferLine(capital: string, bundleEligible: boolean): string {
  if (!bundleEligible) {
    const standard: Record<string, string> = {
      'under_100': 'No current offer — channel access only',
      '100_300': '$100 deposit → VIP access',
      '300_1000': '$200 deposit → FX Basics or Education',
      '1000_plus': '$500 deposit → School access',
    };
    return standard[capital] || 'See agent for options';
  }

  const bundle: Record<string, string> = {
    'under_100': 'No current offer — channel access only',
    '100_300': '$100 deposit → VIP + Ebook bundle 🎁',
    '300_1000': '$200 deposit → Pick 1 product + 50% off second 🎁',
    '1000_plus': '$500 deposit → School + 1 product of choice FREE 🎁',
  };
  return bundle[capital] || 'See agent for options';
}

function getScoreEmoji(score: number): string {
  if (score >= 5) return '🔴';
  if (score >= 3) return '🟡';
  return '⚪';
}

export async function sendLeadCard(api: Api, user: any) {
  const emoji = getScoreEmoji(user.score || 0);
  const offerLine = getOfferLine(
    user.questionnaireAnswers?.capital || 'under_100',
    user.bundleEligible || false
  );

  // Message 1: User-facing (creates the CRM thread)
  const userMessage = `✅ You've been pre-approved for GTMO Trading access.\n\nA specialist from our team is reviewing your application now.\n\nPlease reply *READY* to confirm you're available to proceed.`;

  await api.sendMessage(user.telegramId, userMessage, {
    parse_mode: 'Markdown',
  });

  // Message 2: Internal lead card (same thread — agent sees everything)
  // This is structured so Chatwoot automation can tag it
  const leadCard = [
    `[GTMO QUALIFIED LEAD]`,
    ``,
    `Score: ${user.score} ${emoji}`,
    `Capital declared: ${user.questionnaireAnswers?.capital?.replace(/_/g, ' ') || 'unknown'}`,
    `Experience: ${user.questionnaireAnswers?.experience?.replace(/_/g, ' ') || 'unknown'}`,
    `Goal: ${user.questionnaireAnswers?.goal?.replace(/_/g, ' ') || 'unknown'}`,
    `Readiness: ${user.questionnaireAnswers?.readiness?.replace(/_/g, ' ') || 'unknown'}`,
    ``,
    `Source: ${user.entryVariant || 'direct'}`,
    `CID: ${user.voluumCid || 'none'}`,
    `Country: ${user.country || 'unknown'}`,
    ``,
    `Mini app user: YES`,
    `Bundle eligible: ${user.bundleEligible ? 'YES — first deposit' : 'NO'}`,
    `Products owned: ${user.productsUnlocked?.length ? user.productsUnlocked.join(', ') : 'none'}`,
    ``,
    `→ Offer to lead with: ${offerLine}`,
  ].join('\n');

  await api.sendMessage(user.telegramId, leadCard);

  // Update DB
  await db
    .update(users)
    .set({ crmTriggered: true, crmTriggeredAt: new Date() })
    .where(eq(users.id, user.id));

  // Log event
  await db.insert(events).values({
    userId: user.id,
    telegramId: user.telegramId,
    eventType: 'crm_triggered',
    metadata: { score: user.score, segment: user.segment },
    country: user.country,
  });

  // Fire Voluum postback
  if (user.voluumCid) {
    try {
      await axios.get(
        `${process.env.VOLUUM_POSTBACK_URL}?cid=${user.voluumCid}&event=qualified`
      );
    } catch (e) {
      console.error('Voluum postback failed:', e);
    }
  }
}
```

---

## File: bot/lib/nurture.ts

```typescript
import { Bot } from 'grammy';
import { db } from './db';
import { nurtureQueue, users } from './db/schema';
import { eq, lte, and } from 'drizzle-orm';

const nurtureMessages = [
  // Day 0 — sent immediately after scoring MID
  (firstName: string) =>
    `Hey ${firstName}, you're now inside GTMO Trading signals.\n\nThe channel is live every day with real trade setups. Have a look around and see what we're doing. 👀`,

  // Day 1
  (firstName: string) =>
    `${firstName}, just checking in.\n\nIf you've been watching the channel, you'll have seen the kind of setups we run. When you're ready to go deeper, tap below to get started with a funded account. 📈`,

  // Day 2 — re-offer
  (firstName: string) =>
    `Last message from us for now, ${firstName}.\n\nIf the timing is right and you're ready to start — our team is available to walk you through everything step by step.\n\nReply *READY* and we'll connect you now.`,
];

export async function processNurtureQueue(bot: Bot) {
  const now = new Date();

  // Get all pending messages scheduled for now or earlier
  const pending = await db
    .select()
    .from(nurtureQueue)
    .where(
      and(
        eq(nurtureQueue.status, 'pending'),
        lte(nurtureQueue.scheduledAt, now)
      )
    );

  for (const item of pending) {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, item.userId))
        .limit(1);

      if (!user) continue;

      // Skip if user has been upgraded to HIGH and CRM triggered
      if (user.crmTriggered) {
        await db
          .update(nurtureQueue)
          .set({ status: 'cancelled' })
          .where(eq(nurtureQueue.id, item.id));
        continue;
      }

      const message = nurtureMessages[item.step](user.firstName || 'there');

      await bot.api.sendMessage(user.telegramId, message, {
        parse_mode: 'Markdown',
      });

      await db
        .update(nurtureQueue)
        .set({ status: 'sent', sentAt: new Date() })
        .where(eq(nurtureQueue.id, item.id));

    } catch (err) {
      console.error(`Nurture send failed for ${item.userId}:`, err);
    }
  }
}
```

---

## Railway Deployment

1. Push bot code to GitHub (can be same repo under /bot)
2. Railway → New Project → Deploy from GitHub
3. Set root directory to `/bot`
4. Add all environment variables from `bot/.env`
5. Start command: `npx ts-node index.ts` or compile and run `node dist/index.js`
