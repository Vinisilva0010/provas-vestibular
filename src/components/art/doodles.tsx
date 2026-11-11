import type { ReactNode } from "react";

export type DoodleProps = { className?: string };

function Doodle({
  className,
  viewBox,
  children,
}: {
  className?: string;
  viewBox: string;
  children: ReactNode;
}) {
  return (
    <svg
      viewBox={viewBox}
      className={className}
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="var(--color-ink)"
      strokeWidth={4}
      strokeLinecap="round"
      strokeLinejoin="round"
      overflow="visible"
    >
      {children}
    </svg>
  );
}

export function Star({ className }: DoodleProps) {
  return (
    <Doodle className={className} viewBox="0 0 100 100">
      <path
        d="M50 4 C54 36 64 46 96 50 C64 54 54 64 50 96 C46 64 36 54 4 50 C36 46 46 36 50 4 Z"
        fill="var(--color-sun)"
      />
    </Doodle>
  );
}

export function Pencil({ className }: DoodleProps) {
  return (
    <Doodle className={className} viewBox="0 0 200 56">
      <path d="M44 10 H160 V46 H44 Z" fill="var(--color-sun)" />
      <path d="M160 10 H174 V46 H160 Z" fill="var(--color-paper)" />
      <path
        d="M174 10 H188 a6 6 0 0 1 6 6 V40 a6 6 0 0 1 -6 6 H174 Z"
        fill="var(--color-coral)"
      />
      <path d="M44 10 L6 28 L44 46 Z" fill="var(--color-paper)" />
      <path d="M18 22 L6 28 L18 34 Z" fill="var(--color-ink)" />
      <path d="M44 22 H160 M44 34 H160" strokeWidth={2.5} />
    </Doodle>
  );
}

export function Arrow({ className }: DoodleProps) {
  return (
    <Doodle className={className} viewBox="0 0 180 90">
      <path d="M8 74 C 50 10, 120 6, 166 40" />
      <path d="M140 22 L168 42 L136 54" />
    </Doodle>
  );
}

const calendarCells = [
  { x: 24, y: 58 },
  { x: 52, y: 58 },
  { x: 80, y: 58 },
  { x: 24, y: 84 },
  { x: 52, y: 84 },
  { x: 80, y: 84 },
];

export function Calendar({ className }: DoodleProps) {
  return (
    <Doodle className={className} viewBox="0 0 120 120">
      <rect x="8" y="18" width="104" height="94" rx="12" fill="var(--color-paper)" />
      <path
        d="M8 46 V30 a12 12 0 0 1 12 -12 H100 a12 12 0 0 1 12 12 V46 Z"
        fill="var(--color-coral)"
      />
      <rect x="30" y="6" width="10" height="24" rx="5" fill="var(--color-ink)" />
      <rect x="80" y="6" width="10" height="24" rx="5" fill="var(--color-ink)" />
      {calendarCells.map((cell, index) => (
        <rect
          key={`${cell.x}-${cell.y}`}
          x={cell.x}
          y={cell.y}
          width="16"
          height="16"
          rx="3"
          strokeWidth={2.5}
          fill={index === calendarCells.length - 1 ? "var(--color-sun)" : "var(--color-violet-soft)"}
        />
      ))}
    </Doodle>
  );
}

export function Book({ className }: DoodleProps) {
  return (
    <Doodle className={className} viewBox="0 0 200 120">
      <path
        d="M100 26 C 72 12, 36 12, 10 22 V108 C 36 98, 72 98, 100 112 Z"
        fill="var(--color-violet-soft)"
      />
      <path
        d="M100 26 C 128 12, 164 12, 190 22 V108 C 164 98, 128 98, 100 112 Z"
        fill="var(--color-paper)"
      />
      <path
        d="M28 44 C 48 38, 68 38, 84 44 M28 62 C 48 56, 68 56, 84 62 M116 44 C 132 38, 152 38, 172 44 M116 62 C 132 56, 152 56, 172 62 M116 80 C 132 74, 148 74, 160 78"
        strokeWidth={3}
      />
    </Doodle>
  );
}
