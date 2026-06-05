import type { InferSelectModel } from "drizzle-orm";
import { eq } from "drizzle-orm";
import {
  addLabel,
  findTelegramInboxConversationForTelegramUser,
  removeLabelsFromConversation,
} from "@/lib/chatwoot";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

type UserRow = InferSelectModel<typeof users>;

export const TRIAGE_LABEL_STARTED_NOT_OPENED = "started-not-opened";
export const TRIAGE_LABEL_QUESTIONNAIRE_INCOMPLETE = "questionnaire-incomplete";
export const TRIAGE_LABEL_NO_CONFIRM = "no-confirm";

export const STALE_TRIAGE_LABELS = [
  TRIAGE_LABEL_STARTED_NOT_OPENED,
  TRIAGE_LABEL_QUESTIONNAIRE_INCOMPLETE,
  TRIAGE_LABEL_NO_CONFIRM,
] as const;

/** Confirmed leads and depositors stay out of non-completer triage. */
export function isTelegramInboxLeadProtected(user: UserRow): boolean {
  return (
    user.intentConfirmedAt != null ||
    user.crmTriggered === true ||
    user.bundleUsed === true
  );
}

async function applyTriageLabel(
  conversationId: string,
  label: string,
): Promise<void> {
  const ok = await addLabel(conversationId, label);
  if (ok) {
    console.log("[chatwoot-triage]", label, { conversationId });
  } else {
    console.error("[chatwoot-triage] label failed", { conversationId, label });
  }
}

/** Remove named stale triage labels without touching priority, deposit-confirmed, or agent labels. */
export async function removeStaleTelegramInboxTriageLabels(
  conversationId: string,
  labels: readonly string[] = STALE_TRIAGE_LABELS,
): Promise<void> {
  const ok = await removeLabelsFromConversation(conversationId, [...labels]);
  if (ok) {
    console.log("[chatwoot-triage] stale labels removed", {
      conversationId,
      labels: [...labels],
    });
  } else {
    console.error("[chatwoot-triage] stale label removal failed", {
      conversationId,
      labels: [...labels],
    });
  }
}

/**
 * Resolve the Telegram inbox conversation id for triage/mirror side effects.
 * Prefers the stored row, then searches Chatwoot across all contact rows.
 */
export async function resolveTelegramInboxConversationId(
  user: UserRow,
): Promise<string | null> {
  const stored = user.chatwootTelegramConversationId?.trim();
  if (stored) return stored;
  return findTelegramInboxConversationForTelegramUser(user.telegramId);
}

/**
 * Backfill `chatwoot_telegram_conversation_id` when discoverable, then apply
 * triage rules. Safe to call from init/score without blocking the HTTP response.
 */
export async function syncTelegramInbox977TriageForUser(
  user: UserRow,
): Promise<void> {
  const conversationId = await resolveTelegramInboxConversationId(user);
  if (!conversationId) return;

  if (!user.chatwootTelegramConversationId) {
    await db
      .update(users)
      .set({ chatwootTelegramConversationId: conversationId })
      .where(eq(users.id, user.id));
  }

  await applyTelegramInbox977Triage({
    conversationId,
    telegramId: user.telegramId,
    user,
  });
}

/**
 * Phase 1 — label-only triage on Telegram inbox (977). No snooze, resolve, or delete.
 * Removes stale non-completer labels when the user progresses through the funnel.
 */
export async function applyTelegramInbox977Triage(args: {
  conversationId: string;
  telegramId: number;
  user: UserRow | null;
}): Promise<void> {
  const { conversationId, telegramId, user } = args;

  if (!user) {
    await applyTriageLabel(conversationId, TRIAGE_LABEL_STARTED_NOT_OPENED);
    console.log("[chatwoot-triage] started-not-opened", {
      conversationId,
      telegramId,
    });
    return;
  }

  if (isTelegramInboxLeadProtected(user)) {
    await removeStaleTelegramInboxTriageLabels(conversationId);
    return;
  }

  if (user.questionnaireCompleted) {
    await removeStaleTelegramInboxTriageLabels(conversationId, [
      TRIAGE_LABEL_STARTED_NOT_OPENED,
      TRIAGE_LABEL_QUESTIONNAIRE_INCOMPLETE,
    ]);
    if (user.intentConfirmedAt == null) {
      await applyTriageLabel(conversationId, TRIAGE_LABEL_NO_CONFIRM);
    }
    return;
  }

  await applyTriageLabel(conversationId, TRIAGE_LABEL_QUESTIONNAIRE_INCOMPLETE);
}
