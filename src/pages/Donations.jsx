import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import Toast from "../../components/admin/Toast";
import Modal from "../../components/admin/Modal";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import ReceiptUploadField from "../../components/admin/ReceiptUploadField";
import { useToast } from "../../components/admin/useToast";

const categories = [
  { value: "education", label: "Education" },
  { value: "health", label: "Health" },
  { value: "care", label: "Care" },
  { value: "general", label: "General" },
  { value: "other", label: "Other" },
];

const statuses = [
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
];

const statusStyles = {
  pending: "bg-ink/10 text-ink/50",
  verified: "bg-education/15 text-education-dark",
  rejected: "bg-care/15 text-care",
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const emptyForm = {
  amount: "",
  donation_date: todayStr(),
  category: "general",
  payment_method: "",
  donor_name: "",
  is_anonymous: false,
  is_public: true,
  reference_number: "",
  notes: "",
  verification_status: "pending",
  receipt_path: "",
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
          rows={rows || 2}
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

export default function Donations() {
  const [items, setItems] = useState([]);
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [toast, showToast] = useToast();

  async function loadDonations() {
    setLoading(true);
    setLoadError(false);
    const { data, error } = await supabase
      .from("donations")
      .select("*")
      .order("donation_date", { ascending: false });

    if (error) {
      setLoadError(true);
      setLoading(false);
      return;
    }
    setItems(data || []);
    setLoading(false);
  }

  async function loadMethods() {
    // Only need the names for the payment-method dropdown, and any method
    // (active or not) so editing an older donation doesn't lose its value.
    const { data } = await supabase
      .from("donation_methods")
      .select("method_name")
      .order("display_order", { ascending: true });
    setMethods(data || []);
  }

  useEffect(() => {
    loadDonations();
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
      amount: String(item.amount ?? ""),
      donation_date: item.donation_date || todayStr(),
      category: item.category || "general",
      payment_method: item.payment_method || "",
      donor_name: item.donor_name || "",
      is_anonymous: item.is_anonymous,
      is_public: item.is_public,
      reference_number: item.reference_number || "",
      notes: item.notes || "",
      verification_status: item.verification_status || "pending",
      receipt_path: item.receipt_path || "",
    });
    setErrors({});
    setModalOpen(true);
  }

  // Matches the `donations.amount` column's numeric(12,2) definition
  // (supabase/migrations/0001_schema.sql).
  const MAX_AMOUNT = 9_999_999_999.99;

  function validate() {
    const next = {};
    const amountNum = Number(form.amount);
    if (!form.amount || Number.isNaN(amountNum) || amountNum <= 0) {
      next.amount = "Enter an amount greater than 0.";
    } else if (amountNum > MAX_AMOUNT) {
      next.amount = `Amount is too large — check for extra digits (max Rs. ${MAX_AMOUNT.toLocaleString()}).`;
    }
    if (!form.donation_date) next.donation_date = "Date is required.";
    if (!form.category) next.category = "Category is required.";
    if (!form.payment_method.trim()) next.payment_method = "Payment method is required.";
    if (!form.verification_status) next.verification_status = "Status is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    const payload = {
      amount: Number(form.amount),
      donation_date: form.donation_date,
      category: form.category,
      payment_method: form.payment_method,
      donor_name: form.donor_name || null,
      is_anonymous: form.is_anonymous,
      is_public: form.is_public,
      reference_number: form.reference_number || null,
      notes: form.notes || null,
      verification_status: form.verification_status,
      receipt_path: form.receipt_path || null,
    };

    const { error } = editingId
      ? await supabase.from("donations").update(payload).eq("id", editingId)
      : await supabase.from("donations").insert(payload);

    setSaving(false);

    if (error) {
      showToast("error", "Couldn't save donation. Please try again.");
      return;
    }
    setModalOpen(false);
    showToast("success", editingId ? "Donation updated." : "Donation added.");
    loadDonations();
  }

  async function handleDelete() {
    const target = deleteTarget;
    setDeleteTarget(null);
    const { error } = await supabase.from("donations").delete().eq("id", target.id);
    if (error) {
      showToast("error", "Couldn't delete donation. Please try again.");
      return;
    }
    showToast("success", "Donation deleted.");
    loadDonations();
  }

  async function setStatus(item, status) {
    const { error } = await supabase
      .from("donations")
      .update({ verification_status: status })
      .eq("id", item.id);
    if (error) {
      showToast("error", "Couldn't update status. Please try again.");
      return;
    }
    showToast("success", `Marked as ${status}.`);
    loadDonations();
  }

  async function viewReceipt(path) {
    const { data, error } = await supabase.storage
      .from("donation-receipts")
      .createSignedUrl(path, 60);
    if (error || !data?.signedUrl) {
      showToast("error", "Couldn't open receipt. Please try again.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  const filtered = items.filter(
    (d) => statusFilter === "all" || d.verification_status === statusFilter
  );

  const verifiedTotal = items
    .filter((d) => d.verification_status === "verified")
    .reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const pendingCount = items.filter((d) => d.verification_status === "pending").length;

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
            Donations
          </h1>
          <p className="mt-2 text-sm text-ink/60 max-w-xl">
            Only verified donations count toward public totals.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center justify-center rounded-full bg-pine px-5 py-2.5 text-sm font-semibold text-white hover:bg-pine-light transition-all hover:-translate-y-0.5 active:translate-y-0 shrink-0"
        >
          Add Donation
        </button>
      </motion.div>

      {!loading && !loadError && items.length > 0 && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl">
          <div className="rounded-xl border border-ink/10 bg-white/60 p-3.5">
            <p className="text-[11px] text-ink/50">Verified total</p>
            <p className="font-display text-lg text-pine-dark">{formatMoney(verifiedTotal)}</p>
          </div>
          <div className="rounded-xl border border-ink/10 bg-white/60 p-3.5">
            <p className="text-[11px] text-ink/50">Pending</p>
            <p className="font-display text-lg text-pine-dark">{pendingCount}</p>
          </div>
          <div className="rounded-xl border border-ink/10 bg-white/60 p-3.5">
            <p className="text-[11px] text-ink/50">Total records</p>
            <p className="font-display text-lg text-pine-dark">{items.length}</p>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {["all", "pending", "verified", "rejected"].map((s) => (
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
        {loading && <p className="text-sm text-ink/50">Loading donations…</p>}

        {!loading && loadError && (
          <div className="rounded-2xl border border-care/30 bg-care/5 p-6">
            <p className="text-sm text-care">
              Couldn't load donations. Make sure migration
              0008_donations_other_and_receipts.sql has been run and your
              .env is configured — see docs/SUPABASE_SETUP.md.
            </p>
          </div>
        )}

        {!loading && !loadError && filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-ink/20 p-10 text-center">
            <p className="text-sm text-ink/50">
              {items.length === 0
                ? "No donations recorded yet."
                : "No donations match this filter."}
            </p>
          </div>
        )}

        {!loading && !loadError && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((item, i) => (
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
                      <p className="font-display text-base text-pine-dark">
                        {formatMoney(item.amount)}
                      </p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
                          statusStyles[item.verification_status] || statusStyles.pending
                        }`}
                      >
                        {item.verification_status}
                      </span>
                      {!item.is_public && (
                        <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-ink/10 text-ink/40">
                          Private
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink/50 mt-0.5 truncate">
                      {item.donation_date} · {categories.find((c) => c.value === item.category)?.label || item.category}
                      {item.payment_method ? ` · ${item.payment_method}` : ""}
                      {" · "}
                      {item.is_anonymous ? "Anonymous" : item.donor_name || "No name given"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    {item.receipt_path && (
                      <button
                        onClick={() => viewReceipt(item.receipt_path)}
                        className="rounded-full px-3 py-1.5 text-xs font-semibold text-pine-dark border border-ink/15 hover:bg-ink/5 transition-colors"
                      >
                        View receipt
                      </button>
                    )}
                    {item.verification_status !== "verified" && (
                      <button
                        onClick={() => setStatus(item, "verified")}
                        className="rounded-full px-3 py-1.5 text-xs font-semibold text-education-dark border border-education/40 hover:bg-education/10 transition-colors"
                      >
                        Verify
                      </button>
                    )}
                    {item.verification_status !== "pending" && (
                      <button
                        onClick={() => setStatus(item, "pending")}
                        className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink/60 border border-ink/15 hover:bg-ink/5 transition-colors"
                      >
                        Mark pending
                      </button>
                    )}
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
        title={editingId ? "Edit donation" : "Add donation"}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Field
                id="amount"
                label="Amount (Rs.)"
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
              {errors.amount && (
                <p role="alert" className="mt-1.5 text-xs text-care">{errors.amount}</p>
              )}
            </div>
            <div>
              <Field
                id="donation_date"
                label="Date"
                type="date"
                value={form.donation_date}
                onChange={(e) => setForm((f) => ({ ...f, donation_date: e.target.value }))}
              />
              {errors.donation_date && (
                <p role="alert" className="mt-1.5 text-xs text-care">{errors.donation_date}</p>
              )}
            </div>
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
              <label htmlFor="payment_method" className="block text-sm font-medium text-pine-dark mb-1.5">
                Payment method
              </label>
              <input
                id="payment_method"
                list="payment-method-options"
                value={form.payment_method}
                onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value }))}
                className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm bg-white"
                placeholder="e.g. Bank Transfer"
              />
              <datalist id="payment-method-options">
                {methods.map((m) => (
                  <option key={m.method_name} value={m.method_name} />
                ))}
              </datalist>
              {errors.payment_method && (
                <p role="alert" className="mt-1.5 text-xs text-care">{errors.payment_method}</p>
              )}
            </div>
          </div>

          <Field
            id="donor_name"
            label="Donor name (optional)"
            value={form.donor_name}
            onChange={(e) => setForm((f) => ({ ...f, donor_name: e.target.value }))}
          />

          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <label className="flex items-center gap-2 text-sm text-ink/70">
              <input
                type="checkbox"
                checked={form.is_anonymous}
                onChange={(e) => setForm((f) => ({ ...f, is_anonymous: e.target.checked }))}
                className="rounded border-ink/30"
              />
              Keep donor anonymous
            </label>
            <label className="flex items-center gap-2 text-sm text-ink/70">
              <input
                type="checkbox"
                checked={form.is_public}
                onChange={(e) => setForm((f) => ({ ...f, is_public: e.target.checked }))}
                className="rounded border-ink/30"
              />
              Allow in public listing
            </label>
          </div>

          <Field
            id="reference_number"
            label="Reference / receipt number (optional)"
            value={form.reference_number}
            onChange={(e) => setForm((f) => ({ ...f, reference_number: e.target.value }))}
          />

          <Field
            id="notes"
            label="Notes (optional, admin-only)"
            textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />

          <ReceiptUploadField
            bucket="donation-receipts"
            value={form.receipt_path}
            onChange={(path) => setForm((f) => ({ ...f, receipt_path: path }))}
            onError={(msg) => showToast("error", msg)}
          />

          <div>
            <label htmlFor="verification_status" className="block text-sm font-medium text-pine-dark mb-1.5">
              Verification status
            </label>
            <select
              id="verification_status"
              value={form.verification_status}
              onChange={(e) => setForm((f) => ({ ...f, verification_status: e.target.value }))}
              className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm bg-white"
            >
              {statuses.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
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
        title="Delete donation?"
        message={deleteTarget ? `This will permanently remove this ${formatMoney(deleteTarget.amount)} donation record. This can't be undone.` : ""}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Toast toast={toast} />
    </div>
  );
}
