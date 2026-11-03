import { SITE } from "@/content/site";
import { SERVICES, ENGAGEMENT_STEPS } from "@/content/services";
import { PRODUCTS, productHref } from "@/content/products";
import { LABS, LAB_LOCAL, LAB_TOTALS, LAB_TRACKS } from "@/content/labs";
import { JOURNEY, TEP_FAQ, TEP_INTRO, TRACKS } from "@/content/tep";
import { OPENINGS } from "@/content/careers";
import { COMMUNITIES, COMMUNITY_INTRO } from "@/content/community";
import { PRINCIPLES, TEAM } from "@/content/team";
import { STORIES } from "@/content/work";
import type { DbPost, DbProgram, WithId } from "@/content/dynamic";

export type Chunk = { id: string; title: string; text: string; href?: string };

export const ROUTES = ["/", "/products", "/services", "/company", "/program", "/tep", "/labs", "/work", "/blog", "/careers", "/contact"] as const;

export const NO_INFO =
  "I don't have verified information about that at the moment. I can help you connect with the DeboisTech team for the exact details.";

export const PRICING_REPLY =
  "Cost depends on the scope, design, features, integrations and technology stack, so I can't quote a price here. If you share what you would like to build, I can note the requirements so the team can scope it with you.";

const CONFIRM_LINE = "Anything not listed here (dates, fees, duration, certificates, availability) is confirmed by the team when you enquire.";
const join = (xs: string[]) => xs.join("; ");
const sentence = (s: string) => (/[.!?]$/.test(s) ? s : `${s}.`);

/** What the dashboard publishes about programs; the static TEP content fills in the rest. */
export function programsText(db: WithId<DbProgram>[] | null): string {
  const live = (db ?? []).map((p) => {
    const facts = [p.startDate && `starts ${p.startDate}`, p.endDate && `ends ${p.endDate}`, p.duration && `duration ${p.duration}`, p.fee && `fee ${p.fee}`].filter(Boolean);
    return `${p.title} (${p.status})${p.summary ? `: ${sentence(p.summary)}` : "."}${facts.length ? ` Published details: ${facts.join(", ")}.` : ""}`;
  });
  return [
    `${TEP_INTRO} Tracks: ${join(TRACKS.map((t) => t.name))}.`,
    ...(live.length ? [`Programs listed on the site: ${live.join(" ")}`] : []),
    CONFIRM_LINE,
  ].join(" ");
}

export function careersText(): string {
  return OPENINGS.length
    ? `Current openings: ${join(OPENINGS.map((o) => `${o.title} (${o.location}, ${o.type})`))}. Apply through the Careers page.`
    : `There are no open roles at the moment. If you would like to work with us, email ${SITE.email} with examples of your work.`;
}

const c = (id: string, title: string, text: string, href?: string): Chunk => ({ id, title, text, href });

/** Chunks from the built-in content files. Safe on the client; the server adds dashboard data on top. */
export function staticChunks(): Chunk[] {
  const out: Chunk[] = [
    c("company", "About DeboisTech company Nashik team location remote clients",
      `${SITE.legalName} is a small engineering team based in ${SITE.location.replace(", India", "")}, India. ${SITE.description} We serve clients across India and internationally, working remotely. Our tagline is “${SITE.tagline}” There are three ways in: Products, Engineering Services and Programs.`, "/company"),
    c("contact", "Contact email phone WhatsApp reach team address",
      `You can reach the team at ${SITE.email}, or by phone / WhatsApp on ${SITE.phone}. We are based in ${SITE.location}.`, "/contact"),
    c("services", "Services engineering services overview capabilities",
      `Engineering Services cover ${join(SERVICES.map((s) => `${s.name} (${s.short.replace(/\.$/, "")})`))}.`, "/services"),
    c("process", "Process how we work engagement steps", `Our engagement process has five steps: ${ENGAGEMENT_STEPS.join(", ")}.`, "/services"),
    ...SERVICES.map((s) => c(`svc-${s.slug}`, `${s.name} ${s.short}`,
      `${s.name} is for ${s.audience.charAt(0).toLowerCase()}${s.audience.slice(1)} Typical deliverables: ${join(s.deliverables)}.`, "/services")),
    c("products", "Products overview product list",
      `DeboisTech has ${PRODUCTS.length} products: ${join(PRODUCTS.map((p) => `${p.name} (${p.tagline.replace(/\.$/, "")})`))}.`, "/products"),
    ...PRODUCTS.map((p) => c(p.slug, `${p.name} ${p.tagline}`,
      `${p.name}: ${sentence(p.summary)} Who it's for: ${join(p.audience)}. Features: ${join(p.features.map((f) => `${f.title} (${f.body.replace(/\.$/, "")})`))}. Status: ${p.status}. ${p.statusNote}`, productHref(p))),
    c("labs-overview", "Debo Labs labs tracks count how many total",
      `${LABS.name} has ${LAB_TOTALS.labs} labs across ${LAB_TOTALS.tracks} tracks (${join(LAB_TRACKS.map((t) => `${t.name}: ${t.labs}`))}), hosted at ${LABS.url.replace("https://", "")} or runnable offline in Docker.`, "/labs"),
    ...LAB_TRACKS.map((t) => c(`lab-${t.slug}`, `${t.name} lab track Debo Labs`, `${t.name} in Debo Labs: ${t.labs} lab${t.labs === 1 ? "" : "s"}, about ${t.minutes} minutes in total. ${t.blurb}`, "/labs")),
    c("labs-local", "Debo Labs run locally offline Docker requirements install",
      `Debo Labs can run on your own machine in Docker: ${LAB_LOCAL.commands.join(", then ")}. Requirements: ${join(LAB_LOCAL.requirements.map((r) => `${r.os}: ${r.needs}`))}`, "/labs"),
    c("programs", "Programs overview training TEP FDE cohort dates fees", programsText(null), "/program"),
    ...TRACKS.map((t) => c(`tep-${t.slug}`, `TEP ${t.name} track Technology Excellence Program`,
      `TEP ${t.name}: ${sentence(t.summary)} For: ${t.audience} Topics: ${join(t.topics)}. Format: ${join(t.format)}. Learning journey: ${join(JOURNEY[t.slug].map((j) => `${j.step} (${j.body.replace(/\.$/, "")})`))}. The team confirms ${t.needsConfirmation.join(", ").toLowerCase()} when you enquire.`, `/tep/${t.slug}`)),
    ...TEP_FAQ.map((f, i) => c(`tep-faq-${i}`, `TEP FAQ ${f.q}`, `${f.q} ${f.a}`, "/tep")),
    c("careers", "Careers jobs openings hiring vacancies internship work with us", careersText(), "/careers"),
    c("work", "Work case studies clients portfolio references stories",
      `No client case studies are published. Product stories are available for ${join(STORIES.map((s) => s.title))}.`, "/work"),
    c("team", "Team leadership people who works CEO CTO engineers founders",
      `The team includes ${join(TEAM.map((m) => `${m.name} (${m.title})`))}.`, "/company"),
    c("principles", "Principles values culture how we work together", `Our principles: ${join(PRINCIPLES.map((p) => `${p.title} (${p.body.replace(/\.$/, "")})`))}.`, "/company"),
    ...COMMUNITIES.filter((m) => !m.pending).map((m, i) => c(`community-${i}`, `Community ${m.name} workshops events open source`,
      `${m.name}: ${m.about} ${m.contribution.join(" ")} ${m.facts.map((f) => `${f.label}: ${f.value}.`).join(" ")}`.trim(), "/company")),
    c("community", "Community developer communities workshops events", COMMUNITY_INTRO, "/company"),
  ];
  return out;
}

export const CHUNKS: Chunk[] = staticChunks();

/** Blog posts from the dashboard become retrievable chunks that link to the post. */
export function postChunks(posts: WithId<DbPost>[]): Chunk[] {
  return posts.slice(0, 20).map((p) => c(`post-${p.slug}`, `Blog post article ${p.title} ${(p.tags ?? []).join(" ")}`,
    `Blog post “${p.title}”${p.author ? ` by ${p.author}` : ""}: ${p.excerpt}`.slice(0, 600), `/blog/${p.slug}`));
}

/** Team from the dashboard replaces the built-in list when present. */
export function teamChunk(members: { name: string; title: string }[]): Chunk {
  return c("team", "Team leadership people who works CEO CTO engineers founders", `The team includes ${join(members.map((m) => `${m.name} (${m.title})`))}.`, "/company");
}

export const chunkText = (id: string, chunks: Chunk[] = CHUNKS) => chunks.find((x) => x.id === id)?.text ?? "";
