import "server-only";
import type { KeyObject } from "node:crypto";
import { z } from "zod";
import { eventSchema, examSchema, type Exam, type ExamEvent } from "./schemas";
import { verifyDocument } from "./signing";
import { DatasetError, stripServerFields, type FetchItem } from "./technoworks";

/**
 * Reads the published data: the signed index, then every signed exam bundle
 * it lists. Any problem stops the whole load, so the site never publishes
 * partial or tampered data; the previous deployment stays online instead.
 * Must match the format written by tools/pvb-data/src/push.rs.
 */

export const FORMAT_VERSION = 1;

const SIGNATURE_HEX = /^[0-9a-f]{128}$/;
const REFERENCE = /^[A-Za-z0-9]{1,128}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const indexSchema = z.strictObject({
  pvbKey: z.literal("index"),
  formatVersion: z.literal(FORMAT_VERSION),
  generatedAt: z.number().int().nonnegative(),
  bundles: z
    .array(
      z.strictObject({
        key: z.string().regex(SLUG),
        ref: z.string().regex(REFERENCE),
        signature: z.string().regex(SIGNATURE_HEX),
      }),
    )
    .min(1),
  signature: z.string(),
});

type IndexEntry = z.infer<typeof indexSchema>["bundles"][number];

const bundleSchema = z.strictObject({
  pvbKey: z.string(),
  formatVersion: z.literal(FORMAT_VERSION),
  bundle: z.string(),
  documents: z.array(z.record(z.string(), z.unknown())).min(1),
  signature: z.string(),
});

export type Dataset = {
  /** Unix time (seconds) of the push that produced this data. */
  generatedAt: number;
  exams: Exam[];
  events: ExamEvent[];
};

function describeIssues(error: z.ZodError): string {
  return error.issues
    .slice(0, 3)
    .map((issue) => `${issue.path.join(".") || "(document)"}: ${issue.message}`)
    .join("; ");
}

async function loadBundle(
  entry: IndexEntry,
  fetchItem: FetchItem,
  publicKey: KeyObject,
): Promise<{ exams: Exam[]; events: ExamEvent[] }> {
  const label = `Bundle "${entry.key}"`;
  const raw = await fetchItem(entry.ref);
  if (!raw) {
    throw new DatasetError(`${label} was not found.`);
  }

  const bundle = stripServerFields(raw);
  if (!verifyDocument(bundle, publicKey)) {
    throw new DatasetError(`${label} has an invalid signature.`);
  }
  if (bundle.signature !== entry.signature) {
    throw new DatasetError(`${label} is not the one listed in the index.`);
  }

  const parsed = bundleSchema.safeParse(bundle);
  if (!parsed.success) {
    throw new DatasetError(`${label} has an unexpected format: ${describeIssues(parsed.error)}`);
  }
  if (parsed.data.bundle !== entry.key || parsed.data.pvbKey !== `bundle-${entry.key}`) {
    throw new DatasetError(`${label} is labeled as a different exam.`);
  }

  const exams: Exam[] = [];
  const events: ExamEvent[] = [];
  for (const document of parsed.data.documents) {
    if (!verifyDocument(document, publicKey)) {
      throw new DatasetError(`A document in ${label} has an invalid signature.`);
    }
    const { signature: _signature, ...unsigned } = document;

    if (unsigned.type === "exam") {
      const result = examSchema.safeParse(unsigned);
      if (!result.success) {
        throw new DatasetError(`Exam in ${label} is invalid: ${describeIssues(result.error)}`);
      }
      if (result.data.slug !== entry.key) {
        throw new DatasetError(`An exam in ${label} belongs to another exam.`);
      }
      exams.push(result.data);
    } else if (unsigned.type === "event") {
      const result = eventSchema.safeParse(unsigned);
      if (!result.success) {
        throw new DatasetError(`Event in ${label} is invalid: ${describeIssues(result.error)}`);
      }
      if (result.data.examSlug !== entry.key) {
        throw new DatasetError(`An event in ${label} belongs to another exam.`);
      }
      events.push(result.data);
    } else {
      throw new DatasetError(`${label} contains an unknown document type.`);
    }
  }

  if (exams.length !== 1) {
    throw new DatasetError(`${label} must contain exactly one exam.`);
  }
  return { exams, events };
}

export async function loadDataset(options: {
  fetchItem: FetchItem;
  publicKey: KeyObject;
  indexRef: string;
}): Promise<Dataset> {
  const { fetchItem, publicKey, indexRef } = options;

  const raw = await fetchItem(indexRef);
  if (!raw) {
    throw new DatasetError("The index was not found.");
  }

  const index = stripServerFields(raw);
  if (!verifyDocument(index, publicKey)) {
    throw new DatasetError("The index has an invalid signature.");
  }

  const parsed = indexSchema.safeParse(index);
  if (!parsed.success) {
    throw new DatasetError(`The index has an unexpected format: ${describeIssues(parsed.error)}`);
  }

  const entries = parsed.data.bundles;
  const uniqueKeys = new Set(entries.map((entry) => entry.key)).size;
  const uniqueRefs = new Set(entries.map((entry) => entry.ref)).size;
  if (uniqueKeys !== entries.length || uniqueRefs !== entries.length) {
    throw new DatasetError("The index lists the same bundle twice.");
  }

  const parts = await Promise.all(entries.map((entry) => loadBundle(entry, fetchItem, publicKey)));
  const exams = parts.flatMap((part) => part.exams).sort((a, b) => a.slug.localeCompare(b.slug));
  const events = parts.flatMap((part) => part.events).sort((a, b) => a.id.localeCompare(b.id));

  const ids = [...exams, ...events].map((document) => document.id);
  if (new Set(ids).size !== ids.length) {
    throw new DatasetError("Two documents share the same id.");
  }

  return { generatedAt: parsed.data.generatedAt, exams, events };
}
