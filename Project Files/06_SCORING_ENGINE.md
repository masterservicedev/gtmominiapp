# GTMO Mini App — Scoring Engine

## File: lib/scoring.ts

```typescript
// ─── Input Types ──────────────────────────────────────────────────────────────

export type Capital = 'under_100' | '100_300' | '300_1000' | '1000_plus';
export type Experience = 'beginner' | 'some_experience' | 'trades_already';
export type Goal = 'exploring' | 'side_income' | 'serious_income' | 'full_time';
export type Readiness = 'not_ready' | 'this_month' | 'seven_days' | 'ready_now';

export interface QuestionnaireInput {
  capital: Capital;
  experience: Experience;
  goal: Goal;
  readiness: Readiness;
}

export type Segment = 'HIGH' | 'MID' | 'LOW';

export interface ScoreResult {
  rawScore: number;
  cappedScore: number;
  segment: Segment;
  capitalPoints: number;
  experiencePoints: number;
  readinessPoints: number;
  cappingApplied: boolean;
  floorApplied: boolean;
}

// ─── Scoring Tables ───────────────────────────────────────────────────────────

const CAPITAL_SCORES: Record<Capital, number> = {
  under_100: 0,
  '100_300': 1,
  '300_1000': 2,
  '1000_plus': 3,
};

const EXPERIENCE_SCORES: Record<Experience, number> = {
  beginner: 0,
  some_experience: 1,
  trades_already: 1,
};

// Goal does NOT score — stored for agent context only
const GOAL_SCORES: Record<Goal, number> = {
  exploring: 0,
  side_income: 0,
  serious_income: 0,
  full_time: 0,
};

const READINESS_SCORES: Record<Readiness, number> = {
  not_ready: 0,
  this_month: 1,
  seven_days: 2,
  ready_now: 2,
};

// ─── Tier Thresholds ─────────────────────────────────────────────────────────

const TIERS = {
  HIGH: { min: 5, max: 6 },
  MID: { min: 3, max: 4 },
  LOW: { min: 0, max: 2 },
};

// ─── Main Scoring Function ───────────────────────────────────────────────────

export function calculateScore(input: QuestionnaireInput): ScoreResult {
  const capitalPoints = CAPITAL_SCORES[input.capital];
  const experiencePoints = EXPERIENCE_SCORES[input.experience];
  const readinessPoints = READINESS_SCORES[input.readiness];

  const rawScore = capitalPoints + experiencePoints + readinessPoints;

  let cappedScore = rawScore;
  let cappingApplied = false;
  let floorApplied = false;

  // HARD CAP: if capital = 0, max score is 2 (stays LOW regardless of other answers)
  // Prevents "enthusiastic but broke" users reaching MID and consuming agent time
  if (input.capital === 'under_100') {
    if (cappedScore > 2) {
      cappedScore = 2;
      cappingApplied = true;
    }
  }

  // PROTECTION FLOOR: if capital >= 2 AND readiness >= 1, min score is 4
  // Prevents burying genuinely ready leads who answered one question conservatively
  if (
    capitalPoints >= 2 &&
    readinessPoints >= 1 &&
    cappedScore < 4
  ) {
    cappedScore = 4;
    floorApplied = true;
  }

  const segment = getSegment(cappedScore);

  return {
    rawScore,
    cappedScore,
    segment,
    capitalPoints,
    experiencePoints,
    readinessPoints,
    cappingApplied,
    floorApplied,
  };
}

function getSegment(score: number): Segment {
  if (score >= TIERS.HIGH.min) return 'HIGH';
  if (score >= TIERS.MID.min) return 'MID';
  return 'LOW';
}

// ─── Re-Scoring (for MID users who re-engage) ────────────────────────────────

export function reScore(currentScore: number, trigger: 'bot_reply' | 'broker_click' | 'app_revisit'): {
  newScore: number;
  segment: Segment;
  upgraded: boolean;
} {
  const increments: Record<string, number> = {
    bot_reply: 1,
    broker_click: 2,
    app_revisit: 1,
  };

  const increment = increments[trigger] || 1;
  const newScore = Math.min(currentScore + increment, 6); // cap at max
  const segment = getSegment(newScore);
  const upgraded = segment === 'HIGH' && getSegment(currentScore) !== 'HIGH';

  return { newScore, segment, upgraded };
}
```

---

## Scoring Examples

### User A — Strong lead
```
Capital: $1,000+     → 3 points
Experience: some     → 1 point
Readiness: 7 days    → 2 points
─────────────────────
Raw: 6  |  Capped: 6  |  Segment: HIGH
No cap or floor applied
→ Immediate Chatwoot lead card
→ Offer: $500 → School + free product
```

### User B — Mid prospect
```
Capital: $100–$300   → 1 point
Experience: beginner → 0 points
Readiness: this month→ 1 point
─────────────────────
Raw: 2  |  Floor applied → 0  |  Capped: 2  |  Segment: LOW
Wait — floor only applies if capital >= 2. Capital is 1 here. No floor.
Final: 2  |  Segment: LOW
```

### User C — Correct MID example
```
Capital: $300–$1000  → 2 points
Experience: beginner → 0 points
Readiness: this month→ 1 point
─────────────────────
Raw: 3  |  Floor check: capital(2) >= 2 AND readiness(1) >= 1 → floor to 4
Capped: 4  |  Segment: MID
→ Bot nurture sequence Day 0/1/2
```

### User D — Broke but enthusiastic (cap applies)
```
Capital: under $100  → 0 points
Experience: trades   → 1 point
Readiness: ready now → 2 points
─────────────────────
Raw: 3  |  Hard cap: capital = 0, max = 2
Capped: 2  |  Segment: LOW
→ Channel only, no agent
```

---

## Soft Exit Logic (Before Questionnaire Completes)

```typescript
// Check after Q1 (age gate)
if (!ageVerified) {
  return { exit: true, reason: 'age', message: 'You must be 18 or over to continue.' };
}

// Check after Q2 + Q5 combination (capital + readiness)
// If capital is under_100 AND readiness is not_ready → soft exit immediately
// Don't waste their time on remaining questions
if (capital === 'under_100' && readiness === 'not_ready') {
  return {
    exit: true,
    reason: 'not_ready',
    message: 'No problem — join the free channel to follow along. Come back when you\'re ready to start.',
    channelLink: process.env.NEXT_PUBLIC_CHANNEL_LINK,
  };
}
```

Note: The soft exit check for capital + readiness can only happen after Q5. In the UI, show Q2 (capital) first then Q5 (readiness) last — when both are submitted together, run the check before saving to DB.

---

## Score → Agent Offer Mapping

| Segment | Capital | Offer to lead with |
|---------|---------|-------------------|
| HIGH | $1,000+ | $500 deposit → School + free product (bundle) |
| HIGH | $300–$1,000 | $200 deposit → Pick 1 + 50% off second (bundle) |
| MID | $100–$300 | $100 deposit → VIP + Ebook (bundle) |
| MID | $300–$1,000 | $200 deposit → FX Basics or Education |
| LOW | any | No offer — channel only |
