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
} from "drizzle-orm/pg-core";

export const segmentEnum = pgEnum("segment", [
  "HIGH",
  "MID",
  "LOW",
  "UNSCORED",
]);

export const capitalEnum = pgEnum("capital", [
  "under_100",
  "100_300",
  "300_1000",
  "1000_plus",
]);

export const experienceEnum = pgEnum("experience", [
  "beginner",
  "some_experience",
  "trades_already",
]);

export const goalEnum = pgEnum("goal", [
  "exploring",
  "side_income",
  "serious_income",
  "full_time",
]);

export const readinessEnum = pgEnum("readiness", [
  "not_ready",
  "this_month",
  "seven_days",
  "ready_now",
]);

/** Single source of truth for `event_type` enum — keep in sync with DB. */
export const eventTypeValues = [
  "app_open",
  "offer_view",
  "offer_complete",
  "funnel_gate_complete",
  "prelander_view",
  "prelander_complete",
  "offer_watched",
  "questionnaire_start",
  "questionnaire_complete",
  "questionnaire_processing_shown",
  "crm_triggered",
  "bot_nurtured",
  "deposit_confirmed",
  "rescore",
  "product_match_view",
  "intent_confirm",
  "intent_decline",
  "handoff_confirmed",
] as const;

export type EventType = (typeof eventTypeValues)[number];

export const eventTypeEnum = pgEnum(
  "event_type",
  eventTypeValues as unknown as [string, ...string[]],
);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  telegramId: bigint("telegram_id", { mode: "number" }).notNull().unique(),
  username: text("username"),
  firstName: text("first_name"),
  languageCode: text("language_code"),
  voluumCid: text("voluum_cid"),
  entryVariant: text("entry_variant"),
  source: text("source").default("mini_app"),
  country: text("country"),
  countryCode: text("country_code"),
  score: integer("score"),
  segment: segmentEnum("segment").default("UNSCORED"),
  miniAppUser: boolean("mini_app_user").default(true),
  bundleEligible: boolean("bundle_eligible").default(true),
  bundleUsed: boolean("bundle_used").default(false),
  questionnaireCompleted: boolean("questionnaire_completed").default(false),
  crmTriggered: boolean("crm_triggered").default(false),
  chatwootContactId: text("chatwoot_contact_id"),
  chatwootConversationId: text("chatwoot_conversation_id"),
  depositTotal: integer("deposit_total").default(0),
  productsUnlocked: text("products_unlocked").array().default([]),
  confirmedProductKey: text("confirmed_product_key"),
  intentConfirmedAt: timestamp("intent_confirmed_at"),
  intentDeclinedAt: timestamp("intent_declined_at"),
  bundleOfferShown: boolean("bundle_offer_shown").default(false),
  bundleAccepted: boolean("bundle_accepted"),
  createdAt: timestamp("created_at").defaultNow(),
  questionnaireCompletedAt: timestamp("questionnaire_completed_at"),
  crmTriggeredAt: timestamp("crm_triggered_at"),
  lastSeenAt: timestamp("last_seen_at").defaultNow(),
});

export const questionnaireAnswers = pgTable("questionnaire_answers", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  ageVerified: boolean("age_verified").notNull(),
  capital: capitalEnum("capital").notNull(),
  experience: experienceEnum("experience").notNull(),
  goal: goalEnum("goal").notNull(),
  readiness: readinessEnum("readiness").notNull(),
  rawScore: integer("raw_score").notNull(),
  cappedScore: integer("capped_score").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const offers = pgTable("offers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  weight: integer("weight").default(1),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  telegramId: bigint("telegram_id", { mode: "number" }).notNull(),
  eventType: eventTypeEnum("event_type").notNull(),
  metadata: jsonb("metadata"),
  country: text("country"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const referrals = pgTable("referrals", {
  id: uuid("id").defaultRandom().primaryKey(),
  referrerId: uuid("referrer_id")
    .references(() => users.id)
    .notNull(),
  referredUserId: uuid("referred_user_id")
    .references(() => users.id)
    .notNull(),
  qualified: boolean("qualified").default(false),
  rewarded: boolean("rewarded").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  qualifiedAt: timestamp("qualified_at"),
});

export const nurtureQueue = pgTable("nurture_queue", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  telegramId: bigint("telegram_id", { mode: "number" }).notNull(),
  step: integer("step").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  sentAt: timestamp("sent_at"),
  status: text("status").default("pending"),
  /** `mid` = post-score MID nurture; `intent_decline` = user declined in-app intent step */
  nurtureKind: text("nurture_kind").default("mid"),
  createdAt: timestamp("created_at").defaultNow(),
});
