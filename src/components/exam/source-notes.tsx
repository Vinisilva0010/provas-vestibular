import { Badge } from "@/components/ui/badge";
import { formatShortDate } from "@/lib/format";

type Source = {
  sourceName: string;
  sourceUrl: string;
  checkedAt: string;
  nature: "official" | "analysis";
};

/** Where the information on this tab came from, one line per distinct source. */
export function SourceNotes({ sources }: { sources: Source[] }) {
  const unique = sources.filter(
    (source, index) => sources.findIndex((other) => other.sourceUrl === source.sourceUrl) === index,
  );
  if (unique.length === 0) return null;

  return (
    <div className="mt-12 space-y-3 border-t-2 border-dashed border-ink pt-5">
      {unique.map((source) => (
        <p key={source.sourceUrl} className="flex flex-wrap items-center gap-x-3 gap-y-2 text-base">
          {source.nature === "official" ? <Badge>Informação oficial</Badge> : <Badge tone="violet">Análise nossa</Badge>}
          <span>
            Fonte:{" "}
            <a href={source.sourceUrl} target="_blank" rel="noopener noreferrer">
              {source.sourceName}
            </a>
            . Conferido em {formatShortDate(source.checkedAt)}.
          </span>
        </p>
      ))}
    </div>
  );
}
