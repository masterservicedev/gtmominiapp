// Re-engagement broadcast messages with A/B/C split testing.
// Variant is stored on nurture_queue at schedule time; tracked via events.

import { productCatalog } from "@/lib/productCatalog";
import type { ProductKey } from "@/lib/productMatch";

export const RE_ENGAGEMENT_BROADCAST_TYPES = [
  "reactivation_48h",
  "reactivation_day5",
  "high_to_mid_day14",
  "mid_day7",
  "mid_day14",
  "mid_day21",
  "low_day14",
  "low_day30",
] as const;

export type ReEngagementBroadcastType =
  (typeof RE_ENGAGEMENT_BROADCAST_TYPES)[number];

export type MessageVariant = "A" | "B" | "C";

export const MESSAGE_VARIANTS: MessageVariant[] = ["A", "B", "C"];

export const RE_ENGAGEMENT_LABELS: Record<ReEngagementBroadcastType, string> = {
  reactivation_48h: "HIGH · 48h no deposit",
  reactivation_day5: "HIGH · Day 5 no deposit",
  high_to_mid_day14: "HIGH → MID (Day 14 reclass)",
  mid_day7: "MID · Day 7",
  mid_day14: "MID · Day 14",
  mid_day21: "MID · Day 21 final",
  low_day14: "LOW · Day 14",
  low_day30: "LOW · Day 30 final",
};

/** Types included in A/B/C split-test dashboard (no user-facing DM). */
export const BROADCAST_SPLIT_TYPES = RE_ENGAGEMENT_BROADCAST_TYPES.filter(
  (t) => t !== "high_to_mid_day14",
);

export type ReEngagementPreviewInput = {
  firstName: string | null;
  confirmedProductKey: string | null;
  bundleEligible: boolean;
  bundleUsed: boolean;
};

export function isReEngagementBroadcastType(
  v: string | null | undefined,
): v is ReEngagementBroadcastType {
  return (
    v != null &&
    (RE_ENGAGEMENT_BROADCAST_TYPES as readonly string[]).includes(v)
  );
}

function getProductName(key: string | null): string {
  if (!key) return "your selected product";
  return (
    productCatalog[key as ProductKey]?.displayName ?? "your selected product"
  );
}

function bundleLine(bundleEligible: boolean, bundleUsed: boolean): string {
  if (bundleEligible && !bundleUsed) {
    return "\n\nYour mini app exclusive bundle offer is still held for you.";
  }
  return "";
}

/**
 * Random A/B/C unless RE_ENGAGEMENT_VARIANT_MODE=a_only (ship infra before volume).
 */
export function assignVariant(): MessageVariant {
  const mode =
    typeof process !== "undefined"
      ? (process.env.RE_ENGAGEMENT_VARIANT_MODE ?? "").trim().toLowerCase()
      : "";
  if (mode === "a_only") return "A";
  return MESSAGE_VARIANTS[
    Math.floor(Math.random() * MESSAGE_VARIANTS.length)
  ]!;
}

export const VARIANT_STRATEGY: Record<MessageVariant, string> = {
  A: "Direct — names product, single clear action. Hypothesis: stronger for HIGH.",
  B: "Proof-led — references channel results. Hypothesis: stronger for MID.",
  C: "Pressure-release — low friction. Hypothesis: stronger for LOW.",
};

export function buildReEngagementTelegramBody(
  broadcastType: ReEngagementBroadcastType,
  u: ReEngagementPreviewInput,
  variant: MessageVariant = "A",
): string {
  const product = getProductName(u.confirmedProductKey);
  const name = u.firstName || "there";
  const bl = bundleLine(u.bundleEligible, u.bundleUsed);

  switch (broadcastType) {
    case "reactivation_48h":
      return {
        A: `Hey ${name},\n\nYou applied for ${product} access — your spot is still held.${bl}\n\nYour specialist is ready when you are.\n\nReply *READY* and they'll pick this up straight away.`,
        B: `${name}, just checking in.\n\nThe channel has been live every day since you applied. The calls are there.${bl}\n\nYour ${product} access is still reserved. Reply *READY* and a specialist picks it up immediately.`,
        C: `Hey ${name} — no pressure, just keeping you in the loop.\n\nYour ${product} spot is still open.${bl}\n\nIf now's not the right time, just say so. If you're ready — reply *READY* and we'll take it from there.`,
      }[variant];

    case "reactivation_day5":
      return {
        A: `${name}, your ${product} offer hasn't been claimed yet.${bl}\n\nThis was reserved for you when you applied. It won't stay open indefinitely.\n\nReply *READY* if you're ready to move forward. If timing is the issue, let me know.`,
        B: `${name} — five days in the channel.\n\nYou've seen what the signals look like. You've seen the take profits hit.${bl}\n\nYour ${product} access is still sitting here. The next step is one reply away.\n\nReply *READY*.`,
        C: `${name}, still here when you're ready.\n\nYour ${product} offer is open.${bl}\n\nNo rush — but if something was holding you back, your specialist can walk through it with you. Just reply *READY* and they'll be in touch.`,
      }[variant];

    case "high_to_mid_day14":
      return "";

    case "mid_day7":
      return {
        A: `${name}, you've had a week inside the GTMO channel.\n\nYou've seen the calls. You've seen the results.\n\nYour ${product} access is still available at the level you qualified for.${bl}\n\nReply *READY* when you're ready to activate it.`,
        B: `${name} — one week of signals.\n\nLast week alone: 23 take profits, 1 stop loss.\n\nThat's the environment your ${product} access puts you inside — not watching from the sidelines.${bl}\n\nReply *READY* to activate.`,
        C: `${name}, no pressure — just wanted to check in after your first week.\n\nThe channel is there every day. When the timing is right for you, so is your ${product} offer.${bl}\n\nReply *READY* or tap below when you're ready to activate.`,
      }[variant];

    case "mid_day14":
      return {
        A: `Two weeks in the channel, ${name}.\n\nThe calls have been consistent. You've seen it work.\n\nYour ${product} offer is still here.${bl}\n\nReply *READY* and a specialist will walk you through the next step.`,
        B: `${name} — two weeks of live trading calls.\n\nThe traders inside who started where you are now aren't watching anymore — they're executing.\n\nYour ${product} access changes that.${bl}\n\nReply *READY*.`,
        C: `Hey ${name}.\n\nStill here, no rush.\n\nTwo weeks is enough time to decide whether this is real. You've seen it is.${bl}\n\nWhenever you're ready, your ${product} offer is one reply away. Just say *READY*.`,
      }[variant];

    case "mid_day21":
      return {
        A: `Last message from us, ${name}.\n\nIf the timing still isn't right, that's fine. The free channel is always here.\n\nWhen you're ready to go further — reply *READY* at any point and we'll pick up exactly where you left off.`,
        B: `${name} — three weeks of calls, entries, and take profits.\n\nThis is the last time I'll reach out. But the offer doesn't disappear.\n\nWhen you're ready — reply *READY*. We'll be there.`,
        C: `Hey ${name}.\n\nLast one from us. No hard sell — just wanted you to know the door is open whenever you are.\n\nReply *READY* any time. A specialist will pick it up.`,
      }[variant];

    case "low_day14":
      return {
        A: `${name}, you've been following the channel for a couple of weeks now.\n\nHas anything changed for you since you first joined?`,
        B: `${name} — two weeks of signals, two weeks of results you've seen yourself.\n\nIs the timing any better for you now than when you first joined?`,
        C: `Hey ${name}.\n\nNo agenda here — just checking in after a couple of weeks.\n\nHas anything shifted for you since you first came through?`,
      }[variant];

    case "low_day30":
      return {
        A: `${name} — last check-in from us.\n\nThe channel is live every single day. When you're ready to go beyond the free access, we're here.\n\nJust reply *READY* at any point and a specialist will be in touch.`,
        B: `${name}, one last message.\n\nA month of calls. A month of results. You've seen what's possible.\n\nWhen the timing is right — reply *READY*. We'll pick it up from there.`,
        C: `Hey ${name}.\n\nThis is the last time I'll reach out — but the channel and your offer aren't going anywhere.\n\nReady when you are. Just reply *READY*.`,
      }[variant];

    default:
      return "";
  }
}

export function buildReEngagementAdminHint(
  broadcastType: ReEngagementBroadcastType,
): string {
  switch (broadcastType) {
    case "high_to_mid_day14":
      return "No DM sent. DB update only: segment → MID, cancel pending 48h/Day5 rows, schedule MID Day 7 from this timestamp.";
    case "mid_day7":
    case "mid_day14":
      return 'Includes inline button "Activate my access" → WebApp /reactivate?startapp=reactivate_{offer_uuid}';
    case "mid_day21":
      return "After send: set user segment → LOW in DB.";
    case "low_day14":
      return 'Includes inline buttons: "I\'m ready to explore options now" / "Still need more time"';
    case "low_day30":
      return "Final automated message for this sequence.";
    case "reactivation_48h":
    case "reactivation_day5":
      return "Plain text only. Reply READY in chat → agent picks up via Chatwoot.";
    default:
      return "";
  }
}

export function telegramBodyToAdminPlain(body: string): string {
  return body.replace(/\*([^*]+)\*/g, "$1");
}

export function normalizeMessageVariant(
  raw: string | null | undefined,
): MessageVariant {
  if (raw === "B" || raw === "C") return raw;
  return "A";
}
