import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import Toast from "../../components/admin/Toast";
import AdministratorsPanel from "../../components/admin/AdministratorsPanel";
import { useFoundationSettings } from "../../context/useFoundationSettings";

// The single settings row always has id = 1 (see
// supabase/migrations/0001_schema.sql — foundation_settings is a
// "singleton" table by design).
const SETTINGS_ID = 1;

const emptyForm = {
  name: "",
  about_text: "",
  mission: "",
  vision: "",
  phone: "",
  whatsapp: "",
  email: "",
  address: "",
  social_facebook: "",
  social_instagram: "",
};

function Field({ label, id, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-pine-dark mb-1.5">
        {label}
      </label>
      {props.textarea ? (
        <textarea
          id={id}
          rows={props.rows || 3}
          value={props.value}
          onChange={props.onChange}
          className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm bg-white resize-none"
        />
      ) : (
        <input
          id={id}
          type={props.type || "text"}
          value={props.value}
          onChange={props.onChange}
          className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm bg-white"
        />
      )}
    </div>
  );
}

export default function Settings() {
  // Shared with the rest of the app (public site + every admin screen) via
  // FoundationSettingsProvider — refresh() here is what makes an uploaded
  // logo show up immediately in the sidebar/header without a full reload.
  const { refresh: refreshFoundationSettings } = useFoundationSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [logoUrl, setLogoUrl] = useState(null);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const toastTimer = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      setLoading(true);
      setLoadError(false);
      const { data, error } = await supabase
        .from("foundation_settings")
        .select("*")
        .eq("id", SETTINGS_ID)
        .single();

      if (cancelled) return;

      if (error) {
        setLoadError(true);
        setLoading(false);
        return;
      }

      setForm({
        name: data.name || "",
        about_text: data.about_text || "",
        mission: data.mission || "",
        vision: data.vision || "",
        phone: data.phone || "",
        whatsapp: data.whatsapp || "",
        email: data.email || "",
        address: data.address || "",
        social_facebook: data.social_facebook || "",
        social_instagram: data.social_instagram || "",
      });
      setLogoUrl(data.logo_url || null);
      setLoading(false);
    }

    loadSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  // Clear any pending toast-dismiss timer on unmount so we never call
  // setState after the component is gone.
  useEffect(() => {
    return () => window.clearTimeout(toastTimer.current);
  }, []);

  function showToast(type, message) {
    setToast({ type, message });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4000);
  }

  function handleChange(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = "Foundation name is required.";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      next.email = "Enter a valid email address.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    const { error } = await supabase
      .from("foundation_settings")
      .update({ ...form })
      .eq("id", SETTINGS_ID);
    setSaving(false);

    if (error) {
      // Logged so the real Postgrest/RLS error (e.g. "permission denied for
      // table foundation_settings", meaning the current user isn't
      // recognized as an admin) is visible in DevTools instead of only a
      // generic toast.
      console.error("Failed to save foundation settings:", error);
      showToast("error", "Couldn't save settings. Please try again.");
      return;
    }
    showToast("success", "Settings saved successfully.");
  }

  async function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("error", "Please choose an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast("error", "Logo must be smaller than 2MB.");
      return;
    }

    setUploadingLogo(true);
    const ext = file.name.split(".").pop();
    const path = `logo/logo-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("foundation-assets")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      // Logged so a Storage RLS/permission error is distinguishable from a
      // network failure.
      console.error("Logo upload failed:", uploadError);
      setUploadingLogo(false);
      showToast("error", "Logo upload failed. Please try again.");
      return;
    }

    const { data: urlData } = supabase.storage
      .from("foundation-assets")
      .getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    const { error: saveError } = await supabase
      .from("foundation_settings")
      .update({ logo_url: publicUrl })
      .eq("id", SETTINGS_ID);

    setUploadingLogo(false);

    if (saveError) {
      // The upload itself succeeded (so Storage permissions are fine) but
      // saving the resulting URL to foundation_settings failed — logging
      // this distinguishes a table-RLS problem from a Storage problem.
      console.error("Failed to save logo_url:", saveError);
      showToast("error", "Logo uploaded but couldn't be saved. Please retry.");
      return;
    }

    setLogoUrl(publicUrl);
    // Update the shared Foundation Settings context so the new logo shows
    // up immediately everywhere else it's rendered (admin sidebar/header,
    // and the public site once it next loads/refreshes).
    await refreshFoundationSettings();
    showToast("success", "Logo updated successfully.");
  }

  async function handleRemoveLogo() {
    setUploadingLogo(true);
    const { error: saveError } = await supabase
      .from("foundation_settings")
      .update({ logo_url: null })
      .eq("id", SETTINGS_ID);

    setUploadingLogo(false);

    if (saveError) {
      console.error("Failed to remove logo:", saveError);
      showToast("error", "Couldn't remove the logo. Please try again.");
      return;
    }

    setLogoUrl(null);
    // Same shared-context refresh as a new upload, so every consumer
    // (admin sidebar/header, public navbar/footer) drops back to the "IK"
    // fallback immediately instead of only on their next full reload.
    await refreshFoundationSettings();
    showToast("success", "Logo removed — back to the default mark.");
  }

  if (loading) {
    return <p className="text-sm text-ink/50">Loading settings…</p>;
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-care/30 bg-care/5 p-6">
        <p className="text-sm text-care">
          Couldn't load foundation settings. Make sure the Supabase
          migrations have been run and your .env is configured — see
          docs/SUPABASE_SETUP.md.
        </p>
      </div>
    );
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="eyebrow mb-2">Admin</p>
        <h1 className="font-display text-2xl sm:text-3xl text-pine-dark">
          Foundation settings
        </h1>
        <p className="mt-2 text-sm text-ink/60 max-w-xl">
          These details appear across the public website — the homepage,
          footer, and contact page.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="mt-8 rounded-2xl border border-ink/10 bg-white/60 p-5 sm:p-6"
      >
        <p className="eyebrow mb-3">Logo</p>
        <div className="flex flex-wrap items-center gap-4">
          <div className="h-16 w-16 shrink-0 rounded-full overflow-hidden bg-pine grid place-items-center text-paper font-display text-lg">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Foundation logo"
                className="h-full w-full object-contain"
              />
            ) : (
              "IK"
            )}
          </div>
          <label className="inline-flex items-center rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-pine-dark hover:bg-ink/5 transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-education focus-within:ring-offset-2 focus-within:ring-offset-paper">
            {uploadingLogo ? "Uploading…" : "Upload new logo"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleLogoChange}
              disabled={uploadingLogo}
            />
          </label>
          {logoUrl && (
            <button
              type="button"
              onClick={handleRemoveLogo}
              disabled={uploadingLogo}
              className="inline-flex items-center rounded-full border border-care/30 px-4 py-2 text-sm font-semibold text-care hover:bg-care/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Remove logo
            </button>
          )}
        </div>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        onSubmit={handleSubmit}
        noValidate
        className="mt-6 rounded-2xl border border-ink/10 bg-white/60 p-5 sm:p-6 space-y-5"
      >
        <div>
          <Field
            id="name"
            label="Foundation name"
            value={form.name}
            onChange={handleChange("name")}
          />
          {errors.name && (
            <p role="alert" className="mt-1.5 text-xs text-care">
              {errors.name}
            </p>
          )}
        </div>

        <Field
          id="about_text"
          label="Short description"
          textarea
          value={form.about_text}
          onChange={handleChange("about_text")}
        />
        <Field
          id="mission"
          label="Mission"
          textarea
          value={form.mission}
          onChange={handleChange("mission")}
        />
        <Field
          id="vision"
          label="Vision"
          textarea
          value={form.vision}
          onChange={handleChange("vision")}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="phone"
            label="Phone"
            value={form.phone}
            onChange={handleChange("phone")}
          />
          <Field
            id="whatsapp"
            label="WhatsApp"
            value={form.whatsapp}
            onChange={handleChange("whatsapp")}
          />
        </div>

        <div>
          <Field
            id="email"
            label="Email"
            type="email"
            value={form.email}
            onChange={handleChange("email")}
          />
          {errors.email && (
            <p role="alert" className="mt-1.5 text-xs text-care">
              {errors.email}
            </p>
          )}
        </div>

        <Field
          id="address"
          label="Address"
          textarea
          rows={2}
          value={form.address}
          onChange={handleChange("address")}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="social_facebook"
            label="Facebook URL"
            value={form.social_facebook}
            onChange={handleChange("social_facebook")}
          />
          <Field
            id="social_instagram"
            label="Instagram URL"
            value={form.social_instagram}
            onChange={handleChange("social_instagram")}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center rounded-full bg-pine px-6 py-3 text-sm font-semibold text-white hover:bg-pine-light transition-all disabled:opacity-60 hover:-translate-y-0.5 active:translate-y-0"
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
      </motion.form>

      <AdministratorsPanel showToast={showToast} />

      <Toast toast={toast} />
    </div>
  );
}
