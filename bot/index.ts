import { Bot } from "grammy";
import { handleStart } from "./handlers/start";
import { handleMessage } from "./handlers/messages";
import { handleCallbackQuery } from "./handlers/callbacks";
import { processNurtureQueue } from "./lib/nurture";
import { getBotToken } from "./lib/config";
import "dotenv/config";

const token = getBotToken();
if (!token) {
  console.error("TELEGRAM_BOT_TOKEN is missing or empty");
  process.exit(1);
}

const bot = new Bot(token);

bot.command("start", handleStart);
bot.on("message:text", handleMessage);
bot.on("callback_query:data", handleCallbackQuery);

bot.catch((err) => {
  console.error("Bot error:", err);
});

setInterval(async () => {
  await processNurtureQueue(bot);
}, 5 * 60 * 1000);

bot.start();
console.log("GTMO bot running");
