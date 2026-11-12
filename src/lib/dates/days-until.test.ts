import { describe, expect, it } from "vitest";
import { daysUntil } from "./days-until";

// All "now" values are UTC instants. Brasília time is UTC-3.
describe("daysUntil", () => {
  it("returns 0 when the target is today in Brasília", () => {
    const now = new Date("2026-11-11T15:00:00Z");
    expect(daysUntil("2026-11-11", now)).toBe(0);
  });

  it("returns 1 when the target is tomorrow", () => {
    const now = new Date("2026-11-11T15:00:00Z");
    expect(daysUntil("2026-11-12", now)).toBe(1);
  });

  it("returns a negative number for past dates", () => {
    const now = new Date("2026-11-11T15:00:00Z");
    expect(daysUntil("2026-11-01", now)).toBe(-10);
  });

  it("uses the Brasília calendar day, not the UTC day", () => {
    // 02:30 UTC on Nov 12 is still 23:30 on Nov 11 in Brasília.
    const now = new Date("2026-11-12T02:30:00Z");
    expect(daysUntil("2026-11-12", now)).toBe(1);
  });

  it("counts across a year boundary", () => {
    const now = new Date("2026-12-31T12:00:00Z");
    expect(daysUntil("2027-01-01", now)).toBe(1);
  });

  it("accepts February 29 in a leap year", () => {
    const now = new Date("2028-02-28T12:00:00Z");
    expect(daysUntil("2028-02-29", now)).toBe(1);
  });

  it("rejects a date in the wrong format", () => {
    const now = new Date("2026-11-11T15:00:00Z");
    expect(() => daysUntil("11/11/2026", now)).toThrow(RangeError);
  });

  it("rejects a calendar date that does not exist", () => {
    const now = new Date("2026-11-11T15:00:00Z");
    expect(() => daysUntil("2027-02-30", now)).toThrow(RangeError);
  });

  it("rejects an invalid 'now' value", () => {
    expect(() => daysUntil("2026-11-11", new Date("invalid"))).toThrow(RangeError);
  });
});

describe("todayInExamTimeZone", () => {
  it("returns the calendar date in Brasília", async () => {
    const { todayInExamTimeZone } = await import("./days-until");
    expect(todayInExamTimeZone(new Date("2026-11-12T02:30:00Z"))).toBe("2026-11-11");
    expect(todayInExamTimeZone(new Date("2026-11-12T03:30:00Z"))).toBe("2026-11-12");
  });
});
