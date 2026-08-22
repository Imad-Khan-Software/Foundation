import { motion } from "framer-motion";
import SectionHeading from "../components/SectionHeading";
import Reveal from "../components/Reveal";
import AnimatedCounter from "../components/AnimatedCounter";
import { colorMap } from "../data/colorMap";
import { transparency } from "../data/sampleData";

export default function Transparency() {
  const remaining = transparency.totalDonations - transparency.totalExpenses;
  const maxCategory = Math.max(...transparency.categories.map((c) => c.amount));

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
          expenses. Once Supabase is connected, they will be calculated
          directly from the database rather than set by hand.
        </Reveal>
      </section>

      {/* Flow: donations -> spent -> remaining */}
      <section className="mx-auto max-w-6xl px-5 md:px-8 py-10">
        <Reveal>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr_auto_1fr] items-center">
            <div className="rounded-2xl border border-ink/10 bg-white/60 p-7">
              <p className="eyebrow">Total verified donations</p>
              <p className="mt-2 font-display text-3xl text-pine-dark">
                <AnimatedCounter value={transparency.totalDonations} prefix="Rs. " />
              </p>
            </div>
            <span className="hidden sm:block text-ink/25 text-2xl justify-self-center" aria-hidden="true">
              →
            </span>
            <div className="rounded-2xl border border-ink/10 bg-white/60 p-7">
              <p className="eyebrow">Total verified expenses</p>
              <p className="mt-2 font-display text-3xl text-pine-dark">
                <AnimatedCounter value={transparency.totalExpenses} prefix="Rs. " />
              </p>
            </div>
            <span className="hidden sm:block text-ink/25 text-2xl justify-self-center" aria-hidden="true">
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
        <Reveal delay={0.1} className="mt-8 space-y-5">
          {transparency.categories.map((c, i) => {
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
      </section>

      <section className="mx-auto max-w-6xl px-5 md:px-8 py-14">
        <Reveal>
          <SectionHeading eyebrow="Reports" title="Financial reports" />
        </Reveal>
        <Reveal
          delay={0.1}
          className="mt-8 divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-white/60"
        >
          {transparency.reports.map((r) => (
            <div
              key={r.period}
              className="flex items-center justify-between px-6 py-4"
            >
              <div>
                <p className="text-sm font-medium text-pine-dark">
                  {r.label}
                </p>
                <p className="text-xs text-ink/40">{r.period}</p>
              </div>
              <span className="text-xs font-semibold text-ink/30 border border-ink/15 rounded-full px-3 py-1">
                Coming soon
              </span>
            </div>
          ))}
        </Reveal>
        <p className="mt-4 text-xs text-ink/50">
          Downloadable reports will be available once the admin panel and
          database are connected in a later phase.
        </p>
      </section>
    </div>
  );
}
