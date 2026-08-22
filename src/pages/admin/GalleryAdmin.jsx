import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import Toast from "../../components/admin/Toast";
import Modal from "../../components/admin/Modal";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import ImageUploadField from "../../components/admin/ImageUploadField";
import { useToast } from "../../components/admin/useToast";

// The "gallery" table already existed from Phase 2 with image_url, caption,
// category, display_order, active — reused as-is. This phase only added a
// "title" column (see supabase/migrations/0007_gallery_title.sql). The
// existing "caption" column is reused here as the optional description,
// and "active" is reused as the published/unpublished flag.
const categories = [
  { value: "education", label: "Education" },
  { value: "health", label: "Health" },
  { value: "care", label: "Care" },
  { value: "general", label: "General" },
];

const emptyForm = {
  title: "",
  caption: "",
  category: "general",
  image_url: "",
  active: false,
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

export default function AdminGallery() {
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

  async function loadGallery() {
    setLoading(true);
    setLoadError(false);
    const { data, error } = await supabase
      .from("gallery")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      setLoadError(true);
      setLoading(false);
      return;
    }
    setItems(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadGallery();
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
      caption: item.caption || "",
      category: item.category || "general",
      image_url: item.image_url || "",
      active: item.active,
    });
    setErrors({});
    setModalOpen(true);
  }

  function validate() {
    const next = {};
    if (!form.image_url) next.image_url = "An image is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    const payload = {
      title: form.title || null,
      caption: form.caption || null,
      category: form.category,
      image_url: form.image_url,
      active: form.active,
    };

    const { error } = editingId
      ? await supabase.from("gallery").update(payload).eq("id", editingId)
      : await supabase.from("gallery").insert(payload);

    setSaving(false);

    if (error) {
      showToast("error", "Couldn't save image. Please try again.");
      return;
    }
    setModalOpen(false);
    showToast("success", editingId ? "Image updated." : "Image added.");
    loadGallery();
  }

  async function handleDelete() {
    const target = deleteTarget;
    setDeleteTarget(null);
    const { error } = await supabase.from("gallery").delete().eq("id", target.id);
    if (error) {
      showToast("error", "Couldn't delete image. Please try again.");
      return;
    }
    showToast("success", "Image deleted.");
    loadGallery();
  }

  async function togglePublished(item) {
    const { error } = await supabase
      .from("gallery")
      .update({ active: !item.active })
      .eq("id", item.id);
    if (error) {
      showToast("error", "Couldn't update status. Please try again.");
      return;
    }
    showToast("success", item.active ? "Image unpublished." : "Image published.");
    loadGallery();
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
            Gallery
          </h1>
          <p className="mt-2 text-sm text-ink/60 max-w-xl">
            Shown on the public Gallery page once published.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center justify-center rounded-full bg-pine px-5 py-2.5 text-sm font-semibold text-white hover:bg-pine-light transition-all hover:-translate-y-0.5 active:translate-y-0 shrink-0"
        >
          Add Image
        </button>
      </motion.div>

      <div className="mt-8">
        {loading && <p className="text-sm text-ink/50">Loading gallery…</p>}

        {!loading && loadError && (
          <div className="rounded-2xl border border-care/30 bg-care/5 p-6">
            <p className="text-sm text-care">
              Couldn't load the gallery. Make sure your .env is configured —
              see docs/SUPABASE_SETUP.md.
            </p>
          </div>
        )}

        {!loading && !loadError && items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-ink/20 p-10 text-center">
            <p className="text-sm text-ink/50">No gallery images uploaded yet.</p>
          </div>
        )}

        {!loading && !loadError && items.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
                className="min-w-0 rounded-2xl border border-ink/10 bg-white/60 overflow-hidden"
              >
                <div className="aspect-[4/3] bg-pine/10">
                  {item.image_url && (
                    <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-pine-dark text-sm truncate min-w-0 flex-1">
                      {item.title || "Untitled"}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        item.active ? "bg-education/15 text-education-dark" : "bg-ink/10 text-ink/40"
                      }`}
                    >
                      {item.active ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="text-xs text-ink/50 truncate mt-0.5">
                    {categories.find((c) => c.value === item.category)?.label || item.category}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => togglePublished(item)}
                      className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-ink/60 border border-ink/15 hover:bg-ink/5 transition-colors"
                    >
                      {item.active ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      onClick={() => openEdit(item)}
                      className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-pine-dark border border-ink/15 hover:bg-ink/5 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(item)}
                      className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-care border border-care/30 hover:bg-care/10 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        title={editingId ? "Edit image" : "Add image"}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <ImageUploadField
              label="Image"
              bucket="gallery"
              pathPrefix="gallery"
              shape="square"
              value={form.image_url}
              onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
              onError={(msg) => showToast("error", msg)}
            />
            {errors.image_url && (
              <p role="alert" className="mt-1.5 text-xs text-care">{errors.image_url}</p>
            )}
          </div>

          <Field
            id="title"
            label="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <Field
            id="caption"
            label="Description"
            textarea
            rows={2}
            value={form.caption}
            onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
          />

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

          <div>
            <label htmlFor="active" className="block text-sm font-medium text-pine-dark mb-1.5">
              Status
            </label>
            <select
              id="active"
              value={form.active ? "published" : "draft"}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.value === "published" }))}
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
        title="Delete image?"
        message={deleteTarget ? `This will permanently remove "${deleteTarget.title || "this image"}". This can't be undone.` : ""}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Toast toast={toast} />
    </div>
  );
}
