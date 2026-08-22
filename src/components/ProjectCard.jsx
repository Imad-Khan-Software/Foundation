import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { colorMap } from "../data/colorMap";

const categoryLabel = {
  education: "Education",
  health: "Health",
  care: "Care",
};

const statusLabel = {
  planned: "Planned",
  active: "Active",
  completed: "Completed",
};

// project: a row from the `projects` table (see
// supabase/migrations/0001_schema.sql), optionally with a `cover_image_url`
// property attached by the caller (the projects table itself has no image
// column — cover photos live in the separate project_images table).
export default function ProjectCard({ project }) {
  const c = colorMap[project.category] ?? colorMap.pine;
  const budget = Number(project.budget || 0);
  const spent = Number(project.amount_spent || 0);
  const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="rounded-2xl border border-ink/10 bg-white/60 overflow-hidden flex flex-col h-full transition-shadow hover:shadow-lg hover:shadow-ink/5"
    >
      {project.cover_image_url && (
        <img
          src={project.cover_image_url}
          alt=""
          className="h-40 w-full object-cover"
        />
      )}

      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-3 gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full text-white ${c.bg}`}>
            {categoryLabel[project.category] || project.category}
          </span>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
              project.status === "active"
                ? "border-pine text-pine-dark"
                : "border-ink/20 text-ink/50"
            }`}
          >
            {statusLabel[project.status] || project.status}
          </span>
        </div>

        <h3 className="font-display text-lg text-pine-dark mb-1.5 break-words">
          {project.title}
        </h3>
        {(project.branches?.name || project.location) && (
          <p className="text-sm text-ink/40 mb-3">
            {project.branches?.name || project.location}
          </p>
        )}
        {project.description && (
          <p className="text-sm text-ink/70 leading-relaxed flex-1">
            {project.description}
          </p>
        )}

        {budget > 0 && (
          <div className="mt-5">
            <div className="h-1.5 w-full rounded-full bg-ink/10 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${c.bg}`}
                initial={{ width: 0 }}
                animate={{ width: isInView ? `${pct}%` : 0 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-ink/60 font-mono">
              <span>Rs. {spent.toLocaleString()} spent</span>
              <span>{pct}% of Rs. {budget.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
