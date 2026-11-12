import "server-only";
import { DatasetError, isValidRa, isValidReference } from "./technoworks";

export type DataSource = { kind: "fixture" } | { kind: "technoworks"; ra: string; indexRef: string };

/**
 * Where the site reads its data from. The signed test fixture exists for
 * automated tests and is refused on the production deployment.
 * Error messages name the variable but never print its value.
 */
export function resolveDataSource(env: Record<string, string | undefined>): DataSource {
  if (env.PVB_DATA_SOURCE === "fixture") {
    if (env.VERCEL_ENV === "production") {
      throw new DatasetError("The test fixture cannot be used in production.");
    }
    return { kind: "fixture" };
  }
  if (env.PVB_DATA_SOURCE !== undefined && env.PVB_DATA_SOURCE !== "technoworks") {
    throw new DatasetError('PVB_DATA_SOURCE must be "technoworks" or "fixture".');
  }

  const ra = env.PVB_TECHNOWORKS_RA?.trim() ?? "";
  const indexRef = env.PVB_INDEX_REF?.trim() ?? "";
  if (!isValidRa(ra)) {
    throw new DatasetError("PVB_TECHNOWORKS_RA is missing or invalid.");
  }
  if (!isValidReference(indexRef)) {
    throw new DatasetError("PVB_INDEX_REF is missing or invalid.");
  }
  return { kind: "technoworks", ra, indexRef };
}
