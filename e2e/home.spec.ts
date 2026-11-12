import { expect, test } from "@playwright/test";

test("the home page shows the next dates and links to the calendar", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Próximas datas" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ver o calendário completo" })).toHaveAttribute("href", "/calendario");
});
