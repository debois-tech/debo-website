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
