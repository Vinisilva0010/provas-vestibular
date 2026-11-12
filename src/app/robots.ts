import type { MetadataRoute } from "next";
import { resolveSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const base = resolveSiteUrl(process.env);
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/estilo"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
