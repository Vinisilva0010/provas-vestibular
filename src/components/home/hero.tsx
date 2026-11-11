"use client";

import { motion } from "motion/react";
import { Arrow, Book, Pencil, Star } from "@/components/art/doodles";
import { Professor } from "@/components/professor/professor";
import { ButtonLink } from "@/components/ui/button";

const headlineLines = ["Todas as provas", "para entrar na", "faculdade"];
const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  return (
    <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pt-10 pb-16 lg:grid-cols-[1.2fr_1fr] lg:gap-4 lg:pt-16">
      <div className="relative z-10">
        <motion.p
          initial={{ opacity: 0, y: -28, rotate: -14 }}
          animate={{ opacity: 1, y: 0, rotate: -3 }}
          transition={{ type: "spring", stiffness: 260, damping: 15 }}
          className="inline-block rounded-xl border-3 border-ink bg-coral px-4 py-1.5 text-lg font-extrabold shadow-[4px_4px_0_0_var(--color-ink)]"
        >
          ENEM, vestibulares e provas militares
        </motion.p>

        <h1 className="display-type mt-6 text-[clamp(3.25rem,10vw,8rem)] leading-[0.86]">
          {headlineLines.map((line, index) => (
            <span key={line} className="block overflow-hidden pb-1">
              <motion.span
                className="block"
                initial={{ y: "105%" }}
                animate={{ y: "0%" }}
                transition={{ delay: 0.15 + index * 0.1, duration: 0.65, ease }}
              >
                {index < headlineLines.length - 1 ? `${line} ` : line}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5, ease }}
          className="mt-6 max-w-xl text-xl sm:text-2xl"
        >
          Datas, regras, o que estudar e o material oficial de cada prova, sempre com o link da
          fonte.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5, ease }}
          className="mt-8 flex flex-wrap gap-4"
        >
          <ButtonLink href="/provas">Ver as provas</ButtonLink>
          <ButtonLink href="/calendario" variant="secondary">
            Abrir o calendário
          </ButtonLink>
        </motion.div>
      </div>

      <div className="relative mx-auto flex w-full max-w-sm items-end justify-center pt-6 sm:max-w-md lg:max-w-none">
        <motion.div
          aria-hidden="true"
          initial={{ scale: 0.5, opacity: 0, rotate: -25 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ delay: 0.25, type: "spring", stiffness: 120, damping: 13 }}
          className="absolute bottom-0 left-1/2 aspect-square w-[88%] -translate-x-1/2 rounded-full border-4 border-ink bg-sun shadow-[10px_10px_0_0_var(--color-ink)]"
        />

        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45, type: "spring", stiffness: 140, damping: 14 }}
          className="relative z-10"
        >
          <Professor pose="point-left" size="xl" />
        </motion.div>

        <Star className="absolute top-0 left-2 size-12 animate-[spin_14s_linear_infinite] sm:size-16" />
        <Book className="absolute top-10 -right-2 w-24 rotate-12 sm:w-32" />
        <Pencil className="absolute -bottom-4 -left-6 w-36 -rotate-[18deg] sm:w-48" />
        <Arrow className="absolute top-1/3 -left-24 hidden w-32 -scale-x-100 rotate-12 lg:block" />
      </div>
    </section>
  );
}
