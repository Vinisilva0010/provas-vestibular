import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button, ButtonLink } from "./button";

describe("Button", () => {
  it("defaults to type=button so it never submits a form by accident", () => {
    render(<Button>Ver datas</Button>);
    expect(screen.getByRole("button", { name: "Ver datas" })).toHaveAttribute("type", "button");
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Calcular</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Calcular" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("uses coral for primary and paper for secondary", () => {
    render(
      <>
        <Button>Principal</Button>
        <Button variant="secondary">Secundário</Button>
      </>,
    );
    expect(screen.getByRole("button", { name: "Principal" })).toHaveClass("bg-coral");
    expect(screen.getByRole("button", { name: "Secundário" })).toHaveClass("bg-paper");
  });
});

describe("ButtonLink", () => {
  it("renders a link with the given href", () => {
    render(<ButtonLink href="/calendario">Calendário</ButtonLink>);
    expect(screen.getByRole("link", { name: "Calendário" })).toHaveAttribute("href", "/calendario");
  });
});
