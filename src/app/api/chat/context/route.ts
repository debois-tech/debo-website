import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/ratelimit";
import { getKnowledge } from "@/lib/chatbot/site-data";

export const runtime = "nodejs";

/** Dashboard-sourced text the widget needs for its canned replies. */
export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`chat-ctx:${ip}`, 30)) return NextResponse.json({ ok: false }, { status: 429 });
  const { programs } = await getKnowledge();
  return NextResponse.json({ ok: true, programs }, { headers: { "Cache-Control": "public, max-age=60" } });
}
