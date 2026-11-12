import { expect, test } from "@playwright/test";

test("the exam list links to each exam page", async ({ page }) => {
  await page.goto("/provas");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Todas as provas");
  await page.locator('a[href="/provas/fuvest"]').first().click();
  await expect(page).toHaveURL(/\/provas\/fuvest$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("the exam page shows calendar, structure and official documents", async ({ page }) => {
  await page.goto("/provas/fuvest");

  await page.getByRole("tab", { name: "Calendário" }).click();
  await expect(page.getByRole("tabpanel", { name: "Calendário" })).toContainText("Datas da edição");

  await page.getByRole("tab", { name: "Como é a prova" }).click();
  await expect(page.getByRole("tabpanel", { name: "Como é a prova" })).toContainText("Como a nota é calculada");

  await page.getByRole("tab", { name: "Documentos oficiais" }).click();
  const documents = page.getByRole("tabpanel", { name: "Documentos oficiais" });
  await expect(documents).toContainText("Cada link abre o arquivo no site oficial.");
  await expect(documents.getByRole("link").first()).toHaveAttribute("href", /^https:\/\//);
});

test("every tab shows where its information came from", async ({ page }) => {
  await page.goto("/provas/fuvest");
  await expect(page.getByRole("tabpanel", { name: "Visão geral" })).toContainText("Conferido em");
});

test("an unknown exam returns 404", async ({ page }) => {
  const response = await page.goto("/provas/prova-que-nao-existe");
  expect(response?.status()).toBe(404);
});
