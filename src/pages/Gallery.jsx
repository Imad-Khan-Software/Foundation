import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import EmptyState from "../components/EmptyState";
import Reveal from "../components/Reveal";
import { staggerContainer, fadeUp, EASE } from "../lib/motionVariants";
import { colorMap } from "../data/colorMap";
import { supabase } from "../lib/supabaseClient";

const filters = [
  { key: "all", label: "All" },
  { key: "education", label: "Education" },
  { key: "health", label: "Health" },
  { key: "care", label: "Care" },
  { key: "general", label: "General" },
];

export default function Gallery() {
  const [active, setActive] = useState("all");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [lightboxItem, setLightboxItem] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(false);
      const { data, error } = await supabase
        .from("gallery")
        .select("*")
        .eq("active", true)
        .order("display_order", { ascending: true });

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

  // Close the lightbox on Escape, same convention used by the admin
  // Modal/ConfirmDialog and the public mobile nav.
  useEffect(() => {
    if (!lightboxItem) return;
    document.body.style.overflow = "hidden";
    function handleKey(e) {
      if (e.key === "Escape") setLightboxItem(null);
    }
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [lightboxItem]);

  const filtered = items.filter(
    (g) => active === "all" || g.category === active
  );

  return (
    <div>
      <section className="mx-auto max-w-6xl px-5 md:px-8 pt-14 pb-6">
        <Reveal as="p" className="eyebrow mb-4">
          In the field
        </Reveal>
        <Reveal as="h1" delay={0.05} className="font-display text-4xl text-pine-dark max-w-2xl leading-tight">
          Gallery
        </Reveal>
        <Reveal as="p" delay={0.1} className="mt-4 text-ink/70 max-w-2xl">
          A look at our camps, distributions, and events.
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
        {loading && <p className="text-sm text-ink/50">Loading gallery…</p>}

        {!loading && loadError && (
          <EmptyState
            title="Couldn't load the gallery"
            description="Please try again in a moment."
          />
        )}

        {!loading && !loadError && filtered.length === 0 && (
          <EmptyState
            title="No gallery images available yet"
            description="Check back soon, or browse another category above."
          />
        )}

        {!loading && !loadError && filtered.length > 0 && (
          <motion.div
            key={active}
            initial="hidden"
            animate="visible"
            variants={staggerContainer(0.06)}
            className="grid grid-cols-2 sm:grid-cols-3 gap-4"
          >
            {filtered.map((g) => {
              const c = colorMap[g.category] ?? colorMap.pine;
              return (
                <motion.button
                  key={g.id}
                  type="button"
                  onClick={() => setLightboxItem(g)}
                  variants={fadeUp}
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className={`group relative aspect-[4/3] rounded-xl border border-ink/10 overflow-hidden flex items-end p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-education focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${c.bgSoft}`}
                >
                  {g.image_url && (
                    <img
                      src={g.image_url}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-pine-dark/0 opacity-0 group-hover:opacity-100 group-hover:bg-pine-dark/35 transition-all duration-300" />
                  {(g.title || g.caption) && (
                    <p className="relative text-xs font-medium text-white opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                      {g.title || g.caption}
                    </p>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </section>

      <AnimatePresence>
        {lightboxItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-4 py-8"
            onClick={() => setLightboxItem(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl min-w-0"
            >
              {lightboxItem.image_url && (
                <img
                  src={lightboxItem.image_url}
                  alt=""
                  className="w-full max-h-[70vh] object-contain rounded-xl"
                />
              )}
              {(lightboxItem.title || lightboxItem.caption) && (
                <div className="mt-3 text-paper">
                  {lightboxItem.title && (
                    <p className="font-display text-lg">{lightboxItem.title}</p>
                  )}
                  {lightboxItem.caption && (
                    <p className="mt-1 text-sm text-paper/70">{lightboxItem.caption}</p>
                  )}
                </div>
              )}
              <button
                onClick={() => setLightboxItem(null)}
                aria-label="Close"
                className="mt-4 rounded-full border border-paper/30 px-4 py-2 text-sm text-paper hover:bg-paper/10 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
