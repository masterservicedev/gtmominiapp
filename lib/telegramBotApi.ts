const TG = "https://api.telegram.org";

export async function telegramSendMessage(
  chatId: number,
  text: string,
  options?: { parse_mode?: "Markdown" | "HTML" },
): Promise<{ ok: boolean; description?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("telegramSendMessage: TELEGRAM_BOT_TOKEN missing");
    return { ok: false, description: "missing_token" };
  }
  const res = await fetch(`${TG}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      ...options,
    }),
  });
  const data = (await res.json()) as { ok: boolean; description?: string };
  if (!data.ok) {
    console.error("telegramSendMessage failed:", data.description);
  }
  return data;
}
