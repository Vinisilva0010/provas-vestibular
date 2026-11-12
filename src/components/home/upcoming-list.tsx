"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { todayInExamTimeZone } from "@/lib/dates/days-until";
import { upcomingDates } from "@/lib/exam-view";
import { formatDateRange } from "@/lib/format";

export type HomeDate = {
  id: string;
  label: string;
  startDate: string;
  endDate?: string;
  examSlug: string;
  examName: string;
};

const subscribe = () => () => {};
const tones = ["bg-sun", "bg-coral", "bg-violet-soft", "bg-paper"];
const tilts = ["-rotate-1", "rotate-1", "rotate-0", "-rotate-2"];

/** The next dates of every exam, counted in the browser with Brasília time. */
export function UpcomingList({ items }: { items: HomeDate[] }) {
  const today = useSyncExternalStore(subscribe, () => todayInExamTimeZone(), () => null);

  if (today === null) {
    return <p className="text-xl">Calculando os dias que faltam…</p>;
  }

  const upcoming = upcomingDates(items, today).slice(0, 6);
  if (upcoming.length === 0) {
    return <p className="text-xl font-extrabold">Nenhuma data marcada por enquanto.</p>;
  }

  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {upcoming.map((item, index) => (
        <li key={item.id}>
          <Link
            href={`/provas/${item.examSlug}`}
            className={cn(
              "flex h-full flex-col gap-3 rounded-2xl border-4 border-ink p-5 no-underline shadow-card",
              "transition-[transform,box-shadow,rotate] duration-200 ease-out hover:-translate-y-1 hover:rotate-0 hover:shadow-card-hover",
              tones[index % tones.length],
              tilts[index % tilts.length],
            )}
          >
            <span className="display-type text-4xl leading-none">{item.countdown}</span>
            <span className="text-lg font-extrabold">{formatDateRange(item.startDate, item.endDate)}</span>
            <span className="text-xl">{item.label}</span>
            <span className="mt-auto self-start rounded-lg border-2 border-ink bg-paper px-3 py-1 text-base font-extrabold">
              {item.examName}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
