import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { professorPoses } from "./poses";

describe("professorPoses", () => {
  const entries = Object.entries(professorPoses);

  it("defines the poses used across the site", () => {
    expect(Object.keys(professorPoses).sort()).toEqual(
      ["angry", "calendar", "celebrating", "point-left", "point-right", "reading", "sitting", "thinking", "waving"],
    );
  });

  it.each(entries)("%s points to a PNG named after the pose", (pose, config) => {
    expect(config.src).toBe(`/professor/${pose}.png`);
  });

  it.each(entries)("%s has a non-empty label", (_pose, config) => {
    expect(config.label.trim().length).toBeGreaterThan(0);
  });

  it.each(entries)("%s has its PNG in public/ when marked as available", (_pose, config) => {
    if (config.available) {
      expect(existsSync(join(process.cwd(), "public", config.src))).toBe(true);
    }
  });
});
