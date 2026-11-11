import { describe, expect, it } from "vitest";
import { contrastRatio, relativeLuminance } from "./contrast";

describe("relativeLuminance", () => {
  it("is 1 for white and 0 for black", () => {
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 5);
  });

  it("accepts upper case hex", () => {
    expect(relativeLuminance("#FFFFFF")).toBeCloseTo(1, 5);
  });

  it("rejects values that are not 6-digit hex colors", () => {
    expect(() => relativeLuminance("#fff")).toThrow(RangeError);
    expect(() => relativeLuminance("red")).toThrow(RangeError);
    expect(() => relativeLuminance("#gggggg")).toThrow(RangeError);
  });
});

describe("contrastRatio", () => {
  it("is 21 for black on white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
  });

  it("does not depend on argument order", () => {
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 5);
  });

  it("matches the known WCAG reference for #777777 on white", () => {
    expect(contrastRatio("#777777", "#ffffff")).toBeCloseTo(4.48, 2);
  });
});
