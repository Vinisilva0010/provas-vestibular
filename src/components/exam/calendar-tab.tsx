import { Badge, type BadgeTone } from "@/components/ui/badge";
import type { ExamEvent } from "@/lib/data/schemas";
import { formatDateRange, formatDuration } from "@/lib/format";
import { eventStatusLabel } from "@/lib/labels";
import { EmptyState } from "./empty-state";
import { SourceNotes } from "./source-notes";

const statusTone: Record<ExamEvent["status"], BadgeTone> = {
  official: "sun",
  announced: "violet",
  "not-announced": "paper",
};

function timeDetails(event: ExamEvent): string | null {
  const parts = [
    event.gatesOpen && `portões abrem às ${event.gatesOpen}`,
    event.gatesClose && `fecham às ${event.gatesClose}`,
    event.durationMinutes && `prova de até ${formatDuration(event.durationMinutes)}`,
  ].filter(Boolean);
  if (parts.length === 0) return null;
  const text = parts.join(", ");
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;
}

export function CalendarTab({ events, editionYear }: { events: ExamEvent[]; editionYear?: number }) {
  if (events.length === 0) {
    return <EmptyState text="As datas desta prova ainda não foram cadastradas." />;
  }

  return (
    <div>
      <p className="text-xl">Datas da edição {editionYear}, sempre no horário de Brasília.</p>
      <ol className="mt-8 space-y-7 border-l-4 border-ink pl-6 sm:pl-8">
        {events.map((event) => {
          const details = timeDetails(event);
          return (
            <li key={event.id} className="relative">
              <span
                aria-hidden="true"
                className="absolute top-2 -left-[2.25rem] size-5 rounded-full border-4 border-ink bg-sun sm:-left-[2.75rem]"
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                <h3 className="text-2xl font-extrabold">{event.label}</h3>
                <Badge tone={statusTone[event.status]}>{eventStatusLabel[event.status]}</Badge>
              </div>
              <p className="mt-1 text-xl">
                {event.startDate ? formatDateRange(event.startDate, event.endDate) : "Data ainda não divulgada"}
              </p>
              {details && <p className="mt-1 text-lg">{details}</p>}
            </li>
          );
        })}
      </ol>
      <SourceNotes sources={events} />
    </div>
  );
}
