import { getPosts, getPrograms, getTeam } from "@/lib/content";
import { CHUNKS, postChunks, programsText, teamChunk, type Chunk } from "./live-site";

const TTL = 60_000;
let cache: { at: number; chunks: Chunk[]; programs: string } | null = null;

/** Built-in content plus what the dashboard publishes (programs, team, blog). Falls back to built-in content if Firebase is unreachable. */
export async function getKnowledge() {
  if (cache && Date.now() - cache.at < TTL) return cache;
  const [programs, team, posts] = await Promise.all([getPrograms(), getTeam(), getPosts()]);
  const text = programsText(programs);
  const chunks = CHUNKS.map((c) => (c.id === "programs" ? { ...c, text } : c.id === "team" && team ? teamChunk(team) : c)).concat(postChunks(posts));
  cache = { at: Date.now(), chunks, programs: text };
  return cache;
}
