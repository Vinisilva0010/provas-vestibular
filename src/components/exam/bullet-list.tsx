import { Star } from "@/components/art/doodles";

export function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-lg">
          <Star className="mt-1 size-5 shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
