// Shared animation variants. Keeping these in one place means every
// scroll-reveal and stagger animation on the site moves the same way,
// instead of each page inventing its own timing/easing.
//
// Reduced motion is handled globally via <MotionConfig reducedMotion="user">
// in main.jsx — framer-motion automatically strips movement (keeping only
// opacity) for anyone with the OS "reduce motion" setting on, so components
// using these variants don't need their own reduced-motion checks.

export const EASE = [0.16, 1, 0.3, 1];

export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE },
  },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, ease: EASE },
  },
};

// Wrap a group of fadeUp children in a container using this variant to get
// a staggered entrance instead of everything animating at once.
export function staggerContainer(stagger = 0.1, delayChildren = 0) {
  return {
    hidden: {},
    visible: {
      transition: { staggerChildren: stagger, delayChildren },
    },
  };
}
