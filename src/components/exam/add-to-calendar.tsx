"use client";

import { Calendar } from "@/components/art/doodles";
import type { DateItem } from "@/lib/exam-view";
import { buildIcs } from "@/lib/ics";

type Props = { examName: string; examSlug: string; items: DateItem[] };

/** Downloads the exam dates as an .ics file, built in the browser on click. */
export function AddToCalendar({ examName, examSlug, items }: Props) {
  if (items.length === 0) return null;

  function download() {
    const pageUrl = `${window.location.origin}/provas/${examSlug}`;
    const text = buildIcs({ calendarName: examName, items, pageUrl, now: new Date() });
    const url = URL.createObjectURL(new Blob([text], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${examSlug}-datas.ics`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1_000);
  }

  return (
    <button
      type="button"
      onClick={download}
      className="inline-flex items-center gap-2 rounded-xl border-3 border-ink bg-sun px-5 py-3 text-lg font-extrabold shadow-card transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <Calendar className="size-6 shrink-0" />
      Adicionar à minha agenda
    </button>
  );
}
