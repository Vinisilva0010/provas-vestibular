import { expect, test } from "@playwright/test";

test("serves a sitemap with every exam page", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.ok()).toBe(true);
  const body = await response.text();
  expect(body).toContain("/provas/fuvest</loc>");
  expect(body).toContain("/calendario</loc>");
});

test("robots.txt points to the sitemap and hides the style guide", async ({ request }) => {
  const body = await (await request.get("/robots.txt")).text();
  expect(body).toContain("Sitemap: ");
  expect(body).toContain("Disallow: /estilo");
});

test("pages are sent with security headers", async ({ request }) => {
  const headers = (await request.get("/")).headers();
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
});
