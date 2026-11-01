import Link from "next/link";
import { NewsletterForm } from "./NewsletterForm";
import { Reveal } from "./InView";

/** Closing newsletter signup for the home page. */
export function NewsletterSection() {
  return (
    <section aria-labelledby="newsletter-h" className="bg-paper py-14 sm:py-24">
      <div className="container-x grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <div>
          <h2 id="newsletter-h" className="display text-4xl sm:text-6xl">Stay in the loop.</h2>
          <p className="mt-4 max-w-md text-lg text-muted">New products, workshops, open-source releases and engineering notes from DeboisTech, sent when we have something worth sharing.</p>
        </div>
        <Reveal>
          <NewsletterForm />
          <p className="mt-1 text-sm text-muted">By subscribing you agree to receive our emails. Read our <Link href="/privacy" className="underline underline-offset-4 hover:text-brand-text">privacy notice</Link>.</p>
        </Reveal>
      </div>
    </section>
  );
}
