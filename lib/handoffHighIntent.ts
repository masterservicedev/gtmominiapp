import type { InferSelectModel } from "drizzle-orm";
import { users, questionnaireAnswers } from "@/lib/db/schema";
import {
  getProductMatch,
  productKeyToChatwootLabelSuffix,
  type ProductKey,
} from "@/lib/productMatch";
import {
  buildCustomerHandoffMessage,
  buildQualifiedLeadCardText,
  capitalFromAnswers,
  type LeadCardExtras,
} from "@/lib/leadCardContent";
import { telegramSendMessage } from "@/lib/telegramBotApi";
import {
  findOrCreateMiniAppConversation,
  getConversationLabelTitles,
  addChatwootNote,
  addLabel,
  assignToTeam,
  postLeadSummaryToTelegramInbox,
} from "@/lib/chatwoot";
import { conversationHasDepositConfirmedLabel } from "@/lib/chatwootDeposit";
import { voluumPostbackUrl } from "@/lib/voluum";
import axios from "axios";

type UserRow = InferSelectModel<typeof users>;
type AnswerRow = InferSelectModel<typeof questionnaireAnswers> | null;

/** Customer Telegram only — internal card goes to Chatwoot private note. */
export async function sendHighIntentTelegramLead(
  user: UserRow,
  answers: AnswerRow,
  extras?: LeadCardExtras,
): Promise<void> {
  await telegramSendMessage(
    user.telegramId,
    buildCustomerHandoffMessage(user, answers, extras),
    { parse_mode: "Markdown" },
  );
}

const SEGMENT_LABELS: Record<string, string> = {
  HIGH: "segment-high",
  MID: "segment-mid",
  LOW: "segment-low",
};

const CAPITAL_LABELS: Record<string, string> = {
  under_100: "capital-under-100",
  "100_300": "capital-100-300",
  "300_1000": "capital-300-1000",
  "1000_plus": "capital-1000-plus",
};

/**
 * Attach a HIGH lead to its existing Chatwoot conversation.
 *
 * Chatwoot owns the Telegram inbox: customer DMs and `/start` create the
 * conversation. This function NEVER creates one. If none exists yet,
 * returns null so the caller can fall back to direct Telegram.
 */
async function logLabel(
  conversationId: string,
  label: string,
): Promise<void> {
  const ok = await addLabel(conversationId, label);
  console.log(`[label] ${label}`, ok ? "success" : "fail");
}

export async function attachInternalLeadToChatwoot(
  telegramId: number,
  productKey: ProductKey,
  user: UserRow,
  answers: AnswerRow,
  extras?: LeadCardExtras,
): Promise<string | null> {
  console.log("[handoff] attachInternalLeadToChatwoot started", {
    telegramId,
    productKey,
    segment: user.segment,
  });

  // Find existing conversation OR create one in the API inbox
  let conversationId: string | null = user.chatwootConversationId ?? null;
  if (conversationId) {
    console.log(
      "[handoff] using stored chatwootConversationId:",
      conversationId,
    );
  } else {
    console.log(
      "[handoff] no stored conversation id — find or create in mini app inbox",
    );
    conversationId = await findOrCreateMiniAppConversation(
      telegramId,
      user.username ?? null,
      user.firstName ?? null,
    );
  }

  if (!conversationId) {
    console.error(
      "[handoff] Could not find or create Chatwoot conversation for",
      telegramId,
    );
    return null;
  }

  console.log("[handoff] conversation ready:", conversationId);

  if (extras?.reactivation) {
    const labelTitles = await getConversationLabelTitles(conversationId);
    if (conversationHasDepositConfirmedLabel(labelTitles)) {
      console.log(
        "[reactivate] skip pending labels because deposit-confirmed exists",
      );
      await addChatwootNote(
        conversationId,
        buildQualifiedLeadCardText(user, answers, extras),
      );
      console.log("[handoff] private reactivation note sent (deposit confirmed)");
      return conversationId;
    }
  }

  // Always send the customer-facing message via the Telegram Bot API.
  // Chatwoot API-type inboxes do not push outgoing messages to Telegram,
  // so we never rely on sendChatwootOutboundMessage for delivery.
  await sendHighIntentTelegramLead(user, answers, extras);
  console.log("[handoff] direct Telegram customer message sent");

  await addChatwootNote(
    conversationId,
    buildQualifiedLeadCardText(user, answers, extras),
  );
  console.log("[handoff] private lead note sent");

  console.log("[handoff] applying labels...");

  const productLabel = `product-${productKeyToChatwootLabelSuffix(productKey)}`;
  await logLabel(conversationId, "qualified-lead");
  await logLabel(conversationId, productLabel);
  await logLabel(conversationId, "deposit-pending");

  const segmentLabel = user.segment ? SEGMENT_LABELS[user.segment] : undefined;
  if (segmentLabel) {
    await logLabel(conversationId, segmentLabel);
  } else {
    console.log(
      "[label] segment-* skipped (no segment or UNSCORED):",
      user.segment,
    );
  }

  const capital = capitalFromAnswers(answers?.capital);
  const capitalLabel = CAPITAL_LABELS[capital];
  if (capitalLabel) {
    await logLabel(conversationId, capitalLabel);
  } else {
    console.log("[label] capital-* skipped (unknown capital):", capital);
  }

  await logLabel(conversationId, "handoff-requested");

  const teamRaw = process.env.CHATWOOT_CLOSERS_TEAM_ID;
  if (teamRaw) {
    const teamId = parseInt(teamRaw, 10);
    if (Number.isFinite(teamId)) {
      await assignToTeam(conversationId, teamId);
    }
  }

  // Post summary note to Telegram inbox so the agent sees the lead in context.
  // Fire-and-forget — failure does not affect the handoff result.
  const productTitle =
    extras?.productMatch?.primaryTitle ?? productKey;
  const capitalText = answers?.capital
    ? answers.capital.replace(/_/g, " ")
    : "—";
  const summaryNote = [
    `⚡ MINI APP LEAD — ${productKey.toUpperCase()}`,
    ``,
    `This user completed the GTMO application and has been matched.`,
    ``,
    `Product: ${productTitle}`,
    `Segment: ${user.segment ?? "—"}`,
    `Capital: ${capitalText}`,
    ``,
    `Full lead card and deposit tracking: API inbox conversation #${conversationId}`,
    `Apply deposit-confirmed label HERE (Telegram inbox) after deposit is verified.`,
  ].join("\n");

  console.log(
    `[handoff] posting summary to Telegram inbox for tg ${telegramId}`,
  );
  void postLeadSummaryToTelegramInbox(telegramId, summaryNote).catch((err) => {
    console.error("[handoff] Telegram inbox summary failed:", err);
  });

  return conversationId;
}

export async function fireCrmVoluumPostback(voluumCid: string | null) {
  if (!voluumCid || !process.env.VOLUUM_POSTBACK_URL) return;
  try {
    const url = voluumPostbackUrl(
      process.env.VOLUUM_POSTBACK_URL,
      voluumCid,
      "crm_triggered",
    );
    await axios.get(url);
  } catch (e) {
    console.error("Voluum postback failed:", e);
  }
}

export function buildLeadExtrasFromState(input: {
  capital: string | undefined;
  bundleEligible: boolean;
  bundleUsed: boolean;
  bundleAccepted: boolean | null;
  bundleOfferShown: boolean;
}): LeadCardExtras {
  const cap = capitalFromAnswers(input.capital);
  const productMatch = getProductMatch(
    cap,
    input.bundleEligible,
    input.bundleUsed,
  );
  return {
    productMatch,
    bundleOfferShown: input.bundleOfferShown,
    bundleAccepted: input.bundleAccepted,
  };
}
