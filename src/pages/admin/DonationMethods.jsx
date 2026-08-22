import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import Toast from "../../components/admin/Toast";
import Modal from "../../components/admin/Modal";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import { useToast } from "../../components/admin/useToast";

// donation_methods already existed from Phase 2 (0001_schema.sql) with
// method_name, account_details, instructions, active, display_order —
// reused as-is. Different payment methods need different account info
// (Bank Transfer needs a bank name + IBAN, Easypaisa/JazzCash just need a
// mobile number), so rather than add columns for every possible field,
// "Account details" is one free-text box where the admin writes whatever's
// relevant, one "Label: Value" pair per line — e.g.:
//   Account Title: Ikhlass Welfare Foundation
//   Bank: XYZ Bank
//   Account Number: 1234567890
//   IBAN: PK00XYZ0000000000000000
// The public Donate page (src/pages/Donate.jsx) parses those lines back
// into the same labeled rows it already displayed with sample data.
const emptyForm = {
  method_name: "",
  account_details: "",
  instructions: "",
  active: true,
};

const detailsPlaceholder = `Account Title: Ikhlass Welfare Foundation
Bank: XYZ Bank
Account Number: 1234567890
IBAN: PK00XYZ0000000000000000`;

function Field({ label, id, textarea, rows, hint, ...props }) {
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
          className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm bg-white resize-none font-mono"
        />
      ) : (
        <input
          id={id}
          {...props}
          className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm bg-white"
        />
      )}
      {hint && <p className="mt-1.5 text-xs text-ink/40">{hint}</p>}
    </div>
  );
}

export default function DonationMethods() {
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

  async function loadMethods() {
    setLoading(true);
    setLoadError(false);
    const { data, error } = await supabase
      .from("donation_methods")
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
    loadMethods();
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
      method_name: item.method_name || "",
      account_details: item.account_details || "",
      instructions: item.instructions || "",
      active: item.active,
    });
    setErrors({});
    setModalOpen(true);
  }

  function validate() {
    const next = {};
    if (!form.method_name.trim()) next.method_name = "Method name is required.";
    if (!form.account_details.trim())
      next.account_details = "Add at least the account information donors will need.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    const payload = {
      method_name: form.method_name,
      account_details: form.account_details,
      instructions: form.instructions || null,
      active: form.active,
    };

    const { error } = editingId
      ? await supabase.from("donation_methods").update(payload).eq("id", editingId)
      : await supabase.from("donation_methods").insert(payload);

    setSaving(false);

    if (error) {
      showToast("error", "Couldn't save donation method. Please try again.");
      return;
    }
    setModalOpen(false);
    showToast("success", editingId ? "Donation method updated." : "Donation method added.");
    loadMethods();
  }

  async function handleDelete() {
    const target = deleteTarget;
    setDeleteTarget(null);
    const { error } = await supabase.from("donation_methods").delete().eq("id", target.id);
    if (error) {
      showToast("error", "Couldn't delete donation method. Please try again.");
      return;
    }
    showToast("success", "Donation method deleted.");
    loadMethods();
  }

  async function toggleActive(item) {
    const { error } = await supabase
      .from("donation_methods")
      .update({ active: !item.active })
      .eq("id", item.id);
    if (error) {
      showToast("error", "Couldn't update status. Please try again.");
      return;
    }
    showToast("success", item.active ? "Method deactivated." : "Method activated.");
    loadMethods();
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
            Donation Methods
          </h1>
          <p className="mt-2 text-sm text-ink/60 max-w-xl">
            Active methods appear on the public Donate page.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center justify-center rounded-full bg-pine px-5 py-2.5 text-sm font-semibold text-white hover:bg-pine-light transition-all hover:-translate-y-0.5 active:translate-y-0 shrink-0"
        >
          Add Method
        </button>
      </motion.div>

      <div className="mt-8">
        {loading && <p className="text-sm text-ink/50">Loading donation methods…</p>}

        {!loading && loadError && (
          <div className="rounded-2xl border border-care/30 bg-care/5 p-6">
            <p className="text-sm text-care">
              Couldn't load donation methods. Make sure your .env is
              configured — see docs/SUPABASE_SETUP.md.
            </p>
          </div>
        )}

        {!loading && !loadError && items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-ink/20 p-10 text-center">
            <p className="text-sm text-ink/50">No donation methods configured yet.</p>
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
                className="min-w-0 rounded-2xl border border-ink/10 bg-white/60 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-pine-dark text-sm">{item.method_name}</p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          item.active ? "bg-education/15 text-education-dark" : "bg-ink/10 text-ink/40"
                        }`}
                      >
                        {item.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-ink/50 whitespace-pre-line break-words">
                      {item.account_details}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
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
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        title={editingId ? "Edit donation method" : "Add donation method"}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <Field
              id="method_name"
              label="Method name"
              placeholder="e.g. Bank Transfer, Easypaisa, JazzCash"
              value={form.method_name}
              onChange={(e) => setForm((f) => ({ ...f, method_name: e.target.value }))}
            />
            {errors.method_name && (
              <p role="alert" className="mt-1.5 text-xs text-care">{errors.method_name}</p>
            )}
          </div>

          <div>
            <Field
              id="account_details"
              label="Account details"
              textarea
              rows={5}
              placeholder={detailsPlaceholder}
              hint='One "Label: Value" per line — only include what this method needs.'
              value={form.account_details}
              onChange={(e) => setForm((f) => ({ ...f, account_details: e.target.value }))}
            />
            {errors.account_details && (
              <p role="alert" className="mt-1.5 text-xs text-care">{errors.account_details}</p>
            )}
          </div>

          <Field
            id="instructions"
            label="Instructions (optional)"
            textarea
            rows={2}
            placeholder="e.g. Please send your payment reference to us on WhatsApp after donating."
            value={form.instructions}
            onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
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
              <option value="inactive">Inactive</option>
              <option value="active">Active</option>
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
        title="Delete donation method?"
        message={deleteTarget ? `This will permanently remove "${deleteTarget.method_name}". This can't be undone.` : ""}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Toast toast={toast} />
    </div>
  );
}
