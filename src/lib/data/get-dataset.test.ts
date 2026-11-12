// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getDataset } from "./get-dataset";

vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));

const fixture = JSON.parse(readFileSync(join(process.cwd(), "test-vectors/dataset.json"), "utf8")) as {
  indexRef: string;
  items: Record<string, unknown>;
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("getDataset", () => {
  it("loads the signed test fixture when asked to", async () => {
    vi.stubEnv("PVB_DATA_SOURCE", "fixture");
    const dataset = await getDataset();
    expect(dataset.exams.map((exam) => exam.slug)).toEqual(["fuvest"]);
    expect(dataset.editions).toHaveLength(1);
    expect(dataset.structures).toHaveLength(1);
  });

  it("checks Technoworks data against the real public key", async () => {
    vi.stubEnv("PVB_DATA_SOURCE", "technoworks");
    vi.stubEnv("PVB_TECHNOWORKS_RA", "123456");
    vi.stubEnv("PVB_INDEX_REF", fixture.indexRef);
    vi.stubGlobal("fetch", async (url: string) => {
      const reference = url.split("/").at(-1) ?? "";
      const item = fixture.items[reference];
      return item
        ? new Response(JSON.stringify({ status: "ok", dados: item }), { status: 200 })
        : new Response(JSON.stringify({ status: "nao_encontrado" }), { status: 404 });
    });

    // The fixture is signed with the public test key, not with the project key,
    // so data served by "Technoworks" must be rejected.
    await expect(getDataset()).rejects.toThrow("The index has an invalid signature.");
  });
});
