import axios from "axios";

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

export async function findContactByTelegramId(telegramId: number) {
  try {
    const { data } = await chatwoot.get(
      `/accounts/${ACCOUNT_ID}/contacts/search?q=${telegramId}`,
    );
    return data.payload?.length > 0 ? data.payload[0] : null;
  } catch {
    return null;
  }
}

type ConvPayload = {
  id?: number;
  inbox_id?: number;
  status?: string;
  last_activity_at?: number;
  created_at?: number;
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

/** After a Telegram DM is mirrored into Chatwoot, resolve conversation id for labels. */
export async function findLatestConversationIdForTelegramUser(
  telegramId: number,
): Promise<string | null> {
  if (!ACCOUNT_ID) return null;
  const contact = await findContactByTelegramId(telegramId);
  const contactId = contact?.id;
  if (contactId == null) return null;

  try {
    const { data } = await chatwoot.get<{ payload?: ConvPayload[] }>(
      `/accounts/${ACCOUNT_ID}/contacts/${contactId}/conversations`,
    );
    const list = Array.isArray(data.payload) ? data.payload : [];
    const inboxIdRaw = process.env.CHATWOOT_MINIAPP_INBOX_ID;
    const inboxFilter =
      inboxIdRaw !== undefined && inboxIdRaw !== ""
        ? parseInt(inboxIdRaw, 10)
        : NaN;
    let convs = list;
    if (Number.isFinite(inboxFilter)) {
      convs = convs.filter((c) => c.inbox_id === inboxFilter);
    }
    const score = (c: ConvPayload) =>
      (c.last_activity_at as number) ||
      (c.created_at as number) ||
      0;
    convs.sort((a, b) => score(b) - score(a));
    const pick =
      convs.find((c) => c.status === "open" || c.status === "pending") ??
      convs[0];
    return pick?.id != null ? String(pick.id) : null;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Chatwoot list conversations error:", msg);
    return null;
  }
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
