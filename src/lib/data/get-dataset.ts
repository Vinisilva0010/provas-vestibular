import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cacheLife, cacheTag } from "next/cache";
import { loadDataset, type Dataset } from "./dataset";
import { parsePublicKey } from "./signing";
import { resolveDataSource } from "./source";
import { createTechnoworksFetcher, type FetchItem } from "./technoworks";

type Fixture = {
  publicKeyHex: string;
  indexRef: string;
  items: Record<string, Record<string, unknown>>;
};

function readProjectFile(path: string): Promise<string> {
  return readFile(join(process.cwd(), path), "utf8");
}

/**
 * The verified dataset. Cached and refreshed once a day, so pages are served
 * ready-made and pick up new data without a new deployment.
 */
export async function getDataset(): Promise<Dataset> {
  "use cache";
  cacheLife("days");
  cacheTag("dataset");

  const source = resolveDataSource(process.env);

  if (source.kind === "fixture") {
    const fixture = JSON.parse(await readProjectFile("test-vectors/dataset.json")) as Fixture;
    const fetchItem: FetchItem = async (reference) => fixture.items[reference] ?? null;
    return loadDataset({
      fetchItem,
      publicKey: parsePublicKey(fixture.publicKeyHex),
      indexRef: fixture.indexRef,
    });
  }

  const publicKeyHex = (await readProjectFile("config/data-public-key.txt")).trim();
  return loadDataset({
    fetchItem: createTechnoworksFetcher(source.ra),
    publicKey: parsePublicKey(publicKeyHex),
    indexRef: source.indexRef,
  });
}
