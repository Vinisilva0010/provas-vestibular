import { Badge } from "@/components/ui/badge";
import type { Edition } from "@/lib/data/schemas";
import { formatShortDate } from "@/lib/format";
import { documentKindLabel } from "@/lib/labels";
import { EmptyState } from "./empty-state";
import { SourceNotes } from "./source-notes";

export function DocumentsTab({ edition }: { edition?: Edition }) {
  const documents = edition?.documents ?? [];
  if (documents.length === 0) {
    return <EmptyState text="Os documentos desta edição ainda não foram cadastrados." />;
  }

  return (
    <div>
      <p className="text-xl">Cada link abre o arquivo no site oficial.</p>
      <ul className="mt-6 grid gap-5 md:grid-cols-2">
        {documents.map((document) => (
          <li key={document.url}>
            <a
              href={document.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-full flex-col gap-3 rounded-2xl border-3 border-ink bg-paper p-5 no-underline shadow-card transition-[transform,box-shadow] duration-150 hover:-translate-y-1 hover:shadow-card-hover"
            >
              <span className="flex flex-wrap items-center gap-2">
                <Badge tone="violet">{documentKindLabel[document.kind]}</Badge>
                {document.publishedOn && (
                  <span className="text-base">Publicado em {formatShortDate(document.publishedOn)}</span>
                )}
              </span>
              <span className="text-xl font-extrabold underline decoration-violet decoration-3 underline-offset-4">
                {document.label}
              </span>
            </a>
          </li>
        ))}
      </ul>
      <SourceNotes sources={edition ? [edition] : []} />
    </div>
  );
}
