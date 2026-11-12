import "server-only";
import {
  createPrivateKey,
  createPublicKey,
  sign,
  verify,
  type KeyObject,
} from "node:crypto";

/**
 * Ed25519 document signing, shared with the Rust data tool.
 * Server-side only: never import this from a client component.
 *
 * The private key signs and stays on the author's machine. The website only
 * needs the public key, which can verify but never sign.
 *
 * Canonical form: object keys sorted, no whitespace, UTF-8, JSON escapes as
 * produced by JSON.stringify. Only safe integers are allowed as numbers so
 * that every language writes them the same way.
 */

export const SIGNATURE_FIELD = "signature";

const HEX_32_BYTES = /^[0-9a-f]{64}$/;
const HEX_64_BYTES = /^[0-9a-f]{128}$/;

// Fixed DER headers that wrap a raw 32-byte Ed25519 key (RFC 8410).
const PKCS8_ED25519_PREFIX = Buffer.from("302e020100300506032b657004220420", "hex");
const SPKI_ED25519_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

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

/** Private key from its 32-byte seed written as 64 lowercase hex characters. */
export function parsePrivateKey(seedHex: string): KeyObject {
  if (!HEX_32_BYTES.test(seedHex)) {
    throw new RangeError("Private key must be 64 lowercase hex characters (32 bytes).");
  }
  return createPrivateKey({
    key: Buffer.concat([PKCS8_ED25519_PREFIX, Buffer.from(seedHex, "hex")]),
    format: "der",
    type: "pkcs8",
  });
}

/** Public key from its 32 bytes written as 64 lowercase hex characters. */
export function parsePublicKey(hex: string): KeyObject {
  if (!HEX_32_BYTES.test(hex)) {
    throw new RangeError("Public key must be 64 lowercase hex characters (32 bytes).");
  }
  return createPublicKey({
    key: Buffer.concat([SPKI_ED25519_PREFIX, Buffer.from(hex, "hex")]),
    format: "der",
    type: "spki",
  });
}

/** The raw 32-byte public key as lowercase hex. */
export function publicKeyHex(publicKey: KeyObject): string {
  const der = publicKey.export({ format: "der", type: "spki" });
  return Buffer.from(der).subarray(SPKI_ED25519_PREFIX.length).toString("hex");
}

function signedBytes(document: Record<string, unknown>): Buffer {
  const { [SIGNATURE_FIELD]: _signature, ...rest } = document;
  return Buffer.from(canonicalJson(rest), "utf8");
}

/** Ed25519 signature of the canonical form, ignoring any existing signature field. */
export function computeSignature(document: Record<string, unknown>, privateKey: KeyObject): string {
  return sign(null, signedBytes(document), privateKey).toString("hex");
}

export function signDocument<T extends Record<string, unknown>>(
  document: T,
  privateKey: KeyObject,
): T & { signature: string } {
  return { ...document, signature: computeSignature(document, privateKey) };
}

/** True only when the document carries a well-formed signature that matches its content. */
export function verifyDocument(document: Record<string, unknown>, publicKey: KeyObject): boolean {
  const provided = document[SIGNATURE_FIELD];
  if (typeof provided !== "string" || !HEX_64_BYTES.test(provided)) {
    return false;
  }
  try {
    return verify(null, signedBytes(document), publicKey, Buffer.from(provided, "hex"));
  } catch {
    return false;
  }
}
