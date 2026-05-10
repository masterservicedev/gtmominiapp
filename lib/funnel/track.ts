import type { EventType } from "@/lib/db/schema";
import { loadWebApp } from "@/lib/twa";

export async function trackFunnelEvent(
  eventType: EventType,
  metadata?: Record<string, unknown>,
) {
  try {
    const WebApp = await loadWebApp();
    await fetch("/api/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        initData: WebApp.initData,
        eventType,
        metadata,
      }),
    });
  } catch {
    /* non-blocking */
  }
}
