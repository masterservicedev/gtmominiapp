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
    payloadContactKeys?: string[];
    payloadContactId?: number | null;
    normalizedContactKeys?: string[];
    normalizedContactId?: number | null;
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
    ...(context.payloadContactKeys
      ? {
          payloadContactKeys: context.payloadContactKeys,
          payloadContactId: context.payloadContactId ?? null,
        }
      : {}),
    ...(context.normalizedContactKeys
      ? {
          normalizedContactKeys: context.normalizedContactKeys,
          normalizedContactId: context.normalizedContactId ?? null,
        }
      : {}),
    ...(httpStatus != null ? { httpStatus } : {}),
    ...(axiosBody != null
      ? { responseBody: axiosBody }
      : context.responseBody != null
        ? { responseBody: context.responseBody }
        : {}),
    ...(errorMessage ? { errorMessage } : {}),
  });
}

/**
 * Post a private (agent-only) note to a Chatwoot conversation.
 * Returns true on a successful POST, false on any failure. Never throws.
 */
export async function addChatwootNote(
  conversationId: string,
  content: string,
): Promise<boolean> {
  if (!ACCOUNT_ID) {
    console.error("[chatwoot] note skipped — CHATWOOT_ACCOUNT_ID not set", {
      conversationId,
    });
    return false;
  }
  try {
    await chatwoot.post(
      `/accounts/${ACCOUNT_ID}/conversations/${conversationId}/messages`,
      {
        content,
        message_type: "outgoing",
        private: true,
      },
    );
    return true;
  } catch (err: unknown) {
    const httpStatus = isAxiosError(err) ? err.response?.status : undefined;
    const responseBody = isAxiosError(err) ? err.response?.data : undefined;
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("[chatwoot] note post failed", {
      conversationId,
      ...(httpStatus != null ? { httpStatus } : {}),
      ...(responseBody != null ? { responseBody } : {}),
      errorMessage,
    });
    return false;
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

/**
 * Remove specific labels from a conversation while preserving all others.
 * Compares case-insensitively; no-op when none of the labels are present.
 */
export async function removeLabelsFromConversation(
  conversationId: string,
  labelsToRemove: string[],
): Promise<boolean> {
  if (!ACCOUNT_ID || labelsToRemove.length === 0) return true;
  const removeSet = new Set(
    labelsToRemove.map((label) => label.toLowerCase()),
  );
  try {
    const { data } = await chatwoot.get(
      `/accounts/${ACCOUNT_ID}/conversations/${conversationId}`,
    );
    const currentLabels: string[] = data.labels || [];
    const nextLabels = currentLabels.filter(
      (label) => !removeSet.has(String(label).toLowerCase()),
    );
    if (nextLabels.length === currentLabels.length) {
      return true;
    }
    await chatwoot.post(
      `/accounts/${ACCOUNT_ID}/conversations/${conversationId}/labels`,
      { labels: nextLabels },
    );
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[chatwoot] remove labels error:", msg, {
      conversationId,
      labelsToRemove,
    });
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

/** Body shapes returned by POST /accounts/:id/contacts (varies by Chatwoot version). */
type ChatwootContactCreateBody = {
  id?: number;
  contact?: ContactPayload;
  payload?: ContactPayload & {
    contact?: ContactPayload;
    contact_inbox?: unknown;
  };
};

function extractContactIdFromCreateResponse(
  data: ChatwootContactCreateBody | undefined,
): number | null {
  const id =
    data?.id ??
    data?.payload?.id ??
    data?.payload?.contact?.id ??
    data?.contact?.id ??
    null;
  return id ?? null;
}

function normalizeContactFromCreateResponse(
  data: ChatwootContactCreateBody | undefined,
): ContactPayload | null {
  if (!data) return null;
  const contact =
    data.payload?.contact ?? data.payload ?? data.contact ?? data;
  return contact && typeof contact === "object" ? contact : null;
}

type ContactCreateMissingIdDiagnostics = {
  payloadContactKeys?: string[];
  payloadContactId?: number | null;
  normalizedContactKeys?: string[];
  normalizedContactId?: number | null;
};

function contactCreateMissingIdDiagnostics(
  data: ChatwootContactCreateBody | undefined,
): ContactCreateMissingIdDiagnostics {
  const payloadContact = data?.payload?.contact;
  if (payloadContact && typeof payloadContact === "object") {
    return {
      payloadContactKeys: Object.keys(payloadContact),
      payloadContactId: payloadContact.id ?? null,
    };
  }
  const normalized = normalizeContactFromCreateResponse(data);
  if (normalized) {
    return {
      normalizedContactKeys: Object.keys(normalized),
      normalizedContactId: normalized.id ?? null,
    };
  }
  return {};
}

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
  contact?: {
    id?: number;
    additional_attributes?: {
      social_telegram_user_id?: string | number;
    };
  };
  meta?: {
    sender?: {
      id?: number;
      additional_attributes?: {
        social_telegram_user_id?: string | number;
      };
    };
  };
};

const DIRECT_INBOX_DISCOVERY_MAX_PAGES = 5;
const DIRECT_INBOX_SCAN_DEADLINE_MS = 3000;
const DIRECT_INBOX_PER_REQUEST_TIMEOUT_MS = 1000;
const CONVERSATION_VALIDATION_REQUEST_TIMEOUT_MS = 1000;
const DEFAULT_CONVERSATIONS_PAGE_SIZE = 25;

type Telegram977ResolverCache = {
  contactInboxBindingByContactId: Map<number, Promise<boolean>>;
};

function createTelegram977ResolverCache(): Telegram977ResolverCache {
  return { contactInboxBindingByContactId: new Map() };
}

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

function conversationHasTelegramIdentityFields(
  conversation: ConvPayload,
): boolean {
  return (
    conversation.contact_inbox?.source_id != null ||
    conversation.meta?.sender?.additional_attributes?.social_telegram_user_id !=
      null ||
    conversation.contact?.additional_attributes?.social_telegram_user_id != null
  );
}

function conversationMatchesTelegramIdentity(
  conversation: ConvPayload,
  telegramId: number,
): boolean {
  const tgStr = String(telegramId);
  const tgNum = Number(telegramId);
  const srcId = conversation.contact_inbox?.source_id;
  const socialSender =
    conversation.meta?.sender?.additional_attributes?.social_telegram_user_id;
  const socialContact =
    conversation.contact?.additional_attributes?.social_telegram_user_id;
  return (
    (srcId != null && String(srcId) === tgStr) ||
    (socialSender != null && Number(socialSender) === tgNum) ||
    (socialContact != null && Number(socialContact) === tgNum)
  );
}

function extractConversationContactId(
  conversation: ConvPayload,
): number | null {
  const raw = conversation.meta?.sender?.id ?? conversation.contact?.id;
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export type Telegram977IdentitySource =
  | "contact_inbox_source_id"
  | "meta_sender_social_telegram_user_id"
  | "contact_social_telegram_user_id"
  | "contact_inbox_binding";

export type Telegram977InvalidReason =
  | "wrong_inbox"
  | "identity_mismatch"
  | "missing_identity"
  | "not_found"
  | "invalid_payload";

export type Telegram977ConversationValidation =
  | {
      status: "valid";
      conversationId: string;
      contactId: number | null;
      identitySource: Telegram977IdentitySource;
    }
  | {
      status: "request_failed";
      reason: string;
      httpStatus?: number;
    }
  | {
      status: "invalid";
      reason: Telegram977InvalidReason;
    };

function identitySourceForConversation(
  conversation: ConvPayload,
  telegramId: number,
): Telegram977IdentitySource | null {
  const tgStr = String(telegramId);
  const tgNum = Number(telegramId);
  const srcId = conversation.contact_inbox?.source_id;
  if (srcId != null && String(srcId) === tgStr) {
    return "contact_inbox_source_id";
  }
  const socialSender =
    conversation.meta?.sender?.additional_attributes?.social_telegram_user_id;
  if (socialSender != null && Number(socialSender) === tgNum) {
    return "meta_sender_social_telegram_user_id";
  }
  const socialContact =
    conversation.contact?.additional_attributes?.social_telegram_user_id;
  if (socialContact != null && Number(socialContact) === tgNum) {
    return "contact_social_telegram_user_id";
  }
  return null;
}

async function contactHasVerifiedTelegramInboxBinding(
  contactId: number,
  telegramId: number,
  telegramInboxId: number,
  cache: Telegram977ResolverCache,
): Promise<boolean> {
  const existing = cache.contactInboxBindingByContactId.get(contactId);
  if (existing) return existing;

  const pending = (async () => {
    const fullContact = await fetchContactWithInboxes(contactId);
    return contactInboxesContainBinding(
      fullContact?.contact_inboxes,
      telegramInboxId,
      telegramId,
    );
  })();
  cache.contactInboxBindingByContactId.set(contactId, pending);
  return pending;
}

async function conversationVerifiedByContactInboxBinding(
  conversation: ConvPayload,
  telegramId: number,
  telegramInboxId: number,
  cache: Telegram977ResolverCache,
): Promise<boolean> {
  const contactId = extractConversationContactId(conversation);
  if (contactId == null) return false;
  return contactHasVerifiedTelegramInboxBinding(
    contactId,
    telegramId,
    telegramInboxId,
    cache,
  );
}

/**
 * Evaluate a single inbox-977 conversation candidate for exact Telegram identity.
 * When identity fields are absent on the conversation payload, require a verified
 * contact_inbox binding on the owning contact.
 */
async function evaluateTelegram977ConversationCandidate(
  conversation: ConvPayload,
  conversationId: string,
  telegramId: number,
  telegramInboxId: number,
  cache: Telegram977ResolverCache,
): Promise<Telegram977ConversationValidation> {
  if (
    conversation.inbox_id != null &&
    conversation.inbox_id !== telegramInboxId
  ) {
    return { status: "invalid", reason: "wrong_inbox" };
  }

  const contactId = extractConversationContactId(conversation);

  if (conversationHasTelegramIdentityFields(conversation)) {
    if (!conversationMatchesTelegramIdentity(conversation, telegramId)) {
      return { status: "invalid", reason: "identity_mismatch" };
    }
    return {
      status: "valid",
      conversationId,
      contactId,
      identitySource:
        identitySourceForConversation(conversation, telegramId) ??
        "contact_inbox_source_id",
    };
  }

  const bindingOk = await conversationVerifiedByContactInboxBinding(
    conversation,
    telegramId,
    telegramInboxId,
    cache,
  );
  if (!bindingOk) {
    return { status: "invalid", reason: "missing_identity" };
  }
  return {
    status: "valid",
    conversationId,
    contactId,
    identitySource: "contact_inbox_binding",
  };
}

type InboxConversationListParseResult = {
  conversations: ConvPayload[];
  container: "data" | "payload" | "data.payload" | null;
};

function parseInboxConversationRows(
  data: unknown,
  inboxId: number,
): InboxConversationListParseResult {
  if (data == null || typeof data !== "object") {
    return { conversations: [], container: null };
  }
  const record = data as Record<string, unknown>;

  let raw: unknown[] | null = null;
  let container: InboxConversationListParseResult["container"] = null;

  if (Array.isArray(record.data)) {
    raw = record.data;
    container = "data";
  } else if (Array.isArray(record.payload)) {
    raw = record.payload;
    container = "payload";
  } else if (record.data != null && typeof record.data === "object") {
    const inner = record.data as Record<string, unknown>;
    if (Array.isArray(inner.payload)) {
      raw = inner.payload;
      container = "data.payload";
    }
  }

  if (raw == null) {
    if (record.data != null || record.payload != null) {
      console.warn(
        "[chatwoot-977] direct inbox list unsupported response container",
        {
          inboxId,
          hasData: record.data != null,
          hasPayload: record.payload != null,
          dataType:
            record.data != null ? typeof record.data : undefined,
          payloadType:
            record.payload != null ? typeof record.payload : undefined,
        },
      );
    }
    return { conversations: [], container: null };
  }

  const conversations = raw.filter((item): item is ConvPayload => {
    if (item == null || typeof item !== "object") return false;
    const conv = item as ConvPayload;
    return conv.inbox_id === inboxId;
  });
  return { conversations, container };
}

/**
 * Fetch and validate a conversation belongs to inbox 977 with exact Telegram identity.
 */
export async function fetchConversationForTelegramValidation(
  conversationId: string,
  telegramId: number,
  cache: Telegram977ResolverCache = createTelegram977ResolverCache(),
): Promise<Telegram977ConversationValidation> {
  const telegramInboxId = readTelegramInboxId();
  if (!ACCOUNT_ID || telegramInboxId == null) {
    return { status: "invalid", reason: "invalid_payload" };
  }

  let conversation: ConvPayload | null = null;
  try {
    const { data } = await chatwoot.get<ConvPayload>(
      `/accounts/${ACCOUNT_ID}/conversations/${conversationId}`,
      { timeout: CONVERSATION_VALIDATION_REQUEST_TIMEOUT_MS },
    );
    conversation = data ?? null;
  } catch (err: unknown) {
    const httpStatus = isAxiosError(err) ? err.response?.status : undefined;
    if (httpStatus === 404) {
      return { status: "invalid", reason: "not_found" };
    }
    const msg = err instanceof Error ? err.message : String(err);
    return {
      status: "request_failed",
      reason: msg,
      ...(httpStatus != null ? { httpStatus } : {}),
    };
  }

  if (!conversation) {
    return { status: "invalid", reason: "not_found" };
  }

  if (conversation.inbox_id !== telegramInboxId) {
    return { status: "invalid", reason: "wrong_inbox" };
  }

  return evaluateTelegram977ConversationCandidate(
    conversation,
    conversationId,
    telegramId,
    telegramInboxId,
    cache,
  );
}

type InboxConversationsPageResult = {
  conversations: ConvPayload[];
  reportedPageSize: number | null;
  responseContainer: InboxConversationListParseResult["container"];
};

async function listInboxConversationsPage(
  inboxId: number,
  page: number,
  requestTimeoutMs: number,
): Promise<InboxConversationsPageResult> {
  if (!ACCOUNT_ID) {
    return { conversations: [], reportedPageSize: null, responseContainer: null };
  }
  try {
    const { data } = await chatwoot.get<{
      meta?: { per_page?: number };
    }>(`/accounts/${ACCOUNT_ID}/conversations`, {
      params: { inbox_id: inboxId, page },
      timeout: requestTimeoutMs,
    });
    const parsed = parseInboxConversationRows(data, inboxId);
    const reportedPageSize =
      typeof data?.meta?.per_page === "number" ? data.meta.per_page : null;
    return {
      conversations: parsed.conversations,
      reportedPageSize,
      responseContainer: parsed.container,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[chatwoot-977] direct inbox list page failed", {
      inboxId,
      page,
      errorMessage: msg,
    });
    return { conversations: [], reportedPageSize: null, responseContainer: null };
  }
}

/**
 * Account-level paginated scan of inbox 977 when contact-search discovery misses
 * split-contact Telegram rows.
 */
async function discoverTelegramInbox977ByDirectInboxScan(args: {
  telegramId: number;
  telegramInboxId: number;
  cache: Telegram977ResolverCache;
}): Promise<Telegram977DiscoveryResult> {
  const { telegramId, telegramInboxId, cache } = args;
  const scanDeadline = Date.now() + DIRECT_INBOX_SCAN_DEADLINE_MS;

  console.log("[chatwoot-977] direct inbox discovery started", {
    telegramId,
    inboxId: telegramInboxId,
    maximumPages: DIRECT_INBOX_DISCOVERY_MAX_PAGES,
    scanDeadlineMs: DIRECT_INBOX_SCAN_DEADLINE_MS,
  });

  let candidatesChecked = 0;
  let pagesChecked = 0;
  let stoppedByDeadline = false;

  try {
    for (let page = 1; page <= DIRECT_INBOX_DISCOVERY_MAX_PAGES; page++) {
      const remainingMs = scanDeadline - Date.now();
      if (remainingMs <= 0) {
        stoppedByDeadline = true;
        console.warn("[chatwoot-977] direct inbox discovery deadline exhausted", {
          telegramId,
          pagesChecked,
          candidatesChecked,
        });
        break;
      }

      const requestTimeoutMs = Math.min(
        DIRECT_INBOX_PER_REQUEST_TIMEOUT_MS,
        remainingMs,
      );
      const pageResult = await listInboxConversationsPage(
        telegramInboxId,
        page,
        requestTimeoutMs,
      );
      const list = pageResult.conversations;
      pagesChecked = page;

      if (list.length === 0) {
        console.log("[chatwoot-977] direct inbox page scanned", {
          telegramId,
          page,
          conversationCount: 0,
          exactIdentityMatches: 0,
          bindingVerifiedMatches: 0,
          responseContainer: pageResult.responseContainer,
        });
        break;
      }

      let exactIdentityMatches = 0;
      let bindingVerifiedMatches = 0;

      for (const conversation of list) {
        if (scanDeadline - Date.now() <= 0) {
          stoppedByDeadline = true;
          break;
        }

        candidatesChecked++;
        if (conversation.id == null) continue;

        const evaluated = await evaluateTelegram977ConversationCandidate(
          conversation,
          String(conversation.id),
          telegramId,
          telegramInboxId,
          cache,
        );
        if (evaluated.status !== "valid") continue;

        if (evaluated.identitySource === "contact_inbox_binding") {
          bindingVerifiedMatches++;
        } else {
          exactIdentityMatches++;
        }

        console.log("[chatwoot-977] direct inbox conversation found", {
          telegramId,
          conversationId: evaluated.conversationId,
          contactId: evaluated.contactId,
          identitySource: evaluated.identitySource,
          page,
        });

        return {
          conversationId: evaluated.conversationId,
          source:
            evaluated.identitySource === "contact_inbox_binding"
              ? "direct_inbox_binding"
              : "direct_inbox_exact",
        };
      }

      console.log("[chatwoot-977] direct inbox page scanned", {
        telegramId,
        page,
        conversationCount: list.length,
        exactIdentityMatches,
        bindingVerifiedMatches,
        responseContainer: pageResult.responseContainer,
      });

      const effectivePageSize =
        pageResult.reportedPageSize ?? DEFAULT_CONVERSATIONS_PAGE_SIZE;
      if (list.length < effectivePageSize) {
        break;
      }

      if (stoppedByDeadline) {
        console.warn("[chatwoot-977] direct inbox discovery deadline exhausted", {
          telegramId,
          pagesChecked,
          candidatesChecked,
        });
        break;
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[chatwoot-977] direct inbox discovery failed", {
      telegramId,
      pagesChecked,
      candidatesChecked,
      errorMessage: msg,
    });
    return { conversationId: null, source: null };
  }

  if (!stoppedByDeadline) {
    console.warn("[chatwoot-977] direct inbox discovery exhausted", {
      telegramId,
      pagesChecked,
      candidatesChecked,
    });
  }

  return { conversationId: null, source: null };
}

function pickLatestTelegramInboxConversation(
  conversations: ConvPayload[],
  telegramInboxId: number,
): ConvPayload | null {
  const filtered = conversations.filter((c) => c.inbox_id === telegramInboxId);
  if (filtered.length === 0) return null;

  filtered.sort((a, b) => {
    const la = a.last_activity_at ?? 0;
    const lb = b.last_activity_at ?? 0;
    if (lb !== la) return lb - la;
    const ca = a.created_at ?? 0;
    const cb = b.created_at ?? 0;
    return cb - ca;
  });

  return (
    filtered.find((c) => c.status === "open" || c.status === "pending") ??
    filtered[0] ??
    null
  );
}

async function listContactConversations(
  contactId: number,
): Promise<ConvPayload[]> {
  if (!ACCOUNT_ID) return [];
  try {
    const { data } = await chatwoot.get<{ payload?: ConvPayload[] }>(
      `/accounts/${ACCOUNT_ID}/contacts/${contactId}/conversations`,
    );
    return Array.isArray(data?.payload) ? data.payload : [];
  } catch {
    return [];
  }
}

export type Telegram977DiscoverySource =
  | "contact_inbox_binding"
  | "cross_contact_strict"
  | "cross_contact_verified_contact"
  | "direct_inbox_exact"
  | "direct_inbox_binding";

export type Telegram977DiscoveryResult = {
  conversationId: string | null;
  source: Telegram977DiscoverySource | null;
};

type ContactDiscoveryDiagnostic = {
  contactId: number;
  hasTelegramInboxBinding: boolean;
  inbox977ConversationCount: number;
  strictIdentityMatchCount: number;
  sampleConversationFields: {
    inboxId: number | null;
    hasContactInboxSourceId: boolean;
    hasSocialTelegramUserId: boolean;
  } | null;
};

/**
 * Discover an existing Telegram inbox (977) conversation for a Telegram user.
 * Contacts may be enumerated via /contacts/search, but every accepted conversation
 * must belong to inbox 977 and either match Telegram identity on the conversation
 * or hang off a contact whose contact_inbox row is verified for this telegramId.
 */
export async function discoverTelegramInbox977Conversation(args: {
  telegramId: number;
  /** Prefer checking canonical/API contact binding before broad search. */
  canonicalContactId?: number | null;
}): Promise<Telegram977DiscoveryResult> {
  const { telegramId } = args;
  if (!ACCOUNT_ID) {
    return { conversationId: null, source: null };
  }
  const telegramInboxId = readTelegramInboxId();
  if (telegramInboxId == null) {
    return { conversationId: null, source: null };
  }

  const strictMatches: ConvPayload[] = [];
  const verifiedContactConversations: Array<{
    contactId: number;
    conversations: ConvPayload[];
  }> = [];
  const diagnostics: ContactDiscoveryDiagnostic[] = [];
  const seenContactIds = new Set<number>();

  const canonicalId =
    args.canonicalContactId != null && Number.isFinite(args.canonicalContactId)
      ? args.canonicalContactId
      : null;
  const contactOrder: number[] = [];
  if (canonicalId != null) contactOrder.push(canonicalId);

  const searched = await findContactsByTelegramId(telegramId);
  for (const contact of searched) {
    if (contact?.id != null && !contactOrder.includes(contact.id)) {
      contactOrder.push(contact.id);
    }
  }

  for (const contactId of contactOrder) {
    if (seenContactIds.has(contactId)) continue;
    seenContactIds.add(contactId);

    const fullContact = await fetchContactWithInboxes(contactId);
    const hasTelegramInboxBinding = contactInboxesContainBinding(
      fullContact?.contact_inboxes,
      telegramInboxId,
      telegramId,
    );

    const list = await listContactConversations(contactId);
    const inbox977 = list.filter((c) => c.inbox_id === telegramInboxId);
    let strictCount = 0;
    for (const c of inbox977) {
      if (conversationMatchesTelegramIdentity(c, telegramId)) {
        strictMatches.push(c);
        strictCount++;
      }
    }

    const sample = inbox977[0];
    diagnostics.push({
      contactId,
      hasTelegramInboxBinding,
      inbox977ConversationCount: inbox977.length,
      strictIdentityMatchCount: strictCount,
      sampleConversationFields: sample
        ? {
            inboxId: sample.inbox_id ?? null,
            hasContactInboxSourceId: sample.contact_inbox?.source_id != null,
            hasSocialTelegramUserId:
              sample.meta?.sender?.additional_attributes
                ?.social_telegram_user_id != null,
          }
        : null,
    });

    if (hasTelegramInboxBinding && inbox977.length > 0) {
      verifiedContactConversations.push({ contactId, conversations: inbox977 });
    }
  }

  const strictPick = pickLatestTelegramInboxConversation(
    strictMatches,
    telegramInboxId,
  );
  if (strictPick?.id != null) {
    console.log("[chatwoot-977] discovered via strict conversation identity", {
      telegramId,
      conversationId: strictPick.id,
      contactCandidates: contactOrder.length,
    });
    return {
      conversationId: String(strictPick.id),
      source: "cross_contact_strict",
    };
  }

  let bestVerified: ConvPayload | null = null;
  let bestVerifiedContactId: number | null = null;
  for (const entry of verifiedContactConversations) {
    const pick = pickLatestTelegramInboxConversation(
      entry.conversations,
      telegramInboxId,
    );
    if (!pick) continue;
    if (
      !bestVerified ||
      (pick.last_activity_at ?? 0) > (bestVerified.last_activity_at ?? 0)
    ) {
      bestVerified = pick;
      bestVerifiedContactId = entry.contactId;
    }
  }

  if (bestVerified?.id != null) {
    console.log("[chatwoot-977] discovered via verified contact_inbox binding", {
      telegramId,
      conversationId: bestVerified.id,
      contactId: bestVerifiedContactId,
      contactCandidates: contactOrder.length,
    });
    return {
      conversationId: String(bestVerified.id),
      source:
        bestVerifiedContactId === canonicalId
          ? "contact_inbox_binding"
          : "cross_contact_verified_contact",
    };
  }

  if (contactOrder.length > 0) {
    console.warn("[chatwoot-977] discovery failed — no identity-verified match", {
      telegramId,
      contactCandidates: contactOrder.length,
      diagnostics,
    });
  }

  return { conversationId: null, source: null };
}

export type ResolveTelegram977Source =
  | "stored"
  | "webhook"
  | Telegram977DiscoverySource
  | "none";

export type ResolveTelegram977Result = {
  conversationId: string | null;
  source: ResolveTelegram977Source;
};

/**
 * Resolve the Telegram inbox (977) conversation id for a Telegram user.
 *
 * Precedence:
 *   1. Stored users.chatwoot_telegram_conversation_id (validated)
 *   2. Verified incoming webhook conversation id (validated)
 *   3. discoverTelegramInbox977Conversation (contact search)
 *   4. discoverTelegramInbox977ByDirectInboxScan (account-level inbox list)
 */
export async function resolveTelegramInbox977ConversationId(args: {
  telegramId: number;
  storedConversationId?: string | null;
  webhookConversationId?: string | null;
  /**
   * When true, the webhook conversation id was extracted from a verified inbox-977
   * payload with a trusted Telegram id. REST validation is still attempted, but a
   * validation request failure does not block accepting the webhook id.
   */
  webhookContextVerified?: boolean;
  canonicalContactId?: number | null;
}): Promise<ResolveTelegram977Result> {
  const cache = createTelegram977ResolverCache();

  const stored = args.storedConversationId?.trim();
  if (stored) {
    const validated = await fetchConversationForTelegramValidation(
      stored,
      args.telegramId,
      cache,
    );
    if (validated.status === "valid") {
      return { conversationId: validated.conversationId, source: "stored" };
    }
  }

  const webhook = args.webhookConversationId?.trim();
  if (webhook) {
    const validated = await fetchConversationForTelegramValidation(
      webhook,
      args.telegramId,
      cache,
    );
    if (validated.status === "valid") {
      return { conversationId: validated.conversationId, source: "webhook" };
    }
    if (
      validated.status === "request_failed" &&
      args.webhookContextVerified === true
    ) {
      console.log(
        "[chatwoot-977] webhook conversation accepted from verified ingress after REST failure",
        {
          telegramId: args.telegramId,
          conversationId: webhook,
          errorCategory: "request_failed",
          ...(validated.httpStatus != null
            ? { httpStatus: validated.httpStatus }
            : {}),
          reason: validated.reason,
        },
      );
      return { conversationId: webhook, source: "webhook" };
    }
    if (validated.status === "invalid" && args.webhookContextVerified === true) {
      console.warn("[chatwoot-977] webhook conversation rejected", {
        telegramId: args.telegramId,
        conversationId: webhook,
        reason: validated.reason,
      });
    }
  }

  const discovered = await discoverTelegramInbox977Conversation({
    telegramId: args.telegramId,
    canonicalContactId: args.canonicalContactId,
  });
  if (discovered.conversationId) {
    return {
      conversationId: discovered.conversationId,
      source: discovered.source ?? "none",
    };
  }

  const telegramInboxId = readTelegramInboxId();
  if (telegramInboxId != null) {
    try {
      const direct = await discoverTelegramInbox977ByDirectInboxScan({
        telegramId: args.telegramId,
        telegramInboxId,
        cache,
      });
      if (direct.conversationId) {
        return {
          conversationId: direct.conversationId,
          source: direct.source ?? "none",
        };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[chatwoot-977] direct inbox discovery aborted", {
        telegramId: args.telegramId,
        errorMessage: msg,
      });
    }
  }

  return { conversationId: null, source: "none" };
}

/**
 * Find the latest Telegram inbox (977) conversation for a Telegram user id,
 * searching across every contact row Chatwoot has indexed for that user.
 * Used when the 977 conversation hangs off a different contact than the
 * canonical API inbox contact (split-contact scenario).
 */
export async function findTelegramInboxConversationForTelegramUser(
  telegramId: number,
): Promise<string | null> {
  const resolved = await resolveTelegramInbox977ConversationId({ telegramId });
  return resolved.conversationId;
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
      const { data } = await chatwoot.post<ChatwootContactCreateBody>(
        `/accounts/${ACCOUNT_ID}/contacts`,
        {
          inbox_id: miniAppInboxId,
          name: displayName,
          identifier: `telegram:${telegramId}`,
          additional_attributes: {
            telegram_id: String(telegramId),
            username: userName ?? "",
            acquisition_source: "mini_app",
          },
        },
      );
      const created = extractContactIdFromCreateResponse(data);
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
          ...contactCreateMissingIdDiagnostics(data),
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
