import { useEffect, useState } from "react";
import SectionHeading from "../components/SectionHeading";
import Reveal from "../components/Reveal";
import EmptyState from "../components/EmptyState";
import { supabase } from "../lib/supabaseClient";

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadBranches() {
      setLoading(true);
      setLoadError(false);

      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .eq("active", true)
        .order("name", { ascending: true });

      if (cancelled) return;

      if (error) {
        setLoadError(true);
        setLoading(false);
        return;
      }
      setBranches(data || []);
      setLoading(false);
    }

    loadBranches();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <section className="mx-auto max-w-6xl px-5 md:px-8 pt-14 pb-6">
        <Reveal as="p" className="eyebrow mb-4">
          Where we work
        </Reveal>
        <Reveal
          as="h1"
          delay={0.05}
          className="font-display text-4xl text-pine-dark max-w-2xl leading-tight"
        >
          Our branches
        </Reveal>
        <Reveal as="p" delay={0.1} className="mt-4 text-ink/70 max-w-2xl">
          Each branch coordinates local projects and reports back to the
          head office.
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-5 md:px-8 py-10">
        <Reveal>
          <SectionHeading eyebrow="Branch directory" title="Our locations" />
        </Reveal>

        {loading && <p className="mt-10 text-sm text-ink/50">Loading branches…</p>}

        {!loading && loadError && (
          <div className="mt-10">
            <EmptyState
              title="Couldn't load branches"
              description="Please try again in a moment."
            />
          </div>
        )}

        {!loading && !loadError && branches.length === 0 && (
          <div className="mt-10">
            <EmptyState
              title="No branches added yet"
              description="Check back soon for our branch locations."
            />
          </div>
        )}

        {!loading && !loadError && branches.length > 0 && (
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {branches.map((b, i) => (
              <Reveal
                key={b.id}
                delay={i * 0.1}
                className="min-w-0 rounded-2xl border border-ink/10 bg-white/60 overflow-hidden transition-shadow hover:shadow-lg hover:shadow-ink/5"
              >
                {b.image_url && (
                  <img
                    src={b.image_url}
                    alt=""
                    className="h-40 w-full object-cover"
                  />
                )}
                <div className="p-7">
                  <span className="font-mono text-xs text-ink/40">
                    Branch {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-2 font-display text-xl text-pine-dark break-words">
                    {b.name}
                  </h3>
                  {b.description && (
                    <p className="mt-2 text-sm text-ink/70 leading-relaxed">
                      {b.description}
                    </p>
                  )}
                  <dl className="mt-5 space-y-2 text-sm text-ink/70">
                    {b.location && (
                      <div className="flex gap-2">
                        <dt className="text-ink/40 w-20 shrink-0">Location</dt>
                        <dd className="min-w-0 break-words">{b.location}</dd>
                      </div>
                    )}
                    {b.contact_phone && (
                      <div className="flex gap-2">
                        <dt className="text-ink/40 w-20 shrink-0">Phone</dt>
                        <dd className="min-w-0 break-words">{b.contact_phone}</dd>
                      </div>
                    )}
                    {b.contact_email && (
                      <div className="flex gap-2">
                        <dt className="text-ink/40 w-20 shrink-0">Email</dt>
                        <dd className="min-w-0 break-all">{b.contact_email}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
