import { describe, expect, it } from "vitest";
import { resolveSiteUrl } from "./site-url";

describe("resolveSiteUrl", () => {
  it("prefers the explicit site URL and drops the trailing slash", () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: " https://provas.example.com/ " })).toBe(
      "https://provas.example.com",
    );
  });

  it("refuses an explicit value that is not an http or https URL", () => {
    expect(() => resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "ftp://example.com" })).toThrow("NEXT_PUBLIC_SITE_URL");
    expect(() => resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "not a url" })).toThrow("NEXT_PUBLIC_SITE_URL");
  });

  it("uses the Vercel production domain when there is no explicit URL", () => {
    expect(resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "provas-vestibular.vercel.app" })).toBe(
      "https://provas-vestibular.vercel.app",
    );
  });

  it("falls back to localhost", () => {
    expect(resolveSiteUrl({})).toBe("http://localhost:3000");
  });
});
