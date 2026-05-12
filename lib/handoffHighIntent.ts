import type { InferSelectModel } from "drizzle-orm";
import { users, questionnaireAnswers } from "@/lib/db/schema";
import {
  getProductMatch,
  productKeyToChatwootLabelSuffix,
  type ProductKey,
} from "@/lib/productMatch";
import {
  buildPreApprovalUserMessage,
  buildQualifiedLeadCardText,
  capitalFromAnswers,
  type LeadCardExtras,
} from "@/lib/leadCardContent";
import { telegramSendMessage } from "@/lib/telegramBotApi";
import {
  findLatestConversationIdForTelegramUser,
  applyQualifiedLeadLabels,
} from "@/lib/chatwoot";
import { voluumPostbackUrl } from "@/lib/voluum";
import axios from "axios";

type UserRow = InferSelectModel<typeof users>;
type AnswerRow = InferSelectModel<typeof questionnaireAnswers> | null;

export async function sendHighIntentTelegramLead(
  user: UserRow,
  answers: AnswerRow,
  extras: LeadCardExtras,
): Promise<void> {
  await telegramSendMessage(user.telegramId, buildPreApprovalUserMessage(), {
    parse_mode: "Markdown",
  });
  await telegramSendMessage(
    user.telegramId,
    buildQualifiedLeadCardText(user, answers, extras),
  );
}

export async function runChatwootLabelsForHandoff(
  telegramId: number,
  productKey: ProductKey,
): Promise<string | null> {
  const conversationId =
    await findLatestConversationIdForTelegramUser(telegramId);
  if (conversationId) {
    await applyQualifiedLeadLabels(
      conversationId,
      productKeyToChatwootLabelSuffix(productKey),
    );
  }
  return conversationId;
}

/** Fire Voluum postback when user has CID (same as bot sendLead). */
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
