/**
 * Community involvement. Sources: GDG Nashik workshop proposal, GDGC MET core-team list and letter, and the
 * "Cloud Native & AI" event banner/check-in list (all in the owner's files, reviewed 21 Oct 2026).
 * Only facts those documents support are stated. `pending: true` marks a community whose contribution details have not been supplied.
 */
export type CommunityFact = { label: string; value: string };
export type Community = {
  name: string;
  /** One line on what the community is, as named in our documents. */
  about: string;
  /** What we did with them. Only verified statements. */
  contribution: string[];
  facts: CommunityFact[];
  pending?: boolean;
};

export const COMMUNITY_INTRO = "We teach and organise with the developer communities around us in Nashik, and in open source more widely.";

export const COMMUNITIES: Community[] = [
  {
    name: "Google Developer Groups Nashik",
    about: "A developer community in Nashik.",
    contribution: [
      "Designed “From Prompt to Prod”, a 3-hour hands-on workshop with GDG Nashik: participants build a four-agent AI placement assistant with Google’s Agent Development Kit, then containerise it and deploy it live in the same session.",
      "Two DeboisTech engineers lead the two halves: Sakshi Dhatrak on agentic AI, and Yash Pawar on deployment.",
      "DeboisTech team members also help lead GDG on Campus at MET’s Institute of Engineering, Nashik.",
    ],
    facts: [
      { label: "Format", value: "3 hours, every participant builds and deploys their own agent" },
      { label: "Audience", value: "Engineering students, mixed skill level" },
    ],
  },
  {
    name: "CNCF Nashik",
    about: "The Cloud Native Computing Foundation’s Nashik community group (CNCG Nashik).",
    contribution: [
      "Part of the Cloud Native & AI community in Nashik: “Cloud Native & AI: from Kubernetes to Intelligent Systems”, an info session presented by GDG on Campus MET and CNCG Nashik.",
    ],
    facts: [
      { label: "Event", value: "Cloud Native & AI info session" },
      { label: "Date", value: "18 February 2026" },
      { label: "Venue", value: "215 CC Lab, MET Institute of Engineering, Nashik" },
    ],
  },
];

/* ---------- editorial layout data. Everything here is verified against the source documents above; add more only when it is. ---------- */

export const COMMUNITY_EYEBROW = "BEYOND THE CODE";
export const COMMUNITY_HEADLINE = "We build more than software. We build ecosystems.";
export const COMMUNITY_LEAD = "Creating spaces where developers learn, collaborate, experiment and build what’s next.";

/** Placeholders for missing photos and figures show only while developing, so visitors never see an unfinished tile. */
export const SHOW_PLACEHOLDERS = process.env.NODE_ENV !== "production";

export type BuildWallProject = { name: string; by: string; tech: string[]; repo?: string; demo?: string };
/**
 * Community Build Wall. Add a project ONLY with its builders' permission and links that have been checked.
 * The wall is hidden while this list is empty.
 */
export const BUILD_WALL: BuildWallProject[] = [];

/* ---------- impact strip ---------- */

/**
 * Fill `value` ONLY with a figure you can verify (and that is a count of what the label says, not estimated attendance).
 * Metrics without a value are hidden on the live site and shown as "add a verified figure" tiles while developing.
 */
export const IMPACT_METRICS: { label: string; value?: string; note?: string }[] = [
  { label: "Developers & learners reached" },
  { label: "Community events supported" },
  { label: "Hands-on workshops delivered" },
  { label: "Community partnerships", value: "2", note: "GDG Nashik, CNCG Nashik" },
];

/* ---------- partners and affiliations ---------- */

/**
 * Shown under the impact strip. Keep each entry to a relationship you can document, and use the programme's exact name.
 * No Google or CNCF logos are used: only their names, as plain text.
 */
export type Partner = { name: string; role: string; /** Optional logo in public/partners/. Without one, the name is shown as a text wordmark. */ logo?: { src: string; alt: string; width: number; height: number } };
export const PARTNERS: Partner[] = [
  { name: "Google Cloud", role: "Official Google partner", logo: { src: "/partners/google-cloud.png", alt: "Google Cloud", width: 900, height: 197 } }, /* role is the owner's statement; confirm the exact programme name before publishing */
  { name: "Google Developer Groups Nashik", role: "Community partner", logo: { src: "/partners/gdg-nashik.png", alt: "Google Developer Groups Nashik", width: 900, height: 323 } },
  { name: "CNCG Nashik", role: "Part of the Cloud Native & AI community", logo: { src: "/partners/cncg-nashik.png", alt: "Cloud Native Community Groups Nashik", width: 600, height: 520 } },
];

/* ---------- contribution categories ---------- */

/** `evidence` is shown only where a verified example exists. */
export const CONTRIBUTIONS: { title: string; body: string; evidence?: { text: string; href?: string } }[] = [
  { title: "Technical mentorship", body: "Engineers sharing knowledge, mentoring developers and helping students understand emerging technologies.",
    evidence: { text: "DeboisTech team members help lead GDG on Campus at MET." } },
  { title: "Hands-on workshops", body: "Practical sessions where participants build, experiment and deploy real-world projects.",
    evidence: { text: "From Prompt to Prod, with GDG Nashik." } },
  { title: "Event partnerships", body: "Supporting developer conferences, technical events and community-led initiatives.",
    evidence: { text: "Part of the Cloud Native & AI community behind the 18 February 2026 session." } },
  { title: "Speaker & expert network", body: "Connecting communities with engineers and industry professionals." },
  { title: "Learning initiatives", body: "Creating technical resources, labs and opportunities for practical learning.",
    evidence: { text: "Debo Labs: DevOps labs in a real terminal.", href: "/labs" } },
  { title: "Open-source contributions", body: "Building and sharing tools, projects and infrastructure that benefit the wider ecosystem.",
    evidence: { text: "TenantPlane, open source under Apache 2.0.", href: "/products/tenantplane" } },
];

/* ---------- gallery ---------- */

export type GalleryItem = {
  /** Path under /public, e.g. "/community/devfest-2026-1.webp". Leave out until you have the real photo: a placeholder shows in development only. */
  src?: string;
  /** Describe what the photo shows. Required once `src` is set. */
  alt: string;
  /** Short event label, e.g. "DevFest Nashik 2026". */
  label: string;
  caption?: string;
  /** CSS object-position for cropping, e.g. "50% 30%". */
  position?: string;
};

/**
 * Real photographs of community events only. Never add stock or generated images.
 * To add a photo: put the file in public/community/, then set `src` and `alt` on its entry (or add a new entry).
 */
export const COMMUNITY_GALLERY: GalleryItem[] = [
  { label: "DevFest Nashik 2026", alt: "" /* PHOTO NEEDED: DevFest Nashik 2026, 25 October 2026 */ },
  { label: "GDG Nashik", alt: "" /* PHOTO NEEDED: the “From Prompt to Prod” workshop in progress */ },
  { label: "GDG on Campus MET", alt: "" /* PHOTO NEEDED: GDG on Campus MET event or team */ },
  { label: "Cloud Native & AI", alt: "" /* PHOTO NEEDED: 18 February 2026 session, MET Institute of Engineering */ },
  { label: "Community", alt: "" /* PHOTO NEEDED: community group photograph. Add more entries (technical sessions, speaker interactions, behind the scenes) the same way. */ },
];

/* ---------- stories ---------- */

export type CommunityStory = {
  id: string;
  title: string;
  /** Community or organisation involved. */
  org: string;
  /** Shown large when present. Only verified dates. */
  date?: string;
  location?: string;
  summary: string;
  /** DeboisTech's actual role, only when verified. */
  role?: string;
  /** Steps shown as a flow. */
  flow?: string[];
  facts?: { label: string; value: string }[];
  /** A real photograph from the event. */
  image?: { src: string; alt: string; position?: string };
  /** Where the card leads. Omit when no verified destination exists. */
  link?: { href: string; label: string };
};

export const COMMUNITY_STORIES: CommunityStory[] = [
  { id: "devfest-2026", title: "DevFest Nashik 2026", org: "GDG Nashik", date: "25 October 2026", location: "Nashik",
    summary: "GDG Nashik’s community-led developer festival, bringing Nashik’s developers together for a day of talks, learning and collaboration."
    /* role: add DeboisTech’s verified role here once confirmed. image: add a real DevFest photo. link: add the event page or LinkedIn coverage. */ },
  { id: "prompt-to-prod", title: "From Prompt to Prod", org: "GDG Nashik workshop",
    summary: "A 3-hour, hands-on session where every participant builds a four-agent AI placement assistant, then containerises it and deploys it live before they leave the room.",
    flow: ["Build four agents with Google’s Agent Development Kit", "Containerise the assistant", "Deploy it live, in the same session"],
    facts: [{ label: "Format", value: "3 hours, every participant builds and deploys their own agent" }, { label: "Audience", value: "Engineering students, mixed skill level" }, { label: "Led by", value: "Sakshi Dhatrak (agentic AI) and Yash Pawar (deployment)" }],
    link: { href: "/contact?intent=partnership", label: "Bring this workshop to your community" } },
];

/* ---------- closing ---------- */

export const COMMUNITY_CTA = {
  heading: "The next generation of technology is built together.",
  body: "Whether you’re building a developer community, organizing a technology event, running campus initiatives or creating opportunities for developers, we’d love to contribute.",
};
