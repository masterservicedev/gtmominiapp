import { NextRequest, NextResponse } from "next/server";
import { getAnalyticsPayload } from "@/lib/analytics-data";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-analytics-secret");
  if (secret !== process.env.ANALYTICS_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = await getAnalyticsPayload();
  return NextResponse.json(payload);
}
