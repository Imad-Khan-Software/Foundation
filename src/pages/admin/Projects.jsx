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

const statuses = [
  { value: "planned", label: "Planned" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];

const statusStyles = {
  planned: "bg-ink/10 text-ink/50",
  active: "bg-education/15 text-education-dark",
  completed: "bg-pine/15 text-pine-dark",
};

const emptyForm = {
  title: "",
  category: "education",
  description: "",
  location: "",
  branch_id: "",
  start_date: "",
  end_date: "",
  budget: "",
  amount_spent: "",
  status: "planned",
  featured: false,
  cover_image_url: "",
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

function formatMoney(n) {
  return `Rs. ${Number(n || 0).toLocaleString()}`;
}

export default function Projects() {
  const [items, setItems] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  // The id of the project_images row backing the cover image, so saving
  // knows whether to update that row or insert a new one.
  const [coverImageId, setCoverImageId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [toast, showToast] = useToast();

  async function loadProjects() {
    setLoading(true);
    setLoadError(false);
    // Pull each project's branch name and its gallery images in one round
    // trip (same embedding pattern as Members.jsx's `branches(name)`),
    // then pick the lowest display_order image as the cover.
    const { data, error } = await supabase
      .from("projects")
      .select("*, branches(name), project_images(id, image_url, display_order)")
      .order("created_at", { ascending: false });

    if (error) {
      setLoadError(true);
      setLoading(false);
      return;
    }
    setItems(data || []);
    setLoading(false);
  }

  async function loadBranches() {
    const { data } = await supabase
      .from("branches")
      .select("id, name")
      .order("name", { ascending: true });
    setBranches(data || []);
  }

  useEffect(() => {
    loadProjects();
    loadBranches();
  }, []);

  function coverOf(item) {
    const images = [...(item.project_images || [])].sort(
      (a, b) => a.display_order - b.display_order
    );
    return images[0] || null;
  }

  function openAdd() {
    setEditingId(null);
    setCoverImageId(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(item) {
    const cover = coverOf(item);
    setEditingId(item.id);
    setCoverImageId(cover?.id || null);
    setForm({
      title: item.title || "",
      category: item.category || "education",
      description: item.description || "",
      location: item.location || "",
      branch_id: item.branch_id || "",
      start_date: item.start_date || "",
      end_date: item.end_date || "",
      budget: item.budget != null ? String(item.budget) : "",
      amount_spent: item.amount_spent != null ? String(item.amount_spent) : "",
      status: item.status || "planned",
      featured: item.featured,
      cover_image_url: cover?.image_url || "",
    });
    setErrors({});
    setModalOpen(true);
  }

  function validate() {
    const next = {};
    if (!form.title.trim()) next.title = "Title is required.";
    if (!form.category) next.category = "Category is required.";
    if (form.budget && (Number.isNaN(Number(form.budget)) || Number(form.budget) < 0)) {
      next.budget = "Budget must be a non-negative number.";
    }
    if (
      form.amount_spent &&
      (Number.isNaN(Number(form.amount_spent)) || Number(form.amount_spent) < 0)
    ) {
      next.amount_spent = "Amount spent must be a non-negative number.";
    }
    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      next.end_date = "End date can't be before the start date.";
    }
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
      branch_id: form.branch_id || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      budget: form.budget === "" ? null : Number(form.budget),
      amount_spent: form.amount_spent === "" ? 0 : Number(form.amount_spent),
      status: form.status,
      featured: form.featured,
    };

    const { data: savedProject, error } = editingId
      ? await supabase.from("projects").update(payload).eq("id", editingId).select().single()
      : await supabase.from("projects").insert(payload).select().single();

    if (error) {
      setSaving(false);
      console.error("Failed to save project:", error);
      showToast("error", "Couldn't save project. Please try again.");
      return;
    }

    // Sync the cover image as a single project_images row (display_order 0).
    // The projects table has no image column itself — photos live in the
    // separate project_images table (supabase/migrations/0001_schema.sql).
    const projectId = savedProject.id;
    if (form.cover_image_url) {
      const imageError = coverImageId
        ? (
            await supabase
              .from("project_images")
              .update({ image_url: form.cover_image_url })
              .eq("id", coverImageId)
          ).error
        : (
            await supabase
              .from("project_images")
              .insert({ project_id: projectId, image_url: form.cover_image_url, display_order: 0 })
          ).error;

      if (imageError) {
        console.error("Failed to save project image:", imageError);
        showToast("error", "Project saved, but the image couldn't be saved.");
      }
    } else if (coverImageId) {
      // Cover image was removed in the form — clear it.
      const { error: deleteImageError } = await supabase
        .from("project_images")
        .delete()
        .eq("id", coverImageId);
      if (deleteImageError) {
        console.error("Failed to remove project image:", deleteImageError);
      }
    }

    setSaving(false);
    setModalOpen(false);
    showToast("success", editingId ? "Project updated." : "Project added.");
    loadProjects();
  }

  async function handleDelete() {
    const target = deleteTarget;
    setDeleteTarget(null);
    // expenses.project_id and project_images.project_id both reference
    // projects(id) — expenses use "on delete set null" (an expense keeps
    // its record but loses the project link) and project_images uses
    // "on delete cascade" (its gallery rows go with it). See
    // supabase/migrations/0001_schema.sql. So a hard delete here is safe:
    // it never orphans or silently destroys financial records.
    const { error } = await supabase.from("projects").delete().eq("id", target.id);
    if (error) {
      console.error("Failed to delete project:", error);
      showToast("error", "Couldn't delete project. Please try again.");
      return;
    }
    showToast("success", "Project deleted.");
    loadProjects();
  }

  async function setStatus(item, status) {
    const { error } = await supabase.from("projects").update({ status }).eq("id", item.id);
    if (error) {
      showToast("error", "Couldn't update status. Please try again.");
      return;
    }
    showToast("success", `Marked as ${status}.`);
    loadProjects();
  }

  const filtered = items.filter(
    (p) => statusFilter === "all" || p.status === statusFilter
  );

  const activeCount = items.filter((p) => p.status === "active").length;
  const totalBudget = items.reduce((sum, p) => sum + Number(p.budget || 0), 0);
  const totalSpent = items.reduce((sum, p) => sum + Number(p.amount_spent || 0), 0);

  return (
    <div className="pt-4 sm:pt-0">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <p className="eyebrow mb-2">Admin</p>
          <h1 className="font-display text-2xl sm:text-3xl text-pine-dark">
            Projects
          </h1>
          <p className="mt-2 text-sm text-ink/60 max-w-xl">
            Shown on the public Projects page. Mark a project "Featured" to
            surface it on the homepage.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center justify-center rounded-full bg-pine px-5 py-2.5 text-sm font-semibold text-white hover:bg-pine-light transition-all hover:-translate-y-0.5 active:translate-y-0 shrink-0"
        >
          Add Project
        </button>
      </motion.div>

      {!loading && !loadError && items.length > 0 && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl">
          <div className="rounded-xl border border-ink/10 bg-white/60 p-3.5">
            <p className="text-[11px] text-ink/50">Active projects</p>
            <p className="font-display text-lg text-pine-dark">{activeCount}</p>
          </div>
          <div className="rounded-xl border border-ink/10 bg-white/60 p-3.5">
            <p className="text-[11px] text-ink/50">Total budget</p>
            <p className="font-display text-lg text-pine-dark">{formatMoney(totalBudget)}</p>
          </div>
          <div className="rounded-xl border border-ink/10 bg-white/60 p-3.5">
            <p className="text-[11px] text-ink/50">Total spent</p>
            <p className="font-display text-lg text-pine-dark">{formatMoney(totalSpent)}</p>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {["all", "planned", "active", "completed"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            aria-pressed={statusFilter === s}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors capitalize ${
              statusFilter === s
                ? "bg-pine text-white border-pine"
                : "border-ink/15 text-ink/60 hover:border-pine/40"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {loading && <p className="text-sm text-ink/50">Loading projects…</p>}

        {!loading && loadError && (
          <div className="rounded-2xl border border-care/30 bg-care/5 p-6">
            <p className="text-sm text-care">
              Couldn't load projects. Make sure the Supabase migrations have
              been run and your .env is configured — see
              docs/SUPABASE_SETUP.md.
            </p>
          </div>
        )}

        {!loading && !loadError && filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-ink/20 p-10 text-center">
            <p className="text-sm text-ink/50">
              {items.length === 0
                ? "No projects added yet."
                : "No projects match this filter."}
            </p>
          </div>
        )}

        {!loading && !loadError && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((item, i) => {
              const cover = coverOf(item);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
                  className="flex flex-col gap-3 rounded-2xl border border-ink/10 bg-white/60 p-4 sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-pine/10 grid place-items-center text-pine-dark font-display text-sm">
                      {cover?.image_url ? (
                        <img src={cover.image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        (item.title || "?").slice(0, 1)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-pine-dark text-sm truncate">{item.title}</p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
                            statusStyles[item.status] || statusStyles.planned
                          }`}
                        >
                          {item.status}
                        </span>
                        {item.featured && (
                          <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-education/15 text-education-dark">
                            Featured
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink/50 truncate">
                        {categories.find((c) => c.value === item.category)?.label || item.category}
                        {item.branches?.name ? ` · ${item.branches.name}` : item.location ? ` · ${item.location}` : ""}
                        {item.budget ? ` · ${formatMoney(item.amount_spent)} of ${formatMoney(item.budget)}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto sm:shrink-0">
                    {statuses
                      .filter((s) => s.value !== item.status)
                      .map((s) => (
                        <button
                          key={s.value}
                          onClick={() => setStatus(item, s.value)}
                          className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink/60 border border-ink/15 hover:bg-ink/5 transition-colors"
                        >
                          {s.label}
                        </button>
                      ))}
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
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        title={editingId ? "Edit project" : "Add project"}
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

          <div className="grid grid-cols-2 gap-4">
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
              <label htmlFor="status" className="block text-sm font-medium text-pine-dark mb-1.5">
                Status
              </label>
              <select
                id="status"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm bg-white"
              >
                {statuses.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
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
              label="Location (optional)"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            />
            <div>
              <label htmlFor="branch_id" className="block text-sm font-medium text-pine-dark mb-1.5">
                Branch (optional)
              </label>
              <select
                id="branch_id"
                value={form.branch_id}
                onChange={(e) => setForm((f) => ({ ...f, branch_id: e.target.value }))}
                className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm bg-white"
              >
                <option value="">No branch</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field
              id="start_date"
              label="Start date (optional)"
              type="date"
              value={form.start_date}
              onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
            />
            <div>
              <Field
                id="end_date"
                label="End date (optional)"
                type="date"
                value={form.end_date}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
              />
              {errors.end_date && (
                <p role="alert" className="mt-1.5 text-xs text-care">{errors.end_date}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Field
                id="budget"
                label="Budget (Rs., optional)"
                type="number"
                min="0"
                step="0.01"
                value={form.budget}
                onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
              />
              {errors.budget && (
                <p role="alert" className="mt-1.5 text-xs text-care">{errors.budget}</p>
              )}
            </div>
            <div>
              <Field
                id="amount_spent"
                label="Amount spent so far (Rs.)"
                type="number"
                min="0"
                step="0.01"
                value={form.amount_spent}
                onChange={(e) => setForm((f) => ({ ...f, amount_spent: e.target.value }))}
              />
              {errors.amount_spent && (
                <p role="alert" className="mt-1.5 text-xs text-care">{errors.amount_spent}</p>
              )}
              <p className="mt-1.5 text-xs text-ink/40">
                A running total — expenses recorded against this project
                don't update it automatically yet.
              </p>
            </div>
          </div>

          <ImageUploadField
            label="Cover image (optional)"
            bucket="project-images"
            pathPrefix="projects"
            shape="square"
            value={form.cover_image_url}
            onChange={(url) => setForm((f) => ({ ...f, cover_image_url: url }))}
            onError={(msg) => showToast("error", msg)}
          />

          <label className="flex items-center gap-2 text-sm text-ink/70">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
              className="rounded border-ink/30"
            />
            Feature on homepage
          </label>

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
        title="Delete project?"
        message={
          deleteTarget
            ? `This will permanently remove "${deleteTarget.title}" and its photos. Any expenses recorded against it will keep their records but lose the project link. This can't be undone.`
            : ""
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Toast toast={toast} />
    </div>
  );
}
