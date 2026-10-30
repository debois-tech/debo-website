import type { Metadata, Viewport } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ScrollProgress } from "@/components/ScrollProgress";
import { ScrollTopOnReload } from "@/components/ScrollTopOnReload";
import { ChatWidget } from "@/components/chatbot/chat-widget";
import { SITE } from "@/content/site";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], display: "swap" });
const mono = JetBrains_Mono({ variable: "--font-mono-jb", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "en_IN",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: `${SITE.name} — ${SITE.tagline}` }],
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.png", apple: "/icon.png" },
};

export const viewport: Viewport = { themeColor: "#0a0a0a", viewportFit: "cover" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${manrope.variable} ${mono.variable}`}>
      <body>
        <noscript><style>{`.reveal{opacity:1!important;transform:none!important}.draw{stroke-dashoffset:0!important}.arrive{transform:none!important}`}</style></noscript>
        <a href="#main" className="skip-link">Skip to content</a>
        <ScrollProgress />
        <ScrollTopOnReload />
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
        <ChatWidget />
      </body>
    </html>
  );
}
