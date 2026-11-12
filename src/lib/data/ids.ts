/** Prefix that separates this project's documents from other data in a shared collection. */
export const ID_PREFIX = "pvb";

export const documentTypes = [
  "exam",
  "edition",
  "event",
  "structure",
  "topic",
  "material",
  "course",
  "plan",
  "change",
  "meta",
] as const;

export type DocumentType = (typeof documentTypes)[number];

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Lowercase letters and digits, words joined by single hyphens. */
export function isSlug(value: string): boolean {
  return SLUG.test(value);
}

/** Builds a deterministic id: pvb-<type>-<part>-<part>... */
export function buildId(type: DocumentType, ...parts: string[]): string {
  if (parts.length === 0) {
    throw new RangeError("An id needs at least one part after the type.");
  }
  for (const part of parts) {
    if (!isSlug(part)) {
      throw new RangeError(
        `Invalid id part "${part}". Use lowercase letters, digits and single hyphens.`,
      );
    }
  }
  return [ID_PREFIX, type, ...parts].join("-");
}

/** Same as buildId, but returns null instead of throwing. */
export function tryBuildId(type: DocumentType, ...parts: string[]): string | null {
  try {
    return buildId(type, ...parts);
  } catch {
    return null;
  }
}

/** Reads the document type from one of our ids. */
export function idType(id: string): DocumentType | undefined {
  return documentTypes.find((type) => id.startsWith(`${ID_PREFIX}-${type}-`));
}
