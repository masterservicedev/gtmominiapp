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
