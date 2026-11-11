import { describe, expect, it } from "vitest";
import { professorPoses } from "./poses";

describe("professorPoses", () => {
  const entries = Object.entries(professorPoses);

  it("defines the four poses used across the site", () => {
    expect(Object.keys(professorPoses).sort()).toEqual(
      ["angry", "point-left", "point-right", "sitting"].sort(),
    );
  });

  it.each(entries)("%s points to a PNG named after the pose", (pose, config) => {
    expect(config.src).toBe(`/professor/${pose}.png`);
  });

  it.each(entries)("%s has a non-empty label", (_pose, config) => {
    expect(config.label.trim().length).toBeGreaterThan(0);
  });
});
