import { describe, expect, it } from "vitest";
import { isIsoDate, toEpochDay } from "./iso-date";

describe("toEpochDay", () => {
  it("returns 0 for the Unix epoch", () => {
    expect(toEpochDay("1970-01-01")).toBe(0);
  });

  it("counts whole days", () => {
    expect(toEpochDay("2027-01-02") - toEpochDay("2027-01-01")).toBe(1);
  });

  it("rejects bad formats and impossible dates", () => {
    expect(() => toEpochDay("2027-1-1")).toThrow(RangeError);
    expect(() => toEpochDay("2027-02-30")).toThrow(RangeError);
  });
});

describe("isIsoDate", () => {
  it("accepts real dates, including Feb 29 in leap years", () => {
    expect(isIsoDate("2027-11-07")).toBe(true);
    expect(isIsoDate("2028-02-29")).toBe(true);
  });

  it("rejects everything else", () => {
    expect(isIsoDate("2027-02-29")).toBe(false);
    expect(isIsoDate("07/11/2027")).toBe(false);
    expect(isIsoDate("")).toBe(false);
  });
});
