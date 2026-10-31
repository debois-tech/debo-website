/** Shapes stored in the Firebase Realtime Database (managed from the dashboard). */
export type DbTeam = { name: string; title: string; linkedin?: string; imageId?: string; order?: number };
export type ProgramStatus = "current" | "upcoming" | "past";
export type DbProgram = {
  title: string; status: ProgramStatus; flagship?: boolean; summary: string; details?: string;
  startDate?: string; endDate?: string; duration?: string; fee?: string; applyUrl?: string; imageId?: string; order?: number; updatedAt?: number;
};
export type DbPost = { title: string; slug: string; excerpt: string; body: string; author?: string; tags?: string[]; coverImageId?: string; publishedAt?: number; updatedAt?: number };
export type DbOpening = {
  title: string; slug: string; location: string; type: string; summary?: string;
  responsibilities?: string[]; requirements?: string[]; applyUrl?: string; open: boolean; order?: number; updatedAt?: number;
};
export type WithId<T> = T & { id: string };
