import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SectionHeading from "../components/SectionHeading";
import Reveal from "../components/Reveal";
import { foundation } from "../data/sampleData";

const initialForm = { name: "", email: "", message: "" };

export default function Contact() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | submitting | sent

  function validate(values) {
    const next = {};
    if (!values.name.trim()) next.name = "Enter your name.";
    if (!values.email.trim()) {
      next.email = "Enter your email.";
    } else if (!/^\S+@\S+\.\S+$/.test(values.email)) {
      next.email = "Enter a valid email address.";
    }
    if (!values.message.trim()) next.message = "Enter a message.";
    return next;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const validation = validate(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setStatus("submitting");
    // Phase 1 has no backend yet — this simulates a submission so the
    // form's states (loading / success) can be reviewed and tested now.
    setTimeout(() => {
      setStatus("sent");
      setForm(initialForm);
    }, 700);
  }

  return (
    <div>
      <section className="mx-auto max-w-6xl px-5 md:px-8 pt-14 pb-6">
        <Reveal as="p" className="eyebrow mb-4">
          Get in touch
        </Reveal>
        <Reveal
          as="h1"
          delay={0.05}
          className="font-display text-4xl text-pine-dark max-w-2xl leading-tight"
        >
          Contact us
        </Reveal>
        <Reveal as="p" delay={0.1} className="mt-4 text-ink/70 max-w-2xl">
          Questions about a project, a branch visit, or a donation — reach
          out any way that's convenient.
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-5 md:px-8 py-10 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal className="space-y-6">
          <div className="rounded-2xl border border-ink/10 bg-white/60 p-6">
            <SectionHeading eyebrow="Reach us directly" title="Details" />
            <dl className="mt-5 space-y-3 text-sm text-ink/70">
              <div className="flex gap-3">
                <dt className="text-ink/40 w-20 shrink-0">Phone</dt>
                <dd>{foundation.phone}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="text-ink/40 w-20 shrink-0">WhatsApp</dt>
                <dd>{foundation.whatsapp}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="text-ink/40 w-20 shrink-0">Email</dt>
                <dd>{foundation.email}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="text-ink/40 w-20 shrink-0">Address</dt>
                <dd>{foundation.address}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-white/60 p-6">
            <p className="eyebrow mb-3">Follow along</p>
            <ul className="space-y-1.5 text-sm text-pine-dark">
              <li>{foundation.social.facebook}</li>
              <li>{foundation.social.instagram}</li>
              <li>{foundation.social.youtube}</li>
            </ul>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="rounded-2xl border border-ink/10 bg-white/60 p-7">
          <AnimatePresence mode="wait">
            {status === "sent" ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="py-10 text-center"
              >
                <div className="mx-auto h-12 w-12 rounded-full bg-pine text-white grid place-items-center font-display text-lg">
                  ✓
                </div>
                <h3 className="mt-4 font-display text-xl text-pine-dark">
                  Message sent
                </h3>
                <p className="mt-2 text-sm text-ink/60 max-w-sm mx-auto">
                  Thanks for reaching out — someone from our team will get back
                  to you shortly.
                </p>
                <button
                  onClick={() => setStatus("idle")}
                  className="mt-6 text-sm font-semibold text-education-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-education focus-visible:ring-offset-2 focus-visible:ring-offset-paper rounded-sm"
                >
                  Send another message
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSubmit}
                noValidate
                className="space-y-5"
              >
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-pine-dark mb-1.5"
                >
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-sm bg-white ${
                    errors.name ? "border-care" : "border-ink/15"
                  }`}
                  placeholder="Your full name"
                />
                {errors.name && (
                  <p id="name-error" className="mt-1.5 text-xs text-care">
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-pine-dark mb-1.5"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-sm bg-white ${
                    errors.email ? "border-care" : "border-ink/15"
                  }`}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p id="email-error" className="mt-1.5 text-xs text-care">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-pine-dark mb-1.5"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  value={form.message}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={errors.message ? "message-error" : undefined}
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-sm bg-white resize-none ${
                    errors.message ? "border-care" : "border-ink/15"
                  }`}
                  placeholder="How can we help?"
                />
                {errors.message && (
                  <p id="message-error" className="mt-1.5 text-xs text-care">
                    {errors.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={status === "submitting"}
                className="inline-flex items-center justify-center rounded-full bg-pine px-6 py-3 text-sm font-semibold text-white hover:bg-pine-light transition-all disabled:opacity-60 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-education focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
              >
                {status === "submitting" ? "Sending…" : "Send message"}
              </button>
              </motion.form>
            )}
          </AnimatePresence>
        </Reveal>
      </section>
    </div>
  );
}
