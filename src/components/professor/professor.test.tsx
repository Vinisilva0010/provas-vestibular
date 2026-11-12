import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Professor } from "./professor";

// A pose list with one missing and one ready image, so both cases stay tested.
vi.mock("@/lib/professor/poses", () => ({
  professorPoses: {
    sitting: { label: "sentado", src: "/professor/sitting.png", available: false },
    "point-left": { label: "apontando para a esquerda", src: "/professor/point-left.png", available: true },
  },
}));

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
    const { container } = render(<Professor pose="sitting" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the image, hidden from screen readers, when the PNG exists", () => {
    vi.stubEnv("NODE_ENV", "production");
    const { container } = render(<Professor pose="point-left" />);
    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector("img")?.getAttribute("src")).toContain("point-left.png");
  });
});
