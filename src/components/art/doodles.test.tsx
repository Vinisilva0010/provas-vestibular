import { render } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it } from "vitest";
import { Arrow, Book, Calendar, Pencil, Star, type DoodleProps } from "./doodles";

const doodles: [string, ComponentType<DoodleProps>][] = [
  ["Star", Star],
  ["Pencil", Pencil],
  ["Arrow", Arrow],
  ["Calendar", Calendar],
  ["Book", Book],
];

describe("doodles", () => {
  it.each(doodles)("%s is decorative and hidden from screen readers", (_name, Doodle) => {
    const { container } = render(<Doodle className="size-10" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
    expect(svg).toHaveClass("size-10");
  });
});
