import type { Metadata } from "next";
import { CalendarBoard } from "@/components/calendar/calendar-board";
import { Professor } from "@/components/professor/professor";
import { buildCalendar } from "@/lib/calendar";
import { getDataset } from "@/lib/data/get-dataset";

export const metadata: Metadata = {
  title: "Calendário das provas",
  description: "Todas as datas das provas de entrada na faculdade em um só lugar, no horário de Brasília.",
};

export default async function CalendarPage() {
  const calendar = buildCalendar(await getDataset());

  return (
    <main className="mx-auto max-w-7xl px-5 pt-10">
      <div className="flex flex-col-reverse gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="display-type text-[clamp(3rem,9vw,7rem)] leading-[0.88]">Calendário</h1>
          <p className="mt-4 max-w-2xl text-xl">
            Todas as datas das provas num lugar só, sempre no horário de Brasília. Use os botões para ver uma
            prova de cada vez.
          </p>
        </div>
        <Professor pose="point-left" size="lg" />
      </div>
      <div className="mt-10">
        <CalendarBoard calendar={calendar} />
      </div>
    </main>
  );
}
