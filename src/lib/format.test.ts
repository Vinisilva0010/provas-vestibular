import { describe, expect, it } from "vitest";
import {
  formatCurrencyCents,
  formatDate,
  formatDateRange,
  formatDuration,
  formatNumber,
  formatShortDate,
} from "./format";

describe("formatDate", () => {
  it("writes the first day of the month as 1º", () => {
    expect(formatDate("2026-11-01")).toBe("1º de novembro de 2026");
  });

  it("writes other days as plain numbers", () => {
    expect(formatDate("2026-12-06")).toBe("6 de dezembro de 2026");
  });

  it("rejects impossible dates", () => {
    expect(() => formatDate("2026-02-30")).toThrow(RangeError);
  });
});

describe("formatDateRange", () => {
  it("shows a single day when there is no end or the end is the same day", () => {
    expect(formatDateRange("2026-11-01")).toBe("1º de novembro de 2026");
    expect(formatDateRange("2026-11-01", "2026-11-01")).toBe("1º de novembro de 2026");
  });

  it("joins two consecutive days with 'e'", () => {
    expect(formatDateRange("2026-12-06", "2026-12-07")).toBe("6 e 7 de dezembro de 2026");
  });

  it("joins longer ranges in the same month with 'a'", () => {
    expect(formatDateRange("2026-12-08", "2026-12-11")).toBe("8 a 11 de dezembro de 2026");
  });

  it("names both months when they differ", () => {
    expect(formatDateRange("2026-08-17", "2026-10-09")).toBe("17 de agosto a 9 de outubro de 2026");
  });

  it("names both years when they differ", () => {
    expect(formatDateRange("2026-12-15", "2027-01-10")).toBe("15 de dezembro de 2026 a 10 de janeiro de 2027");
  });
});

describe("formatShortDate", () => {
  it("writes DD/MM/YYYY", () => {
    expect(formatShortDate("2026-11-04")).toBe("04/11/2026");
  });

  it("rejects impossible dates", () => {
    expect(() => formatShortDate("2026-13-01")).toThrow(RangeError);
  });
});

describe("formatCurrencyCents", () => {
  it("writes Brazilian reais", () => {
    expect(formatCurrencyCents(22800)).toBe("R$ 228,00");
    expect(formatCurrencyCents(123456)).toBe("R$ 1.234,56");
    expect(formatCurrencyCents(0)).toBe("R$ 0,00");
  });
});

describe("formatDuration", () => {
  it("writes hours and minutes in Portuguese", () => {
    expect(formatDuration(300)).toBe("5 horas");
    expect(formatDuration(60)).toBe("1 hora");
    expect(formatDuration(90)).toBe("1 hora e 30 minutos");
    expect(formatDuration(241)).toBe("4 horas e 1 minuto");
    expect(formatDuration(45)).toBe("45 minutos");
    expect(formatDuration(1)).toBe("1 minuto");
  });
});

describe("formatNumber", () => {
  it("uses the Brazilian thousands separator", () => {
    expect(formatNumber(8000)).toBe("8.000");
  });
});
