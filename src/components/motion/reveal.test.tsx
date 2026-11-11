import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MotionProvider } from "./motion-provider";
import { Reveal } from "./reveal";

describe("Reveal", () => {
  it("renders its content so it is present in the HTML for readers and search engines", () => {
    render(
      <MotionProvider>
        <Reveal>
          <h2>Próximas datas</h2>
        </Reveal>
      </MotionProvider>,
    );
    expect(screen.getByRole("heading", { name: "Próximas datas" })).toBeInTheDocument();
  });
});
