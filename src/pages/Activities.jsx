import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabaseClient";
import EmptyState from "../components/EmptyState";
import Reveal from "../components/Reveal";
import { colorMap } from "../data/colorMap";

const filters = [
  { key: "all", label: "All" },
  { key: "education", label: "Education" },
  { key: "health", label: "Health" },
  { key: "care", label: "Care" },
];

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function Activities() {
  const [active, setActive] = useState("all");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(false);
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("published", true)
        .order("activity_date", { ascending: false, nullsFirst: false });

      if (cancelled) return;
      if (error) {
        setLoadError(true);
        setLoading(false);
        return;
      }
      setItems(data || []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = items.filter((a) => active === "all" || a.category === active);

  return (
    <div>
      <section className="mx-auto max-w-6xl px-5 md:px-8 pt-14 pb-6">
        <Reveal as="p" className="eyebrow mb-4">
          On the ground
        </Reveal>
        <Reveal as="h1" delay={0.05} className="font-display text-4xl text-pine-dark max-w-2xl leading-tight">
          Activities
        </Reveal>
        <Reveal as="p" delay={0.1} className="mt-4 text-ink/70 max-w-2xl">
          Recent camps, distributions, and events across our education,
          health, and care programs.
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-5 md:px-8 pb-6">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setActive(f.key)}
              aria-pressed={active === f.key}
              className={`rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
                active === f.key
                  ? "bg-pine text-white border-pine"
                  : "border-ink/15 text-ink/60 hover:border-pine/40"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 md:px-8 py-8">
        {loading && <p className="text-sm text-ink/50">Loading activities…</p>}

        {!loading && loadError && (
          <EmptyState
            title="Couldn't load activities"
            description="Please try again in a moment."
          />
        )}

        {!loading && !loadError && filtered.length === 0 && (
          <EmptyState
            title="No activities published yet"
            description="Check back soon, or browse another category above."
          />
        )}

        {!loading && !loadError && filtered.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a, i) => {
              const c = colorMap[a.category] ?? colorMap.pine;
              const dateLabel = formatDate(a.activity_date);
              return (
                <Reveal key={a.id} delay={Math.min(i * 0.06, 0.3)}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="min-w-0 h-full flex flex-col rounded-2xl border border-ink/10 bg-white/60 overflow-hidden"
                  >
                    <div className={`aspect-[16/10] ${c.bgSoft}`}>
                      {a.image_url && (
                        <img
                          src={a.image_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <span className={`self-start rounded-full px-2.5 py-1 text-[11px] font-semibold ${c.bgSoft} ${c.text}`}>
                        {filters.find((f) => f.key === a.category)?.label || a.category}
                      </span>
                      <h3 className="mt-3 font-display text-lg text-pine-dark leading-snug">
                        {a.title}
                      </h3>
                      {a.description && (
                        <p className="mt-2 text-sm text-ink/60 leading-relaxed line-clamp-3">
                          {a.description}
                        </p>
                      )}
                      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/45">
                        {dateLabel && <span>{dateLabel}</span>}
                        {a.location && <span>{a.location}</span>}
                      </div>
                    </div>
                  </motion.div>
                </Reveal>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
