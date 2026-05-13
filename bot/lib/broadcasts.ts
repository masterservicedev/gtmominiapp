import type { Api } from "grammy";
import { db } from "./db";
import { broadcastOffers, users } from "../../lib/db/schema";
import { getMiniAppWebAppUrl } from "./config";
import {
  buildReEngagementTelegramBody,
  type MessageVariant,
  type ReEngagementPreviewInput,
} from "../../lib/reEngagementBroadcasts";

export type UserRow = typeof users.$inferSelect;

function toPreviewInput(user: UserRow): ReEngagementPreviewInput {
  return {
    firstName: user.firstName,
    confirmedProductKey: user.confirmedProductKey,
    bundleEligible: user.bundleEligible ?? false,
    bundleUsed: user.bundleUsed ?? false,
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

export async function sendReactivation48h(
  api: Api,
  user: UserRow,
  variant: MessageVariant,
) {
  await api.sendMessage(
    user.telegramId,
    buildReEngagementTelegramBody("reactivation_48h", toPreviewInput(user), variant),
    { parse_mode: "Markdown" },
  );
}

export async function sendReactivationDay5(
  api: Api,
  user: UserRow,
  variant: MessageVariant,
) {
  await api.sendMessage(
    user.telegramId,
    buildReEngagementTelegramBody("reactivation_day5", toPreviewInput(user), variant),
    { parse_mode: "Markdown" },
  );
}

export async function sendMidDay7(
  api: Api,
  user: UserRow,
  variant: MessageVariant,
) {
  const offerId = await createBundleExtensionOffer(user.id);
  const extra = webAppReactivateButton(offerId);
  await api.sendMessage(
    user.telegramId,
    buildReEngagementTelegramBody("mid_day7", toPreviewInput(user), variant),
    {
      parse_mode: "Markdown",
      ...extra,
    },
  );
}

export async function sendMidDay14(
  api: Api,
  user: UserRow,
  variant: MessageVariant,
) {
  const offerId = await createBundleExtensionOffer(user.id);
  const extra = webAppReactivateButton(offerId);
  await api.sendMessage(
    user.telegramId,
    buildReEngagementTelegramBody("mid_day14", toPreviewInput(user), variant),
    { parse_mode: "Markdown", ...extra },
  );
}

export async function sendMidDay21Final(
  api: Api,
  user: UserRow,
  variant: MessageVariant,
) {
  await api.sendMessage(
    user.telegramId,
    buildReEngagementTelegramBody("mid_day21", toPreviewInput(user), variant),
    { parse_mode: "Markdown" },
  );
}

export async function sendLowDay14(
  api: Api,
  user: UserRow,
  variant: MessageVariant,
) {
  await api.sendMessage(
    user.telegramId,
    buildReEngagementTelegramBody("low_day14", toPreviewInput(user), variant),
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "I'm ready to explore options now",
              callback_data: `low_ready_${user.id}`,
            },
          ],
          [{ text: "Still need more time", callback_data: `low_later_${user.id}` }],
        ],
      },
    },
  );
}

export async function sendLowDay30Final(
  api: Api,
  user: UserRow,
  variant: MessageVariant,
) {
  await api.sendMessage(
    user.telegramId,
    buildReEngagementTelegramBody("low_day30", toPreviewInput(user), variant),
    { parse_mode: "Markdown" },
  );
}
