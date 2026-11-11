import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  canonicalJson,
  computeSignature,
  parseSigningKey,
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
) as { keyHex: string; vectors: Vector[] };

const key = parseSigningKey(fixture.keyHex);
const otherKey = parseSigningKey("f".repeat(64));

describe("shared vectors (must match the Rust implementation)", () => {
  it.each(fixture.vectors.map((vector) => [vector.name, vector] as const))(
    "%s: canonical text and signature match",
    (_name, vector) => {
      expect(canonicalJson(vector.document)).toBe(vector.canonical);
      expect(computeSignature(vector.document, key)).toBe(vector.signature);
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

describe("parseSigningKey", () => {
  it("accepts exactly 64 lowercase hex characters", () => {
    expect(parseSigningKey("a".repeat(64))).toHaveLength(32);
  });

  it("rejects short, long, upper case and non-hex keys", () => {
    for (const value of ["a".repeat(63), "a".repeat(65), "A".repeat(64), "g".repeat(64), ""]) {
      expect(() => parseSigningKey(value)).toThrow(RangeError);
    }
  });
});

describe("signDocument and verifyDocument", () => {
  const document = { id: "pvb-exam-fuvest", type: "exam", hasStudyPlan: true };

  it("signs and verifies a document", () => {
    const signed = signDocument(document, key);
    expect(signed.signature).toMatch(/^[0-9a-f]{64}$/);
    expect(verifyDocument(signed, key)).toBe(true);
  });

  it("does not include the signature itself in what is signed", () => {
    const signed = signDocument(document, key);
    expect(computeSignature(signed, key)).toBe(computeSignature(document, key));
  });

  it("detects a changed value", () => {
    const signed = signDocument(document, key);
    expect(verifyDocument({ ...signed, hasStudyPlan: false }, key)).toBe(false);
  });

  it("detects an added field", () => {
    const signed = signDocument(document, key);
    expect(verifyDocument({ ...signed, extra: "x" }, key)).toBe(false);
  });

  it("fails with a different key", () => {
    const signed = signDocument(document, key);
    expect(verifyDocument(signed, otherKey)).toBe(false);
  });

  it("returns false for missing or malformed signatures instead of throwing", () => {
    expect(verifyDocument(document, key)).toBe(false);
    expect(verifyDocument({ ...document, signature: "not-hex" }, key)).toBe(false);
    expect(verifyDocument({ ...document, signature: "ab" }, key)).toBe(false);
    expect(verifyDocument({ ...document, signature: 123 }, key)).toBe(false);
  });

  it("returns false for documents that cannot be canonicalized", () => {
    const signed = signDocument(document, key);
    expect(verifyDocument({ ...signed, weight: 1.5 }, key)).toBe(false);
  });
});
