import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { MotionGlobalConfig } from "motion/react";
import { afterEach } from "vitest";

// Without Vitest globals, Testing Library does not clean the DOM on its own.
afterEach(() => {
  cleanup();
});

// Animations make DOM assertions depend on timing; tests check behavior, not motion.
MotionGlobalConfig.skipAnimations = true;

// jsdom has no IntersectionObserver; Motion's whileInView needs one to exist.
class IntersectionObserverStub {
  readonly root = null;
  readonly rootMargin = "0px";
  readonly thresholds = [0];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

globalThis.IntersectionObserver ??=
  IntersectionObserverStub as unknown as typeof IntersectionObserver;
