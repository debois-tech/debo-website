export const SITE = {
  name: "DeboisTech",
  legalName: "DeboisTech IT Solutions LLP",
  tagline: "Building Technology. Creating Value.",
  description:
    "DeboisTech is a Nashik-based technology company building software, AI and cloud systems, open-source and SaaS products, and technology training programs.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.deboistech.in",
  email: "hello@deboistech.in",
  legalEmail: "legal@deboistech.in",
  phone: "+91 8263830296",
  phoneHref: "tel:+918263830296",
  whatsapp: "https://wa.me/918263830296",
  location: "Nashik, Maharashtra, India",
  mapsUrl: "https://share.google/5UeHKkNy7OzUZLwmt",
  social: {
    linkedin: "https://www.linkedin.com/company/deboistech",
    github: "https://github.com/debois-tech",
    instagram: "https://instagram.com/deboistech.in",
  },
} as const;

export const NAV = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
  { label: "Services", href: "/services" },
  { label: "About", href: "/company" },
  { label: "Program", href: "/program" },
  { label: "Contact", href: "/contact" },
] as const;

export const FOOTER_LINKS = {
  About: [
    { label: "About", href: "/company" },
    { label: "Work", href: "/work" },
    { label: "Blog", href: "/blog" },
    { label: "Careers", href: "/careers" },
  ],
  Explore: [
    { label: "Products", href: "/products" },
    { label: "Services", href: "/services" },
    { label: "Program", href: "/program" },
    { label: "Debo Labs", href: "/labs" },
  ],
  Legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
} as const;

export type Intent = "project" | "product" | "tep" | "careers" | "partnership" | "other";
export const INTENTS: { value: Intent; label: string }[] = [
  { value: "project", label: "Software / consulting project" },
  { value: "product", label: "Product enquiry" },
  { value: "tep", label: "Program (TEP)" },
  { value: "careers", label: "Careers" },
  { value: "partnership", label: "Partnership" },
  { value: "other", label: "Other" },
];
