import type { InferSelectModel } from "drizzle-orm";
import { addLabel } from "@/lib/chatwoot";
import { users } from "@/lib/db/schema";

type UserRow = InferSelectModel<typeof users>;

export const TRIAGE_LABEL_STARTED_NOT_OPENED = "started-not-opened";
export const TRIAGE_LABEL_QUESTIONNAIRE_INCOMPLETE = "questionnaire-incomplete";
export const TRIAGE_LABEL_NO_CONFIRM = "no-confirm";

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

/**
 * Phase 1 — label-only triage on Telegram inbox (977). No snooze, resolve, or delete.
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
    return;
  }

  if (!user.questionnaireCompleted) {
    await applyTriageLabel(conversationId, TRIAGE_LABEL_QUESTIONNAIRE_INCOMPLETE);
    return;
  }

  if (user.intentConfirmedAt == null) {
    await applyTriageLabel(conversationId, TRIAGE_LABEL_NO_CONFIRM);
  }
}
