import Image from "next/image";
import Link from "next/link";
import { PRODUCTS, productHref } from "@/content/products";
import { SERVICES } from "@/content/services";
import { TRACKS } from "@/content/tep";
import { SITE } from "@/content/site";
import { InView } from "./InView";

type Item = { label: string; href: string; external?: boolean };
const COLUMNS: { title: string; items: Item[] }[] = [
  { title: "Products", items: [...PRODUCTS.map((p) => ({ label: p.name, href: productHref(p) })), { label: "All products", href: "/products" }] },
  { title: "Services", items: SERVICES.map((s) => ({ label: s.name, href: `/services/${s.slug}` })) },
  { title: "Program", items: [{ label: "All programs", href: "/program" }, { label: "Technology Excellence Program", href: "/tep" }, ...TRACKS.map((t) => ({ label: t.name, href: `/tep/${t.slug}` }))] },
  { title: "About", items: [{ label: "About", href: "/company" }, { label: "Work", href: "/work" }, { label: "Blog", href: "/blog" }, { label: "Careers", href: "/careers" }, { label: "Contact", href: "/contact" }] },
];

const linkClass = "inline-block py-2 text-[15px] text-muted transition-colors hover:text-ink";

/** Closing footer: link columns, a large faded logo watermark, then the legal bar. A white surface that ends the black/white rhythm. */
export function SiteFooter() {
  return (
    <footer className="light-surface border-t border-line">
      <div className="container-x pt-14 sm:pt-20">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-5">
          {COLUMNS.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <p className="mb-2 text-base font-bold text-ink">{c.title}</p>
              <ul>
                {c.items.map((i) => (
                  <li key={i.href}><Link href={i.href} className={linkClass}>{i.label}</Link></li>
                ))}
              </ul>
            </nav>
          ))}
          <div className="col-span-2 md:col-span-1">
            <p className="mb-2 text-base font-bold text-ink">Connect</p>
            <address className="not-italic">
              <ul>
                <li><a href={`mailto:${SITE.email}`} className={linkClass}>{SITE.email}</a></li>
                <li><a href={SITE.phoneHref} className={linkClass}>{SITE.phone}</a></li>
                <li><a href={SITE.mapsUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>{SITE.location}<span className="sr-only"> (view on Google Maps, opens in a new tab)</span></a></li>
                <li><a href={SITE.social.linkedin} target="_blank" rel="noopener noreferrer" className={linkClass}>LinkedIn<span className="sr-only"> (opens in a new tab)</span></a></li>
                <li><a href={SITE.social.github} target="_blank" rel="noopener noreferrer" className={linkClass}>GitHub<span className="sr-only"> (opens in a new tab)</span></a></li>
                <li><a href={SITE.social.instagram} target="_blank" rel="noopener noreferrer" className={linkClass}>Instagram<span className="sr-only"> (opens in a new tab)</span></a></li>
              </ul>
            </address>
          </div>
        </div>

        {/* Official horizontal logo, shown large and faded purely with CSS. The file itself is unmodified. */}
        <InView threshold={0.2} className="relative mt-14 select-none overflow-hidden sm:mt-20" >
          <div aria-hidden className="reveal [mask-image:linear-gradient(to_bottom,black_35%,transparent)]">
            <Image src="/brand/logo-horizontal-light.webp" alt="" width={3064} height={630} sizes="(min-width:1280px) 1200px, 94vw" className="mx-auto h-auto w-full opacity-[0.1]" />
          </div>
        </InView>
      </div>

      <div className="border-t border-line">
        <div className="container-x flex flex-col gap-3 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 {SITE.legalName}. All rights reserved.</p>
          <ul className="flex flex-wrap items-center gap-x-5">
            <li><Link href="/terms" className="inline-block py-2 hover:text-ink">Terms</Link></li>
            <li><Link href="/privacy" className="inline-block py-2 hover:text-ink">Privacy</Link></li>
            <li aria-hidden className="h-4 w-px bg-line" />
            <li><a href={SITE.social.linkedin} target="_blank" rel="noopener noreferrer" className="inline-block py-2 hover:text-ink">LinkedIn<span className="sr-only"> (opens in a new tab)</span></a></li>
            <li><a href={SITE.social.github} target="_blank" rel="noopener noreferrer" className="inline-block py-2 hover:text-ink">GitHub<span className="sr-only"> (opens in a new tab)</span></a></li>
            <li><a href={SITE.social.instagram} target="_blank" rel="noopener noreferrer" className="inline-block py-2 hover:text-ink">Instagram<span className="sr-only"> (opens in a new tab)</span></a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
