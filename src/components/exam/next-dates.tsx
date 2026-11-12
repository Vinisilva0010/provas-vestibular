"use client";

import { useSyncExternalStore } from "react";
import { todayInExamTimeZone } from "@/lib/dates/days-until";
import { upcomingDates, type DateItem } from "@/lib/exam-view";
import { formatDateRange } from "@/lib/format";

const subscribe = () => () => {};

/**
 * Countdown to the next dates. Computed in the visitor's browser with
 * Brasília time, so it stays correct every day on a page built in advance.
 */
export function NextDates({ items }: { items: DateItem[] }) {
  const today = useSyncExternalStore(subscribe, () => todayInExamTimeZone(), () => null);
  const upcoming = today === null ? [] : upcomingDates(items, today).slice(0, 3);

  return (
    <div className="w-full rounded-2xl border-4 border-ink bg-paper p-5 shadow-[8px_8px_0_0_var(--color-ink)]">
      <h2 className="display-type text-3xl leading-none">Próximas datas</h2>
      {today === null ? (
        <p className="mt-3 text-lg">Calculando os dias que faltam…</p>
      ) : upcoming.length === 0 ? (
        <p className="mt-3 text-lg">Não há mais datas divulgadas para esta edição.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {upcoming.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-3 border-t-2 border-dashed border-ink pt-3 first:border-t-0 first:pt-0"
            >
              <div>
                <p className="text-lg font-extrabold">{item.label}</p>
                <p className="text-base">{formatDateRange(item.startDate, item.endDate)}</p>
              </div>
              <span className="shrink-0 rounded-lg border-2 border-ink bg-sun px-2 py-1 text-base font-extrabold">
                {item.countdown}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
