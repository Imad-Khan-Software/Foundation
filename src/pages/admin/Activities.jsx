import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import Toast from "../../components/admin/Toast";
import Modal from "../../components/admin/Modal";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import ImageUploadField from "../../components/admin/ImageUploadField";
import { useToast } from "../../components/admin/useToast";

const categories = [
  { value: "education", label: "Education" },
  { value: "health", label: "Health" },
  { value: "care", label: "Care" },
];

const emptyForm = {
  title: "",
  category: "education",
  description: "",
  location: "",
  activity_date: "",
  image_url: "",
  published: false,
};

function Field({ label, id, textarea, rows, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-pine-dark mb-1.5">
        {label}
      </label>
      {textarea ? (
        <textarea
          id={id}
          rows={rows || 3}
          {...props}
          className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm bg-white resize-none"
        />
      ) : (
        <input
          id={id}
          {...props}
          className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm bg-white"
        />
      )}
    </div>
  );
}

export default function AdminActivities() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, showToast] = useToast();

  async function loadActivities() {
    setLoading(true);
    setLoadError(false);
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .order("activity_date", { ascending: false, nullsFirst: false });

    if (error) {
      setLoadError(true);
      setLoading(false);
      return;
    }
    setItems(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadActivities();
  }, []);

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditingId(item.id);
    setForm({
      title: item.title || "",
      category: item.category || "education",
      description: item.description || "",
      location: item.location || "",
      activity_date: item.activity_date || "",
      image_url: item.image_url || "",
      published: item.published,
    });
    setErrors({});
    setModalOpen(true);
  }

  function validate() {
    const next = {};
    if (!form.title.trim()) next.title = "Title is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    const payload = {
      title: form.title,
      category: form.category,
      description: form.description || null,
      location: form.location || null,
      activity_date: form.activity_date || null,
      image_url: form.image_url || null,
      published: form.published,
    };

    const { error } = editingId
      ? await supabase.from("activities").update(payload).eq("id", editingId)
      : await supabase.from("activities").insert(payload);

    setSaving(false);

    if (error) {
      showToast("error", "Couldn't save activity. Please try again.");
      return;
    }
    setModalOpen(false);
    showToast("success", editingId ? "Activity updated." : "Activity added.");
    loadActivities();
  }

  async function handleDelete() {
    const target = deleteTarget;
    setDeleteTarget(null);
    const { error } = await supabase.from("activities").delete().eq("id", target.id);
    if (error) {
      showToast("error", "Couldn't delete activity. Please try again.");
      return;
    }
    showToast("success", "Activity deleted.");
    loadActivities();
  }

  async function togglePublished(item) {
    const { error } = await supabase
      .from("activities")
      .update({ published: !item.published })
      .eq("id", item.id);
    if (error) {
      showToast("error", "Couldn't update status. Please try again.");
      return;
    }
    showToast("success", item.published ? "Activity unpublished." : "Activity published.");
    loadActivities();
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <p className="eyebrow mb-2">Admin</p>
          <h1 className="font-display text-2xl sm:text-3xl text-pine-dark">
            Activities
          </h1>
          <p className="mt-2 text-sm text-ink/60 max-w-xl">
            Shown on the public Activities page once published.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center justify-center rounded-full bg-pine px-5 py-2.5 text-sm font-semibold text-white hover:bg-pine-light transition-all hover:-translate-y-0.5 active:translate-y-0 shrink-0"
        >
          Add Activity
        </button>
      </motion.div>

      <div className="mt-8">
        {loading && <p className="text-sm text-ink/50">Loading activities…</p>}

        {!loading && loadError && (
          <div className="rounded-2xl border border-care/30 bg-care/5 p-6">
            <p className="text-sm text-care">
              Couldn't load activities. Make sure migration
              0006_activities.sql has been run and your .env is configured
              — see docs/SUPABASE_SETUP.md.
            </p>
          </div>
        )}

        {!loading && !loadError && items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-ink/20 p-10 text-center">
            <p className="text-sm text-ink/50">No activities added yet.</p>
          </div>
        )}

        {!loading && !loadError && items.length > 0 && (
          <div className="space-y-3">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
                className="flex flex-col gap-3 rounded-2xl border border-ink/10 bg-white/60 p-4 sm:flex-row sm:items-center sm:gap-4"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-pine/10 grid place-items-center text-pine-dark font-display text-sm">
                    {item.image_url ? (
                      <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      (item.title || "?").slice(0, 1)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-pine-dark text-sm truncate">{item.title}</p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          item.published ? "bg-education/15 text-education-dark" : "bg-ink/10 text-ink/40"
                        }`}
                      >
                        {item.published ? "Published" : "Draft"}
                      </span>
                    </div>
                    <p className="text-xs text-ink/50 truncate">
                      {categories.find((c) => c.value === item.category)?.label || item.category}
                      {item.location ? ` · ${item.location}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:ml-auto sm:shrink-0">
                  <button
                    onClick={() => togglePublished(item)}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink/60 border border-ink/15 hover:bg-ink/5 transition-colors"
                  >
                    {item.published ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    onClick={() => openEdit(item)}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-pine-dark border border-ink/15 hover:bg-ink/5 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(item)}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-care border border-care/30 hover:bg-care/10 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        title={editingId ? "Edit activity" : "Add activity"}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <Field
              id="title"
              label="Title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            {errors.title && (
              <p role="alert" className="mt-1.5 text-xs text-care">{errors.title}</p>
            )}
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-pine-dark mb-1.5">
              Category
            </label>
            <select
              id="category"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm bg-white"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <Field
            id="description"
            label="Description"
            textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-4">
            <Field
              id="location"
              label="Location"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            />
            <Field
              id="activity_date"
              label="Date"
              type="date"
              value={form.activity_date}
              onChange={(e) => setForm((f) => ({ ...f, activity_date: e.target.value }))}
            />
          </div>

          <ImageUploadField
            label="Photo"
            bucket="activity-images"
            pathPrefix="activities"
            shape="square"
            value={form.image_url}
            onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
            onError={(msg) => showToast("error", msg)}
          />

          <div>
            <label htmlFor="published" className="block text-sm font-medium text-pine-dark mb-1.5">
              Status
            </label>
            <select
              id="published"
              value={form.published ? "published" : "draft"}
              onChange={(e) => setForm((f) => ({ ...f, published: e.target.value === "published" }))}
              className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm bg-white"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-full px-4 py-2.5 text-sm font-semibold text-ink/60 hover:bg-ink/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-full bg-pine px-6 py-2.5 text-sm font-semibold text-white hover:bg-pine-light transition-all disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteTarget}
        title="Delete activity?"
        message={deleteTarget ? `This will permanently remove "${deleteTarget.title}". This can't be undone.` : ""}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Toast toast={toast} />
    </div>
  );
}
