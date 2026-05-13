/** Normalize Chatwoot label titles from webhook payloads. */
export function collectLabelTitles(
  conversation: Record<string, unknown> | undefined,
): string[] {
  if (!conversation) return [];
  const labels = conversation.labels;
  if (!Array.isArray(labels)) return [];
  const out: string[] = [];
  for (const l of labels) {
    if (typeof l === "string") out.push(l.toLowerCase());
    else if (l && typeof l === "object" && "title" in l) {
      out.push(String((l as { title: unknown }).title).toLowerCase());
    }
  }
  return out;
}

export function conversationHasDepositConfirmedLabel(
  titles: string[],
): boolean {
  return titles.some(
    (t) =>
      t === "deposit-confirmed" ||
      t === "deposit_confirmed" ||
      t.replace(/\s+/g, "-") === "deposit-confirmed",
  );
}

/** Optional USD amount from conversation custom_attributes or meta. */
export function extractDepositAmountUsd(
  conversation: Record<string, unknown> | undefined,
  payload: Record<string, unknown>,
): number | null {
  const tryNum = (v: unknown): number | null => {
    if (typeof v === "number" && Number.isFinite(v)) return Math.round(v);
    if (typeof v === "string") {
      const n = parseInt(v.replace(/[^\d]/g, ""), 10);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  const custom = conversation?.custom_attributes as
    | Record<string, unknown>
    | undefined;
  if (custom) {
    const keys = [
      "deposit_amount_usd",
      "deposit_usd",
      "deposit_total_usd",
      "deposit_amount",
    ];
    for (const k of keys) {
      const n = tryNum(custom[k]);
      if (n != null) return n;
    }
  }

  const meta = payload.meta as Record<string, unknown> | undefined;
  if (meta?.deposit_amount_usd != null)
    return tryNum(meta.deposit_amount_usd);
  return null;
}
