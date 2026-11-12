// @vitest-environment node
import { describe, expect, it } from "vitest";
import { resolveDataSource } from "./source";

describe("resolveDataSource", () => {
  it("uses Technoworks by default", () => {
    expect(resolveDataSource({ PVB_TECHNOWORKS_RA: " 123456 ", PVB_INDEX_REF: "abc123" })).toEqual({
      kind: "technoworks",
      ra: "123456",
      indexRef: "abc123",
    });
  });

  it("accepts the explicit technoworks value", () => {
    const env = { PVB_DATA_SOURCE: "technoworks", PVB_TECHNOWORKS_RA: "1", PVB_INDEX_REF: "a" };
    expect(resolveDataSource(env).kind).toBe("technoworks");
  });

  it("uses the test fixture outside production", () => {
    expect(resolveDataSource({ PVB_DATA_SOURCE: "fixture" })).toEqual({ kind: "fixture" });
    expect(resolveDataSource({ PVB_DATA_SOURCE: "fixture", VERCEL_ENV: "preview" })).toEqual({ kind: "fixture" });
  });

  it("refuses the test fixture in production", () => {
    expect(() => resolveDataSource({ PVB_DATA_SOURCE: "fixture", VERCEL_ENV: "production" })).toThrow(
      "cannot be used in production",
    );
  });

  it("refuses unknown sources", () => {
    expect(() => resolveDataSource({ PVB_DATA_SOURCE: "mongo" })).toThrow("PVB_DATA_SOURCE");
  });

  it("explains which variable is missing without printing values", () => {
    expect(() => resolveDataSource({ PVB_INDEX_REF: "abc" })).toThrow("PVB_TECHNOWORKS_RA");
    expect(() => resolveDataSource({ PVB_TECHNOWORKS_RA: "123456" })).toThrow("PVB_INDEX_REF");
    expect(() => resolveDataSource({ PVB_TECHNOWORKS_RA: "123456", PVB_INDEX_REF: "../x" })).toThrow(
      "PVB_INDEX_REF",
    );
  });
});
