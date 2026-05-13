import type { Context } from "grammy";
import { db } from "../lib/db";
import { users, events } from "../../lib/db/schema";
import { eq } from "drizzle-orm";
import { sendLeadCard } from "../lib/sendLead";
import { getMiniAppUrl, getMiniAppWebAppUrl } from "../lib/config";
import { notifyReactivationFromTelegramReady } from "../../lib/reactivateHandoff";
import {
  findLatestReEngagementBroadcastSent,
  logBroadcastReply,
} from "../../lib/broadcastAttribution";

export async function handleMessage(ctx: Context) {
  const telegramId = ctx.from?.id;
  const text = ctx.message?.text?.toLowerCase().trim();
  if (!telegramId || !text) return;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.telegramId, telegramId))
    .limit(1);

  const miniAppUrl = getMiniAppWebAppUrl();
  const miniAppConfigured = Boolean(getMiniAppUrl());

  if (!user) {
    const msg = "To get started, please complete your application first.";
    if (!miniAppConfigured) {
      await ctx.reply(
        `${msg}\n\n⚠️ MINI_APP_URL is not set on the server.`,
      );
      return;
    }
    await ctx.reply(msg, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "📋 Apply Now", web_app: { url: miniAppUrl! } }],
        ],
      },
    });
    return;
  }

  if (text === "ready") {
    const last = await findLatestReEngagementBroadcastSent(user.id);
    if (last) {
      await logBroadcastReply(
        user.id,
        user.telegramId,
        last,
        "telegram_ready",
        user.country,
      );
    }
  }

  if (text === "ready" && user.segment === "HIGH") {
    if (user.intentDeclinedAt) {
      await ctx.reply(
        "You previously chose not to connect right now. Open the mini app when you're ready — you can continue from there.",
      );
      return;
    }
    if (user.crmTriggered) {
      await notifyReactivationFromTelegramReady(user);
      return;
    }
    if (user.intentConfirmedAt) {
      await ctx.reply(
        "We already received your confirmation. Check this chat for messages from our team.",
      );
      return;
    }
    await sendLeadCard(ctx.api, user);
    return;
  }

  if (user.segment === "MID") {
    await db.insert(events).values({
      userId: user.id,
      telegramId: user.telegramId,
      eventType: "rescore",
      metadata: { trigger: "bot_reply", message: text },
      country: user.country,
    });

    const newScore = (user.score || 0) + 1;
    if (newScore >= 5) {
      await db
        .update(users)
        .set({ score: newScore, segment: "HIGH" })
        .where(eq(users.id, user.id));

      const [updated] = await db
        .select()
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      if (updated) {
        await sendLeadCard(ctx.api, updated);
      }
    }
    return;
  }

  if (!miniAppConfigured) {
    await ctx.reply(
      "Tap below to continue your application.\n\n⚠️ MINI_APP_URL is not set on the server.",
    );
    return;
  }

  await ctx.reply("Tap below to continue your application.", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📋 Open App", web_app: { url: miniAppUrl! } }],
      ],
    },
  });
}
