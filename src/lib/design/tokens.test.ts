import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { WCAG_AA_NON_TEXT, WCAG_AA_TEXT, contrastRatio } from "./contrast";
import { cssVariableName, palette, textBackgrounds, uiStrokeColors } from "./tokens";

describe("palette accessibility", () => {
  it.each(textBackgrounds)("ink text on %s meets WCAG AA", (background) => {
    expect(contrastRatio(palette.ink, palette[background])).toBeGreaterThanOrEqual(WCAG_AA_TEXT);
  });

  it("keeps violet out of text backgrounds because ink on violet is not readable", () => {
    expect(contrastRatio(palette.ink, palette.violet)).toBeLessThan(WCAG_AA_TEXT);
    expect(textBackgrounds).not.toContain("violet");
  });

  it.each(uiStrokeColors)("%s borders and focus rings are visible on paper", (stroke) => {
    expect(contrastRatio(palette[stroke], palette.paper)).toBeGreaterThanOrEqual(WCAG_AA_NON_TEXT);
  });
});

describe("globals.css", () => {
  const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

  it.each(Object.keys(palette) as (keyof typeof palette)[])(
    "declares %s with the same value as tokens.ts",
    (color) => {
      const declaration = new RegExp(`${cssVariableName[color]}:\\s*${palette[color]};`, "i");
      expect(css).toMatch(declaration);
    },
  );
});
