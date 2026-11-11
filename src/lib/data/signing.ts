import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Document signing shared with the Rust data tool.
 * Server-side only: never import this from a client component.
 *
 * Canonical form: object keys sorted, no whitespace, UTF-8, JSON escapes as
 * produced by JSON.stringify. Only safe integers are allowed as numbers so
 * that every language writes them the same way.
 */

export const SIGNATURE_FIELD = "signature";

const KEY_HEX = /^[0-9a-f]{64}$/;
const SIGNATURE_HEX = /^[0-9a-f]{64}$/;

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return JSON.stringify(value);
  }

  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) {
      throw new TypeError(`Only safe integers can be signed, got ${value}.`);
    }
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const entries = Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`);
    return `{${entries.join(",")}}`;
  }

  throw new TypeError(`Unsupported value of type ${typeof value}.`);
}

/** Parses the secret key: exactly 32 bytes written as 64 lowercase hex characters. */
export function parseSigningKey(hex: string): Buffer {
  if (!KEY_HEX.test(hex)) {
    throw new RangeError("Signing key must be 64 lowercase hex characters (32 bytes).");
  }
  return Buffer.from(hex, "hex");
}

function withoutSignature(document: Record<string, unknown>): Record<string, unknown> {
  const { [SIGNATURE_FIELD]: _signature, ...rest } = document;
  return rest;
}

/** HMAC-SHA256 of the canonical form, ignoring any existing signature field. */
export function computeSignature(document: Record<string, unknown>, key: Buffer): string {
  return createHmac("sha256", key)
    .update(canonicalJson(withoutSignature(document)), "utf8")
    .digest("hex");
}

export function signDocument<T extends Record<string, unknown>>(
  document: T,
  key: Buffer,
): T & { signature: string } {
  return { ...document, signature: computeSignature(document, key) };
}

/** True only when the document carries a well-formed signature that matches its content. */
export function verifyDocument(document: Record<string, unknown>, key: Buffer): boolean {
  const provided = document[SIGNATURE_FIELD];
  if (typeof provided !== "string" || !SIGNATURE_HEX.test(provided)) {
    return false;
  }

  let expected: string;
  try {
    expected = computeSignature(document, key);
  } catch {
    return false;
  }

  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(provided, "hex"));
}
