import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { eventSchema, examSchema } from "./schemas";

type Base = "exam" | "event";
type Case = {
  name: string;
  base: Base;
  patch?: Record<string, unknown>;
  remove?: string[];
  valid: boolean;
  path?: string;
};

const fixture = JSON.parse(
  readFileSync(join(process.cwd(), "test-vectors/documents.json"), "utf8"),
) as { bases: Record<Base, Record<string, unknown>>; cases: Case[] };

const schemaFor = { exam: examSchema, event: eventSchema };

function buildDocument(testCase: Case): Record<string, unknown> {
  const document: Record<string, unknown> = { ...fixture.bases[testCase.base], ...testCase.patch };
  for (const key of testCase.remove ?? []) {
    delete document[key];
  }
  return document;
}

describe("shared validation cases (must match the Rust validator)", () => {
  it.each(fixture.cases.map((testCase) => [testCase.name, testCase] as const))(
    "%s",
    (_name, testCase) => {
      const result = schemaFor[testCase.base].safeParse(buildDocument(testCase));
      expect(result.success).toBe(testCase.valid);
      if (!testCase.valid) {
        const paths = (result.error?.issues ?? []).map((issue) => issue.path.join("."));
        expect(paths).toContain(testCase.path);
      }
    },
  );
});
