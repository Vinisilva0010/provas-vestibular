import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Hero } from "./hero";

describe("Hero", () => {
  it("has one main heading with the full sentence", () => {
    render(<Hero />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Todas as provas para entrar na faculdade");
  });

  it("links to the exam list and the calendar", () => {
    render(<Hero />);
    expect(screen.getByRole("link", { name: "Ver as provas" })).toHaveAttribute("href", "/provas");
    expect(screen.getByRole("link", { name: "Abrir o calendário" })).toHaveAttribute(
      "href",
      "/calendario",
    );
  });
});
