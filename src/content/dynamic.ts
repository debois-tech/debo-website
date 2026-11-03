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
/** Testimonials. `kind` decides where it appears: client voices on Services, learner voices on the TEP page. */
export type DbTestimonial = {
  quote: string; name: string; role?: string; company?: string; published: boolean; order?: number; updatedAt?: number;
  kind?: "client" | "learner"; /** program or workshop attended, for learners */ program?: string; linkedin?: string; videoUrl?: string; imageId?: string; featured?: boolean;
};
export type AchievementLabel = "placed" | "internship" | "certified" | "progress";
/** A learner's verified milestone. Publish only with the learner's permission and a link that verifies it. */
export type DbAchievement = {
  name: string; title: string; org?: string; label: AchievementLabel; track?: string; date?: string; linkedin?: string; story?: string; imageId?: string;
  published: boolean; order?: number; updatedAt?: number;
};
/** A project built in a program. `kind` is "capstone" (DeboisTech or program capstones) or "learner" (verified learner work). */
export type DbProject = {
  title: string; kind: "capstone" | "learner"; track?: string; problem?: string; description: string; contributors?: string; stack?: string[]; deliverables?: string[];
  repo?: string; demo?: string; feedback?: string; imageId?: string; published: boolean; order?: number; updatedAt?: number;
};
/** A TEP mentor. Only add people who actually mentor on the program; never add qualifications or employers you cannot verify. */
export type DbMentor = { name: string; title: string; /** Company or organisation they work for */ company?: string; imageId?: string; linkedin?: string; expertise?: string[]; guides?: string[]; published: boolean; order?: number; updatedAt?: number };
/** A real learner journey, shared with the learner's permission. */
export type DbJourney = { before: string; after: string; who?: string; track?: string; published: boolean; order?: number; updatedAt?: number };
/** A photo in the Community gallery on the Company page. Real event photos only, shown with the permission of the people in them. */
export type DbCommunityPhoto = { label: string; alt: string; imageId: string; caption?: string; /** CSS object-position, so a tall photo cropped into a wide tile keeps its subject in frame */ position?: string; published: boolean; order?: number; updatedAt?: number };
export type WithId<T> = T & { id: string };
