"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Star } from "@/components/art/doodles";
import { Professor } from "@/components/professor/professor";
import { cn } from "@/lib/cn";
import { mainNavigation, siteName } from "@/lib/site";

const circleFromMenuButton = "circle(0% at 92% 4%)";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const pathname = usePathname();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (!open) {
      if (wasOpen.current) {
        wasOpen.current = false;
        toggleRef.current?.focus();
      }
      return;
    }

    wasOpen.current = true;
    closeRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-2xl border-3 border-ink bg-paper py-2 pr-2 pl-3 shadow-card sm:pl-4">
        <Link href="/" className="group flex min-w-0 items-center gap-3 no-underline">
          <span
            aria-hidden="true"
            className="grid size-12 shrink-0 -rotate-6 place-items-center rounded-xl border-3 border-ink bg-sun transition-transform duration-300 group-hover:rotate-12"
          >
            <Star className="size-7" />
          </span>
          <span className="display-type text-lg leading-none sm:text-2xl">{siteName}</span>
        </Link>

        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {mainNavigation.map((item) => {
              const current = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "block rounded-xl border-3 px-4 py-2 text-lg font-extrabold no-underline",
                      "transition-[transform,background-color,border-color] duration-150",
                      current
                        ? "border-ink bg-coral shadow-[3px_3px_0_0_var(--color-ink)]"
                        : "border-transparent hover:-translate-y-0.5 hover:border-ink hover:bg-sun-soft",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <button
          ref={toggleRef}
          type="button"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen(true)}
          className="flex shrink-0 items-center gap-2 rounded-xl border-3 border-ink bg-sun px-4 py-2 text-lg font-extrabold text-ink shadow-[3px_3px_0_0_var(--color-ink)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none lg:hidden"
        >
          <span aria-hidden="true" className="flex flex-col gap-1">
            <span className="block h-[3px] w-5 rounded bg-ink" />
            <span className="block h-[3px] w-5 rounded bg-ink" />
            <span className="block h-[3px] w-3 rounded bg-ink" />
          </span>
          Menu
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile-menu"
            id={menuId}
            role="dialog"
            aria-modal="true"
            aria-label="Menu do site"
            initial={{ clipPath: circleFromMenuButton }}
            animate={{ clipPath: "circle(150% at 92% 4%)" }}
            exit={{ clipPath: circleFromMenuButton }}
            transition={{ duration: 0.45, ease: [0.65, 0, 0.35, 1] }}
            className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-sun px-5 pt-5 pb-8 lg:hidden"
          >
            <div className="flex justify-end">
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border-3 border-ink bg-paper px-4 py-2 text-lg font-extrabold shadow-[3px_3px_0_0_var(--color-ink)]"
              >
                Fechar
              </button>
            </div>

            <nav aria-label="Principal no celular" className="mt-8">
              <ul className="space-y-3">
                {mainNavigation.map((item, index) => (
                  <motion.li
                    key={item.href}
                    initial={{ opacity: 0, x: -48 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + index * 0.06, duration: 0.3, ease: "easeOut" }}
                  >
                    <Link
                      href={item.href}
                      aria-current={pathname === item.href ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className="display-type block text-6xl leading-[0.95] no-underline"
                    >
                      {item.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </nav>

            <div className="mt-auto flex justify-end pt-8">
              <Professor pose="point-left" size="lg" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
