const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Scrolls the window to the top instantly for users who prefer reduced motion,
 * and smoothly for everyone else. Keeps navigation destinations unchanged.
 */
export const scrollToTop = (): void => {
  window.scrollTo({
    top: 0,
    behavior: prefersReducedMotion() ? 'instant' : 'smooth',
  });
};
