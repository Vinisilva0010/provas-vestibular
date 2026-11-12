import { readFileSync } from "node:fs";
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
  await expect(page.getByRole("tabpanel", { name: "Calendário" })).toContainText("Datas para entrar na faculdade em");

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

// Exam pages stream, so an unknown slug may answer 200 with the not-found page.
// Next.js then adds a noindex tag, which keeps the URL out of search engines.
test("an unknown exam shows the not-found page and is not indexed", async ({ page }) => {
  await page.goto("/provas/prova-que-nao-existe");
  await expect(page.getByText("Essa página não existe")).toBeVisible();
  await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
});

test("the exam page downloads its dates for a calendar app", async ({ page }) => {
  await page.goto("/provas/fuvest");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Adicionar à minha agenda" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("fuvest-datas.ics");
  const content = readFileSync(await download.path(), "utf8");
  expect(content).toContain("BEGIN:VCALENDAR");
  expect(content).toContain("BEGIN:VEVENT");
});

test("the exam list can be searched", async ({ page }) => {
  await page.goto("/provas");
  const search = page.getByLabel("Buscar prova");

  await search.fill("fuvest");
  await expect(page.locator('a[href="/provas/fuvest"]')).toBeVisible();

  await search.fill("prova que não existe");
  await expect(page.getByText("Nenhuma prova encontrada com esses filtros.")).toBeVisible();
});
