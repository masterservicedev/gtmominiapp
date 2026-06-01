import axios, { isAxiosError } from "axios";
import { collectLabelTitles } from "@/lib/chatwootDeposit";

const chatwoot = axios.create({
  baseURL: `${process.env.CHATWOOT_BASE_URL}/api/v1`,
  headers: {
    api_access_token: process.env.CHATWOOT_API_TOKEN,
    "Content-Type": "application/json",
  },
});

const ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID;

export type ChatwootCanonicalFailureAction =
  | "config_missing"
  | "contact_search"
  | "contact_create"
  | "contact_missing_id"
  | "conversation_list"
  | "conversation_create";

/** Structured log for canonical contact / API conversation resolution failures. */
export function logChatwootCanonicalFailure(
  action: ChatwootCanonicalFailureAction,
  context: {
    telegramId: number;
    accountId?: string | null;
    miniAppInboxId?: number | null;
    contactId?: number | null;
    reason?: string;
    responseBody?: unknown;
  },
  err?: unknown,
): void {
  const httpStatus = isAxiosError(err) ? err.response?.status : undefined;
  const axiosBody = isAxiosError(err) ? err.response?.data : undefined;
  const errorMessage =
    err instanceof Error ? err.message : err != null ? String(err) : undefined;

  console.error("[chatwoot] canonical contact failure", {
    action,
    telegramId: context.telegramId,
    accountId: context.accountId ?? ACCOUNT_ID ?? null,
    miniAppInboxId: context.miniAppInboxId ?? null,
    ...(context.contactId != null ? { contactId: context.contactId } : {}),
    ...(context.reason ? { reason: context.reason } : {}),
    ...(httpStatus != null ? { httpStatus } : {}),
    ...(axiosBody != null
      ? { responseBody: axiosBody }
      : context.responseBody != null
        ? { responseBody: context.responseBody }
        : {}),
    ...(errorMessage ? { errorMessage } : {}),
  });
}

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

/** Apply the universal priority label to a Telegram inbox (977) conversation. */
export async function applyTelegramInboxPriorityLabel(
  conversationId: string,
): Promise<void> {
  const ok = await addLabel(conversationId, "priority");
  if (ok) {
    console.log("[handoff] priority label applied to telegram inbox", {
      conversationId,
    });
  } else {
    console.error("[handoff] priority label skipped/failed for telegram inbox", {
      conversationId,
    });
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
  if (!ACCOUNT_ID) {
    logChatwootCanonicalFailure("config_missing", {
      telegramId,
      reason: "CHATWOOT_ACCOUNT_ID not set",
    });
    return [];
  }
  try {
    const { data } = await chatwoot.get<{ payload?: ContactPayload[] }>(
      `/accounts/${ACCOUNT_ID}/contacts/search?q=${telegramId}`,
    );
    return Array.isArray(data?.payload) ? data.payload : [];
  } catch (err: unknown) {
    logChatwootCanonicalFailure(
      "contact_search",
      {
        telegramId,
        accountId: ACCOUNT_ID,
      },
      err,
    );
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

function readTelegramInboxId(): number | null {
  const raw = process.env.CHATWOOT_TELEGRAM_INBOX_ID;
  if (!raw) return null;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function readMiniAppInboxId(): number | null {
  const raw = process.env.CHATWOOT_MINIAPP_INBOX_ID;
  if (!raw) return null;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

type ContactInboxRow = {
  inbox?: { id?: number };
  inbox_id?: number;
  source_id?: string | number;
};

type FullContactPayload = {
  id?: number;
  contact_inboxes?: ContactInboxRow[];
};

async function fetchContactWithInboxes(
  contactId: number,
): Promise<FullContactPayload | null> {
  if (!ACCOUNT_ID) return null;
  try {
    const { data } = await chatwoot.get<{
      payload?: FullContactPayload;
      contact_inboxes?: ContactInboxRow[];
      id?: number;
    }>(`/accounts/${ACCOUNT_ID}/contacts/${contactId}`);
    const payload =
      (data as { payload?: FullContactPayload }).payload ??
      (data as FullContactPayload);
    return payload ?? null;
  } catch {
    return null;
  }
}

function contactInboxesContainBinding(
  rows: ContactInboxRow[] | undefined,
  inboxId: number,
  telegramId: number,
): boolean {
  if (!Array.isArray(rows)) return false;
  const tg = String(telegramId);
  return rows.some((row) => {
    const innerInboxId = row.inbox?.id ?? row.inbox_id;
    if (innerInboxId !== inboxId) return false;
    if (row.source_id == null) return false;
    return String(row.source_id) === tg;
  });
}

export type TelegramContactInboxResult =
  | { status: "bound"; inboxId: number }
  | { status: "already_bound"; inboxId: number }
  | { status: "conflict_requires_reconciliation"; details: unknown };

/**
 * Ensure the canonical Chatwoot contact has a `contact_inbox` row for the
 * Telegram inbox (CHATWOOT_TELEGRAM_INBOX_ID) with `source_id = String(telegramId)`.
 *
 * When this row exists ahead of any inbound Telegram event, Chatwoot's Telegram
 * ingestion resolves the user against the canonical contact instead of creating
 * a new one, eliminating the split-contact problem at source.
 *
 * Behaviour:
 *   - "already_bound"   — relation exists, no Chatwoot request was made.
 *   - "bound"           — relation was created in this call.
 *   - "conflict_requires_reconciliation" — the relation could not be created
 *     and was not present on the canonical contact afterwards. This usually
 *     means an older Telegram-created contact already owns the
 *     (inbox, source_id) pair. The handoff may continue but a manual contact
 *     merge is required to fully fix the user.
 */
export async function ensureTelegramContactInbox(params: {
  contactId: number;
  telegramId: number;
}): Promise<TelegramContactInboxResult> {
  const { contactId, telegramId } = params;

  if (!ACCOUNT_ID) {
    return {
      status: "conflict_requires_reconciliation",
      details: "CHATWOOT_ACCOUNT_ID not set",
    };
  }

  const telegramInboxId = readTelegramInboxId();
  if (telegramInboxId == null) {
    return {
      status: "conflict_requires_reconciliation",
      details: "CHATWOOT_TELEGRAM_INBOX_ID not set",
    };
  }

  const before = await fetchContactWithInboxes(contactId);
  if (
    contactInboxesContainBinding(
      before?.contact_inboxes,
      telegramInboxId,
      telegramId,
    )
  ) {
    return { status: "already_bound", inboxId: telegramInboxId };
  }

  try {
    await chatwoot.post(
      `/accounts/${ACCOUNT_ID}/contacts/${contactId}/contact_inboxes`,
      {
        inbox_id: telegramInboxId,
        source_id: String(telegramId),
      },
    );
    return { status: "bound", inboxId: telegramInboxId };
  } catch (err: unknown) {
    const status = isAxiosError(err) ? err.response?.status : undefined;
    const details = isAxiosError(err)
      ? (err.response?.data ?? err.message)
      : err instanceof Error
        ? err.message
        : String(err);

    if (status === 422 || status === 409) {
      const after = await fetchContactWithInboxes(contactId);
      if (
        contactInboxesContainBinding(
          after?.contact_inboxes,
          telegramInboxId,
          telegramId,
        )
      ) {
        return { status: "already_bound", inboxId: telegramInboxId };
      }
      return { status: "conflict_requires_reconciliation", details };
    }

    return { status: "conflict_requires_reconciliation", details };
  }
}

/**
 * Find the most recently active Telegram inbox conversation that hangs off the
 * given canonical contact. Uses the stored contact id as the primary lookup
 * key — never a `/contacts/search` heuristic. Returns null when none exists,
 * which is the correct state for a paid mini-app user who has not yet sent any
 * Telegram message.
 */
export async function findTelegramInboxConversationForContact(
  contactId: number,
): Promise<string | null> {
  if (!ACCOUNT_ID) return null;
  const telegramInboxId = readTelegramInboxId();
  if (telegramInboxId == null) return null;

  try {
    const { data } = await chatwoot.get<{ payload?: ConvPayload[] }>(
      `/accounts/${ACCOUNT_ID}/contacts/${contactId}/conversations`,
    );
    const list = Array.isArray(data?.payload) ? data.payload : [];
    const filtered = list.filter((c) => c.inbox_id === telegramInboxId);
    if (filtered.length === 0) return null;

    filtered.sort((a, b) => {
      const la = a.last_activity_at ?? 0;
      const lb = b.last_activity_at ?? 0;
      if (lb !== la) return lb - la;
      const ca = a.created_at ?? 0;
      const cb = b.created_at ?? 0;
      return cb - ca;
    });

    const pick =
      filtered.find((c) => c.status === "open" || c.status === "pending") ??
      filtered[0];
    return pick?.id != null ? String(pick.id) : null;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(
      `[chatwoot] findTelegramInboxConversationForContact error for contact ${contactId}:`,
      msg,
    );
    return null;
  }
}

export type MiniAppConversationResult = {
  contactId: number;
  apiConversationId: string;
  /** True when this call created a new Chatwoot contact (vs. adopted an existing one). */
  contactCreated: boolean;
};

/**
 * Resolve to a single canonical Chatwoot contact for the Telegram user, then
 * ensure an API inbox (CHATWOOT_MINIAPP_INBOX_ID) conversation exists for it.
 *
 * Precedence:
 *   1. `knownContactId` from `users.chatwoot_contact_id`.
 *   2. `/contacts/search?q=telegramId` (matches legacy `identifier = String(telegramId)`
 *      and new `identifier = telegram:<id>` via substring search, plus any
 *      Telegram-channel contact whose social attribute is indexed).
 *   3. Create a fresh contact under the API inbox using
 *      `identifier = telegram:<id>` and `additional_attributes.telegram_id`.
 *
 * The caller is responsible for binding the resolved contact to the Telegram
 * inbox via `ensureTelegramContactInbox` before any inbound Telegram message
 * arrives. This function does not perform that binding.
 */
export async function findOrCreateMiniAppConversation(
  telegramId: number,
  userName: string | null,
  firstName: string | null,
  knownContactId?: number | null,
): Promise<MiniAppConversationResult | null> {
  if (!ACCOUNT_ID) {
    logChatwootCanonicalFailure("config_missing", {
      telegramId,
      reason: "CHATWOOT_ACCOUNT_ID not set",
    });
    return null;
  }

  const miniAppInboxId = readMiniAppInboxId();
  if (miniAppInboxId == null) {
    logChatwootCanonicalFailure("config_missing", {
      telegramId,
      accountId: ACCOUNT_ID,
      reason: "CHATWOOT_MINIAPP_INBOX_ID not set",
    });
    return null;
  }

  let contactId = knownContactId ?? null;
  let contactCreated = false;

  if (!contactId) {
    const candidate = await findContactByTelegramId(telegramId);
    if (candidate?.id != null) {
      contactId = candidate.id;
      console.log(
        `[chatwoot] adopting existing contact ${contactId} for tg ${telegramId}`,
      );
    }
  } else {
    console.log(
      `[chatwoot] using known canonical contact ${contactId} for tg ${telegramId}`,
    );
  }

  if (!contactId) {
    try {
      const displayName = firstName || userName || `TG_${telegramId}`;
      const { data } = await chatwoot.post<{
        id?: number;
        payload?: { id?: number };
        contact?: { id?: number };
      }>(`/accounts/${ACCOUNT_ID}/contacts`, {
        inbox_id: miniAppInboxId,
        name: displayName,
        identifier: `telegram:${telegramId}`,
        additional_attributes: {
          telegram_id: String(telegramId),
          username: userName ?? "",
          acquisition_source: "mini_app",
        },
      });
      const created =
        data?.id ?? data?.payload?.id ?? data?.contact?.id ?? null;
      if (created != null) {
        contactId = created;
        contactCreated = true;
        console.log(
          `[chatwoot] created canonical contact ${contactId} for tg ${telegramId}`,
        );
      } else {
        logChatwootCanonicalFailure("contact_missing_id", {
          telegramId,
          accountId: ACCOUNT_ID,
          miniAppInboxId,
          responseBody: data,
          reason: "contact_create returned no id",
        });
      }
    } catch (err: unknown) {
      logChatwootCanonicalFailure(
        "contact_create",
        {
          telegramId,
          accountId: ACCOUNT_ID,
          miniAppInboxId,
        },
        err,
      );
      return null;
    }
  }

  if (!contactId) {
    logChatwootCanonicalFailure("contact_missing_id", {
      telegramId,
      accountId: ACCOUNT_ID,
      miniAppInboxId,
      reason: "no contact after search and create",
    });
    console.error(
      `[chatwoot] Could not find or create canonical contact for tg ${telegramId}`,
    );
    return null;
  }

  const apiConversationId = await findOrCreateApiInboxConversationForContact(
    contactId,
    telegramId,
    miniAppInboxId,
  );

  if (!apiConversationId) {
    logChatwootCanonicalFailure("conversation_create", {
      telegramId,
      accountId: ACCOUNT_ID,
      miniAppInboxId,
      contactId,
      reason: "no API inbox conversation after list/create",
    });
    return null;
  }

  return { contactId, apiConversationId, contactCreated };
}

async function findOrCreateApiInboxConversationForContact(
  contactId: number,
  telegramId: number,
  miniAppInboxId: number,
): Promise<string | null> {
  if (!ACCOUNT_ID) return null;

  try {
    const { data } = await chatwoot.get<{ payload?: ConvPayload[] }>(
      `/accounts/${ACCOUNT_ID}/contacts/${contactId}/conversations`,
    );
    const list = Array.isArray(data?.payload) ? data.payload : [];
    const existing = list
      .filter((c) => c.inbox_id === miniAppInboxId)
      .sort((a, b) => {
        const la = a.last_activity_at ?? 0;
        const lb = b.last_activity_at ?? 0;
        if (lb !== la) return lb - la;
        const ca = a.created_at ?? 0;
        const cb = b.created_at ?? 0;
        return cb - ca;
      });
    const pick =
      existing.find((c) => c.status === "open" || c.status === "pending") ??
      existing[0];
    if (pick?.id != null) {
      const id = String(pick.id);
      console.log(
        `[chatwoot] reusing API inbox conversation ${id} for contact ${contactId}`,
      );
      return id;
    }
  } catch (err: unknown) {
    logChatwootCanonicalFailure(
      "conversation_list",
      {
        telegramId,
        accountId: ACCOUNT_ID,
        miniAppInboxId,
        contactId,
      },
      err,
    );
  }

  try {
    const { data } = await chatwoot.post<{ id?: number }>(
      `/accounts/${ACCOUNT_ID}/conversations`,
      {
        contact_id: contactId,
        inbox_id: miniAppInboxId,
        additional_attributes: { telegram_id: String(telegramId) },
      },
    );
    const convId = data?.id != null ? String(data.id) : null;
    if (convId) {
      console.log(
        `[chatwoot] created API inbox conversation ${convId} for contact ${contactId}`,
      );
    } else {
      logChatwootCanonicalFailure("conversation_create", {
        telegramId,
        accountId: ACCOUNT_ID,
        miniAppInboxId,
        contactId,
        responseBody: data,
        reason: "conversation_create returned no id",
      });
    }
    return convId;
  } catch (err: unknown) {
    logChatwootCanonicalFailure(
      "conversation_create",
      {
        telegramId,
        accountId: ACCOUNT_ID,
        miniAppInboxId,
        contactId,
      },
      err,
    );
    return null;
  }
}
