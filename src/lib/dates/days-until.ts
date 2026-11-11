/**
 * Exam dates in Brazil are published in Brasília time, so "today" is
 * always computed in this time zone, regardless of where the visitor is.
 */
export const EXAM_TIME_ZONE = "America/Sao_Paulo";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

/** Converts a YYYY-MM-DD string into a whole day count since the Unix epoch. */
function toEpochDay(isoDate: string): number {
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

/** Returns the calendar date (YYYY-MM-DD) of an instant in the given time zone. */
function calendarDateIn(timeZone: string, instant: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

/**
 * Number of calendar days from today (in Brasília) until the target date.
 * Returns 0 for today, a positive number for future dates and a negative
 * number for past dates.
 */
export function daysUntil(targetIsoDate: string, now: Date = new Date()): number {
  const today = calendarDateIn(EXAM_TIME_ZONE, now);
  return toEpochDay(targetIsoDate) - toEpochDay(today);
}
