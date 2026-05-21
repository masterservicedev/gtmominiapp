/**
 * @deprecated Legacy re-engagement sends — replaced by lib/reEngagementBroadcasts.ts.
 * Railway worker uses lib/reEngagementBroadcasts via bot/lib/nurture.ts.
 * Kept for reference only; do not import from new code paths.
 */

import type { Api } from "grammy";
import { db } from "./db";
import { broadcastOffers, users } from "../../lib/db/schema";
import { getMiniAppWebAppUrl, getChannelLinkUrl } from "./config";
import {
  buildReEngagementTelegramBody,
  type ReEngagementPreviewInput,
  isReEngagementBroadcastType,
} from "../../lib/reEngagementBroadcasts";

export type UserRow = typeof users.$inferSelect;

function toPreviewInput(user: UserRow): ReEngagementPreviewInput {
  return {
    firstName: user.firstName,
    confirmedProductKey: user.confirmedProductKey,
  };
}

async function createBundleExtensionOffer(userId: string): Promise<string> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const [row] = await db
    .insert(broadcastOffers)
    .values({
      userId,
      offerType: "bundle_extension",
      expiresAt,
    })
    .returning({ id: broadcastOffers.id });
  return row!.id;
}

function reactivateStartParam(offerId: string) {
  return `reactivate_${offerId}`;
}

function webAppReactivateButton(offerId: string) {
  const url = getMiniAppWebAppUrl(reactivateStartParam(offerId));
  if (!url) return undefined;
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Activate my access", web_app: { url } }],
      ],
    },
  };
}

/** @deprecated */
export async function sendReactivation48h(api: Api, user: UserRow) {
  if (!isReEngagementBroadcastType("high_day2")) return;
  await api.sendMessage(
    user.telegramId,
    buildReEngagementTelegramBody("high_day2", toPreviewInput(user)),
  );
}

/** @deprecated */
export async function sendReactivationDay5(api: Api, user: UserRow) {
  await api.sendMessage(
    user.telegramId,
    buildReEngagementTelegramBody("high_day5", toPreviewInput(user)),
  );
}

/** @deprecated */
export async function sendMidDay7(api: Api, user: UserRow) {
  const offerId = await createBundleExtensionOffer(user.id);
  const extra = webAppReactivateButton(offerId);
  await api.sendMessage(
    user.telegramId,
    buildReEngagementTelegramBody("mid_day3", toPreviewInput(user)),
    extra,
  );
}

/** @deprecated */
export async function sendMidDay14(api: Api, user: UserRow) {
  const offerId = await createBundleExtensionOffer(user.id);
  const extra = webAppReactivateButton(offerId);
  await api.sendMessage(
    user.telegramId,
    buildReEngagementTelegramBody("mid_day10", toPreviewInput(user)),
    extra,
  );
}

/** @deprecated */
export async function sendMidDay21Final(api: Api, user: UserRow) {
  await api.sendMessage(
    user.telegramId,
    buildReEngagementTelegramBody("mid_day10", toPreviewInput(user)),
  );
}

/** @deprecated */
export async function sendLowDay14(api: Api, user: UserRow) {
  const offerId = await createBundleExtensionOffer(user.id);
  const readyUrl = getMiniAppWebAppUrl(reactivateStartParam(offerId));
  const channelUrl = getChannelLinkUrl();

  const inline_keyboard: {
    text: string;
    web_app?: { url: string };
    url?: string;
  }[][] = [];

  if (readyUrl) {
    inline_keyboard.push([
      {
        text: "I'm ready to explore options now",
        web_app: { url: readyUrl },
      },
    ]);
  }

  if (channelUrl) {
    inline_keyboard.push([
      {
        text: "Still need more time",
        url: channelUrl,
      },
    ]);
  }

  const text = buildReEngagementTelegramBody("low_day7", toPreviewInput(user));
  if (inline_keyboard.length > 0) {
    await api.sendMessage(user.telegramId, text, {
      reply_markup: { inline_keyboard } as import("grammy").InlineKeyboard,
    });
  } else {
    await api.sendMessage(user.telegramId, text);
  }
}

/** @deprecated */
export async function sendLowDay30Final(api: Api, user: UserRow) {
  await api.sendMessage(
    user.telegramId,
    buildReEngagementTelegramBody("low_day7", toPreviewInput(user)),
  );
}
