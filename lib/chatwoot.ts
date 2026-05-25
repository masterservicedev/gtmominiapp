import axios from "axios";
import { collectLabelTitles } from "@/lib/chatwootDeposit";

const chatwoot = axios.create({
  baseURL: `${process.env.CHATWOOT_BASE_URL}/api/v1`,
  headers: {
    api_access_token: process.env.CHATWOOT_API_TOKEN,
    "Content-Type": "application/json",
  },
});

const ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID;

export async function addChatwootNote(
  conversationId: string,
  content: string,
) {
  try {
    await chatwoot.post(
      `/accounts/${ACCOUNT_ID}/conversations/${conversationId}/messages`,
      {
        content,
        message_type: "outgoing",
        private: true,
      },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Chatwoot note error:", msg);
  }
}

/** Normalized lowercase label titles on a conversation (live Chatwoot API). */
export async function getConversationLabelTitles(
  conversationId: string,
): Promise<string[]> {
  if (!ACCOUNT_ID) return [];
  try {
    const { data } = await chatwoot.get(
      `/accounts/${ACCOUNT_ID}/conversations/${conversationId}`,
    );
    return collectLabelTitles(data as Record<string, unknown>);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Chatwoot get labels error:", msg);
    return [];
  }
}

export async function addLabel(
  conversationId: string,
  label: string,
): Promise<boolean> {
  try {
    const { data } = await chatwoot.get(
      `/accounts/${ACCOUNT_ID}/conversations/${conversationId}`,
    );
    const currentLabels: string[] = data.labels || [];

    if (!currentLabels.includes(label)) {
      await chatwoot.post(
        `/accounts/${ACCOUNT_ID}/conversations/${conversationId}/labels`,
        { labels: [...currentLabels, label] },
      );
    }
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Chatwoot label error:", msg);
    return false;
  }
}

export async function assignToTeam(conversationId: string, teamId: number) {
  try {
    await chatwoot.patch(
      `/accounts/${ACCOUNT_ID}/conversations/${conversationId}/assignments`,
      { team_id: teamId },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Chatwoot assign team error:", msg);
  }
}

type ContactPayload = { id?: number };

export async function findContactByTelegramId(telegramId: number) {
  const list = await findContactsByTelegramId(telegramId);
  return list[0] ?? null;
}

async function findContactsByTelegramId(
  telegramId: number,
): Promise<ContactPayload[]> {
  try {
    const { data } = await chatwoot.get<{ payload?: ContactPayload[] }>(
      `/accounts/${ACCOUNT_ID}/contacts/search?q=${telegramId}`,
    );
    return Array.isArray(data?.payload) ? data.payload : [];
  } catch {
    return [];
  }
}

type ConvPayload = {
  id?: number;
  inbox_id?: number;
  status?: string;
  last_activity_at?: number;
  created_at?: number;
  contact_inbox?: { source_id?: string | number };
  meta?: {
    sender?: {
      additional_attributes?: {
        social_telegram_user_id?: string | number;
      };
    };
  };
};

export type ConversationStatus = {
  status: string | null;
  assigneeId: number | null;
  teamId: number | null;
  inboxId: number | null;
};

export async function getConversationStatus(
  conversationId: string,
): Promise<ConversationStatus | null> {
  if (!ACCOUNT_ID) return null;
  try {
    const { data } = await chatwoot.get<{
      status?: string;
      meta?: {
        assignee?: { id?: number };
        team?: { id?: number };
        inbox_id?: number;
      };
    }>(`/accounts/${ACCOUNT_ID}/conversations/${conversationId}`);
    return {
      status: data.status ?? null,
      assigneeId: data.meta?.assignee?.id ?? null,
      teamId: data.meta?.team?.id ?? null,
      inboxId: data.meta?.inbox_id ?? null,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Chatwoot getConversationStatus error:", msg);
    return null;
  }
}

/** Open conversations with no assignee (for ops insight). Returns null if Chatwoot is unavailable. */
export async function countOpenUnassignedConversations(): Promise<number | null> {
  if (!ACCOUNT_ID) return null;
  try {
    const { data } = await chatwoot.get<{
      data?: { id?: number }[];
      payload?: { id?: number }[];
      meta?: { all_count?: number; count?: number };
    }>(`/accounts/${ACCOUNT_ID}/conversations`, {
      params: {
        status: "open",
        assignee_type: "unassigned",
        page: 1,
      },
    });
    const metaCount = data.meta?.all_count ?? data.meta?.count;
    if (typeof metaCount === "number") return metaCount;
    const list = Array.isArray(data.data)
      ? data.data
      : Array.isArray(data.payload)
        ? data.payload
        : [];
    return list.length;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Chatwoot unassigned count error:", msg);
    return null;
  }
}

/**
 * Find the latest Chatwoot conversation for a Telegram user.
 *
 * Walks every contact returned by /contacts/search (Chatwoot can register
 * multiple contact rows for the same Telegram id) and, for each, fetches
 * /contacts/{id}/conversations. Matches require both:
 *   - inbox_id === CHATWOOT_MINIAPP_INBOX_ID (when env is set)
 *   - contact_inbox.source_id === telegramId
 *     OR meta.sender.additional_attributes.social_telegram_user_id === telegramId
 * Sorted by last_activity_at desc, then created_at desc, with status
 * open/pending preferred.
 */
export async function findLatestConversationIdForTelegramUser(
  telegramId: number,
): Promise<string | null> {
  if (!ACCOUNT_ID) return null;

  console.log("[chatwoot-find] searching tg:", telegramId);
  const contacts = await findContactsByTelegramId(telegramId);
  console.log("[chatwoot-find] contact candidates count:", contacts.length);

  if (contacts.length === 0) {
    console.log("[chatwoot-find] no matching conversation found");
    return null;
  }

  const inboxIdRaw = process.env.CHATWOOT_MINIAPP_INBOX_ID;
  const targetInbox = inboxIdRaw ? Number(inboxIdRaw) : NaN;
  const inboxFilterActive = Number.isFinite(targetInbox);

  const tgStr = String(telegramId);
  const tgNum = Number(telegramId);

  const matches: ConvPayload[] = [];

  for (const contact of contacts) {
    const contactId = contact?.id;
    if (contactId == null) continue;
    console.log("[chatwoot-find] checking contact:", contactId);

    let list: ConvPayload[] = [];
    try {
      const { data } = await chatwoot.get<{ payload?: ConvPayload[] }>(
        `/accounts/${ACCOUNT_ID}/contacts/${contactId}/conversations`,
      );
      list = Array.isArray(data?.payload) ? data.payload : [];
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Chatwoot list conversations error:", msg);
      continue;
    }
    console.log(
      `[chatwoot-find] conversations returned for contact ${contactId}:`,
      list.length,
    );

    for (const c of list) {
      const inboxOk = !inboxFilterActive || c.inbox_id === targetInbox;
      const srcId = c.contact_inbox?.source_id;
      const social =
        c.meta?.sender?.additional_attributes?.social_telegram_user_id;
      const sourceOk =
        (srcId != null && String(srcId) === tgStr) ||
        (social != null && Number(social) === tgNum);

      if (!inboxOk || !sourceOk) continue;

      console.log("[chatwoot-find] match candidate:", {
        id: c.id,
        inbox_id: c.inbox_id,
        source_id: srcId,
        status: c.status,
        last_activity_at: c.last_activity_at,
      });
      matches.push(c);
    }
  }

  if (matches.length === 0) {
    console.log("[chatwoot-find] no matching conversation found");
    return null;
  }

  matches.sort((a, b) => {
    const la = a.last_activity_at ?? 0;
    const lb = b.last_activity_at ?? 0;
    if (lb !== la) return lb - la;
    const ca = a.created_at ?? 0;
    const cb = b.created_at ?? 0;
    return cb - ca;
  });

  const pick =
    matches.find((c) => c.status === "open" || c.status === "pending") ??
    matches[0];

  const pickedId = pick?.id != null ? String(pick.id) : null;
  if (pickedId) {
    console.log("[chatwoot-find] picked conversation:", pickedId);
  } else {
    console.log("[chatwoot-find] no matching conversation found");
  }
  return pickedId;
}

export async function applyQualifiedLeadLabels(
  conversationId: string,
  productLabelSuffix: string,
) {
  await addLabel(conversationId, "qualified-lead");
  await addLabel(conversationId, `product-${productLabelSuffix}`);
  await addLabel(conversationId, "deposit-pending");
  const teamRaw = process.env.CHATWOOT_CLOSERS_TEAM_ID;
  if (teamRaw) {
    const teamId = parseInt(teamRaw, 10);
    if (Number.isFinite(teamId)) {
      await assignToTeam(conversationId, teamId);
    }
  }
}

/**
 * Merge a single key into the conversation's custom_attributes.
 * Reads current attrs first so other keys are preserved (Chatwoot's POST
 * to /custom_attributes replaces the object as a whole).
 */
export async function setConversationCustomAttribute(
  conversationId: string,
  key: string,
  value: unknown,
): Promise<boolean> {
  try {
    const { data } = await chatwoot.get(
      `/accounts/${ACCOUNT_ID}/conversations/${conversationId}`,
    );
    const current = (data?.custom_attributes ?? {}) as Record<string, unknown>;
    const next = { ...current, [key]: value };
    await chatwoot.post(
      `/accounts/${ACCOUNT_ID}/conversations/${conversationId}/custom_attributes`,
      { custom_attributes: next },
    );
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Chatwoot set custom attribute error:", msg);
    return false;
  }
}

/**
 * Public outbound message in an existing Chatwoot conversation.
 * Chatwoot delivers it to the customer via the Telegram inbox channel.
 */
export async function sendChatwootOutboundMessage(
  conversationId: string,
  content: string,
): Promise<void> {
  try {
    await chatwoot.post(
      `/accounts/${ACCOUNT_ID}/conversations/${conversationId}/messages`,
      {
        content,
        message_type: "outgoing",
        private: false,
      },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[chatwoot] Outbound message error:", msg);
  }
}

/**
 * Find an existing Chatwoot conversation for a Telegram user,
 * or create one in the API inbox if none exists.
 * Uses CHATWOOT_MINIAPP_INBOX_ID (must be an API-type inbox).
 * Never creates conversations on Telegram-type inboxes.
 */
export async function findOrCreateMiniAppConversation(
  telegramId: number,
  userName: string | null,
  firstName: string | null,
): Promise<string | null> {
  if (!ACCOUNT_ID) return null;

  // Try existing conversation first
  const existing = await findLatestConversationIdForTelegramUser(telegramId);
  if (existing) {
    console.log(
      `[chatwoot] Found existing conversation ${existing} for tg ${telegramId}`,
    );
    return existing;
  }

  const inboxId = process.env.CHATWOOT_MINIAPP_INBOX_ID;
  if (!inboxId) {
    console.warn(
      "[chatwoot] CHATWOOT_MINIAPP_INBOX_ID not set — cannot create conversation",
    );
    return null;
  }

  // Find or create contact
  let contactId: number | null = null;
  const existingContact = await findContactByTelegramId(telegramId);
  contactId = existingContact?.id ?? null;

  if (!contactId) {
    try {
      const displayName = firstName || userName || `TG_${telegramId}`;
      const { data } = await chatwoot.post(
        `/accounts/${ACCOUNT_ID}/contacts`,
        {
          name: displayName,
          identifier: String(telegramId),
          additional_attributes: {
            telegram_id: telegramId,
            username: userName ?? "",
          },
        },
      );
      contactId = data?.id ?? data?.payload?.id ?? null;
      console.log(
        `[chatwoot] Created contact ${contactId} for tg ${telegramId}`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[chatwoot] Contact create error", msg);
      return null;
    }
  }

  if (!contactId) {
    console.error("[chatwoot] Could not find or create contact");
    return null;
  }

  // Create conversation in API inbox
  try {
    const { data } = await chatwoot.post(
      `/accounts/${ACCOUNT_ID}/conversations`,
      {
        contact_id: contactId,
        inbox_id: Number(inboxId),
        additional_attributes: { telegram_id: telegramId },
      },
    );
    const convId = data?.id ? String(data.id) : null;
    console.log(
      `[chatwoot] Created conversation ${convId} for tg ${telegramId}`,
    );
    return convId;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[chatwoot] Conversation create error", msg);
    return null;
  }
}
