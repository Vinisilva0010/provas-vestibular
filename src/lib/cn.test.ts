import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("joins class names with a single space", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("skips false, null, undefined and empty strings", () => {
    expect(cn("a", false, null, undefined, "", "b")).toBe("a b");
  });

  it("returns an empty string when nothing is given", () => {
    expect(cn()).toBe("");
  });
});
