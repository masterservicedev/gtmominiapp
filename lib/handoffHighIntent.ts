import type { InferSelectModel } from "drizzle-orm";
import { db } from "@/lib/db";
import { and, eq, isNull } from "drizzle-orm";
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
  ensureTelegramContactInbox,
  findTelegramInboxConversationForContact,
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

/**
 * Build the agent-facing summary note that gets posted into the Telegram
 * inbox conversation. Exported so the webhook handler can rebuild the same
 * note when the Telegram conversation is created after handoff.
 */
export function buildTelegramInboxSummary(args: {
  productKey: string;
  productTitle: string;
  segment: string | null;
  capital: string | null | undefined;
  apiConversationId: string | null;
}): string {
  const capitalText = args.capital ? args.capital.replace(/_/g, " ") : "—";
  return [
    `⚡ MINI APP LEAD — ${args.productKey.toUpperCase()}`,
    ``,
    `This user completed the GTMO application and has been matched.`,
    ``,
    `Product: ${args.productTitle}`,
    `Segment: ${args.segment ?? "—"}`,
    `Capital: ${capitalText}`,
    ``,
    args.apiConversationId
      ? `Full lead card and deposit tracking: API inbox conversation #${args.apiConversationId}`
      : `Full lead card and deposit tracking: API inbox conversation (id not yet recorded)`,
    `Apply deposit-confirmed label HERE (Telegram inbox) after deposit is verified.`,
  ].join("\n");
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

  const knownContactId = parseStoredContactId(user.chatwootContactId);

  const resolved = await findOrCreateMiniAppConversation(
    telegramId,
    user.username ?? null,
    user.firstName ?? null,
    knownContactId,
  );

  if (!resolved) {
    console.error(
      "[handoff] Could not resolve canonical Chatwoot contact for",
      telegramId,
    );
    return null;
  }

  const { contactId, apiConversationId, contactCreated } = resolved;
  console.log("[handoff] canonical contact resolved", {
    contactId,
    apiConversationId,
    contactCreated,
  });

  // Persist canonical contact + API inbox conversation id immediately so any
  // subsequent webhook event (deposit-confirmed, etc.) can route by primary key.
  // Mirror the API inbox id into the legacy `chatwootConversationId` column so
  // every existing reader of that column keeps working during rollout.
  await db
    .update(users)
    .set({
      chatwootContactId: String(contactId),
      chatwootApiConversationId: apiConversationId,
      chatwootConversationId: apiConversationId,
    })
    .where(eq(users.id, user.id));

  // Pre-bind the canonical contact to the Telegram inbox BEFORE any inbound
  // Telegram event arrives. Chatwoot's Telegram ingestion reuses this row when
  // the user later messages the bot, preventing the split-contact problem.
  const bindingResult = await ensureTelegramContactInbox({
    contactId,
    telegramId,
  });
  if (bindingResult.status === "conflict_requires_reconciliation") {
    console.error(
      "[chatwoot] chatwoot_split_contact_reconciliation_required",
      {
        telegramId,
        canonicalContactId: contactId,
        reason: "telegram_contact_inbox_binding_conflict",
        details: bindingResult.details,
      },
    );
  } else {
    console.log(`[chatwoot] telegram contact_inbox binding: ${bindingResult.status}`, {
      contactId,
      telegramId,
    });
  }

  if (extras?.reactivation) {
    const labelTitles = await getConversationLabelTitles(apiConversationId);
    if (conversationHasDepositConfirmedLabel(labelTitles)) {
      console.log(
        "[reactivate] skip pending labels because deposit-confirmed exists",
      );
      await addChatwootNote(
        apiConversationId,
        buildQualifiedLeadCardText(user, answers, extras),
      );
      console.log("[handoff] private reactivation note sent (deposit confirmed)");
      return apiConversationId;
    }
  }

  // Always send the customer-facing message via the Telegram Bot API.
  // Chatwoot API-type inboxes do not push outgoing messages to Telegram,
  // so we never rely on sendChatwootOutboundMessage for delivery.
  await sendHighIntentTelegramLead(user, answers, extras);
  console.log("[handoff] direct Telegram customer message sent");

  await addChatwootNote(
    apiConversationId,
    buildQualifiedLeadCardText(user, answers, extras),
  );
  console.log("[handoff] private lead note sent");

  console.log("[handoff] applying labels...");

  const productLabel = `product-${productKeyToChatwootLabelSuffix(productKey)}`;
  await logLabel(apiConversationId, "qualified-lead");
  await logLabel(apiConversationId, productLabel);
  await logLabel(apiConversationId, "deposit-pending");

  const segmentLabel = user.segment ? SEGMENT_LABELS[user.segment] : undefined;
  if (segmentLabel) {
    await logLabel(apiConversationId, segmentLabel);
  } else {
    console.log(
      "[label] segment-* skipped (no segment or UNSCORED):",
      user.segment,
    );
  }

  const capital = capitalFromAnswers(answers?.capital);
  const capitalLabel = CAPITAL_LABELS[capital];
  if (capitalLabel) {
    await logLabel(apiConversationId, capitalLabel);
  } else {
    console.log("[label] capital-* skipped (unknown capital):", capital);
  }

  await logLabel(apiConversationId, "handoff-requested");

  const teamRaw = process.env.CHATWOOT_CLOSERS_TEAM_ID;
  if (teamRaw) {
    const teamId = parseInt(teamRaw, 10);
    if (Number.isFinite(teamId)) {
      await assignToTeam(apiConversationId, teamId);
    }
  }

  // Post Telegram inbox summary now if the 977 conversation already exists.
  // For paid traffic with no prior Telegram message, it will not. In that case
  // the webhook handler posts it later when the 977 conversation is created.
  // The content matches the inbox 976 private note so the agent sees the same
  // full lead card in their working inbox.
  await maybePostTelegramInboxSummaryAtHandoff({
    userId: user.id,
    contactId,
    alreadyPosted: user.chatwootTelegramSummaryPostedAt != null,
    content: buildQualifiedLeadCardText(user, answers, extras),
  });

  return apiConversationId;
}

function parseStoredContactId(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

async function maybePostTelegramInboxSummaryAtHandoff(args: {
  userId: string;
  contactId: number;
  alreadyPosted: boolean;
  content: string;
}): Promise<void> {
  if (args.alreadyPosted) {
    console.log("[handoff] telegram inbox summary already posted previously");
    return;
  }

  const telegramConvId = await findTelegramInboxConversationForContact(
    args.contactId,
  );
  if (!telegramConvId) {
    console.log(
      "[handoff] no telegram inbox conversation yet — webhook will post summary on first inbound",
    );
    return;
  }

  // Conditional update guards against duplicate posts from races with the
  // webhook handler. Only the first caller flips the timestamp from NULL.
  const claimed = await db
    .update(users)
    .set({
      chatwootTelegramConversationId: telegramConvId,
      chatwootTelegramSummaryPostedAt: new Date(),
    })
    .where(
      and(
        eq(users.id, args.userId),
        isNull(users.chatwootTelegramSummaryPostedAt),
      ),
    )
    .returning({ id: users.id });

  if (claimed.length === 0) {
    console.log(
      "[handoff] telegram inbox summary already claimed by another path — skip",
    );
    return;
  }

  try {
    await addChatwootNote(telegramConvId, args.content);
    console.log(
      `[handoff] telegram inbox lead card posted to conversation ${telegramConvId}`,
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(
      "[handoff] telegram inbox lead card post failed — rolling back idempotency flag",
      msg,
    );
    await db
      .update(users)
      .set({ chatwootTelegramSummaryPostedAt: null })
      .where(eq(users.id, args.userId));
  }
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
