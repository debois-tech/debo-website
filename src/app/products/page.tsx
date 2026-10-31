import { Fragment } from "react";
import { PixelEdge } from "@/components/PixelEdge";
import { ProductStory } from "@/components/ProductStory";
import { PageHero } from "@/components/ui";
import { PRODUCTS } from "@/content/products";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("Products", "Debo Labs, a hands-on DevOps practice platform, MotoAdmin, a driving school operations platform, and TenantPlane, an open-source Kubernetes multi-tenancy platform, by DeboisTech.", "/products");

export default function ProductsPage() {
  return (
    <>
      <PageHero eyebrow="Products" title="Three products, three kinds of user." lead="One teaches DevOps in a real terminal, one runs the paperwork of a driving school, and one is built for platform engineers running Kubernetes." />
      {PRODUCTS.map((p, i) => {
        const bg = (n: number) => (n % 2 ? "var(--paper)" : "#ffffff"); // odd stories are dark, even are white
        return (
          <Fragment key={p.slug}>
            <PixelEdge from={i === 0 ? "var(--paper)" : bg(i - 1)} to={bg(i)} />
            <ProductStory product={p} tone={i % 2 ? "light" : "wash"} />
          </Fragment>
        );
      })}
    </>
  );
}
