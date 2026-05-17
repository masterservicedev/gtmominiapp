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
  findOrCreateChatwootConversation,
  applyQualifiedLeadLabels,
  addChatwootNote,
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

/**
 * Post full lead card as Chatwoot private note, then labels + team.
 * Creates a Chatwoot contact/conversation when none exists yet.
 */
export async function attachInternalLeadToChatwoot(
  telegramId: number,
  productKey: ProductKey,
  user: UserRow,
  answers: AnswerRow,
  extras?: LeadCardExtras,
): Promise<string | null> {
  const conversationId = await findOrCreateChatwootConversation(
    telegramId,
    user.username ?? null,
    user.firstName ?? null,
    null,
  );

  if (!conversationId) {
    console.error(
      "[handoff] Could not find or create Chatwoot conversation for",
      telegramId,
    );
    return null;
  }

  await addChatwootNote(
    conversationId,
    buildQualifiedLeadCardText(user, answers, extras),
  );
  await applyQualifiedLeadLabels(
    conversationId,
    productKeyToChatwootLabelSuffix(productKey),
  );
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
