import { useEffect, useState } from "react";
import SectionHeading from "../components/SectionHeading";
import Reveal from "../components/Reveal";
import EmptyState from "../components/EmptyState";
import { supabase } from "../lib/supabaseClient";

function initials(name) {
  return (name || "")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Team() {
  const [executives, setExecutives] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadTeam() {
      setLoading(true);
      setLoadError(false);

      // Public visitors only ever see active=true rows here — RLS also
      // enforces this server-side (see supabase/migrations/0002_rls.sql),
      // this filter just avoids fetching rows we'd never render.
      const [execRes, memberRes] = await Promise.all([
        supabase
          .from("executives")
          .select("*")
          .eq("active", true)
          .order("display_order", { ascending: true }),
        supabase
          .from("members")
          .select("*, branches(name)")
          .eq("active", true)
          .order("name", { ascending: true }),
      ]);

      if (cancelled) return;

      if (execRes.error || memberRes.error) {
        setLoadError(true);
        setLoading(false);
        return;
      }

      setExecutives(execRes.data || []);
      setMembers(memberRes.data || []);
      setLoading(false);
    }

    loadTeam();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <section className="mx-auto max-w-6xl px-5 md:px-8 pt-14 pb-6">
        <Reveal as="p" className="eyebrow mb-4">
          Our people
        </Reveal>
        <Reveal
          as="h1"
          delay={0.05}
          className="font-display text-4xl text-pine-dark max-w-2xl leading-tight"
        >
          The team behind the work
        </Reveal>
      </section>

      {loading && (
        <section className="mx-auto max-w-6xl px-5 md:px-8 py-10">
          <p className="text-sm text-ink/50">Loading team…</p>
        </section>
      )}

      {!loading && loadError && (
        <section className="mx-auto max-w-6xl px-5 md:px-8 py-10">
          <EmptyState
            title="Couldn't load the team"
            description="Please try again in a moment."
          />
        </section>
      )}

      {!loading && !loadError && (
        <>
          <section className="mx-auto max-w-6xl px-5 md:px-8 py-10">
            <Reveal>
              <SectionHeading eyebrow="Leadership" title="Executive members" />
            </Reveal>
            {executives.length === 0 ? (
              <div className="mt-10">
                <EmptyState
                  title="No executives added yet"
                  description="Check back soon to meet the team."
                />
              </div>
            ) : (
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {executives.map((e, i) => (
                  <Reveal
                    key={e.id}
                    delay={i * 0.08}
                    className="min-w-0 rounded-2xl border border-ink/10 bg-white/60 p-6 transition-shadow hover:shadow-lg hover:shadow-ink/5"
                  >
                    <div className="h-14 w-14 rounded-full overflow-hidden bg-pine text-paper grid place-items-center font-display text-lg">
                      {e.photo_url ? (
                        <img src={e.photo_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        initials(e.name)
                      )}
                    </div>
                    <h3 className="mt-4 font-display text-lg text-pine-dark break-words">
                      {e.name}
                    </h3>
                    {e.designation && (
                      <p className="text-sm font-medium text-education-dark">
                        {e.designation}
                      </p>
                    )}
                    {e.biography && (
                      <p className="mt-3 text-sm text-ink/70 leading-relaxed">
                        {e.biography}
                      </p>
                    )}
                  </Reveal>
                ))}
              </div>
            )}
          </section>

          <section className="mx-auto max-w-6xl px-5 md:px-8 py-14">
            <Reveal>
              <SectionHeading eyebrow="On the ground" title="General members" />
            </Reveal>
            {members.length === 0 ? (
              <div className="mt-10">
                <EmptyState
                  title="No members added yet"
                  description="Check back soon to meet the team."
                />
              </div>
            ) : (
              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {members.map((m, i) => (
                  <Reveal
                    key={m.id}
                    delay={i * 0.06}
                    y={16}
                    className="min-w-0 rounded-xl border border-ink/10 bg-white/60 p-5 flex items-center gap-4 transition-shadow hover:shadow-md hover:shadow-ink/5"
                  >
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-health/15 text-health-dark grid place-items-center font-display text-sm">
                      {m.photo_url ? (
                        <img src={m.photo_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        initials(m.name)
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-pine-dark text-sm truncate">{m.name}</p>
                      <p className="text-xs text-ink/60 truncate">
                        {[m.designation, m.branches?.name].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
