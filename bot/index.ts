import { Bot } from "grammy";
import { processNurtureQueue } from "./lib/nurture";
import { getBotToken } from "./lib/config";
import "dotenv/config";

/**
 * Railway worker — outbound only.
 *
 * Chatwoot owns the Telegram inbox for TELEGRAM_BOT_TOKEN, so this process
 * MUST NOT call bot.start() or register a webhook. It would steal updates from
 * Chatwoot and cause 409 / dropped messages.
 *
 * Responsibilities:
 *  - Run processNurtureQueue every 5 minutes
 *  - Provide `bot.api` for outbound sends (broadcasts, lead card DMs, etc.)
 */

const token = getBotToken();
if (!token) {
  console.error("TELEGRAM_BOT_TOKEN is missing or empty");
  process.exit(1);
}

const bot = new Bot(token);

const NURTURE_INTERVAL_MS = 5 * 60 * 1000;

setInterval(async () => {
  try {
    await processNurtureQueue(bot);
  } catch (err) {
    console.error("Nurture tick failed:", err);
  }
}, NURTURE_INTERVAL_MS);

console.log("GTMO nurture worker running (outbound only — Chatwoot owns inbound)");
