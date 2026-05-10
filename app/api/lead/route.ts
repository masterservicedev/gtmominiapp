import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  firstName: z.string().min(1).max(200),
  lastName: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().min(8).max(40),
  variant: z.string().max(32).optional(),
  sourcePage: z.string().max(2000).optional(),
});

/**
 * Optional bridge to Google Apps Script / Sheets (or any HTTPS webhook).
 * Set GOOGLE_SHEETS_WEBHOOK_URL and WEBHOOK_LEAD_SECURITY_TOKEN in env; if URL is unset, accepts and no-ops.
 */
export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const url = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
    const token = process.env.WEBHOOK_LEAD_SECURITY_TOKEN;
    const payload = {
      ...parsed.data,
      submittedAt: new Date().toISOString(),
      ...(token ? { webhookSecurityToken: token } : {}),
    };

    if (url) {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 12_000);
      try {
        await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: ctrl.signal,
        });
      } finally {
        clearTimeout(t);
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
