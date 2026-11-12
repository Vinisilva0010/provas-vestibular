import type { DateItem } from "./exam-view";

/**
 * Builds an iCalendar file (RFC 5545) with one all-day event per date.
 * Rules that matter for calendar apps: CRLF line breaks, lines of at most
 * 75 bytes (longer ones are folded), escaped text and an exclusive DTEND.
 */

const CRLF = "\r\n";
const encoder = new TextEncoder();

function escapeText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Splits a line into chunks of at most 75 bytes, never inside a character. */
function fold(line: string): string {
  const chunks: string[] = [];
  let current = "";
  let size = 0;
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    // Continuation lines start with a space, which counts toward the limit.
    const limit = chunks.length === 0 ? 75 : 74;
    if (size + bytes > limit) {
      chunks.push(current);
      current = "";
      size = 0;
    }
    current += char;
    size += bytes;
  }
  chunks.push(current);
  return chunks.join(`${CRLF} `);
}

function compactDate(isoDate: string): string {
  return isoDate.replaceAll("-", "");
}

/** The day after an ISO date, because DTEND of an all-day event is exclusive. */
function nextDay(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
}

function utcStamp(instant: Date): string {
  return instant.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

type IcsInput = {
  calendarName: string;
  items: DateItem[];
  pageUrl: string;
  now: Date;
};

export function buildIcs({ calendarName, items, pageUrl, now }: IcsInput): string {
  const stamp = utcStamp(now);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//provas-vestibular//exam dates//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(`Datas da ${calendarName}`)}`,
  ];

  for (const item of items) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${item.id}@provas-vestibular`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compactDate(item.startDate)}`,
      `DTEND;VALUE=DATE:${compactDate(nextDay(item.endDate ?? item.startDate))}`,
      `SUMMARY:${escapeText(`${calendarName}: ${item.label}`)}`,
      `DESCRIPTION:${escapeText(`Detalhes e fontes oficiais: ${pageUrl}`)}`,
      `URL:${pageUrl}`,
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.map(fold).join(CRLF) + CRLF;
}
