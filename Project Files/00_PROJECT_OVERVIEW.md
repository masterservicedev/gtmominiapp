# GTMO Mini App — Project Overview

## What You Are Building

A Telegram Mini App Funnel Engine that filters traffic, qualifies users by intent, routes them to the correct path, and feeds high-intent leads directly into Chatwoot for agent closing.

This is NOT a general mini app. It is a controlled filter between paid traffic and a human sales team.

---

## System Goals

1. Accept traffic from Telegram Ads via deep links with Voluum CID params
2. Assign users to entry variants (video / LP variants) for A/B testing
3. Qualify users via a 5-step questionnaire
4. Score users mathematically and segment them into HIGH / MID / LOW
5. Route HIGH intent users to Chatwoot as structured lead cards
6. Route MID users into a bot nurture sequence
7. Route LOW users to free channel only — no agent contact
8. Track all events back to Voluum for attribution
9. Store permanent user records keyed on telegram_id for lifetime tracking
10. Surface analytics by country, offer variant, and conversion stage

---

## Non-Negotiable Architecture Decisions

These are locked. Do not deviate.

### Bot Setup
- The mini app runs from a DEDICATED mini app bot (separate from the support bot)
- Both bots are connected to Chatwoot as separate inboxes
- The support bot remains unchanged — it is the channel-facing identity
- The mini app bot is the entry point, qualifier, and CRM trigger

### CRM
- Chatwoot is the CRM (already exists and is operational)
- Agents never log into Telegram directly
- All agent communication happens inside Chatwoot
- Leads arrive in Chatwoot via bot DM to the user which creates a conversation thread

### Database
- Neon (serverless Postgres) is the database
- Drizzle ORM for all queries
- telegram_id is stored on FIRST APP OPEN — before questionnaire starts
- This enables lifetime tracking even if user abandons mid-questionnaire

### Security
- initData HMAC validation is mandatory on every API request
- No telegram_id is trusted without server-side validation
- Invalid initData requests are rejected at the API layer

### Tracking
- Voluum receives postbacks for three events: questionnaire_complete, crm_triggered, deposit_confirmed
- The Voluum CID is parsed from the startapp parameter on app open and stored against the user record
- Attribution persists regardless of how long the conversion cycle takes

---

## User Flow Summary

```
Telegram Ad
    ↓
Deep link: t.me/MiniAppBot/app?startapp=cid_ABC_lp2
    ↓
Mini App opens — user record created immediately (telegram_id + CID + variant)
    ↓
Entry experience shown (video or LP based on variant)
    ↓
5-step questionnaire
    ↓
Score calculated
    ↓
    ├── HIGH (5–6): Channel access + Chatwoot lead card sent + agent contacts proactively
    ├── MID  (3–4): Channel access + bot nurture sequence (Day 0/1/2) + re-score on engagement
    └── LOW  (0–2): Soft exit or channel only — no agent, no CRM
    ↓
User joins free signals channel
    ↓
Agent closes via Chatwoot (deposit → product unlock)
    ↓
Voluum postback fired on deposit confirmation
```

---

## Channel and Product Structure

The signals channel is FREE for all users. It is the trust-building mechanism.

Products are unlocked by deposit via your broker registration link (options provided by your specialist):

| Deposit | Standard | Mini App Exclusive |
|---------|----------|-------------------|
| $50 | Ebook | Ebook + 10% off next product |
| $100 | VIP access | VIP + Ebook bundled |
| $200 | FX Basics OR Education (pick 1) | Pick 1 + second at 50% off |
| $500 | School access | School + 1 product of choice free |

Mini app exclusive bundles apply to FIRST DEPOSIT ONLY and only for users with `mini_app_user = true`.

---

## Chatwoot Setup Required (Do This Before Writing Code)

1. Create new Telegram inbox using mini app bot token → name it "Mini App Leads"
2. Create Team → name it "Closers"
3. Create Labels:
   - Pipeline: `qualified-lead`, `deposit-pending`, `deposit-confirmed`, `not-ready`
   - Products: `product-ebook`, `product-vip`, `product-fxbasics`, `product-education`, `product-school`
4. Create Automation Rule:
   - IF: inbox = Mini App Leads AND message contains "[GTMO QUALIFIED LEAD]"
   - THEN: assign to Closers team + add label qualified-lead
5. Create Quick Replies:
   - `/dep50` → ebook access message + mini app bonus line
   - `/dep100` → VIP invite + ebook bundle (mini app users)
   - `/dep200` → FX Basics or Education + 50% second product
   - `/dep500` → School + free product of choice

---

## Key Constraints

- Do not gate the channel — it is free access for all who complete the questionnaire
- Do not contact LOW intent users via agents — ever
- Do not send unscored inbound to Chatwoot
- Do not skip initData validation for any reason
- Store telegram_id on app open, not on questionnaire completion
