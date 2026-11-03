import { DB_URL } from "@/lib/firebase-config";
import { base64ToBytes } from "@/lib/image-codec";

export const runtime = "nodejs";
const SAFE = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]); // no SVG: it can carry script

/** Turns an image stored as base64 text in the database back into real image bytes. Ids are unique per upload, so responses are cacheable forever. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^[A-Za-z0-9_-]{6,40}$/.test(id)) return new Response("Not found", { status: 404 });
  const full = new URL(req.url).searchParams.get("size") === "full";
  const get = async (k: string) => { try { const r = await fetch(`${DB_URL}/images/${id}/${k}.json`, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) }); return r.ok ? ((await r.json()) as string | null) : null; } catch { return null; } };
  const [b64, mime] = await Promise.all([get(full ? "full" : "thumb"), full ? get("mime") : Promise.resolve("image/webp")]);
  if (!b64 || typeof b64 !== "string" || !mime || !SAFE.has(mime)) return new Response("Not found", { status: 404 });
  let bytes: Uint8Array;
  try { bytes = base64ToBytes(b64); } catch { return new Response("Not found", { status: 404 }); }
  return new Response(bytes as BodyInit, { headers: { "Content-Type": mime, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; sandbox" } });
}
