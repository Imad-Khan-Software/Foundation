import { motion } from "framer-motion";
import { colorMap } from "../data/colorMap";

export default function PillarCard({ label, summary, stat, color }) {
  const c = colorMap[color] ?? colorMap.pine;
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="group rounded-2xl border border-ink/10 bg-white/60 p-6 h-full transition-shadow hover:shadow-lg hover:shadow-ink/5"
    >
      <span
        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold text-white ${c.bg}`}
      >
        {label}
      </span>
      <p className="mt-4 text-ink/75 leading-relaxed">{summary}</p>
      <div className="mt-5 flex items-center justify-between">
        <p className={`font-mono text-sm ${c.text}`}>{stat}</p>
        <span
          className={`inline-block transition-transform duration-200 group-hover:translate-x-1 ${c.text}`}
          aria-hidden="true"
        >
          →
        </span>
      </div>
    </motion.div>
  );
}
