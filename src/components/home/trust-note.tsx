import { Professor } from "@/components/professor/professor";
import { Badge } from "@/components/ui/badge";

export function TrustNote() {
  return (
    <section className="mx-auto max-w-5xl px-5 pt-32">
      <div className="relative rotate-1 rounded-2xl border-4 border-ink bg-paper p-8 pt-12 shadow-[10px_10px_0_0_var(--color-ink)] sm:p-12 sm:pr-56">
        <Badge tone="violet" className="absolute -top-5 left-6 -rotate-3 text-lg">
          De onde vem cada informação
        </Badge>
        <p className="display-type text-[clamp(2rem,5vw,3.75rem)] leading-[0.95]">
          Toda data tem o link do edital e o dia em que foi conferida.
        </p>
        <p className="mt-6 text-xl">
          Quando a instituição ainda não divulgou uma data, o site mostra{" "}
          <Badge tone="paper">Ainda não divulgado</Badge> em vez de chutar.
        </p>
        <Professor
          pose="angry"
          size="md"
          className="mx-auto mt-8 sm:absolute sm:-right-8 sm:-bottom-12 sm:mt-0"
        />
      </div>
    </section>
  );
}
