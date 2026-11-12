import { describe, expect, it } from "vitest";
import { buildCalendar, isPast, monthLabel } from "./calendar";
import type { Dataset } from "./data/dataset";

function event(examSlug: string, key: string, startDate?: string, endDate?: string) {
  return {
    id: `pvb-event-${examSlug}-2027-${key}`,
    examSlug,
    editionYear: 2027,
    key,
    label: key,
    status: startDate ? "official" : "not-announced",
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
  };
}

const dataset = {
  generatedAt: 1,
  exams: [
    { slug: "unicamp", shortName: "Unicamp" },
    { slug: "fuvest", shortName: "Fuvest" },
  ],
  events: [
    event("fuvest", "first-call", "2027-01-26"),
    event("unicamp", "phase-2", "2026-11-29", "2026-11-30"),
    event("unicamp", "enrollment"),
    event("fuvest", "phase-1", "2026-11-01"),
    event("ufrgs", "phase-1", "2026-11-15"),
  ],
  editions: [],
  structures: [],
} as unknown as Dataset;

describe("buildCalendar", () => {
  const calendar = buildCalendar(dataset);

  it("groups dated events by month, in date order", () => {
    expect(calendar.months.map((month) => [month.key, month.label])).toEqual([
      ["2026-11", "Novembro de 2026"],
      ["2027-01", "Janeiro de 2027"],
    ]);
    expect(calendar.months[0]?.entries.map((entry) => entry.id)).toEqual([
      "pvb-event-fuvest-2027-phase-1",
      "pvb-event-ufrgs-2027-phase-1",
      "pvb-event-unicamp-2027-phase-2",
    ]);
  });

  it("names the exam of each entry and falls back to the slug", () => {
    const [fuvest, ufrgs, unicamp] = calendar.months[0]?.entries ?? [];
    expect(fuvest?.examName).toBe("Fuvest");
    expect(ufrgs?.examName).toBe("ufrgs");
    expect(unicamp).toMatchObject({ examName: "Unicamp", startDate: "2026-11-29", endDate: "2026-11-30" });
  });

  it("keeps events without a date apart", () => {
    expect(calendar.undated.map((entry) => entry.id)).toEqual(["pvb-event-unicamp-2027-enrollment"]);
    expect(calendar.undated[0]?.status).toBe("not-announced");
  });

  it("lists the exams for the filter, in alphabetical order", () => {
    expect(calendar.exams).toEqual([
      { slug: "fuvest", name: "Fuvest" },
      { slug: "unicamp", name: "Unicamp" },
    ]);
  });
});

describe("monthLabel", () => {
  it("writes the month name with a capital letter", () => {
    expect(monthLabel("2026-03")).toBe("Março de 2026");
  });
});

describe("isPast", () => {
  const entry = { startDate: "2026-11-29", endDate: "2026-11-30" };

  it("is past only after the last day", () => {
    expect(isPast(entry, "2026-11-30")).toBe(false);
    expect(isPast(entry, "2026-12-01")).toBe(true);
    expect(isPast({ startDate: "2026-11-01" }, "2026-11-02")).toBe(true);
  });

  it("never treats an undated event as past", () => {
    expect(isPast({}, "2030-01-01")).toBe(false);
  });
});
