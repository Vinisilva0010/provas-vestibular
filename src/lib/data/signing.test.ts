import { createPublicKey } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  canonicalJson,
  computeSignature,
  parsePrivateKey,
  parsePublicKey,
  publicKeyHex,
  signDocument,
  verifyDocument,
} from "./signing";

type Vector = {
  name: string;
  document: Record<string, unknown>;
  canonical: string;
  signature: string;
};

const fixture = JSON.parse(
  readFileSync(join(process.cwd(), "test-vectors/signing.json"), "utf8"),
) as { privateKeySeedHex: string; publicKeyHex: string; vectors: Vector[] };

const privateKey = parsePrivateKey(fixture.privateKeySeedHex);
const publicKey = parsePublicKey(fixture.publicKeyHex);
const otherPublicKey = createPublicKey(parsePrivateKey("ab".repeat(32)));

describe("shared vectors (must match the Rust implementation)", () => {
  it("derives the expected public key from the seed", () => {
    expect(publicKeyHex(createPublicKey(privateKey))).toBe(fixture.publicKeyHex);
  });

  it.each(fixture.vectors.map((vector) => [vector.name, vector] as const))(
    "%s: canonical text and signature match",
    (_name, vector) => {
      expect(canonicalJson(vector.document)).toBe(vector.canonical);
      expect(computeSignature(vector.document, privateKey)).toBe(vector.signature);
      expect(verifyDocument({ ...vector.document, signature: vector.signature }, publicKey)).toBe(true);
    },
  );
});

describe("canonicalJson", () => {
  it("ignores key order", () => {
    expect(canonicalJson({ b: 1, a: 2 })).toBe(canonicalJson({ a: 2, b: 1 }));
  });

  it("keeps array order", () => {
    expect(canonicalJson([2, 1])).toBe("[2,1]");
  });

  it("rejects numbers that are not safe integers", () => {
    expect(() => canonicalJson({ weight: 1.5 })).toThrow(TypeError);
    expect(() => canonicalJson({ big: Number.MAX_SAFE_INTEGER + 1 })).toThrow(TypeError);
  });

  it("rejects values JSON cannot represent", () => {
    expect(() => canonicalJson({ missing: undefined })).toThrow(TypeError);
  });
});

describe("key parsing", () => {
  it("rejects malformed private keys", () => {
    for (const value of ["a".repeat(63), "a".repeat(65), "A".repeat(64), "g".repeat(64), ""]) {
      expect(() => parsePrivateKey(value)).toThrow(RangeError);
    }
  });

  it("rejects malformed public keys", () => {
    for (const value of ["a".repeat(63), "A".repeat(64), ""]) {
      expect(() => parsePublicKey(value)).toThrow(RangeError);
    }
  });

  it("round-trips a public key through hex", () => {
    expect(publicKeyHex(publicKey)).toBe(fixture.publicKeyHex);
  });
});

describe("signDocument and verifyDocument", () => {
  const document = { id: "pvb-exam-fuvest", type: "exam", hasStudyPlan: true };

  it("signs and verifies a document", () => {
    const signed = signDocument(document, privateKey);
    expect(signed.signature).toMatch(/^[0-9a-f]{128}$/);
    expect(verifyDocument(signed, publicKey)).toBe(true);
  });

  it("does not include the signature itself in what is signed", () => {
    const signed = signDocument(document, privateKey);
    expect(computeSignature(signed, privateKey)).toBe(computeSignature(document, privateKey));
  });

  it("detects a changed value and an added field", () => {
    const signed = signDocument(document, privateKey);
    expect(verifyDocument({ ...signed, hasStudyPlan: false }, publicKey)).toBe(false);
    expect(verifyDocument({ ...signed, extra: "x" }, publicKey)).toBe(false);
  });

  it("fails with a different public key", () => {
    const signed = signDocument(document, privateKey);
    expect(verifyDocument(signed, otherPublicKey)).toBe(false);
  });

  it("returns false for missing or malformed signatures instead of throwing", () => {
    expect(verifyDocument(document, publicKey)).toBe(false);
    expect(verifyDocument({ ...document, signature: "not-hex" }, publicKey)).toBe(false);
    expect(verifyDocument({ ...document, signature: "ab" }, publicKey)).toBe(false);
    expect(verifyDocument({ ...document, signature: 123 }, publicKey)).toBe(false);
    expect(verifyDocument({ ...document, signature: "A".repeat(128) }, publicKey)).toBe(false);
  });

  it("returns false for documents that cannot be canonicalized", () => {
    const signed = signDocument(document, privateKey);
    expect(verifyDocument({ ...signed, weight: 1.5 }, publicKey)).toBe(false);
  });
});
