import { DB_URL } from "./firebase-config";
import type { DbCommunityPhoto, DbAchievement, DbJourney, DbMentor, DbOpening, DbProject, DbTestimonial, DbPost, DbProgram, DbTeam, WithId } from "@/content/dynamic";
import type { Member } from "@/content/team";

/** Public reads from the Realtime Database REST API. Any failure returns null so pages fall back to built-in content. */
async function read<T>(path: string): Promise<T | null> {
  try {
    const r = await fetch(`${DB_URL}/${path}.json`, { next: { revalidate: 60 }, signal: AbortSignal.timeout(6000) });
    if (!r.ok) return null;
    return (await r.json()) as T | null;
  } catch { return null; }
}
const list = <T extends object>(obj: Record<string, T> | null): WithId<T>[] => Object.entries(obj ?? {}).map(([id, v]) => ({ id, ...v }));
const byOrder = <T extends { order?: number }>(a: T, b: T) => (a.order ?? 999) - (b.order ?? 999);

export const imageUrl = (id?: string, size: "thumb" | "full" = "thumb") => (id ? `/api/img/${id}${size === "full" ? "?size=full" : ""}` : "");

/** Dashboard-managed team, or null when none has been added (the built-in list is used then). */
export async function getTeam(): Promise<Member[] | null> {
  const rows = list(await read<Record<string, DbTeam>>("team")).sort(byOrder);
  const members = rows.filter((m) => m.name && m.title).map((m) => ({ name: m.name, title: m.title, photo: imageUrl(m.imageId), linkedin: m.linkedin }));
  return members.length ? members : null;
}

export async function getPrograms(): Promise<WithId<DbProgram>[] | null> {
  const rows = list(await read<Record<string, DbProgram>>("programs")).filter((p) => p.title).sort(byOrder);
  return rows.length ? rows : null;
}

export async function getPosts(): Promise<WithId<DbPost>[]> {
  return list(await read<Record<string, DbPost>>("posts")).filter((p) => p.slug && p.title).sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
}
export async function getPost(slug: string) { return (await getPosts()).find((p) => p.slug === slug) ?? null; }

/** Open roles managed from the dashboard. Closed roles are hidden from the public page. */
export async function getOpenings(): Promise<WithId<DbOpening>[]> {
  return list(await read<Record<string, DbOpening>>("openings")).filter((o) => o.title && o.slug && o.open).sort(byOrder);
}

/** Testimonials managed from the dashboard. Unpublished ones are hidden; `kind` picks client voices (Services) or learner voices (TEP). */
export async function getTestimonials(kind: "client" | "learner" = "client"): Promise<WithId<DbTestimonial>[]> {
  return list(await read<Record<string, DbTestimonial>>("testimonials")).filter((t) => t.quote && t.name && t.published && (t.kind ?? "client") === kind).sort(byOrder);
}
export async function getAchievements(): Promise<WithId<DbAchievement>[]> {
  return list(await read<Record<string, DbAchievement>>("achievements")).filter((a) => a.name && a.title && a.published).sort(byOrder);
}
export async function getProjects(kind: DbProject["kind"]): Promise<WithId<DbProject>[]> {
  return list(await read<Record<string, DbProject>>("projects")).filter((p) => p.title && p.description && p.published && p.kind === kind).sort(byOrder);
}

/** Community gallery photos from the dashboard. Hidden ones are not returned. */
export async function getCommunityPhotos(): Promise<WithId<DbCommunityPhoto>[]> {
  return list(await read<Record<string, DbCommunityPhoto>>("community")).filter((p) => p.label && p.alt && p.imageId && p.published).sort(byOrder);
}

export async function getMentors(): Promise<WithId<DbMentor>[]> {
  return list(await read<Record<string, DbMentor>>("mentors")).filter((m) => m.name && m.title && m.published).sort(byOrder);
}
export async function getJourneys(): Promise<WithId<DbJourney>[]> {
  return list(await read<Record<string, DbJourney>>("journeys")).filter((j) => j.before && j.after && j.published).sort(byOrder);
}
