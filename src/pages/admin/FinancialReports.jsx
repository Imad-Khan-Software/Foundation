import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import { supabase } from "../../lib/supabaseClient";
import Toast from "../../components/admin/Toast";
import Modal from "../../components/admin/Modal";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import { useToast } from "../../components/admin/useToast";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Expected Excel layout — one row of data, with these exact column
// headers in the first row of the first sheet:
//   Month | Year | Total Donations | Total Expenses |
//   Education Spending | Health Spending | Care Spending |
//   Administration Spending | Other Spending | Description
// "Month" can be a number (1-12) or a name ("August"). Everything else
// should be plain numbers. Only Month, Year, Total Donations, and Total
// Expenses are required — spending category columns default to 0 and
// Description is optional.
function parseWorkbook(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        if (!rows.length) {
          reject(new Error("The file doesn't have any data rows."));
          return;
        }
        resolve(rows[0]);
      } catch {
        reject(new Error("Couldn't read that file. Make sure it's a valid .xlsx or .csv file."));
      }
    };
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.readAsArrayBuffer(file);
  });
}

function toMonthNumber(value) {
  if (typeof value === "number") return value;
  const idx = months.findIndex(
    (m) => m.toLowerCase() === String(value).trim().toLowerCase()
  );
  return idx === -1 ? "" : idx + 1;
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

const emptyForm = {
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  report_title: "",
  description: "",
  total_donations: "",
  total_expenses: "",
  education_spending: "",
  health_spending: "",
  care_spending: "",
  administration_spending: "",
  other_spending: "",
  published: false,
};

function Field({ label, id, textarea, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-pine-dark mb-1.5">
        {label}
      </label>
      {textarea ? (
        <textarea id={id} rows={2} {...props} className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm bg-white resize-none" />
      ) : (
        <input id={id} {...props} className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm bg-white" />
      )}
    </div>
  );
}

export default function FinancialReports() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, showToast] = useToast();

  async function loadReports() {
    setLoading(true);
    setLoadError(false);
    const { data, error } = await supabase
      .from("financial_reports")
      .select("*")
      .order("year", { ascending: false })
      .order("month", { ascending: false, nullsFirst: false });

    if (error) {
      setLoadError(true);
      setLoading(false);
      return;
    }
    setItems(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadReports();
  }, []);

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setUploadError("");
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditingId(item.id);
    setForm({
      year: item.year,
      month: item.month || "",
      report_title: item.report_title,
      description: item.description || "",
      total_donations: String(item.total_donations),
      total_expenses: String(item.total_expenses),
      education_spending: String(item.education_spending),
      health_spending: String(item.health_spending),
      care_spending: String(item.care_spending),
      administration_spending: String(item.administration_spending),
      other_spending: String(item.other_spending),
      published: item.published,
    });
    setErrors({});
    setUploadError("");
    setModalOpen(true);
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setUploadError("");
    try {
      const row = await parseWorkbook(file);
      const monthNum = toMonthNumber(row["Month"]);
      const year = Number(row["Year"]) || new Date().getFullYear();
      setForm({
        year,
        month: monthNum || "",
        report_title:
          row["Report Title"] ||
          (monthNum ? `${months[monthNum - 1]} ${year} Report` : `${year} Report`),
        description: row["Description"] || "",
        total_donations: String(num(row["Total Donations"])),
        total_expenses: String(num(row["Total Expenses"])),
        education_spending: String(num(row["Education Spending"])),
        health_spending: String(num(row["Health Spending"])),
        care_spending: String(num(row["Care Spending"])),
        administration_spending: String(num(row["Administration Spending"])),
        other_spending: String(num(row["Other Spending"])),
        published: false,
      });
      showToast("success", "File read — check the numbers below, then save.");
    } catch (err) {
      setUploadError(err.message);
    }
  }

  function validate() {
    const next = {};
    if (!form.year) next.year = "Year is required.";
    if (form.total_donations === "" || Number.isNaN(Number(form.total_donations)))
      next.total_donations = "Enter a number (0 if none).";
    if (form.total_expenses === "" || Number.isNaN(Number(form.total_expenses)))
      next.total_expenses = "Enter a number (0 if none).";
    if (!form.report_title.trim()) next.report_title = "Give this report a title.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    const payload = {
      year: Number(form.year),
      month: form.month === "" ? null : Number(form.month),
      report_title: form.report_title,
      description: form.description || null,
      total_donations: num(form.total_donations),
      total_expenses: num(form.total_expenses),
      education_spending: num(form.education_spending),
      health_spending: num(form.health_spending),
      care_spending: num(form.care_spending),
      administration_spending: num(form.administration_spending),
      other_spending: num(form.other_spending),
      published: form.published,
    };

    const { error } = editingId
      ? await supabase.from("financial_reports").update(payload).eq("id", editingId)
      : await supabase.from("financial_reports").insert(payload);

    setSaving(false);
    if (error) {
      showToast("error", "Couldn't save this report. Please try again.");
      return;
    }
    setModalOpen(false);
    showToast("success", editingId ? "Report updated." : "Report added.");
    loadReports();
  }

  async function togglePublished(item) {
    const { error } = await supabase
      .from("financial_reports")
      .update({ published: !item.published })
      .eq("id", item.id);
    if (error) {
      showToast("error", "Couldn't update this report. Please try again.");
      return;
    }
    showToast("success", item.published ? "Unpublished." : "Published — now visible on the public Transparency page.");
    loadReports();
  }

  async function handleDelete() {
    const target = deleteTarget;
    setDeleteTarget(null);
    const { error } = await supabase.from("financial_reports").delete().eq("id", target.id);
    if (error) {
      showToast("error", "Couldn't delete this report. Please try again.");
      return;
    }
    showToast("success", "Report deleted.");
    loadReports();
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-4 pb-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <p className="eyebrow mb-2">Admin</p>
          <h1 className="font-display text-2xl sm:text-3xl text-pine-dark">
            Financial Reports
          </h1>
          <p className="mt-2 text-sm text-ink/60 max-w-xl">
            Upload your month-end Excel file, review the numbers, and publish
            to show them on the public Transparency page.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center justify-center rounded-full bg-pine px-5 py-2.5 text-sm font-semibold text-white hover:bg-pine-light transition-all hover:-translate-y-0.5 active:translate-y-0 shrink-0"
        >
          Add Report
        </button>
      </motion.div>

      <div className="mt-8">
        {loading && <p className="text-sm text-ink/50">Loading reports…</p>}

        {!loading && loadError && (
          <div className="rounded-2xl border border-care/30 bg-care/5 p-6">
            <p className="text-sm text-care">Couldn't load reports. Please try again.</p>
          </div>
        )}

        {!loading && !loadError && items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-ink/20 p-10 text-center">
            <p className="text-sm text-ink/50">No reports added yet.</p>
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
                      <p className="font-medium text-pine-dark text-sm">{item.report_title}</p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          item.published ? "bg-education/15 text-education-dark" : "bg-ink/10 text-ink/40"
                        }`}
                      >
                        {item.published ? "Published" : "Draft"}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-ink/50">
                      {item.month ? `${months[item.month - 1]} ` : ""}{item.year} · Rs. {Number(item.total_donations).toLocaleString()} received · Rs. {Number(item.total_expenses).toLocaleString()} spent
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
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
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        title={editingId ? "Edit report" : "Add report"}
        onClose={() => setModalOpen(false)}
      >
        <div className="space-y-4">
          {!editingId && (
            <div className="rounded-xl border border-dashed border-ink/20 p-4">
              <label htmlFor="excel_upload" className="block text-sm font-medium text-pine-dark mb-1.5">
                Upload Excel file (optional — fills in the form below)
              </label>
              <input
                id="excel_upload"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="w-full text-sm"
              />
              <p className="mt-1.5 text-xs text-ink/40">
                First row needs these column headers: Month, Year, Total
                Donations, Total Expenses, Education Spending, Health
                Spending, Care Spending, Administration Spending, Other
                Spending, Description (optional).
              </p>
              {uploadError && (
                <p role="alert" className="mt-1.5 text-xs text-care">{uploadError}</p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="month" className="block text-sm font-medium text-pine-dark mb-1.5">
                  Month (optional — leave blank for a full-year report)
                </label>
                <select
                  id="month"
                  value={form.month}
                  onChange={(e) => setForm((f) => ({ ...f, month: e.target.value }))}
                  className="w-full rounded-lg border border-ink/15 px-3.5 py-2.5 text-sm bg-white"
                >
                  <option value="">Full year</option>
                  {months.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <Field
                  id="year"
                  label="Year"
                  type="number"
                  value={form.year}
                  onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                />
                {errors.year && <p role="alert" className="mt-1.5 text-xs text-care">{errors.year}</p>}
              </div>
            </div>

            <div>
              <Field
                id="report_title"
                label="Report title"
                placeholder="e.g. August 2026 Report"
                value={form.report_title}
                onChange={(e) => setForm((f) => ({ ...f, report_title: e.target.value }))}
              />
              {errors.report_title && <p role="alert" className="mt-1.5 text-xs text-care">{errors.report_title}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Field
                  id="total_donations"
                  label="Total received (Rs.)"
                  type="number"
                  step="0.01"
                  value={form.total_donations}
                  onChange={(e) => setForm((f) => ({ ...f, total_donations: e.target.value }))}
                />
                {errors.total_donations && <p role="alert" className="mt-1.5 text-xs text-care">{errors.total_donations}</p>}
              </div>
              <div>
                <Field
                  id="total_expenses"
                  label="Total spent (Rs.)"
                  type="number"
                  step="0.01"
                  value={form.total_expenses}
                  onChange={(e) => setForm((f) => ({ ...f, total_expenses: e.target.value }))}
                />
                {errors.total_expenses && <p role="alert" className="mt-1.5 text-xs text-care">{errors.total_expenses}</p>}
              </div>
            </div>

            <p className="text-xs font-medium text-ink/50 uppercase tracking-wide pt-1">Spending by category (Rs.)</p>
            <div className="grid grid-cols-2 gap-4">
              <Field id="education_spending" label="Education" type="number" step="0.01" value={form.education_spending} onChange={(e) => setForm((f) => ({ ...f, education_spending: e.target.value }))} />
              <Field id="health_spending" label="Health" type="number" step="0.01" value={form.health_spending} onChange={(e) => setForm((f) => ({ ...f, health_spending: e.target.value }))} />
              <Field id="care_spending" label="Care" type="number" step="0.01" value={form.care_spending} onChange={(e) => setForm((f) => ({ ...f, care_spending: e.target.value }))} />
              <Field id="administration_spending" label="Administration" type="number" step="0.01" value={form.administration_spending} onChange={(e) => setForm((f) => ({ ...f, administration_spending: e.target.value }))} />
            </div>
            <Field id="other_spending" label="Other (Rs.)" type="number" step="0.01" value={form.other_spending} onChange={(e) => setForm((f) => ({ ...f, other_spending: e.target.value }))} />

            <Field
              id="description"
              label="Description (optional)"
              textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />

            <label className="flex items-center gap-2 text-sm text-ink/70">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                className="rounded border-ink/30"
              />
              Publish immediately (visible on the public Transparency page)
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
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteTarget}
        title="Delete report?"
        message={deleteTarget ? `This will permanently remove "${deleteTarget.report_title}". This can't be undone.` : ""}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Toast toast={toast} />
    </div>
  );
}
