import "server-only";

/**
 * Read-only client for the Technoworks REST database.
 * Facts checked against the live API: GET /rest/{ra}/{id} answers
 * { status, dados } and adds `id`, `_criadoEm` and `_atualizadoEm` to every item.
 */

export const TECHNOWORKS_BASE_URL = "https://technoworks.com.br";

const REFERENCE = /^[A-Za-z0-9]{1,128}$/;
const RA = /^[A-Za-z0-9-]{1,32}$/;

export class DatasetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatasetError";
  }
}

export type FetchItem = (reference: string) => Promise<Record<string, unknown> | null>;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isValidReference(value: string): boolean {
  return REFERENCE.test(value);
}

export function isValidRa(value: string): boolean {
  return RA.test(value);
}

/** Removes the fields the database adds on its own: `id` and anything starting with `_`. */
export function stripServerFields(item: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(item).filter(([key]) => key !== "id" && !key.startsWith("_")),
  );
}

type FetcherOptions = { fetchImpl?: typeof fetch; timeoutMs?: number };

/**
 * Builds a function that reads one item by reference. Returns null on 404.
 * Error messages never include the RA, because they may end up in build logs.
 */
export function createTechnoworksFetcher(ra: string, options: FetcherOptions = {}): FetchItem {
  if (!isValidRa(ra)) {
    throw new DatasetError("PVB_TECHNOWORKS_RA must contain only letters, digits and hyphens.");
  }
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 15_000;

  return async (reference) => {
    if (!isValidReference(reference)) {
      throw new DatasetError("Refusing to request an invalid item reference.");
    }

    const response = await fetchImpl(`${TECHNOWORKS_BASE_URL}/rest/${ra}/${reference}`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new DatasetError(`Reading item ${reference} failed with status ${response.status}.`);
    }

    const body: unknown = await response.json();
    const data = isRecord(body) ? body.dados : undefined;
    if (!isRecord(data)) {
      throw new DatasetError(`Item ${reference} came back without a 'dados' object.`);
    }
    return data;
  };
}
