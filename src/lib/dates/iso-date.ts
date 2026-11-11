const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

/** Converts a YYYY-MM-DD string into a whole day count since the Unix epoch. */
export function toEpochDay(isoDate: string): number {
  const match = ISO_DATE.exec(isoDate);
  if (!match) {
    throw new RangeError(`Invalid date format: "${isoDate}". Expected YYYY-MM-DD.`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = Date.UTC(year, month - 1, day);
  const parsed = new Date(utc);

  const isRealDate =
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day;

  if (!isRealDate) {
    throw new RangeError(`Invalid calendar date: "${isoDate}".`);
  }

  return utc / MS_PER_DAY;
}

/** True when the value is a real calendar date written as YYYY-MM-DD. */
export function isIsoDate(value: string): boolean {
  try {
    toEpochDay(value);
    return true;
  } catch {
    return false;
  }
}
