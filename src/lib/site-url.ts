/**
 * The public address of the site, used in the sitemap, robots.txt and
 * metadata. Order: explicit NEXT_PUBLIC_SITE_URL (own domain), then the
 * production domain Vercel provides at build time, then localhost.
 */
export function resolveSiteUrl(env: Record<string, string | undefined>): string {
  const explicit = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    let url: URL;
    try {
      url = new URL(explicit);
    } catch {
      throw new Error("NEXT_PUBLIC_SITE_URL must be a full http or https URL.");
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("NEXT_PUBLIC_SITE_URL must be a full http or https URL.");
    }
    return explicit.replace(/\/+$/, "");
  }

  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) {
    return `https://${vercel}`;
  }
  return "http://localhost:3000";
}
