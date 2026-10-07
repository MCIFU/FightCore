/**
 * Digital Asset Links for the Android app (Trusted Web Activity built with
 * PWABuilder). Android checks this file to open the site full screen, without
 * the browser bar, inside the app. Values come from environment variables
 * (Vercel → Settings → Environment Variables), see docs/APP-MOVIL.md:
 *   ANDROID_PACKAGE_NAME          e.g. app.fightcore.twa
 *   ANDROID_SHA256_FINGERPRINTS   one or more, comma-separated (Play App Signing key)
 * Without them it answers [] (valid, links nothing).
 */
export const dynamic = "force-dynamic";

export function GET() {
  const pkg = process.env.ANDROID_PACKAGE_NAME?.trim();
  const prints = (process.env.ANDROID_SHA256_FINGERPRINTS ?? "").split(",").map((x) => x.trim().toUpperCase()).filter(Boolean);
  const body = pkg && prints.length
    ? [{ relation: ["delegate_permission/common.handle_all_urls"], target: { namespace: "android_app", package_name: pkg, sha256_cert_fingerprints: prints } }]
    : [];
  return Response.json(body, { headers: { "Cache-Control": "public, max-age=3600" } });
}
