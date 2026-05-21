/**
 * Legacy inbound bot handler.
 *
 * Not used while Chatwoot owns Telegram webhook/inbound.
 * Current Railway bot entrypoint is bot/index.ts, which runs outbound nurture only.
 *
 * Keep as reference only unless inbound handling is intentionally moved back from Chatwoot.
 */

import type { Context } from "grammy";
import { db } from "../lib/db";
import { users, broadcastOffers, events } from "../../lib/db/schema";
import { eq } from "drizzle-orm";
import { getMiniAppWebAppUrl } from "../lib/config";
import {
  findLatestReEngagementBroadcastSent,
  logBroadcastReply,
} from "../../lib/broadcastAttribution";

export async function handleCallbackQuery(ctx: Context) {
  const data = ctx.callbackQuery?.data;
  if (!data || !ctx.from?.id) return;

  if (data.startsWith("low_ready_")) {
    const userId = data.replace("low_ready_", "");
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user || user.telegramId !== ctx.from.id) {
      await ctx.answerCallbackQuery({ text: "Unable to verify." });
      return;
    }
    await ctx.answerCallbackQuery();
    const last = await findLatestReEngagementBroadcastSent(user.id);
    if (last) {
      await logBroadcastReply(
        user.id,
        user.telegramId,
        last,
        "low_ready_button",
        user.country,
      );
    }
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const [offer] = await db
      .insert(broadcastOffers)
      .values({
        userId: user.id,
        offerType: "re_entry",
        expiresAt,
      })
      .returning({ id: broadcastOffers.id });
    const offerId = offer?.id;
    const url = offerId
      ? getMiniAppWebAppUrl(`reactivate_${offerId}`)
      : getMiniAppWebAppUrl();
    if (!url) {
      await ctx.reply("Mini app URL is not configured.");
      return;
    }
    await ctx.reply(
      "Great — tap below to see what's available for you now.",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "See my options", web_app: { url } }],
          ],
        },
      },
    );
    return;
  }

  if (data.startsWith("low_later_")) {
    const userId = data.replace("low_later_", "");
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user || user.telegramId !== ctx.from.id) {
      await ctx.answerCallbackQuery({ text: "Unable to verify." });
      return;
    }
    await ctx.answerCallbackQuery();
    await ctx.reply(
      "No problem at all. The channel is here whenever you're ready.\n\nI'll check back in a couple of weeks.",
    );
    await db.insert(events).values({
      userId: user.id,
      telegramId: user.telegramId,
      eventType: "rescore",
      metadata: { trigger: "broadcast_reply", action: "low_later" },
      country: user.country,
    });
  }
}
