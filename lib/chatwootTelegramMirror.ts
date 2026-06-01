import { db } from "@/lib/db";
import { events, users } from "@/lib/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import {
  addChatwootNote,
  applyTelegramInboxPriorityLabel,
  findTelegramInboxConversationForContact,
} from "@/lib/chatwoot";

type UserRow = InferSelectModel<typeof users>;

export const CHATWOOT_TELEGRAM_SUMMARY_MIRROR_EVENT =
  "chatwoot_telegram_summary_posted" as const;

export type TelegramMirrorSource = "handoff" | "webhook";

export type TelegramMirrorMetadata = {
  apiConversationId: string;
  telegramConversationId: string;
  source: TelegramMirrorSource;
};

/** True when this API inbox conversation was already mirrored to Telegram inbox 977. */
export async function hasTelegramSummaryMirrorForApiConversation(
  userId: string,
  apiConversationId: string,
): Promise<boolean> {
  const apiId = String(apiConversationId);
  const [row] = await db
    .select({ id: events.id })
    .from(events)
    .where(
      and(
        eq(events.userId, userId),
        eq(events.eventType, CHATWOOT_TELEGRAM_SUMMARY_MIRROR_EVENT),
        sql`${events.metadata}->>'apiConversationId' = ${apiId}`,
      ),
    )
    .limit(1);
  return row != null;
}

/**
 * Latest API inbox conversation id that does not yet have a mirror event.
 * Prefers `users.chatwoot_api_conversation_id`, then `handoff_confirmed` events.
 */
export async function findLatestUnmirroredApiConversationId(
  user: UserRow,
): Promise<string | null> {
  const candidates: string[] = [];
  const fromUser =
    user.chatwootApiConversationId ?? user.chatwootConversationId ?? null;
  if (fromUser) candidates.push(String(fromUser));

  const handoffs = await db
    .select({ metadata: events.metadata })
    .from(events)
    .where(
      and(
        eq(events.userId, user.id),
        eq(events.eventType, "handoff_confirmed"),
      ),
    )
    .orderBy(desc(events.createdAt))
    .limit(20);

  for (const row of handoffs) {
    const meta = row.metadata as { conversationId?: string | null } | null;
    const id = meta?.conversationId;
    if (id) {
      const s = String(id);
      if (!candidates.includes(s)) candidates.push(s);
    }
  }

  for (const apiConversationId of candidates) {
    if (
      !(await hasTelegramSummaryMirrorForApiConversation(
        user.id,
        apiConversationId,
      ))
    ) {
      return apiConversationId;
    }
  }
  return null;
}

export type MirrorLeadCardResult =
  | "posted"
  | "already_mirrored"
  | "post_failed";

/**
 * Mirror a 976 lead card to Telegram inbox 977 once per API conversation.
 * `users.chatwoot_telegram_summary_posted_at` is updated as last-mirrored only.
 */
export async function mirrorLeadCardToTelegramInbox(args: {
  userId: string;
  telegramId: number;
  apiConversationId: string;
  telegramConversationId: string;
  content: string;
  source: TelegramMirrorSource;
  country?: string | null;
}): Promise<MirrorLeadCardResult> {
  const apiId = String(args.apiConversationId);
  const telegramId = String(args.telegramConversationId);

  if (await hasTelegramSummaryMirrorForApiConversation(args.userId, apiId)) {
    await applyTelegramInboxPriorityLabel(telegramId);
    console.log(
      "[handoff] telegram mirror already recorded for api conversation — priority ensured",
      { apiConversationId: apiId, telegramConversationId: telegramId },
    );
    return "already_mirrored";
  }

  // Post the 977 note first. Only on success do we apply priority, record the
  // mirror event, and stamp the last-mirrored timestamp. If the note fails we
  // record nothing so a later webhook can retry this apiConversationId.
  const noteOk = await addChatwootNote(telegramId, args.content);
  if (!noteOk) {
    console.error(
      "[handoff] telegram inbox mirror note failed — not recording mirror (will retry on next inbound)",
      { apiConversationId: apiId, telegramConversationId: telegramId },
    );
    return "post_failed";
  }
  await applyTelegramInboxPriorityLabel(telegramId);

  await db.insert(events).values({
    userId: args.userId,
    telegramId: args.telegramId,
    eventType: CHATWOOT_TELEGRAM_SUMMARY_MIRROR_EVENT,
    metadata: {
      apiConversationId: apiId,
      telegramConversationId: telegramId,
      source: args.source,
    } satisfies TelegramMirrorMetadata,
    country: args.country ?? null,
  });

  await db
    .update(users)
    .set({
      chatwootTelegramConversationId: telegramId,
      chatwootTelegramSummaryPostedAt: new Date(),
    })
    .where(eq(users.id, args.userId));

  console.log("[handoff] telegram inbox lead card mirrored", {
    apiConversationId: apiId,
    telegramConversationId: telegramId,
    source: args.source,
  });

  return "posted";
}

/** Immediate mirror at handoff when a 977 conversation already exists. */
export async function maybePostTelegramInboxSummaryAtHandoff(args: {
  user: UserRow;
  contactId: number;
  apiConversationId: string;
  content: string;
}): Promise<void> {
  const telegramConvId = await findTelegramInboxConversationForContact(
    args.contactId,
  );
  if (!telegramConvId) {
    console.log(
      "[handoff] no telegram inbox conversation yet — webhook will mirror on first inbound",
      { apiConversationId: args.apiConversationId },
    );
    return;
  }

  await mirrorLeadCardToTelegramInbox({
    userId: args.user.id,
    telegramId: args.user.telegramId,
    apiConversationId: args.apiConversationId,
    telegramConversationId: telegramConvId,
    content: args.content,
    source: "handoff",
    country: args.user.country,
  });
}
