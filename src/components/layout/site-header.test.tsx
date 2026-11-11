import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SiteHeader } from "./site-header";

vi.mock("next/navigation", () => ({
  usePathname: () => "/calendario",
}));

describe("SiteHeader", () => {
  it("links the site name to the home page", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: "Provas para entrar na faculdade" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("marks the current page in the navigation", () => {
    render(<SiteHeader />);
    const nav = screen.getByRole("navigation", { name: "Principal" });
    const current = Array.from(nav.querySelectorAll("a")).find(
      (link) => link.getAttribute("aria-current") === "page",
    );
    expect(current).toHaveTextContent("Calendário");
  });

  it("opens and closes the mobile menu with the button", async () => {
    render(<SiteHeader />);
    const button = screen.getByRole("button", { name: "Menu" });
    expect(button).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(button);
    expect(screen.getByRole("button", { name: "Fechar" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("navigation", { name: "Principal no celular" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Fechar" }));
    await waitFor(() =>
      expect(screen.queryByRole("navigation", { name: "Principal no celular" })).not.toBeInTheDocument(),
    );
  });

  it("closes the mobile menu with Escape", async () => {
    render(<SiteHeader />);
    await userEvent.click(screen.getByRole("button", { name: "Menu" }));
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("navigation", { name: "Principal no celular" })).not.toBeInTheDocument(),
    );
  });
});
