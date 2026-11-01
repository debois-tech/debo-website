import { PixelEdge } from "@/components/PixelEdge";
import { notFound } from "next/navigation";
import { Badge, Breadcrumb, ButtonLink, Section, SectionHeader } from "@/components/ui";
import { ProductStory } from "@/components/ProductStory";
import { FinalInvitation } from "@/components/FinalInvitation";
import { getProduct, PRODUCTS } from "@/content/products";
import { pageMeta } from "@/lib/seo";

export const dynamicParams = false;
// Debo Labs has its own page at /labs; /products/debo-labs redirects there (next.config.ts).
export const generateStaticParams = () => PRODUCTS.filter((p) => !p.detailHref).map((p) => ({ slug: p.slug }));

export async function generateMetadata({ params }: PageProps<"/products/[slug]">) {
  const p = getProduct((await params).slug);
  return p ? pageMeta(p.name, `${p.name}: ${p.tagline} ${p.summary}`.slice(0, 300), `/products/${p.slug}`) : {};
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const p = getProduct((await params).slug);
  if (!p) notFound();
  return (
    <>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Products", href: "/products" }, { label: p.name }]} />
      <h1 className="sr-only">{p.name}: {p.tagline}</h1>
      <ProductStory product={p} />

      <PixelEdge from="var(--paper)" to="#ffffff" />
      <Section theme="white" labelledBy="who">
        <SectionHeader id="who" title="The problem it solves." lead={p.problem} />
        <h3 className="mb-4 text-xl font-bold">Who it’s for</h3>
        <ul className="grid grid-cols-1 gap-x-10 gap-y-4 text-xl sm:grid-cols-2">{p.audience.map((a) => <li key={a} className="border-t border-ink pt-3">{a}</li>)}</ul>
      </Section>

      <PixelEdge from="#ffffff" to="var(--paper)" />
      <Section labelledBy="feat">
        <SectionHeader id="feat" title="What it does." />
        <dl className="grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2">
          {p.features.map((f) => <div key={f.title} className="border-t border-line pt-4"><dt className="text-lg font-bold">{f.title}</dt><dd className="mt-1 text-muted">{f.body}</dd></div>)}
        </dl>
      </Section>

      <PixelEdge from="var(--paper)" to="#ffffff" />
      <Section theme="white" labelledBy="status">
        <SectionHeader id="status" title="Status and next steps." />
        <p className="mb-6 flex flex-wrap items-center gap-3"><Badge>{p.status}</Badge><span className="text-muted">{p.statusNote}</span></p>
        <div className="flex flex-wrap gap-3">{p.cta.map((c, i) => <ButtonLink key={c.href} variant={i ? "secondary" : "primary"} href={c.href} event="product_cta_click" eventProps={{ product_slug: p.slug, cta_id: `status_${i}` }}>{c.label}</ButtonLink>)}</div>
        <p className="mt-8 text-sm text-muted">Sourced from <a className="underline" href={p.source} target="_blank" rel="noopener noreferrer">{p.source.replace("https://", "")}<span className="sr-only"> (opens in a new tab)</span></a>. Last reviewed {p.lastReviewed}.</p>
      </Section>
      <PixelEdge from="#ffffff" to="var(--paper)" />
      <FinalInvitation />
      <PixelEdge from="var(--paper)" to="#ffffff" />
    </>
  );
}
