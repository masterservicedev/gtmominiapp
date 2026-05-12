# GTMO Mini App — Database Schema

## File: lib/db/schema.ts

This is the complete Drizzle schema. Build this first before any other code.

```typescript
import {
  pgTable,
  uuid,
  bigint,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const segmentEnum = pgEnum('segment', ['HIGH', 'MID', 'LOW', 'UNSCORED']);

export const capitalEnum = pgEnum('capital', [
  'under_100',
  '100_300',
  '300_1000',
  '1000_plus',
]);

export const experienceEnum = pgEnum('experience', [
  'beginner',
  'some_experience',
  'trades_already',
]);

export const goalEnum = pgEnum('goal', [
  'exploring',
  'side_income',
  'serious_income',
  'full_time',
]);

export const readinessEnum = pgEnum('readiness', [
  'not_ready',
  'this_month',
  'seven_days',
  'ready_now',
]);

export const eventTypeEnum = pgEnum('event_type', [
  'app_open',
  'offer_view',
  'offer_complete',
  'questionnaire_start',
  'questionnaire_complete',
  'crm_triggered',
  'bot_nurtured',
  'deposit_confirmed',
  'rescore',
]);

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Telegram identity — permanent anchor for lifetime tracking
  telegramId: bigint('telegram_id', { mode: 'number' }).notNull().unique(),
  username: text('username'),
  firstName: text('first_name'),
  languageCode: text('language_code'),

  // Traffic source — stored on app open
  voluumCid: text('voluum_cid'),
  entryVariant: text('entry_variant'), // vid1 | lp1 | lp2 | vid2
  source: text('source').default('mini_app'),

  // Geo — resolved from IP on first open
  country: text('country'),
  countryCode: text('country_code'),

  // Scoring — populated after questionnaire
  score: integer('score'),
  segment: segmentEnum('segment').default('UNSCORED'),

  // Flags
  miniAppUser: boolean('mini_app_user').default(true),
  bundleEligible: boolean('bundle_eligible').default(true), // first deposit only
  bundleUsed: boolean('bundle_used').default(false),
  questionnaireCompleted: boolean('questionnaire_completed').default(false),
  crmTriggered: boolean('crm_triggered').default(false),

  // Chatwoot reference
  chatwootContactId: text('chatwoot_contact_id'),
  chatwootConversationId: text('chatwoot_conversation_id'),

  // Deposit tracking (agent-confirmed, not automated)
  depositTotal: integer('deposit_total').default(0),
  productsUnlocked: text('products_unlocked').array().default([]),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  questionnaireCompletedAt: timestamp('questionnaire_completed_at'),
  crmTriggeredAt: timestamp('crm_triggered_at'),
  lastSeenAt: timestamp('last_seen_at').defaultNow(),
});

// ─── Questionnaire Answers ────────────────────────────────────────────────────

export const questionnaireAnswers = pgTable('questionnaire_answers', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),

  // Q1 — Age gate (boolean pass/fail only, not stored if failed)
  ageVerified: boolean('age_verified').notNull(),

  // Q2 — Capital (drives scoring most heavily)
  capital: capitalEnum('capital').notNull(),

  // Q3 — Experience
  experience: experienceEnum('experience').notNull(),

  // Q4 — Goal (stored for agent context and analytics, does not score)
  goal: goalEnum('goal').notNull(),

  // Q5 — Readiness / intent trigger
  readiness: readinessEnum('readiness').notNull(),

  // Calculated score stored here too for reference
  rawScore: integer('raw_score').notNull(),
  cappedScore: integer('capped_score').notNull(),

  createdAt: timestamp('created_at').defaultNow(),
});

// ─── Offers ───────────────────────────────────────────────────────────────────

export const offers = pgTable('offers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(), // vid1, lp1, lp2, vid2
  type: text('type').notNull(), // video | lp
  weight: integer('weight').default(1), // for weighted random assignment
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── Events ───────────────────────────────────────────────────────────────────

export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  telegramId: bigint('telegram_id', { mode: 'number' }).notNull(), // denormalised for fast queries
  eventType: eventTypeEnum('event_type').notNull(),
  metadata: jsonb('metadata'), // flexible — stores offer_id, score, etc
  country: text('country'), // denormalised for analytics joins
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── Referrals ────────────────────────────────────────────────────────────────

export const referrals = pgTable('referrals', {
  id: uuid('id').defaultRandom().primaryKey(),
  referrerId: uuid('referrer_id').references(() => users.id).notNull(),
  referredUserId: uuid('referred_user_id').references(() => users.id).notNull(),
  qualified: boolean('qualified').default(false), // true when referred user completes questionnaire
  rewarded: boolean('rewarded').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  qualifiedAt: timestamp('qualified_at'),
});

// ─── Nurture Sequence ─────────────────────────────────────────────────────────

export const nurtureQueue = pgTable('nurture_queue', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  telegramId: bigint('telegram_id', { mode: 'number' }).notNull(),
  step: integer('step').notNull(), // 0, 1, 2
  scheduledAt: timestamp('scheduled_at').notNull(),
  sentAt: timestamp('sent_at'),
  status: text('status').default('pending'), // pending | sent | cancelled
  createdAt: timestamp('created_at').defaultNow(),
});
```

---

## File: lib/db/index.ts

```typescript
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

---

## File: drizzle.config.ts

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

---

## Migration Commands

```bash
# Generate migration files from schema
npx drizzle-kit generate:pg

# Push schema directly to Neon (use during development)
npx drizzle-kit push:pg

# Run migrations (use in production)
npx drizzle-kit migrate
```

---

## Schema Notes

### Why telegram_id is bigint
Telegram user IDs exceed JavaScript's safe integer range. Store as bigint with mode 'number' in Drizzle — Neon handles the storage correctly.

### Why country is denormalised on events
The analytics queries join users to events frequently. Denormalising country on events avoids a join on every analytics query and keeps the dashboard queries fast.

### Why productsUnlocked is a text array
Products are confirmed manually by agents (not automated). An array is the simplest structure for agents to update via the Chatwoot API and for the system to check eligibility.

### Why bundleEligible and bundleUsed are separate
`bundleEligible` = came through mini app (permanent)
`bundleUsed` = already claimed the bundle on first deposit (prevents double-claiming)

### The nurtureQueue table
MID intent users need Day 0 / Day 1 / Day 2 follow-up messages. This table stores the scheduled messages so the bot can process them via a polling loop rather than requiring a scheduler service. Column `nurture_kind` distinguishes the default MID post-score sequence (`mid`) from the follow-up sequence after a user taps **Not right now** on the in-app intent step (`intent_decline`).

### Post-qualify intent fields on `users`
`confirmed_product_key`, `intent_confirmed_at`, `intent_declined_at`, `bundle_offer_shown`, and `bundle_accepted` support the `/product-match` → `/confirm-intent` flow. See `lib/db/schema.ts` for exact types. Run `npm run db:push` after pulling so Neon gets new columns and new `event_type` enum values.
