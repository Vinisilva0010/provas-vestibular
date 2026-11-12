import { describe, expect, it } from "vitest";
import { buildIcs } from "./ics";

const now = new Date("2026-11-11T23:23:00.000Z");
const pageUrl = "https://example.com/provas/fuvest";

function build(items: Parameters<typeof buildIcs>[0]["items"]) {
  return buildIcs({ calendarName: "Fuvest", items, pageUrl, now });
}

const unfold = (text: string) => text.replaceAll("\r\n ", "");

describe("buildIcs", () => {
  it("writes a calendar that starts and ends correctly, with CRLF line breaks", () => {
    const text = build([]);
    expect(text.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n")).toBe(true);
    expect(text.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(text).not.toMatch(/[^\r]\n/);
    expect(text).not.toContain("BEGIN:VEVENT");
  });

  it("writes one all-day event per date, with an exclusive end day", () => {
    const text = build([
      { id: "pvb-event-fuvest-2027-phase-2", label: "2ª fase", startDate: "2026-12-06", endDate: "2026-12-07" },
      { id: "pvb-event-fuvest-2027-last", label: "Último dia", startDate: "2026-12-31" },
    ]);
    expect(text).toContain("UID:pvb-event-fuvest-2027-phase-2@provas-vestibular\r\n");
    expect(text).toContain("DTSTAMP:20261111T232300Z\r\n");
    expect(text).toContain("DTSTART;VALUE=DATE:20261206\r\nDTEND;VALUE=DATE:20261208\r\n");
    expect(text).toContain("DTSTART;VALUE=DATE:20261231\r\nDTEND;VALUE=DATE:20270101\r\n");
    expect(text).toContain("SUMMARY:Fuvest: 2ª fase\r\n");
    expect(text).toContain(`URL:${pageUrl}\r\n`);
    expect(text.match(/BEGIN:VEVENT/g)).toHaveLength(2);
  });

  it("escapes commas, semicolons and backslashes in text", () => {
    const text = build([{ id: "x", label: "Inscrições; taxa, isenção \\ prazo", startDate: "2026-08-17" }]);
    expect(unfold(text)).toContain("SUMMARY:Fuvest: Inscrições\\; taxa\\, isenção \\\\ prazo\r\n");
  });

  it("folds long lines at 75 bytes without breaking accented letters", () => {
    const label = "Matrícula virtual da chamada de recuperação ".repeat(6).trim();
    const text = build([{ id: "x", label, startDate: "2027-01-26" }]);
    for (const line of text.split("\r\n")) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
    expect(unfold(text)).toContain(`SUMMARY:Fuvest: ${label}\r\n`);
  });
});
