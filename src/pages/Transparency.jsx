import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import SectionHeading from "../components/SectionHeading";
import Reveal from "../components/Reveal";
import AnimatedCounter from "../components/AnimatedCounter";
import EmptyState from "../components/EmptyState";
import { colorMap } from "../data/colorMap";
import { supabase } from "../lib/supabaseClient";
import { useFinancialSummary } from "../hooks/useFinancialSummary";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function Transparency() {
  const { summary, loading, loadError } = useFinancialSummary();

  // Published monthly/annual reports, added via Admin → Financial Reports
  // (see src/pages/admin/FinancialReports.jsx). Replaces the old hardcoded
  // "Coming soon" placeholder list.
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadReports() {
      setReportsLoading(true);
      setReportsError(false);
      const { data, error } = await supabase
        .from("financial_reports")
        .select("*")
        .eq("published", true)
        .order("year", { ascending: false })
        .order("month", { ascending: false, nullsFirst: false });

      if (cancelled) return;
      if (error) {
        setReportsError(true);
        setReportsLoading(false);
        return;
      }
      setReports(data || []);
      setReportsLoading(false);
    }

    loadReports();
    return () => {
      cancelled = true;
    };
  }, []);

  const remaining = summary.total_donations - summary.total_expenses;
  const categories = [
    { label: "Education", amount: summary.education_spending, color: "education" },
    { label: "Health", amount: summary.health_spending, color: "health" },
    { label: "Care", amount: summary.care_spending, color: "care" },
    { label: "Administration", amount: summary.administration_spending, color: "pine" },
    { label: "Other", amount: summary.other_spending, color: "pine" },
  ];
  const maxCategory = Math.max(...categories.map((c) => c.amount), 0);

  return (
    <div>
      <section className="mx-auto max-w-6xl px-5 md:px-8 pt-14 pb-6">
        <Reveal as="p" className="eyebrow mb-4">
          Accountability
        </Reveal>
        <Reveal
          as="h1"
          delay={0.05}
          className="font-display text-4xl text-pine-dark max-w-2xl leading-tight"
        >
          Financial transparency
        </Reveal>
        <Reveal
          as="p"
          delay={0.1}
          className="mt-4 text-ink/70 max-w-2xl"
        >
          These figures reflect only verified donations and verified
          expenses, calculated directly from our records — nothing here is
          set by hand.
        </Reveal>
      </section>

      {loading && (
        <section className="mx-auto max-w-6xl px-5 md:px-8 py-10">
          <p className="text-sm text-ink/50">Loading financial data…</p>
        </section>
      )}

      {!loading && loadError && (
        <section className="mx-auto max-w-6xl px-5 md:px-8 py-10">
          <EmptyState
            title="Couldn't load financial data"
            description="Please try again in a moment."
          />
        </section>
      )}

      {!loading && !loadError && (
        <>
          {/* Flow: donations -> spent -> remaining */}
          <section className="mx-auto max-w-6xl px-5 md:px-8 py-10">
            <Reveal>
              <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr_auto_1fr] items-center">
                <div className="rounded-2xl border border-ink/10 bg-white/60 p-7">
                  <p className="eyebrow">Total verified donations</p>
                  <p className="mt-2 font-display text-3xl text-pine-dark">
                    <AnimatedCounter value={summary.total_donations} prefix="Rs. " />
                  </p>
                </div>
                <span className="hidden sm:block text-ink/25 text-2xl justify-self-center rotate-90 sm:rotate-0" aria-hidden="true">
                  →
                </span>
                <div className="rounded-2xl border border-ink/10 bg-white/60 p-7">
                  <p className="eyebrow">Total verified expenses</p>
                  <p className="mt-2 font-display text-3xl text-pine-dark">
                    <AnimatedCounter value={summary.total_expenses} prefix="Rs. " />
                  </p>
                </div>
                <span className="hidden sm:block text-ink/25 text-2xl justify-self-center rotate-90 sm:rotate-0" aria-hidden="true">
                  →
                </span>
                <div className="rounded-2xl border border-education bg-education/10 p-7">
                  <p className="eyebrow">Remaining balance</p>
                  <p className="mt-2 font-display text-3xl text-pine-dark">
                    <AnimatedCounter value={remaining} prefix="Rs. " />
                  </p>
                </div>
              </div>
            </Reveal>
          </section>

          <section className="mx-auto max-w-6xl px-5 md:px-8 py-10">
            <Reveal>
              <SectionHeading eyebrow="Breakdown" title="Spending by category" />
            </Reveal>

            {summary.total_expenses === 0 ? (
              <Reveal delay={0.1} className="mt-8">
                <EmptyState
                  title="No verified expenses yet"
                  description="Once expenses are recorded and verified, the breakdown by category will appear here."
                />
              </Reveal>
            ) : (
              <Reveal delay={0.1} className="mt-8 space-y-5">
                {categories
                  .filter((c) => c.amount > 0)
                  .map((c, i) => {
                    const cc = colorMap[c.color] ?? colorMap.pine;
                    const pct = maxCategory > 0 ? Math.round((c.amount / maxCategory) * 100) : 0;
                    return (
                      <div key={c.label}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-medium text-pine-dark">
                            {c.label}
                          </span>
                          <span className="font-mono text-ink/60">
                            Rs. {c.amount.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-2.5 rounded-full bg-ink/10 overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${cc.bg}`}
                            initial={{ width: 0 }}
                            whileInView={{ width: `${pct}%` }}
                            viewport={{ once: true, margin: "-60px" }}
                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </Reveal>
            )}
          </section>
        </>
      )}

      <section className="mx-auto max-w-6xl px-5 md:px-8 py-14">
        <Reveal>
          <SectionHeading eyebrow="Reports" title="Financial reports" />
        </Reveal>
        {reportsLoading && (
          <p className="mt-8 text-sm text-ink/50">Loading reports…</p>
        )}

        {!reportsLoading && reportsError && (
          <Reveal delay={0.1} className="mt-8">
            <EmptyState
              title="Couldn't load reports"
              description="Please try again in a moment."
            />
          </Reveal>
        )}

        {!reportsLoading && !reportsError && reports.length === 0 && (
          <Reveal delay={0.1} className="mt-8">
            <EmptyState
              title="No reports published yet"
              description="Monthly financial reports will appear here as they're published."
            />
          </Reveal>
        )}

        {!reportsLoading && !reportsError && reports.length > 0 && (
          <Reveal
            delay={0.1}
            className="mt-8 divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-white/60"
          >
            {reports.map((r) => (
              <div key={r.id} className="px-6 py-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-pine-dark">
                    {r.report_title}
                  </p>
                  <span className="text-xs text-ink/40">
                    {r.month ? `${monthNames[r.month - 1]} ` : ""}{r.year}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink/60">
                  Rs. {Number(r.total_donations).toLocaleString()} received · Rs.{" "}
                  {Number(r.total_expenses).toLocaleString()} spent
                  {r.education_spending > 0 && ` · Education Rs. ${Number(r.education_spending).toLocaleString()}`}
                  {r.health_spending > 0 && ` · Health Rs. ${Number(r.health_spending).toLocaleString()}`}
                  {r.care_spending > 0 && ` · Care Rs. ${Number(r.care_spending).toLocaleString()}`}
                </p>
                {r.description && (
                  <p className="mt-1.5 text-xs text-ink/50 leading-relaxed">{r.description}</p>
                )}
              </div>
            ))}
          </Reveal>
        )}
      </section>
    </div>
  );
}
