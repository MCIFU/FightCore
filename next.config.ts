import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Portraits are already 400×400 palette PNGs (~55 KB). Serving them as they are
  // avoids the image optimizer, whose free quota 1,000+ portraits would use up.
  images: { unoptimized: true },
  // The snapshot is read with fs at runtime (lib/data/providers/snapshot.ts), which
  // file tracing can't see: ship it with every server function (Vercel, standalone).
  outputFileTracingIncludes: {
    "/**": [
      "./data/snapshot/ufc.json.gz",
      "./data/snapshot/orgs.json.gz",
      "./data/snapshot/espn-extra.json",
      "./data/snapshot/wiki-extra.json",
      "./data/snapshot/photo-meta.json",
      "./data/snapshot/photo-processed.json",
      "./data/snapshot/photo-official-processed.json",
    ],
  },
  // Portraits are served from /public as static files; functions never read them.
  outputFileTracingExcludes: {
    "/**": ["./public/photos/**", "./data/.cache/**", "./scripts/**"],
  },
};

export default nextConfig;
