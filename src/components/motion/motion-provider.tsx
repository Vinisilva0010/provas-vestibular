"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/** Turns off movement animations for visitors who enabled "reduce motion". */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
