import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

// Counts up from 0 to `value` once it scrolls into view. Reduced-motion
// users get the final number immediately instead of a rolling count.
export default function AnimatedCounter({
  value,
  prefix = "",
  duration = 1.4,
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(shouldReduceMotion ? value : 0);

  useEffect(() => {
    if (!isInView) return;

    if (shouldReduceMotion) {
      setDisplay(value);
      return;
    }

    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });

    return () => controls.stop();
  }, [isInView, value, shouldReduceMotion, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {display.toLocaleString()}
    </span>
  );
}
