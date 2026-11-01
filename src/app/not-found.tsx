import { ButtonLink } from "@/components/ui";
import { PixelEdge } from "@/components/PixelEdge";

export const metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <>
    <div className="bg-paper text-ondark on-dark pixel-grid">
      <div className="container-x py-24">
        <p className="font-mono text-sm text-glow">404</p>
        <h1 className="mt-2 text-4xl font-extrabold">This page wandered off.</h1>
        <p className="mt-4 max-w-xl text-ondark-muted">The page you’re looking for doesn’t exist or has moved. Try one of these instead.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink dark href="/">Home</ButtonLink>
          <ButtonLink dark variant="secondary" href="/products">Products</ButtonLink>
          <ButtonLink dark variant="secondary" href="/services">Services</ButtonLink>
          <ButtonLink dark variant="secondary" href="/contact">Contact</ButtonLink>
        </div>
      </div>
    </div>
    <PixelEdge from="var(--paper)" to="#ffffff" />
    </>
  );
}
