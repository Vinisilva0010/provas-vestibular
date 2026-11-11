import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SiteHeader } from "./site-header";

vi.mock("next/navigation", () => ({
  usePathname: () => "/calendario",
}));

const mobileNav = { name: "Principal no celular" };

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

  it("opens the mobile menu and moves focus to the close button", async () => {
    render(<SiteHeader />);
    const menuButton = screen.getByRole("button", { name: "Menu" });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(menuButton);

    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("navigation", mobileNav)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fechar" })).toHaveFocus();
  });

  it("closes with the close button and returns focus to the menu button", async () => {
    render(<SiteHeader />);
    await userEvent.click(screen.getByRole("button", { name: "Menu" }));
    await userEvent.click(screen.getByRole("button", { name: "Fechar" }));

    await waitFor(() => expect(screen.queryByRole("navigation", mobileNav)).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Menu" })).toHaveFocus();
  });

  it("closes with Escape", async () => {
    render(<SiteHeader />);
    await userEvent.click(screen.getByRole("button", { name: "Menu" }));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("navigation", mobileNav)).not.toBeInTheDocument());
  });

  it("locks page scrolling only while the menu is open", async () => {
    render(<SiteHeader />);
    await userEvent.click(screen.getByRole("button", { name: "Menu" }));
    expect(document.body.style.overflow).toBe("hidden");

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(document.body.style.overflow).toBe(""));
  });
});
