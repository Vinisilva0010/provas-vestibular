import { toEpochDay } from "@/lib/dates/iso-date";

const MONTHS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
] as const;

type DateParts = { year: number; month: number; day: number; text: { day: string; month: string } };

/** Splits a validated YYYY-MM-DD string. Throws RangeError for impossible dates. */
function parts(isoDate: string): DateParts {
  toEpochDay(isoDate);
  const [year, month, day] = isoDate.split("-").map(Number) as [number, number, number];
  return {
    year,
    month,
    day,
    text: { day: day === 1 ? "1º" : String(day), month: MONTHS[month - 1] as string },
  };
}

/** "1º de novembro de 2026" */
export function formatDate(isoDate: string): string {
  const date = parts(isoDate);
  return `${date.text.day} de ${date.text.month} de ${date.year}`;
}

/** "6 e 7 de dezembro de 2026", "17 de agosto a 9 de outubro de 2026", and so on. */
export function formatDateRange(start: string, end?: string): string {
  if (end === undefined || end === start) {
    return formatDate(start);
  }
  const a = parts(start);
  const b = parts(end);
  if (a.year !== b.year) {
    return `${formatDate(start)} a ${formatDate(end)}`;
  }
  if (a.month !== b.month) {
    return `${a.text.day} de ${a.text.month} a ${b.text.day} de ${b.text.month} de ${b.year}`;
  }
  const joiner = toEpochDay(end) - toEpochDay(start) === 1 ? "e" : "a";
  return `${a.text.day} ${joiner} ${b.text.day} de ${a.text.month} de ${a.year}`;
}

/** "04/11/2026" */
export function formatShortDate(isoDate: string): string {
  toEpochDay(isoDate);
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

const brazilianNumber = new Intl.NumberFormat("pt-BR");
const brazilianMoney = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "R$ 228,00" from 22800 cents. */
export function formatCurrencyCents(cents: number): string {
  return `R$ ${brazilianMoney.format(cents / 100)}`;
}

/** "8.000" */
export function formatNumber(value: number): string {
  return brazilianNumber.format(value);
}

/** "5 horas", "1 hora e 30 minutos", "45 minutos" */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const hoursText = hours === 1 ? "1 hora" : `${hours} horas`;
  const minutesText = rest === 1 ? "1 minuto" : `${rest} minutos`;
  if (hours === 0) return minutesText;
  if (rest === 0) return hoursText;
  return `${hoursText} e ${minutesText}`;
}
