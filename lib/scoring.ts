export type Capital =
  | "under_100"
  | "100_300"
  | "300_1000"
  | "1000_plus";
export type Experience = "beginner" | "some_experience" | "trades_already";
export type Goal =
  | "exploring"
  | "side_income"
  | "serious_income"
  | "full_time";
export type Readiness =
  | "not_ready"
  | "this_month"
  | "seven_days"
  | "ready_now";

export interface QuestionnaireInput {
  capital: Capital;
  experience: Experience;
  goal: Goal;
  readiness: Readiness;
}

export type Segment = "HIGH" | "MID" | "LOW";

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

const CAPITAL_SCORES: Record<Capital, number> = {
  under_100: 0,
  "100_300": 1,
  "300_1000": 2,
  "1000_plus": 3,
};

const EXPERIENCE_SCORES: Record<Experience, number> = {
  beginner: 0,
  some_experience: 1,
  trades_already: 1,
};

const READINESS_SCORES: Record<Readiness, number> = {
  not_ready: 0,
  this_month: 1,
  seven_days: 2,
  ready_now: 2,
};

const TIERS = {
  HIGH: { min: 5, max: 6 },
  MID: { min: 3, max: 4 },
  LOW: { min: 0, max: 2 },
};

export function calculateScore(input: QuestionnaireInput): ScoreResult {
  const capitalPoints = CAPITAL_SCORES[input.capital];
  const experiencePoints = EXPERIENCE_SCORES[input.experience];
  const readinessPoints = READINESS_SCORES[input.readiness];

  const rawScore = capitalPoints + experiencePoints + readinessPoints;

  let cappedScore = rawScore;
  let cappingApplied = false;
  let floorApplied = false;

  if (input.capital === "under_100") {
    if (cappedScore > 2) {
      cappedScore = 2;
      cappingApplied = true;
    }
  }

  if (capitalPoints >= 2 && readinessPoints >= 1 && cappedScore < 4) {
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
  if (score >= TIERS.HIGH.min) return "HIGH";
  if (score >= TIERS.MID.min) return "MID";
  return "LOW";
}

export function reScore(
  currentScore: number,
  trigger: "bot_reply" | "broker_click" | "app_revisit",
): {
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
  const newScore = Math.min(currentScore + increment, 6);
  const segment = getSegment(newScore);
  const upgraded =
    segment === "HIGH" && getSegment(currentScore) !== "HIGH";

  return { newScore, segment, upgraded };
}
