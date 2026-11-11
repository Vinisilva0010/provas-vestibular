import { describe, expect, it } from "vitest";
import { buildId, idType, isSlug, tryBuildId } from "./ids";

describe("isSlug", () => {
  it("accepts lowercase words joined by single hyphens", () => {
    expect(isSlug("fuvest")).toBe(true);
    expect(isSlug("ita-ime")).toBe(true);
    expect(isSlug("2027")).toBe(true);
  });

  it("rejects upper case, accents, spaces and loose hyphens", () => {
    for (const value of ["Fuvest", "unicâmp", "ita ime", "-ita", "ita-", "ita--ime", ""]) {
      expect(isSlug(value)).toBe(false);
    }
  });
});

describe("buildId", () => {
  it("joins prefix, type and parts", () => {
    expect(buildId("exam", "fuvest")).toBe("pvb-exam-fuvest");
    expect(buildId("event", "fuvest", "2027", "phase-1")).toBe("pvb-event-fuvest-2027-phase-1");
  });

  it("requires at least one part", () => {
    expect(() => buildId("exam")).toThrow(RangeError);
  });

  it("rejects invalid parts", () => {
    expect(() => buildId("exam", "Fuvest")).toThrow(RangeError);
  });
});

describe("tryBuildId", () => {
  it("returns null instead of throwing", () => {
    expect(tryBuildId("exam", "Fuvest")).toBeNull();
    expect(tryBuildId("exam")).toBeNull();
    expect(tryBuildId("exam", "fuvest")).toBe("pvb-exam-fuvest");
  });
});

describe("idType", () => {
  it("reads the document type from an id", () => {
    expect(idType("pvb-exam-fuvest")).toBe("exam");
    expect(idType("pvb-event-enem-2027-exam-day-1")).toBe("event");
  });

  it("returns undefined for ids that are not ours", () => {
    expect(idType("other-exam-fuvest")).toBeUndefined();
    expect(idType("pvb-unknown-fuvest")).toBeUndefined();
  });
});
