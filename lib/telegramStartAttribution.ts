import { db } from "@/lib/db";
import { telegramStartAttribution } from "@/lib/db/schema";
import { eq, isNull, and } from "drizzle-orm";
import { parseStartParam, type StartParamParsed } from "@/lib/startParam";

/** True when parseStartParam extracted campaign/source/cid/variant attribution. */
export function hasStructuredAttribution(parsed: StartParamParsed): boolean {
  return Boolean(
    parsed.cid?.trim() ||
      parsed.source?.trim() ||
      parsed.campaign?.trim() ||
      parsed.variant?.trim(),
  );
}

/**
 * Extract structured payload from an inbound Telegram `/start` command body.
 * Does not treat bare `/start` or message text without a command as attribution.
 */
export function extractStartCommandPayload(content: unknown): string | null {
  if (typeof content !== "string") return null;
  const trimmed = content.trim();
  const match = trimmed.match(/^\/start(?:@\w+)?\s+(\S[\s\S]*)$/i);
  if (!match?.[1]) return null;
  const payload = match[1].trim();
  return payload.length > 0 ? payload : null;
}

/** Read message body from a Chatwoot Telegram inbox webhook payload. */
export function extractInboundMessageContent(
  payload: Record<string, unknown>,
): string | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = payload as any;
  const raw =
    p?.content ??
    p?.message?.content ??
    p?.conversation?.messages?.[0]?.content;
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

/**
 * Persist attribution from `/start {payload}` keyed by numeric Telegram user id.
 * Upserts so the latest bot-first click wins before Mini App open.
 */
export async function upsertTelegramStartAttribution(
  telegramId: number,
  rawStartParam: string,
): Promise<void> {
  const parsed = parseStartParam(rawStartParam);
  await db
    .insert(telegramStartAttribution)
    .values({
      telegramId,
      rawStartParam,
      cid: parsed.cid,
      source: parsed.source,
      campaign: parsed.campaign,
      variant: parsed.variant,
      consumedAt: null,
    })
    .onConflictDoUpdate({
      target: telegramStartAttribution.telegramId,
      set: {
        rawStartParam,
        cid: parsed.cid,
        source: parsed.source,
        campaign: parsed.campaign,
        variant: parsed.variant,
        createdAt: new Date(),
        consumedAt: null,
      },
    });
  console.log("[start-attribution] pending upsert", {
    telegramId,
    rawStartParam,
    source: parsed.source,
    campaign: parsed.campaign,
    cid: parsed.cid,
  });
}

/** Latest unconsumed `/start` attribution for a Telegram user, if any. */
export async function getUnconsumedTelegramStartAttribution(
  telegramId: number,
): Promise<{ rawStartParam: string } | null> {
  const [row] = await db
    .select({ rawStartParam: telegramStartAttribution.rawStartParam })
    .from(telegramStartAttribution)
    .where(
      and(
        eq(telegramStartAttribution.telegramId, telegramId),
        isNull(telegramStartAttribution.consumedAt),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function markTelegramStartAttributionConsumed(
  telegramId: number,
): Promise<void> {
  await db
    .update(telegramStartAttribution)
    .set({ consumedAt: new Date() })
    .where(
      eq(telegramStartAttribution.telegramId, telegramId),
    );
}
