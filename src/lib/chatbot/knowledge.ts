import { CHUNKS, type Chunk } from "./live-site";

const STOP = new Set(
  "a an and are as at be but by can do does for from how i if in is it its me my of on or our so than that the their them then there these they this to us was we what when where which who will with you your about tell please want would like need get have has any some".split(" "),
);

const MIN_SCORE = 2;

export const tokenize = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9+/#]+/g, " ").split(" ").filter((t) => t.length > 1 && !STOP.has(t));

/** Keyword-overlap retrieval: title hits count triple, stop-words are removed, weak matches are dropped. */
export function search(query: string, limit = 3, chunks: Chunk[] = CHUNKS): Chunk[] {
  const q = new Set(tokenize(query));
  if (!q.size) return [];
  return chunks
    .map((c) => {
      const title = new Set(tokenize(c.title));
      const text = new Set(tokenize(c.text));
      let score = 0;
      for (const t of q) score += (title.has(t) ? 3 : 0) + (text.has(t) ? 1 : 0);
      return { c, score };
    })
    .filter((r) => r.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.c);
}
