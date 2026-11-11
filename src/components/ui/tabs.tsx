"use client";

import { motion } from "motion/react";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type TabItem = { id: string; label: string; content: ReactNode };

type TabsProps = {
  items: TabItem[];
  /** Accessible name of the tab list, read by screen readers. */
  label: string;
  defaultTabId?: string;
};

/**
 * Accessible tabs (WAI-ARIA tabs pattern with automatic activation).
 * Every panel stays in the HTML so search engines can read all content.
 */
export function Tabs({ items, label, defaultTabId }: TabsProps) {
  const baseId = useId();
  const [activeId, setActiveId] = useState(defaultTabId ?? items[0]?.id);
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());

  function activateAt(index: number) {
    const item = items.at((index + items.length) % items.length);
    if (!item) return;
    setActiveId(item.id);
    tabRefs.current.get(item.id)?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: items.length - 1,
    };
    const target = moves[event.key];
    if (target === undefined) return;
    event.preventDefault();
    activateAt(target);
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label={label}
        className="flex gap-2 overflow-x-auto border-b-2 border-ink"
      >
        {items.map((item, index) => {
          const selected = item.id === activeId;
          return (
            <button
              key={item.id}
              ref={(element) => {
                if (element) tabRefs.current.set(item.id, element);
                else tabRefs.current.delete(item.id);
              }}
              id={`${baseId}-tab-${item.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveId(item.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                "relative shrink-0 rounded-t-card px-4 py-3 text-lg font-extrabold text-ink",
                "transition-colors duration-150",
                selected ? "bg-sun-soft" : "hover:bg-violet-soft",
              )}
            >
              {item.label}
              {selected && (
                <motion.span
                  layoutId={`${baseId}-indicator`}
                  className="absolute inset-x-0 -bottom-[2px] h-1 bg-violet"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {items.map((item) => {
        const selected = item.id === activeId;
        return (
          <div
            key={item.id}
            id={`${baseId}-panel-${item.id}`}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-${item.id}`}
            hidden={!selected}
            tabIndex={0}
            className="pt-6"
          >
            {selected ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {item.content}
              </motion.div>
            ) : (
              item.content
            )}
          </div>
        );
      })}
    </div>
  );
}
