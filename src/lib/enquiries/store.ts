import { promises as fs } from "node:fs";
import path from "node:path";
import type { EnquiryRecord } from "./types";

const LOCAL_FILE = path.join(process.cwd(), ".data", "enquiries.json");

async function storeInSheets(record: EnquiryRecord, url: string, secret: string) {
  // text/plain keeps this a "simple" request; Apps Script answers via redirect, which fetch follows.
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ secret, action: "create", record }),
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
  });
  const body = (await res.json().catch(() => null)) as { ok?: boolean } | null;
  if (!res.ok || !body?.ok) throw new Error(`sheets responded ${res.status}`);
}

async function storeLocally(record: EnquiryRecord) {
  let rows: EnquiryRecord[] = [];
  try { rows = JSON.parse(await fs.readFile(LOCAL_FILE, "utf8")); } catch { /* first write */ }
  rows.push(record);
  await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true });
  await fs.writeFile(LOCAL_FILE, JSON.stringify(rows, null, 2));
}

/** Google Sheets when configured, otherwise a local JSON file for development. */
export async function storeEnquiry(record: EnquiryRecord): Promise<void> {
  const url = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  const secret = process.env.GOOGLE_SHEETS_SECRET;
  if (url && secret) return storeInSheets(record, url, secret);
  return storeLocally(record);
}
