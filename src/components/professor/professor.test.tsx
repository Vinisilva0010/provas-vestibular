import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Professor } from "./professor";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Professor", () => {
  it("shows a labeled placeholder in development while the PNG does not exist", () => {
    vi.stubEnv("NODE_ENV", "development");
    render(<Professor pose="sitting" />);
    expect(screen.getByTestId("professor-placeholder")).toHaveTextContent("Professor: sentado");
  });

  it("renders nothing in production while the PNG does not exist", () => {
    vi.stubEnv("NODE_ENV", "production");
    const { container } = render(<Professor pose="angry" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("is hidden from screen readers because it is decorative", () => {
    vi.stubEnv("NODE_ENV", "development");
    render(<Professor pose="point-left" />);
    expect(screen.getByTestId("professor-placeholder")).toHaveAttribute("aria-hidden", "true");
  });
});
