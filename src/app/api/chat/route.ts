import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/ratelimit";
import { systemPrompt } from "@/lib/chatbot/prompt";
import { getKnowledge } from "@/lib/chatbot/site-data";
import type { Chunk } from "@/lib/chatbot/live-site";
import { TOOL_DECLARATIONS, runTool, type ChatAction, type ToolContext } from "@/lib/chatbot/tools";
import { offlineReply } from "@/lib/chatbot/offline";
import { clip } from "@/lib/enquiries/normalize";

export const runtime = "nodejs";

const MAX_BODY = 30_000;
const MAX_TURNS = 16;
const MAX_TEXT = 2000;
const MAX_TOOL_ROUNDS = 4;

type Part = Record<string, unknown>;
type Content = { role: "user" | "model"; parts: Part[] };

const json = (body: Record<string, unknown>, status = 200, headers?: Record<string, string>) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

function parseMessages(raw: unknown): Content[] | null {
  if (!Array.isArray(raw) || !raw.length) return null;
  const out: Content[] = [];
  for (const m of raw.slice(-MAX_TURNS)) {
    if (!m || typeof m !== "object") return null;
    const { role, text } = m as { role?: unknown; text?: unknown };
    const t = clip(text, MAX_TEXT);
    if ((role !== "user" && role !== "bot") || !t) continue;
    out.push({ role: role === "user" ? "user" : "model", parts: [{ text: t }] });
  }
  while (out.length && out[0].role !== "user") out.shift();
  return out.length && out[out.length - 1].role === "user" ? out : null;
}

async function callGemini(contents: Content[], key: string, model: string, system: string) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
      tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 700 },
    }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) throw new Error(`gemini ${res.status}`);
  return (await res.json()) as { candidates?: { content?: Content }[] };
}

async function runModel(contents: Content[], key: string, model: string, chunks: Chunk[]) {
  const ctx: ToolContext = { actions: [], submitted: false, chunks };
  const system = systemPrompt(chunks);
  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const data = await callGemini(contents, key, model, system);
    const content = data.candidates?.[0]?.content;
    const parts = content?.parts ?? [];
    const calls = parts.filter((p) => p.functionCall) as { functionCall: { name: string; args?: Record<string, unknown> } }[];
    if (!calls.length) {
      const text = parts.map((p) => (typeof p.text === "string" ? p.text : "")).join("").trim();
      if (!text) throw new Error("empty model reply");
      return { text, ctx };
    }
    contents.push({ role: "model", parts });
    const responses: Part[] = [];
    for (const c of calls) {
      const response = await runTool(c.functionCall.name, c.functionCall.args ?? {}, ctx);
      responses.push({ functionResponse: { name: c.functionCall.name, response } });
    }
    contents.push({ role: "user", parts: responses });
  }
  throw new Error("too many tool rounds");
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) return json({ ok: false, code: "forbidden" }, 403);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`chat:${ip}`, 30)) return json({ ok: false, code: "rate_limited" }, 429, { "Retry-After": "600" });

  const body = await req.text();
  if (body.length > MAX_BODY) return json({ ok: false, code: "too_large" }, 413);
  let raw: { messages?: unknown };
  try { raw = JSON.parse(body); } catch { return json({ ok: false, code: "bad_request" }, 400); }
  const contents = parseMessages(raw?.messages);
  if (!contents) return json({ ok: false, code: "bad_request" }, 400);

  const lastUser = (contents[contents.length - 1].parts[0] as { text: string }).text;
  const { chunks } = await getKnowledge();
  const key = process.env.GEMINI_API_KEY;
  if (key) {
    try {
      const { text, ctx } = await runModel(contents, key, process.env.CHATBOT_MODEL || "gemini-2.5-flash", chunks);
      const action: ChatAction | undefined = ctx.actions[ctx.actions.length - 1];
      return json({ ok: true, text: clip(text, 4000), action, submitted: ctx.submitted });
    } catch (err) {
      console.error("[chat] model failed:", err instanceof Error ? err.message : "unknown");
    }
  }
  const fallback = offlineReply(lastUser, chunks);
  return json({ ok: true, text: fallback.text, action: fallback.action, offline: true });
}
