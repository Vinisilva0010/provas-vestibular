import { expect, test } from "@playwright/test";

test("the calendar page filters dates by exam", async ({ page }) => {
  await page.goto("/calendario");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Calendário");

  const filters = page.getByRole("group", { name: "Filtrar por prova" });
  await expect(filters.getByRole("button", { name: "Todas" })).toHaveAttribute("aria-pressed", "true");

  await filters.getByRole("button", { name: "Fuvest" }).click();
  await expect(filters.getByRole("button", { name: "Fuvest" })).toHaveAttribute("aria-pressed", "true");
  await expect(filters.getByRole("button", { name: "Todas" })).toHaveAttribute("aria-pressed", "false");
});
