import { motion } from "framer-motion";
import { Link } from "react-router-dom";

// A React Router Link that's also a Motion component, so buttons/links
// across the site can share one small lift-on-hover, press-on-tap feel
// instead of every page re-declaring the same whileHover/whileTap props.
export const MotionLink = motion.create(Link);

export const liftHover = {
  whileHover: { y: -2 },
  whileTap: { y: 0, scale: 0.98 },
  transition: { duration: 0.15, ease: "easeOut" },
};
