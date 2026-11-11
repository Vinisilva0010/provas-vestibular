import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./badge";
import { Card } from "./card";

describe("Badge", () => {
  it("renders its text with the chosen tone", () => {
    render(<Badge tone="coral">Data mudou</Badge>);
    expect(screen.getByText("Data mudou")).toHaveClass("bg-coral", "text-ink");
  });

  it("uses a violet border only on the violet tone", () => {
    render(<Badge tone="violet">Análise</Badge>);
    expect(screen.getByText("Análise")).toHaveClass("border-violet", "bg-violet-soft");
  });
});

describe("Card", () => {
  it("renders as an article with ink text", () => {
    render(<Card aria-label="Fuvest">conteúdo</Card>);
    expect(screen.getByRole("article", { name: "Fuvest" })).toHaveClass("text-ink", "bg-paper");
  });

  it("adds the hover lift only when interactive", () => {
    render(
      <>
        <Card aria-label="estático">a</Card>
        <Card aria-label="clicável" interactive>
          b
        </Card>
      </>,
    );
    expect(screen.getByRole("article", { name: "estático" })).not.toHaveClass("hover:-translate-y-1");
    expect(screen.getByRole("article", { name: "clicável" })).toHaveClass("hover:-translate-y-1");
  });
});
