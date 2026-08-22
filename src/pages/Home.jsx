import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ThreadDivider from "../components/ThreadDivider";
import SectionHeading from "../components/SectionHeading";
import PillarCard from "../components/PillarCard";
import ProjectCard from "../components/ProjectCard";
import Reveal from "../components/Reveal";
import AnimatedCounter from "../components/AnimatedCounter";
import { MotionLink, liftHover } from "../components/MotionLink";
import { supabase } from "../lib/supabaseClient";
import { useFinancialSummary } from "../hooks/useFinancialSummary";
import { useFoundationSettings } from "../context/useFoundationSettings";
import {
  foundation,
  pillars,
  activities,
  galleryItems,
} from "../data/sampleData";

const pillarBlocks = [
  { key: "education", label: "Education", bg: "bg-education" },
  { key: "health", label: "Health", bg: "bg-health" },
  { key: "care", label: "Care", bg: "bg-care" },
];

const heroItem = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const heroList = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadFeatured() {
      setFeaturedLoading(true);
      // Prefer projects an admin explicitly marked `featured`; if none are
      // marked yet, fall back to the most recent active projects so this
      // section isn't empty before anyone has used that flag.
      const featuredQuery = supabase
        .from("projects")
        .select("*, branches(name), project_images(image_url, display_order)")
        .eq("featured", true)
        .order("created_at", { ascending: false })
        .limit(3);

      const { data, error } = await featuredQuery;
      if (cancelled) return;

      if (!error && data && data.length > 0) {
        setFeatured(data);
        setFeaturedLoading(false);
        return;
      }

      const { data: activeData } = await supabase
        .from("projects")
        .select("*, branches(name), project_images(image_url, display_order)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(3);

      if (cancelled) return;
      setFeatured(activeData || []);
      setFeaturedLoading(false);
    }

    loadFeatured();
    return () => {
      cancelled = true;
    };
  }, []);

  const featuredWithCovers = featured.map((p) => {
    const images = [...(p.project_images || [])].sort(
      (a, b) => a.display_order - b.display_order
    );
    return { ...p, cover_image_url: images[0]?.image_url || null };
  });

  const { summary } = useFinancialSummary();
  const settings = useFoundationSettings();
  const remaining = summary.total_donations - summary.total_expenses;
  const homeCategories = [
    { label: "Education", amount: summary.education_spending, color: "education" },
    { label: "Health", amount: summary.health_spending, color: "health" },
    { label: "Care", amount: summary.care_spending, color: "care" },
    { label: "Administration", amount: summary.administration_spending, color: "pine" },
    { label: "Other", amount: summary.other_spending, color: "pine" },
  ].filter((c) => c.amount > 0);
  const maxCategory = Math.max(...homeCategories.map((c) => c.amount), 0);

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 md:px-8 pt-14 md:pt-20 pb-10">
        <motion.div
          variants={heroList}
          initial="hidden"
          animate="show"
          className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center"
        >
          <div className="min-w-0">
            <motion.p variants={heroItem} className="eyebrow mb-4">
              {settings.name || foundation.name}
            </motion.p>
            <motion.h1
              variants={heroItem}
              className="font-display text-[2.1rem] xs:text-4xl sm:text-5xl md:text-[3.2rem] leading-[1.12] sm:leading-[1.08] text-pine-dark"
            >
              Sincerity in service,
              <br />
              transparency you can verify.
            </motion.h1>
            <motion.p
              variants={heroItem}
              className="mt-6 text-ink/70 text-base sm:text-lg leading-relaxed max-w-xl"
            >
              {settings.aboutText || foundation.intro}
            </motion.p>
            <motion.div variants={heroItem} className="mt-8 flex flex-wrap gap-4">
              <MotionLink
                to="/donate"
                {...liftHover}
                className="inline-flex items-center rounded-full bg-education px-6 py-3 text-sm font-semibold text-white hover:bg-education-dark transition-colors"
              >
                Donate now
              </MotionLink>
              <MotionLink
                to="/transparency"
                {...liftHover}
                className="inline-flex items-center rounded-full border border-pine/30 px-6 py-3 text-sm font-semibold text-pine-dark hover:bg-pine/5 transition-colors"
              >
                See our impact
              </MotionLink>
            </motion.div>
          </div>

          <motion.div variants={heroItem} className="min-w-0 flex gap-2.5 sm:gap-3 h-64 xs:h-72 sm:h-80">
            {pillarBlocks.map((p, i) => (
              <motion.div
                key={p.key}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={`min-w-0 flex-1 rounded-2xl ${p.bg} text-white flex flex-col justify-between p-3.5 sm:p-5 ${
                  i === 1 ? "translate-y-4" : ""
                }`}
              >
                <span className="font-mono text-[10px] sm:text-xs tracking-[0.14em] sm:tracking-[0.18em] uppercase opacity-80 break-words">
                  {p.label}
                </span>
                <span className="font-display text-lg sm:text-2xl leading-tight break-words">
                  {pillars[i].stat.replace("[XX]", "—")}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      <ThreadDivider className="text-pine my-6" />

      {/* Mission / Vision */}
      <section className="mx-auto max-w-6xl px-5 md:px-8 py-14 grid gap-10 md:grid-cols-2">
        <Reveal className="rounded-2xl border border-ink/10 bg-white/60 p-8">
          <p className="eyebrow mb-3">Mission</p>
          <p className="font-display text-xl text-pine-dark leading-snug">
            {settings.mission || foundation.mission}
          </p>
        </Reveal>
        <Reveal delay={0.1} className="rounded-2xl border border-ink/10 bg-white/60 p-8">
          <p className="eyebrow mb-3">Vision</p>
          <p className="font-display text-xl text-pine-dark leading-snug">
            {settings.vision || foundation.vision}
          </p>
        </Reveal>
      </section>

      {/* Pillars */}
      <section className="mx-auto max-w-6xl px-5 md:px-8 py-10">
        <Reveal>
          <SectionHeading
            eyebrow="What we do"
            title="Three areas, one purpose"
            description="Every project we run falls under one of three pillars. Together they cover the most urgent needs the families we work with face."
          />
        </Reveal>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {pillars.map((p, i) => (
            <Reveal key={p.key} delay={i * 0.1}>
              <PillarCard label={p.label} summary={p.summary} stat={p.stat} color={p.color} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Featured projects */}
      <section className="mx-auto max-w-6xl px-5 md:px-8 py-14">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionHeading eyebrow="Active now" title="Featured projects" />
          </div>
          <MotionLink
            to="/projects"
            whileHover={{ x: 3 }}
            transition={{ duration: 0.15 }}
            className="text-sm font-semibold text-pine-dark hover:text-education-dark"
          >
            View all projects →
          </MotionLink>
        </Reveal>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredLoading && (
            <p className="text-sm text-ink/50 sm:col-span-2 lg:col-span-3">
              Loading projects…
            </p>
          )}
          {!featuredLoading && featuredWithCovers.length === 0 && (
            <p className="text-sm text-ink/50 sm:col-span-2 lg:col-span-3">
              No projects to show yet — check back soon.
            </p>
          )}
          {featuredWithCovers.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.1}>
              <ProjectCard project={p} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Transparency summary */}
      <section className="bg-pine-dark text-paper py-16 overflow-hidden">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <Reveal>
            <SectionHeading
              eyebrow="Financial transparency"
              title="Where every rupee goes"
              color="pine"
              light
            />
          </Reveal>

          {/* Flow: donations -> spent -> remaining */}
          <Reveal delay={0.1}>
            <div className="mt-10 grid gap-4 sm:grid-cols-[1fr_auto_1fr_auto_1fr] items-center">
              <div className="rounded-2xl bg-paper/5 border border-paper/15 p-7">
                <p className="eyebrow text-paper/50">Total donations</p>
                <p className="mt-2 font-display text-3xl">
                  <AnimatedCounter value={summary.total_donations} prefix="Rs. " />
                </p>
              </div>
              <span className="hidden sm:block text-paper/30 text-2xl justify-self-center" aria-hidden="true">
                →
              </span>
              <div className="rounded-2xl bg-paper/5 border border-paper/15 p-7">
                <p className="eyebrow text-paper/50">Total expenses</p>
                <p className="mt-2 font-display text-3xl">
                  <AnimatedCounter value={summary.total_expenses} prefix="Rs. " />
                </p>
              </div>
              <span className="hidden sm:block text-paper/30 text-2xl justify-self-center" aria-hidden="true">
                →
              </span>
              <div className="rounded-2xl bg-education/15 border border-education/40 p-7">
                <p className="eyebrow text-paper/60">Remaining balance</p>
                <p className="mt-2 font-display text-3xl text-education-light">
                  <AnimatedCounter value={remaining} prefix="Rs. " />
                </p>
              </div>
            </div>
          </Reveal>

          {/* Category breakdown */}
          <Reveal delay={0.2} className="mt-10">
            <p className="eyebrow text-paper/50 mb-4">Spending by category</p>
            {homeCategories.length === 0 ? (
              <p className="text-sm text-paper/50">
                No verified expenses yet — the breakdown will appear here once
                there are some.
              </p>
            ) : (
              <div className="space-y-4">
                {homeCategories.map((c, i) => {
                  const pct = maxCategory > 0 ? Math.round((c.amount / maxCategory) * 100) : 0;
                  return (
                    <div key={c.label}>
                      <div className="flex justify-between text-sm mb-1.5 text-paper/80">
                        <span className="font-medium">{c.label}</span>
                        <span className="font-mono text-paper/60">
                          Rs. {c.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-paper/10 overflow-hidden">
                        <motion.div
                          className={
                            c.color === "education"
                              ? "h-full rounded-full bg-education"
                              : c.color === "health"
                              ? "h-full rounded-full bg-health"
                              : c.color === "care"
                              ? "h-full rounded-full bg-care"
                              : "h-full rounded-full bg-paper/60"
                          }
                          initial={{ width: 0 }}
                          whileInView={{ width: `${pct}%` }}
                          viewport={{ once: true, margin: "-60px" }}
                          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Reveal>

          <Reveal delay={0.25}>
            <MotionLink
              to="/transparency"
              whileHover={{ x: 3 }}
              transition={{ duration: 0.15 }}
              className="mt-8 inline-flex items-center text-sm font-semibold text-education-light hover:text-education"
            >
              View full financial breakdown →
            </MotionLink>
          </Reveal>
        </div>
      </section>

      {/* Latest activities */}
      <section className="mx-auto max-w-6xl px-5 md:px-8 py-14">
        <Reveal>
          <SectionHeading eyebrow="Recently" title="Latest activities" />
        </Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {activities.map((a, i) => (
            <Reveal key={a.title} delay={i * 0.1}>
              <div className="rounded-2xl border border-ink/10 p-6 bg-white/60 h-full">
                <p className="font-mono text-xs text-ink/40">{a.date}</p>
                <h3 className="mt-2 font-display text-lg text-pine-dark leading-snug">
                  {a.title}
                </h3>
                <p className="mt-2 text-sm text-ink/70">{a.summary}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Gallery preview */}
      <section className="mx-auto max-w-6xl px-5 md:px-8 py-14">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionHeading eyebrow="In the field" title="Gallery" />
          </div>
          <MotionLink
            to="/gallery"
            whileHover={{ x: 3 }}
            transition={{ duration: 0.15 }}
            className="text-sm font-semibold text-pine-dark hover:text-education-dark"
          >
            View full gallery →
          </MotionLink>
        </Reveal>
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {galleryItems.slice(0, 6).map((g, i) => (
            <Reveal key={i} delay={i * 0.06} y={16}>
              <motion.div
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="group relative aspect-[4/3] rounded-xl bg-pine/10 border border-ink/10 overflow-hidden flex items-end p-3"
              >
                <div className="absolute inset-0 bg-pine-dark/0 group-hover:bg-pine-dark/10 transition-colors duration-200" />
                <p className="relative text-xs font-medium text-pine-dark/80">
                  {g.caption}
                </p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="mx-auto max-w-6xl px-5 md:px-8 py-16">
        <Reveal className="rounded-3xl bg-education/10 border border-education/30 p-10 md:p-14 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div>
            <h2 className="font-display text-2xl md:text-3xl text-pine-dark">
              Have a question, or want to visit a branch?
            </h2>
            <p className="mt-3 text-ink/70 max-w-lg">
              Reach out — we're glad to walk you through our current projects
              and how your support is used.
            </p>
          </div>
          <MotionLink
            to="/contact"
            {...liftHover}
            className="inline-flex items-center justify-center rounded-full bg-pine px-7 py-3.5 text-sm font-semibold text-white hover:bg-pine-light transition-colors shrink-0"
          >
            Contact us
          </MotionLink>
        </Reveal>
      </section>
    </div>
  );
}
