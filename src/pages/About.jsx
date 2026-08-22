import SectionHeading from "../components/SectionHeading";
import PillarCard from "../components/PillarCard";
import ThreadDivider from "../components/ThreadDivider";
import Reveal from "../components/Reveal";
import { foundation, pillars } from "../data/sampleData";
import { useFoundationSettings } from "../context/useFoundationSettings";

export default function About() {
  // mission/vision/about_text are admin-editable (Admin → Settings) and
  // come from FoundationSettingsContext; intro/history/objectives have no
  // equivalent column yet, so those stay as fixed site copy from
  // sampleData. Falls back to the sampleData placeholder for whatever the
  // admin hasn't filled in yet.
  const settings = useFoundationSettings();
  return (
    <div>
      <section className="mx-auto max-w-6xl px-5 md:px-8 pt-14 pb-10">
        <Reveal as="p" className="eyebrow mb-4">
          About the foundation
        </Reveal>
        <Reveal
          as="h1"
          delay={0.05}
          className="font-display text-4xl text-pine-dark max-w-2xl leading-tight"
        >
          Built on ikhlass — sincerity of intention in every project we run.
        </Reveal>
        <Reveal
          as="p"
          delay={0.1}
          className="mt-6 text-ink/70 leading-relaxed max-w-2xl text-lg"
        >
          {settings.aboutText || foundation.intro}
        </Reveal>
      </section>

      <ThreadDivider className="text-pine my-4" />

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

      <section className="mx-auto max-w-6xl px-5 md:px-8 py-4">
        <Reveal>
          <SectionHeading eyebrow="Where we started" title="Our history" />
        </Reveal>
        <Reveal delay={0.1} as="p" className="mt-6 text-ink/70 leading-relaxed max-w-3xl">
          {foundation.history}
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-5 md:px-8 py-14">
        <Reveal>
          <SectionHeading eyebrow="Our commitments" title="Objectives" />
        </Reveal>
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {foundation.objectives.map((o, i) => (
            <Reveal
              key={i}
              as="li"
              delay={i * 0.08}
              y={16}
              className="rounded-2xl border border-ink/10 bg-white/60 p-6 flex gap-4 transition-shadow hover:shadow-lg hover:shadow-ink/5"
            >
              <span className="font-mono text-sm text-education-dark shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-ink/75 leading-relaxed">{o}</span>
            </Reveal>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-5 md:px-8 py-14">
        <Reveal>
          <SectionHeading
            eyebrow="What we do"
            title="Education, Health, and Care"
            description="Every project we run falls under one of these three pillars."
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
    </div>
  );
}
