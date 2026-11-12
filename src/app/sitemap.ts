import type { MetadataRoute } from "next";
import { getDataset } from "@/lib/data/get-dataset";
import { resolveSiteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dataset = await getDataset();
  const base = resolveSiteUrl(process.env);
  // The date the data was last published, not the current time.
  const lastModified = new Date(dataset.generatedAt * 1000);

  return [
    { url: `${base}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/provas`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/calendario`, lastModified, changeFrequency: "daily", priority: 0.9 },
    ...dataset.exams.map((exam) => ({
      url: `${base}/provas/${exam.slug}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
