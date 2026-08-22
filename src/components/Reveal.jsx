import { motion } from "framer-motion";

// Shared scroll/mount entrance animation. Used instead of repeating the same
// framer-motion props on every section — one place to tune easing/duration.
// `delay` lets a group of siblings stagger (delay={i * 0.08}).
// MotionConfig's reducedMotion="user" (set in main.jsx) automatically
// disables the transform/translate part of this for reduced-motion users.
export default function Reveal({
  children,
  as = "div",
  delay = 0,
  y = 24,
  duration = 0.6,
  once = true,
  className = "",
}) {
  const MotionTag = motion[as] ?? motion.div;

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-80px" }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  );
}
