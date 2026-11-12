import { Professor } from "@/components/professor/professor";

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
      <Professor pose="sitting" size="md" />
      <p className="text-xl font-extrabold">{text}</p>
    </div>
  );
}
