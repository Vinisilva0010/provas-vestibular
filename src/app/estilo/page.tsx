import type { Metadata } from "next";
import { Reveal } from "@/components/motion/reveal";
import { Professor } from "@/components/professor/professor";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { palette, type PaletteColor } from "@/lib/design/tokens";

export const metadata: Metadata = {
  title: "Guia visual",
  robots: { index: false, follow: false },
};

const swatches: { color: PaletteColor; name: string; use: string }[] = [
  { color: "coral", name: "Coral", use: "Botões principais e avisos" },
  { color: "sun", name: "Amarelo", use: "Destaques e etiquetas" },
  { color: "violet", name: "Roxo", use: "Bordas, links e foco. Nunca fundo de texto" },
  { color: "coralSoft", name: "Coral claro", use: "Fundo de cartão" },
  { color: "sunSoft", name: "Amarelo claro", use: "Fundo de cartão" },
  { color: "violetSoft", name: "Roxo claro", use: "Fundo de cartão" },
  { color: "ink", name: "Preto", use: "Todo texto" },
  { color: "paper", name: "Branco", use: "Fundo das páginas" },
];

export default function StyleGuidePage() {
  return (
    <main className="mx-auto max-w-5xl space-y-16 px-5 py-16">
      <Reveal className="flex items-end justify-between gap-6">
        <div>
          <Badge>Página interna</Badge>
          <h1 className="mt-4 text-4xl sm:text-5xl">Guia visual</h1>
          <p className="mt-3 text-xl">Cores, textos e componentes usados no site.</p>
        </div>
        <Professor pose="point-left" size="md" />
      </Reveal>

      <Reveal>
        <h2 className="text-3xl">Cores</h2>
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {swatches.map((swatch) => (
            <li key={swatch.color}>
              <div
                className="h-20 rounded-card border-2 border-ink"
                style={{ backgroundColor: palette[swatch.color] }}
              />
              <p className="mt-2 font-extrabold">{swatch.name}</p>
              <p className="text-base">{swatch.use}</p>
              <p className="text-base">{palette[swatch.color]}</p>
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal>
        <h2 className="text-3xl">Textos</h2>
        <div className="mt-6 space-y-3">
          <p className="text-5xl font-extrabold">Título da página</p>
          <p className="text-3xl font-extrabold">Título de seção</p>
          <p className="text-xl">Texto de abertura, usado logo abaixo dos títulos.</p>
          <p>
            Texto corrido em 18 px, peso forte. Um <a href="#">link sublinhado em roxo</a> dentro do
            texto.
          </p>
        </div>
      </Reveal>

      <Reveal>
        <h2 className="text-3xl">Botões e etiquetas</h2>
        <div className="mt-6 flex flex-wrap gap-4">
          <Button>Ver calendário</Button>
          <Button variant="secondary">Comparar provas</Button>
          <ButtonLink href="/">Voltar ao início</ButtonLink>
          <Button disabled>Indisponível</Button>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Badge>Oficial</Badge>
          <Badge tone="coral">Data mudou</Badge>
          <Badge tone="violet">Análise</Badge>
          <Badge tone="paper">Ainda não divulgado</Badge>
        </div>
      </Reveal>

      <Reveal>
        <h2 className="text-3xl">Cartões</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <Card interactive>
            <Badge>Fuvest</Badge>
            <h3 className="mt-3 text-2xl">1ª fase</h3>
            <p className="mt-2">Cartão em fundo branco. Passe o mouse para ver a animação.</p>
          </Card>
          <Card tone="sun" interactive>
            <h3 className="text-2xl">Fundo amarelo claro</h3>
            <p className="mt-2">Para destacar uma informação importante.</p>
          </Card>
          <Card tone="coral">
            <h3 className="text-2xl">Fundo coral claro</h3>
            <p className="mt-2">Para avisos, como inscrição terminando.</p>
          </Card>
          <Card tone="violet">
            <h3 className="text-2xl">Fundo roxo claro</h3>
            <p className="mt-2">Para análises nossas, separadas do dado oficial.</p>
          </Card>
        </div>
      </Reveal>

      <Reveal>
        <h2 className="text-3xl">Professor</h2>
        <p className="mt-2">
          Moldura tracejada só aparece no seu computador enquanto a imagem não existe.
        </p>
        <div className="mt-6 flex flex-wrap items-end gap-6">
          <Professor pose="point-right" size="sm" />
          <Professor pose="point-left" size="sm" />
          <Professor pose="sitting" size="sm" />
          <Professor pose="angry" size="sm" />
        </div>
      </Reveal>
    </main>
  );
}
