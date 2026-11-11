import { Professor } from "@/components/professor/professor";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col items-start gap-8 px-5 py-20 sm:flex-row sm:items-center">
      <Professor pose="sitting" size="md" />
      <div>
        <Badge tone="coral">Página não encontrada</Badge>
        <h1 className="mt-4 text-4xl">Essa página não existe ou ainda está sendo feita.</h1>
        <p className="mt-3 text-xl">
          O site está em construção e algumas partes ainda não estão no ar.
        </p>
        <ButtonLink href="/" className="mt-6">
          Voltar ao início
        </ButtonLink>
      </div>
    </main>
  );
}
