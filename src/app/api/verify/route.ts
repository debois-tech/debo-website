import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/ratelimit";
import { clientIp, sameOrigin } from "@/lib/request";
import { isDocType, verifyDoc, type VerifyResult } from "@/lib/verify";

export const runtime = "nodejs";

const json = (body: VerifyResult, status: number, headers?: Record<string, string>) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

/** Same-origin proxy to the LMS verification API. The API key and the LMS response handling never reach the browser. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ kind: "error" }, 403);

  const ip = clientIp(req);
  // Certificate IDs are sequential, so cap lookups per visitor on top of the LMS's own lockout. ponytail: per-instance memory, shared store if abuse shows up.
  if (!rateLimit(`verify:${ip}`, 20, 10 * 60_000)) return json({ kind: "rate_limited" }, 429, { "Retry-After": "600" });
  if (Number(req.headers.get("content-length") ?? 0) > 1_000) return json({ kind: "invalid" }, 413);

  let raw: unknown;
  try { raw = await req.json(); } catch { return json({ kind: "invalid" }, 400); }
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  if (!isDocType(o.docType) || typeof o.ref !== "string") return json({ kind: "invalid" }, 422);

  const result = await verifyDoc(o.docType, o.ref, ip);
  return json(result, result.kind === "invalid" ? 422 : result.kind === "error" ? 502 : 200);
}
