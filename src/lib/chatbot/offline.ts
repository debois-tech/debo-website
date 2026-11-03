import { search } from "./knowledge";
import { CHUNKS, NO_INFO, PRICING_REPLY, type Chunk } from "./live-site";
import { EMAIL, WHATSAPP_PREFILL, whatsappLink } from "./contact";

export type OfflineReply = { text: string; action?: { label: string; href: string } };

const PRICING_RE = /\b(price|prices|pricing|cost|costs|quote|quotation|how much|rates?|charges?|budget|estimate)\b/i;
const PROGRAM_RE = /\b(tep|fde|program|programs|course|training|cohort|certificate|fees?)\b/i;
const PROMPT_RE = /\b(system prompt|your instructions|your prompt|ignore (all |your )?(previous|prior)|reveal.*(key|prompt|env))/i;

function handoff(text: string): OfflineReply {
  const link = whatsappLink(WHATSAPP_PREFILL);
  return link ? { text, action: { label: "Chat on WhatsApp", href: link } } : { text: `${text} You can email ${EMAIL}.` };
}

/** Rule-based fallback. Only fixed policy text or verbatim knowledge chunks, so it cannot invent facts. */
export function offlineReply(message: string, chunks: Chunk[] = CHUNKS): OfflineReply {
  if (PROMPT_RE.test(message)) return { text: "I can't provide internal system instructions, but I can explain how I can help you." };
  if (PRICING_RE.test(message) && !PROGRAM_RE.test(message)) return { text: PRICING_REPLY };
  const hits = search(message, 1, chunks);
  if (hits.length) {
    const c = hits[0];
    return { text: c.text, action: c.href ? { label: "Learn more", href: c.href } : undefined };
  }
  return handoff(NO_INFO);
}
