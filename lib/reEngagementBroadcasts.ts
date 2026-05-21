import type { InferSelectModel } from "drizzle-orm";
import { users } from "@/lib/db/schema";
import { getCatalogProduct } from "@/lib/productCatalog";
import type { ProductKey } from "@/lib/productMatch";
import { getMiniAppWebAppUrl } from "@/lib/config";

export const RE_ENGAGEMENT_BROADCAST_TYPES = [
  "high_day2",
  "high_day5",
  "mid_day3",
  "mid_day10",
  "low_day7",
] as const;

export type ReEngagementBroadcastType =
  (typeof RE_ENGAGEMENT_BROADCAST_TYPES)[number];

export const RE_ENGAGEMENT_LABELS: Record<ReEngagementBroadcastType, string> = {
  high_day2: "HIGH · Day 2 no deposit",
  high_day5: "HIGH · Day 5 no deposit",
  mid_day3: "MID · Day 3",
  mid_day10: "MID · Day 10 final",
  low_day7: "LOW/Starter · Day 7",
};

export const BROADCAST_SPLIT_TYPES: ReEngagementBroadcastType[] = [];

export const VARIANT_STRATEGY: Record<string, string> = {
  A: "Single variant — A/B split testing removed.",
};

export type ReEngagementPreviewInput = {
  firstName: string | null;
  confirmedProductKey: string | null;
};

export function isReEngagementBroadcastType(
  v: string | null | undefined,
): v is ReEngagementBroadcastType {
  return (
    v != null &&
    (RE_ENGAGEMENT_BROADCAST_TYPES as readonly string[]).includes(v)
  );
}

export function normalizeMessageVariant(
  _raw: string | null | undefined,
): "A" {
  return "A";
}

export type UserRow = InferSelectModel<typeof users>;

type TelegramSendApi = {
  sendMessage: (
    chatId: number,
    text: string,
    other?: Record<string, unknown>,
  ) => Promise<unknown>;
};

function productName(user: UserRow): string {
  const key = user.confirmedProductKey;
  if (!key) return "your matched access";
  try {
    return getCatalogProduct(key as ProductKey).displayName;
  } catch {
    return "your matched access";
  }
}

const WEBAPP_CONTINUE = (userId: string) => {
  const url = getMiniAppWebAppUrl(`reactivate_${userId}`);
  if (!url) return undefined;
  return {
    inline_keyboard: [[{ text: "Continue my application →", web_app: { url } }]],
  };
};

const WEBAPP_CONNECT = (userId: string) => {
  const url = getMiniAppWebAppUrl(`reactivate_${userId}`);
  if (!url) return undefined;
  return {
    inline_keyboard: [
      [{ text: "Connect me with a specialist →", web_app: { url } }],
    ],
  };
};

const WEBAPP_READY = (userId: string) => {
  const url = getMiniAppWebAppUrl(`reactivate_${userId}`);
  if (!url) return undefined;
  return {
    inline_keyboard: [[{ text: "I'm ready to continue →", web_app: { url } }]],
  };
};

export function buildReEngagementTelegramBody(
  broadcastType: ReEngagementBroadcastType,
  u: ReEngagementPreviewInput,
): string {
  const product = u.confirmedProductKey
    ? (() => {
        try {
          return getCatalogProduct(u.confirmedProductKey as ProductKey)
            .displayName;
        } catch {
          return "your matched access";
        }
      })()
    : "your matched access";

  switch (broadcastType) {
    case "high_day2":
      return `Your registration link is waiting in this chat.

When you're ready to fund your account and activate your ${product} access, your specialist is one message away.

Tap below if you have questions or you're ready to continue.`;

    case "high_day5":
      return `Your ${product} access path is still open.

Your specialist has your registration link ready. Fund your account when you're ready and your access activates the same day.`;

    case "mid_day3":
      return `You were matched with ${product} when you completed your application.

Your specialist is ready to send your registration link when you are.`;

    case "mid_day10":
      return `Your ${product} access path is still available.

Tap below when you're ready to continue — this is the last reminder.`;

    case "low_day7":
      return `Your starter access (MT5 Guide + Ebook) is available for $50.

Your registration link is ready — fund your account when you're ready and access activates the same day.`;

    default:
      return "";
  }
}

export function buildReEngagementAdminHint(
  broadcastType: ReEngagementBroadcastType,
): string {
  switch (broadcastType) {
    case "high_day2":
    case "mid_day10":
    case "low_day7":
      return 'WebApp button: "Continue my application →" → /reactivate?startapp=reactivate_{userId}';
    case "high_day5":
      return 'WebApp button: "I\'m ready to continue →" → /reactivate?startapp=reactivate_{userId}';
    case "mid_day3":
      return 'WebApp button: "Connect me with a specialist →" → /reactivate?startapp=reactivate_{userId}';
    default:
      return "";
  }
}

export function telegramBodyToAdminPlain(body: string): string {
  return body;
}

export async function sendHighDay2(
  api: TelegramSendApi,
  user: UserRow,
): Promise<void> {
  const markup = WEBAPP_CONTINUE(user.id);
  await api.sendMessage(
    user.telegramId,
    buildReEngagementTelegramBody("high_day2", user),
    markup ? { reply_markup: markup } : {},
  );
}

export async function sendHighDay5(
  api: TelegramSendApi,
  user: UserRow,
): Promise<void> {
  const markup = WEBAPP_READY(user.id);
  await api.sendMessage(
    user.telegramId,
    buildReEngagementTelegramBody("high_day5", user),
    markup ? { reply_markup: markup } : {},
  );
}

export async function sendMidDay3(
  api: TelegramSendApi,
  user: UserRow,
): Promise<void> {
  const markup = WEBAPP_CONNECT(user.id);
  await api.sendMessage(
    user.telegramId,
    buildReEngagementTelegramBody("mid_day3", user),
    markup ? { reply_markup: markup } : {},
  );
}

export async function sendMidDay10(
  api: TelegramSendApi,
  user: UserRow,
): Promise<void> {
  const markup = WEBAPP_CONTINUE(user.id);
  await api.sendMessage(
    user.telegramId,
    buildReEngagementTelegramBody("mid_day10", user),
    markup ? { reply_markup: markup } : {},
  );
}

export async function sendLowDay7(
  api: TelegramSendApi,
  user: UserRow,
): Promise<void> {
  const markup = WEBAPP_CONTINUE(user.id);
  await api.sendMessage(
    user.telegramId,
    buildReEngagementTelegramBody("low_day7", user),
    markup ? { reply_markup: markup } : {},
  );
}
