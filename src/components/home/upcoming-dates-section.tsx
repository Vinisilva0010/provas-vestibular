import Link from "next/link";
import { Professor } from "@/components/professor/professor";
import { buildCalendar } from "@/lib/calendar";
import { getDataset } from "@/lib/data/get-dataset";
import { UpcomingList, type HomeDate } from "./upcoming-list";

export async function UpcomingDatesSection() {
  const calendar = buildCalendar(await getDataset());
  const items: HomeDate[] = calendar.months
    .flatMap((month) => month.entries)
    .flatMap((entry) =>
      entry.startDate
        ? [
            {
              id: entry.id,
              label: entry.label,
              startDate: entry.startDate,
              ...(entry.endDate ? { endDate: entry.endDate } : {}),
              examSlug: entry.examSlug,
              examName: entry.examName,
            },
          ]
        : [],
    );

  return (
    <section aria-labelledby="proximas-datas" className="mx-auto max-w-7xl px-5 pt-20">
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="proximas-datas" className="display-type text-[clamp(2.75rem,8vw,6rem)] leading-[0.9]">
            Próximas datas
          </h2>
          <p className="mt-3 max-w-xl text-xl">
            O que está chegando em todas as provas, contando os dias pelo horário de Brasília.
          </p>
          <Link href="/calendario" className="mt-4 inline-block text-xl font-extrabold">
            Ver o calendário completo
          </Link>
        </div>
        <Professor pose="point-left" size="lg" className="self-center sm:self-end" />
      </div>
      <div className="mt-10">
        <UpcomingList items={items} />
      </div>
    </section>
  );
}
