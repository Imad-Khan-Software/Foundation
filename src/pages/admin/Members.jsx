import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import Toast from "../../components/admin/Toast";
import Modal from "../../components/admin/Modal";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import ImageUploadField from "../../components/admin/ImageUploadField";
import { useToast } from "../../components/admin/useToast";

const emptyForm = {
  name: "",
  designation: "",
  branch_id: "",
  description: "",
  photo_url: "",
  active: true,
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

export default function AdminMembers() {
  const [items, setItems] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, showToast] = useToast();

  async function loadData() {
    setLoading(true);
    setLoadError(false);

    // branch_id is a real foreign key (see supabase/migrations/0001_schema.sql),
    // so this join fetches each member's branch name in one query instead of
    // storing branch names redundantly on the members table.
    const [membersRes, branchesRes] = await Promise.all([
      supabase
        .from("members")
        .select("*, branches(name)")
        .order("name", { ascending: true }),
      supabase.from("branches").select("id, name").order("name", { ascending: true }),
    ]);

    if (membersRes.error || branchesRes.error) {
      setLoadError(true);
      setLoading(false);
      return;
    }
    setItems(membersRes.data || []);
    setBranches(branchesRes.data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
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
      name: item.name || "",
      designation: item.designation || "",
      branch_id: item.branch_id || "",
      description: item.description || "",
      photo_url: item.photo_url || "",
      active: item.active,
    });
    setErrors({});
    setModalOpen(true);
  }

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = "Name is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    const payload = {
      name: form.name,
      designation: form.designation,
      branch_id: form.branch_id || null, // branch is optional
      description: form.description,
      photo_url: form.photo_url || null,
      active: form.active,
    };

    const { error } = editingId
      ? await supabase.from("members").update(payload).eq("id", editingId)
      : await supabase.from("members").insert(payload);

    setSaving(false);

    if (error) {
      console.error("Failed to save member:", error);
      showToast("error", "Couldn't save member. Please try again.");
      return;
    }
    setModalOpen(false);
    showToast("success", editingId ? "Member updated." : "Member added.");
    loadData();
  }

  async function handleDelete() {
    const target = deleteTarget;
    setDeleteTarget(null);
    const { error } = await supabase.from("members").delete().eq("id", target.id);
    if (error) {
      console.error("Failed to delete member:", error);
      showToast("error", "Couldn't delete member. Please try again.");
      return;
    }
    showToast("success", "Member deleted.");
    loadData();
  }

  async function toggleActive(item) {
    const { error } = await supabase
      .from("members")
      .update({ active: !item.active })
      .eq("id", item.id);
    if (error) {
      console.error("Failed to update member status:", error);
      showToast("error", "Couldn't update status. Please try again.");
      return;
    }
    showToast("success", item.active ? "Member deactivated." : "Member activated.");
    loadData();
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
            Members
          </h1>
          <p className="mt-2 text-sm text-ink/60 max-w-xl">
            General members shown on the public Team page.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center justify-center rounded-full bg-pine px-5 py-2.5 text-sm font-semibold text-white hover:bg-pine-light transition-all hover:-translate-y-0.5 active:translate-y-0 shrink-0"
        >
          Add Member
        </button>
      </motion.div>

      <div className="mt-8">
        {loading && <p className="text-sm text-ink/50">Loading members…</p>}

        {!loading && loadError && (
          <div className="rounded-2xl border border-care/30 bg-care/5 p-6">
            <p className="text-sm text-care">
              Couldn't load members. Make sure the Supabase migrations have
              been run and your .env is configured — see
              docs/SUPABASE_SETUP.md.
            </p>
          </div>
        )}

        {!loading && !loadError && items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-ink/20 p-10 text-center">
            <p className="text-sm text-ink/50">No members added yet.</p>
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
                  <div className="h-12 w-12 shrink-0 rounded-full overflow-hidden bg-health/10 grid place-items-center text-health-dark font-display text-sm">
                    {item.photo_url ? (
                      <img src={item.photo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      (item.name || "?").slice(0, 1)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-pine-dark text-sm truncate">{item.name}</p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          item.active ? "bg-education/15 text-education-dark" : "bg-ink/10 text-ink/40"
                        }`}
                      >
                        {item.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-xs text-ink/50 truncate">
                      {item.designation || "—"}
                      {item.branches?.name ? ` · ${item.branches.name}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:ml-auto sm:shrink-0">
                  <button
                    onClick={() => toggleActive(item)}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink/60 border border-ink/15 hover:bg-ink/5 transition-colors"
                  >
                    {item.active ? "Deactivate" : "Activate"}
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
        title={editingId ? "Edit member" : "Add member"}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <Field
              id="name"
              label="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            {errors.name && (
              <p role="alert" className="mt-1.5 text-xs text-care">{errors.name}</p>
            )}
          </div>
          <Field
            id="designation"
            label="Designation"
            value={form.designation}
            onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
          />
          <div>
            <label htmlFor="branch_id" className="block text-sm font-medium text-pine-dark mb-1.5">
              Branch
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
          <Field
            id="description"
            label="Description"
            textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <ImageUploadField
            label="Photo"
            bucket="member-images"
            pathPrefix="members"
            value={form.photo_url}
            onChange={(url) => setForm((f) => ({ ...f, photo_url: url }))}
            onError={(msg) => showToast("error", msg)}
          />
          <div>
            <label htmlFor="active" className="block text-sm font-medium text-pine-dark mb-1.5">
              Status
            </label>
            <select
              id="active"
              value={form.active ? "active" : "inactive"}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.value === "active" }))}
              className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm bg-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
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
        title="Delete member?"
        message={deleteTarget ? `This will permanently remove "${deleteTarget.name}". This can't be undone.` : ""}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Toast toast={toast} />
    </div>
  );
}
