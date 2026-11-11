import { describe, expect, it } from "vitest";
import { mainNavigation, siteName } from "./site";

describe("site config", () => {
  it("has a site name", () => {
    expect(siteName.trim().length).toBeGreaterThan(0);
  });

  it("uses internal paths for every navigation item", () => {
    for (const item of mainNavigation) {
      expect(item.href.startsWith("/")).toBe(true);
    }
  });

  it("has no duplicated navigation paths", () => {
    const hrefs = mainNavigation.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});
