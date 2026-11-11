import { expect, test } from "@playwright/test";

test("home page is in Portuguese and shows the main title", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("main navigation is reachable on every screen size", async ({ page, isMobile }) => {
  await page.goto("/");
  if (isMobile) {
    const mobileNav = page.getByRole("navigation", { name: "Principal no celular", exact: true });
    await page.getByRole("button", { name: "Menu" }).click();
    await expect(mobileNav).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(mobileNav).toBeHidden();
  } else {
    await expect(page.getByRole("navigation", { name: "Principal", exact: true })).toBeVisible();
  }
});

test("unknown pages return 404 with a way back home", async ({ page }) => {
  const response = await page.goto("/pagina-que-nao-existe");
  expect(response?.status()).toBe(404);
  await page.getByRole("link", { name: "Voltar ao início" }).click();
  await expect(page).toHaveURL(/:3100\/$/);
});

test("style guide is hidden from search engines", async ({ page }) => {
  await page.goto("/estilo");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("tabs work with the keyboard", async ({ page }) => {
  await page.goto("/estilo");
  await page.getByRole("tab", { name: "Informações gerais" }).click();
  await page.keyboard.press("ArrowRight");
  const calendarTab = page.getByRole("tab", { name: "Calendário" });
  await expect(calendarTab).toHaveAttribute("aria-selected", "true");
  await expect(calendarTab).toBeFocused();
});

test("animations are turned off when the visitor asks for reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/estilo");
  const button = page.getByRole("button", { name: "Ver calendário" });
  const duration = await button.evaluate((element) => getComputedStyle(element).transitionDuration);
  expect(Number.parseFloat(duration)).toBeLessThan(0.01);
});
