"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Opens content from top to bottom like a curtain, once.
 * The final inset is negative so hard shadows and tilted cards are not clipped.
 */
export function CurtainReveal({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ clipPath: "inset(-10% -10% 110% -10%)" }}
      whileInView={{ clipPath: "inset(-10% -10% -10% -10%)" }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.8, ease: [0.65, 0, 0.35, 1] }}
    >
      {children}
    </motion.div>
  );
}
