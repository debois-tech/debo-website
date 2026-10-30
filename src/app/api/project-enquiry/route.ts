import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/ratelimit";
import { submitEnquiry } from "@/lib/enquiries/submit";

export const runtime = "nodejs";

const json = (body: Record<string, unknown>, status: number, headers?: Record<string, string>) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) return json({ ok: false, code: "forbidden" }, 403);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`enquiry:${ip}`, 5)) return json({ ok: false, code: "rate_limited" }, 429, { "Retry-After": "600" });

  if (Number(req.headers.get("content-length") ?? 0) > 20_000) return json({ ok: false, code: "too_large" }, 413);

  let raw: unknown;
  try { raw = await req.json(); } catch { return json({ ok: false, code: "bad_request" }, 400); }

  const result = await submitEnquiry(raw);
  if (result.ok) return json({ ok: true, id: result.id }, 200);
  return result.code === "invalid" ? json({ ok: false, code: "invalid", errors: result.errors }, 422) : json({ ok: false, code: "failed" }, 502);
}
