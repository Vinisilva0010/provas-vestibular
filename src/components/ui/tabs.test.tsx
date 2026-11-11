import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Tabs, type TabItem } from "./tabs";

const items: TabItem[] = [
  { id: "geral", label: "Geral", content: <p>Conteúdo geral</p> },
  { id: "datas", label: "Datas", content: <p>Conteúdo das datas</p> },
  { id: "inscricao", label: "Inscrição", content: <p>Conteúdo da inscrição</p> },
];

function renderTabs(defaultTabId?: string) {
  render(<Tabs items={items} label="Seções da prova" defaultTabId={defaultTabId} />);
}

describe("Tabs", () => {
  it("shows the first tab by default and keeps every panel in the HTML", () => {
    renderTabs();
    expect(screen.getByRole("tab", { name: "Geral" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Conteúdo geral")).toBeVisible();
    expect(screen.getByText("Conteúdo das datas")).toBeInTheDocument();
    expect(screen.getByText("Conteúdo das datas")).not.toBeVisible();
  });

  it("respects defaultTabId", () => {
    renderTabs("inscricao");
    expect(screen.getByRole("tab", { name: "Inscrição" })).toHaveAttribute("aria-selected", "true");
  });

  it("switches panels on click", async () => {
    renderTabs();
    await userEvent.click(screen.getByRole("tab", { name: "Datas" }));
    expect(screen.getByText("Conteúdo das datas")).toBeVisible();
    expect(screen.getByText("Conteúdo geral")).not.toBeVisible();
  });

  it("links each tab to its panel for screen readers", () => {
    renderTabs();
    const tab = screen.getByRole("tab", { name: "Geral" });
    const panel = screen.getByRole("tabpanel", { name: "Geral" });
    expect(tab).toHaveAttribute("aria-controls", panel.id);
  });

  it("moves with the arrow keys and wraps around", async () => {
    renderTabs();
    await userEvent.click(screen.getByRole("tab", { name: "Geral" }));

    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Datas" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Datas" })).toHaveAttribute("aria-selected", "true");

    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Inscrição" })).toHaveFocus();
  });

  it("jumps with Home and End", async () => {
    renderTabs();
    await userEvent.click(screen.getByRole("tab", { name: "Geral" }));
    await userEvent.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Inscrição" })).toHaveFocus();
    await userEvent.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "Geral" })).toHaveFocus();
  });

  it("ignores other keys", async () => {
    renderTabs();
    await userEvent.click(screen.getByRole("tab", { name: "Geral" }));
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("tab", { name: "Geral" })).toHaveAttribute("aria-selected", "true");
  });

  it("keeps only the selected tab in the keyboard tab order", () => {
    renderTabs();
    expect(screen.getByRole("tab", { name: "Geral" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("tab", { name: "Datas" })).toHaveAttribute("tabindex", "-1");
  });
});
