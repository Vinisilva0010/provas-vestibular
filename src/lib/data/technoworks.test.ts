// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import {
  DatasetError,
  TECHNOWORKS_BASE_URL,
  createTechnoworksFetcher,
  isRecord,
  stripServerFields,
} from "./technoworks";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("createTechnoworksFetcher", () => {
  it("reads the 'dados' object of an item", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ status: "ok", dados: { id: "abc", pvbKey: "index" } }));
    const fetchItem = createTechnoworksFetcher("123456", { fetchImpl });

    await expect(fetchItem("abc")).resolves.toEqual({ id: "abc", pvbKey: "index" });
    expect(fetchImpl).toHaveBeenCalledWith(`${TECHNOWORKS_BASE_URL}/rest/123456/abc`, expect.any(Object));
  });

  it("returns null when the item does not exist", async () => {
    const fetchItem = createTechnoworksFetcher("123456", {
      fetchImpl: async () => jsonResponse({ status: "nao_encontrado" }, 404),
    });
    await expect(fetchItem("abc")).resolves.toBeNull();
  });

  it("fails on server errors without exposing the RA", async () => {
    const fetchItem = createTechnoworksFetcher("123456", {
      fetchImpl: async () => jsonResponse({ status: "erro" }, 502),
    });
    const error = await fetchItem("abc").catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(DatasetError);
    expect((error as Error).message).toContain("502");
    expect((error as Error).message).not.toContain("123456");
  });

  it("fails when the response has no 'dados' object", async () => {
    for (const body of [{ status: "ok" }, { status: "ok", dados: [1] }, ["not", "an", "object"]]) {
      const fetchItem = createTechnoworksFetcher("123456", { fetchImpl: async () => jsonResponse(body) });
      await expect(fetchItem("abc")).rejects.toBeInstanceOf(DatasetError);
    }
  });

  it("refuses invalid references before making a request", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}));
    const fetchItem = createTechnoworksFetcher("123456", { fetchImpl });
    for (const reference of ["", "../x", "a/b", "a?b"]) {
      await expect(fetchItem(reference)).rejects.toBeInstanceOf(DatasetError);
    }
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("refuses an invalid RA", () => {
    for (const ra of ["", "12/34", "../1"]) {
      expect(() => createTechnoworksFetcher(ra)).toThrow(DatasetError);
    }
  });
});

describe("helpers", () => {
  it("strips only top-level fields added by the database", () => {
    expect(stripServerFields({ id: "x", _criadoEm: "t", pvbKey: "index", nested: { id: "kept" } })).toEqual({
      pvbKey: "index",
      nested: { id: "kept" },
    });
  });

  it("recognizes plain objects only", () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord([])).toBe(false);
    expect(isRecord(null)).toBe(false);
    expect(isRecord("x")).toBe(false);
  });
});
