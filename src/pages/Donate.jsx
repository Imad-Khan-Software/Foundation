import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SectionHeading from "../components/SectionHeading";
import Reveal from "../components/Reveal";
import EmptyState from "../components/EmptyState";
import { supabase } from "../lib/supabaseClient";
import { foundation } from "../data/sampleData";

// donation_methods stores structured info as free-text "Label: Value"
// lines in account_details (see src/pages/admin/DonationMethods.jsx for
// why) — this turns those lines back into the same {label, value} rows
// the page already displayed with sample data, so the design underneath
// doesn't need to change at all.
function parseDetailLines(text) {
  if (!text) return [];
  return text
    .split("\n")
    .map((line) => {
      const idx = line.indexOf(":");
      if (idx === -1) return null;
      const label = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      if (!label || !value) return null;
      return { label, value };
    })
    .filter(Boolean);
}

function CopyRow({ label, value }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can fail silently in some browser contexts;
      // the value is still visible on screen for the donor to copy by hand.
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-ink/10 last:border-0">
      <div className="min-w-0">
        <p className="text-xs text-ink/40">{label}</p>
        <p className="text-sm font-medium text-pine-dark font-mono break-words">{value}</p>
      </div>
      <button
        onClick={handleCopy}
        className="text-xs font-semibold text-education-dark border border-education/40 rounded-full px-3.5 py-2 hover:bg-education/10 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all shrink-0"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export default function Donate() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(false);
      const { data, error } = await supabase
        .from("donation_methods")
        .select("*")
        .eq("active", true)
        .order("display_order", { ascending: true });

      if (cancelled) return;
      if (error) {
        setLoadError(true);
        setLoading(false);
        return;
      }
      setMethods(data || []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <section className="mx-auto max-w-6xl px-5 md:px-8 pt-14 pb-6">
        <Reveal as="p" className="eyebrow mb-4">
          Support our work
        </Reveal>
        <Reveal
          as="h1"
          delay={0.05}
          className="font-display text-4xl text-pine-dark max-w-2xl leading-tight"
        >
          Donate
        </Reveal>
        <Reveal as="p" delay={0.1} className="mt-4 text-ink/70 max-w-2xl">
          Choose whichever method is easiest for you. Every verified donation
          is recorded and reflected on our{" "}
          <Link to="/transparency" className="text-education-dark font-medium">
            transparency page
          </Link>
          . Your support helps us continue our work in Education, Health and
          Care.
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-5 md:px-8 py-10">
        {loading && <p className="text-sm text-ink/50">Loading donation methods…</p>}

        {!loading && loadError && (
          <EmptyState
            title="Couldn't load donation methods"
            description="Please try again in a moment, or reach us directly using the contact details below."
          />
        )}

        {!loading && !loadError && methods.length === 0 && (
          <EmptyState
            title="Donation methods coming soon"
            description="We're setting up our donation methods. Please check back shortly, or contact us directly."
          />
        )}

        {!loading && !loadError && methods.length > 0 && (
          <div className="grid gap-6 md:grid-cols-3">
            {methods.map((m, i) => {
              const rows = parseDetailLines(m.account_details);
              return (
                <Reveal
                  key={m.id}
                  delay={i * 0.1}
                  className="min-w-0 rounded-2xl border border-ink/10 bg-white/60 p-6 transition-shadow hover:shadow-lg hover:shadow-ink/5"
                >
                  <h3 className="font-display text-lg text-pine-dark mb-1">
                    {m.method_name}
                  </h3>
                  <div className="mt-3">
                    {rows.map((d) => (
                      <CopyRow key={d.label} label={d.label} value={d.value} />
                    ))}
                  </div>
                  {m.instructions && (
                    <p className="mt-3 text-xs text-ink/50 leading-relaxed">
                      {m.instructions}
                    </p>
                  )}
                </Reveal>
              );
            })}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-5 md:px-8 pb-16">
        <Reveal className="rounded-2xl border border-ink/10 bg-paper-dim p-8">
          <SectionHeading eyebrow="Please note" title="After you donate" />
          <ul className="mt-5 space-y-2 text-sm text-ink/70 list-disc pl-5">
            <li>
              Send your payment reference or receipt to{" "}
              <span className="text-pine-dark font-medium">
                {foundation.whatsapp}
              </span>{" "}
              or {foundation.email} so we can verify it.
            </li>
            <li>
              Only verified donations are included in our public totals — this
              protects both donors and the accuracy of our reports.
            </li>
            <li>
              Online card payments aren't available yet; the methods above are
              currently the only ways to donate.
            </li>
          </ul>
        </Reveal>
      </section>
    </div>
  );
}
