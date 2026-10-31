import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  trailingSlash: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }, { source: "/dashboard", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }, { key: "Cache-Control", value: "no-store" }] }];
  },
  // Legacy production URLs -> new routes (permanent).
  async redirects() {
    return [
      { source: "/about", destination: "/company", permanent: true },
      { source: "/privacy-policy", destination: "/privacy", permanent: true },
      { source: "/blogs", destination: "/", permanent: true },
      { source: "/faq", destination: "/contact", permanent: true },
      { source: "/products/debo-labs", destination: "/labs", permanent: true },
    ];
  },
  turbopack: {
    root: __dirname, // pin the project root; a stray package-lock.json sits in the parent folder
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
