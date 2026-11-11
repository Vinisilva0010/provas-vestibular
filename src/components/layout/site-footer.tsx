import Link from "next/link";
import { Pencil, Star } from "@/components/art/doodles";
import { mainNavigation, siteName } from "@/lib/site";

const footerLinks = [...mainNavigation, { href: "/fontes", label: "Fontes" }];

export function SiteFooter() {
  return (
    <footer className="relative mt-32 overflow-hidden border-t-4 border-ink bg-sun">
      <Star className="absolute top-8 right-6 size-14 rotate-12 sm:size-20" />
      <Pencil className="absolute top-40 -right-10 hidden w-56 -rotate-12 lg:block" />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-5 pt-14 pb-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="display-type max-w-xl text-5xl leading-[0.9] sm:text-6xl">{siteName}</p>
          <p className="mt-5 max-w-xl text-lg">
            Todas as datas e regras vêm dos sites oficiais de cada prova, com a data em que foram
            conferidas. Antes de se inscrever, confira sempre o edital oficial.
          </p>
        </div>

        <nav aria-label="Rodapé" className="lg:pr-16">
          <ul className="grid grid-cols-2 gap-3">
            {footerLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-xl border-3 border-ink bg-paper px-4 py-3 text-lg font-extrabold no-underline shadow-[3px_3px_0_0_var(--color-ink)] transition-transform duration-150 hover:-translate-y-0.5 hover:-rotate-1"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <p
        aria-hidden="true"
        className="display-type text-outline pointer-events-none -mb-[4vw] px-3 text-[22vw] leading-none whitespace-nowrap select-none"
      >
        Provas
      </p>
    </footer>
  );
}
