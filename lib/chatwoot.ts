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

export async function addLabel(conversationId: string, label: string) {
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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Chatwoot label error:", msg);
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

export async function findOrCreateChatwootConversation(
  telegramId: number,
  userName: string | null,
  firstName: string | null,
  lastName: string | null,
): Promise<string | null> {
  // #region agent log
  console.log(
    "[chatwoot:debug] findOrCreateChatwootConversation called for tg",
    telegramId,
  );
  fetch('http://127.0.0.1:7586/ingest/a06de864-e48c-47c4-804c-fea5dbfaf96a',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'124202'},body:JSON.stringify({sessionId:'124202',hypothesisId:'H1H2H3',location:'lib/chatwoot.ts:findOrCreateChatwootConversation',message:'function entry',data:{telegramId},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  const existing = await findLatestConversationIdForTelegramUser(telegramId);
  if (existing) {
    // #region agent log
    console.log("[chatwoot:debug] Found existing conversation", existing);
    // #endregion
    return existing;
  }

  // #region agent log
  console.log("[chatwoot:debug] No existing conversation — will create");
  // #endregion

  const baseUrl = process.env.CHATWOOT_BASE_URL?.replace(/\/$/, "");
  const token = process.env.CHATWOOT_API_TOKEN;
  const accountId = process.env.CHATWOOT_ACCOUNT_ID;
  const inboxId = process.env.CHATWOOT_MINIAPP_INBOX_ID;

  // #region agent log
  console.log(
    "[chatwoot:debug] env check — baseUrl:",
    !!baseUrl,
    "token:",
    !!token,
    "accountId:",
    accountId,
    "inboxId:",
    inboxId,
  );
  // #endregion

  if (!baseUrl || !token || !accountId || !inboxId) {
    console.warn("[chatwoot:debug] MISSING ENV VARS — aborting");
    return null;
  }

  // Find contact via existing helper (same axios instance + auth as the rest of this file).
  const existingContact = await findContactByTelegramId(telegramId);
  let contactId: number | null = existingContact?.id ?? null;

  if (contactId) {
    // #region agent log
    console.log("[chatwoot:debug] Found contact via search:", contactId);
    // #endregion
  } else {
    try {
      const displayName =
        [firstName, lastName].filter(Boolean).join(" ").trim() ||
        userName ||
        `TG_${telegramId}`;

      const { data } = await chatwoot.post(`/accounts/${accountId}/contacts`, {
        name: displayName,
        identifier: String(telegramId),
        additional_attributes: {
          telegram_id: telegramId,
          username: userName ?? "",
        },
      });
      // #region agent log
      console.log(
        "[chatwoot:debug] Create contact response:",
        JSON.stringify(data),
      );
      // #endregion
      contactId = data?.id ?? data?.payload?.id ?? null;
      // #region agent log
      console.log("[chatwoot:debug] New contactId:", contactId);
      // #endregion
    } catch (err) {
      console.error("[chatwoot] Contact create error", err);
      return null;
    }
  }

  if (!contactId) {
    console.error("[chatwoot] Could not find or create contact");
    return null;
  }

  // #region agent log
  console.log(
    "[chatwoot:debug] Proceeding to create conversation with contactId:",
    contactId,
    "inboxId:",
    inboxId,
  );
  // #endregion

  const conversationBody = {
    source_id: String(telegramId),
    contact_id: contactId,
    inbox_id: Number(inboxId),
    additional_attributes: { telegram_id: telegramId },
  };

  // #region agent log
  console.log(
    "[chatwoot:debug] POST /conversations body:",
    JSON.stringify(conversationBody),
  );
  // #endregion

  try {
    const { data } = await chatwoot.post(
      `/accounts/${accountId}/conversations`,
      conversationBody,
    );
    // #region agent log
    console.log(
      "[chatwoot:debug] Create conversation response:",
      JSON.stringify(data),
    );
    // #endregion
    const convId = data?.id
      ? String(data.id)
      : data?.payload?.id
        ? String(data.payload.id)
        : null;
    // #region agent log
    console.log("[chatwoot:debug] convId:", convId);
    // #endregion
    return convId;
  } catch (err) {
    console.error("[chatwoot] Conversation create error", err);
    return null;
  }
}
