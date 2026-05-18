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
  findLatestConversationIdForTelegramUser,
  applyQualifiedLeadLabels,
  addChatwootNote,
  sendChatwootOutboundMessage,
  addLabel,
} from "@/lib/chatwoot";
import { voluumPostbackUrl } from "@/lib/voluum";
import axios from "axios";

type UserRow = InferSelectModel<typeof users>;
type AnswerRow = InferSelectModel<typeof questionnaireAnswers> | null;

/** Customer Telegram only — internal card goes to Chatwoot private note. */
export async function sendHighIntentTelegramLead(
  user: UserRow,
  answers: AnswerRow,
  extras: LeadCardExtras,
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
export async function attachInternalLeadToChatwoot(
  telegramId: number,
  productKey: ProductKey,
  user: UserRow,
  answers: AnswerRow,
  extras?: LeadCardExtras,
): Promise<string | null> {
  const conversationId =
    await findLatestConversationIdForTelegramUser(telegramId);

  if (!conversationId) {
    console.log(
      "[handoff] No existing Chatwoot conversation for tg",
      telegramId,
    );
    return null;
  }

  await sendChatwootOutboundMessage(
    conversationId,
    buildCustomerHandoffMessage(user, answers, extras),
  );

  await addChatwootNote(
    conversationId,
    buildQualifiedLeadCardText(user, answers, extras),
  );

  await applyQualifiedLeadLabels(
    conversationId,
    productKeyToChatwootLabelSuffix(productKey),
  );

  const segmentLabel = user.segment ? SEGMENT_LABELS[user.segment] : undefined;
  if (segmentLabel) {
    await addLabel(conversationId, segmentLabel);
  }

  const capital = capitalFromAnswers(answers?.capital);
  const capitalLabel = CAPITAL_LABELS[capital];
  if (capitalLabel) {
    await addLabel(conversationId, capitalLabel);
  }

  await addLabel(conversationId, "handoff-requested");

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
