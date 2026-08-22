import { motion } from "framer-motion";
import { MotionLink, liftHover } from "../components/MotionLink";

export default function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-6xl px-5 md:px-8 py-24 text-center"
    >
      <p className="eyebrow mb-3">404</p>
      <h1 className="font-display text-3xl text-pine-dark">
        This page doesn't exist
      </h1>
      <p className="mt-3 text-ink/60">
        The page you're looking for may have moved or been removed.
      </p>
      <MotionLink
        to="/"
        {...liftHover}
        className="mt-8 inline-flex items-center rounded-full bg-pine px-6 py-3 text-sm font-semibold text-white hover:bg-pine-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-education focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        Back to home
      </MotionLink>
    </motion.div>
  );
}
