import Link from "next/link";
import { siteName } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t-2 border-ink bg-sun-soft">
      <div className="mx-auto max-w-5xl space-y-3 px-5 py-10">
        <p className="text-xl font-extrabold">{siteName}</p>
        <p>
          Todas as datas e regras vêm dos sites oficiais de cada prova, com a data em que foram
          conferidas. Antes de se inscrever, confira sempre o edital oficial.
        </p>
        <p>
          <Link href="/fontes">Como as informações são conferidas</Link>
        </p>
      </div>
    </footer>
  );
}
