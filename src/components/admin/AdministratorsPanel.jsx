import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/useAuth";
import ConfirmDialog from "./ConfirmDialog";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Read-only-except-for-active-toggle admin list. There is deliberately no
// "add administrator" button here — per the brief, admin accounts are only
// ever created directly in Supabase (see docs/SUPABASE_SETUP.md), never
// from the app. The (de)activate action is the only write this panel makes,
// and it's still fully gated server-side: 0009_multi_admin.sql's RLS lets
// an active admin update *other* rows, but a trigger silently no-ops any
// attempt to touch role/email or one's own is_active flag — so even if this
// UI had a bug, an admin could never lock themselves out or promote anyone.
export default function AdministratorsPanel({ showToast }) {
  const { profile: currentProfile } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [pendingToggle, setPendingToggle] = useState(null); // the admin row being confirmed
  const [savingId, setSavingId] = useState(null);

  async function loadAdmins() {
    setLoading(true);
    setLoadError(false);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, is_active, created_at")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to load administrators:", error);
      setLoadError(true);
      setLoading(false);
      return;
    }
    setAdmins(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadAdmins();
  }, []);

  async function handleToggleConfirmed() {
    const target = pendingToggle;
    setPendingToggle(null);
    if (!target) return;

    setSavingId(target.id);
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !target.is_active })
      .eq("id", target.id);
    setSavingId(null);

    if (error) {
      console.error("Failed to update administrator status:", error);
      showToast?.("error", "Couldn't update that administrator. Please try again.");
      return;
    }

    setAdmins((prev) =>
      prev.map((a) => (a.id === target.id ? { ...a, is_active: !a.is_active } : a))
    );
    showToast?.(
      "success",
      target.is_active
        ? "Administrator deactivated."
        : "Administrator reactivated."
    );
  }

  if (loading) {
    return <p className="text-sm text-ink/50">Loading administrators…</p>;
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-care/30 bg-care/5 p-6">
        <p className="text-sm text-care">
          Couldn't load administrators. Make sure migration
          0009_multi_admin.sql has been run.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mt-6 rounded-2xl border border-ink/10 bg-white/60 p-5 sm:p-6"
    >
      <p className="eyebrow mb-1">Access</p>
      <h2 className="font-display text-lg text-pine-dark">Administrators</h2>
    
      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/40">
              <th className="py-2 pr-4 font-medium">Name</th>
              <th className="py-2 pr-4 font-medium">Email</th>
              <th className="py-2 pr-4 font-medium">Role</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 pr-4 font-medium">Added</th>
              <th className="py-2 pr-0 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => {
              const isSelf = a.id === currentProfile?.id;
              return (
                <tr key={a.id} className="border-b border-ink/5 last:border-0">
                  <td className="py-3 pr-4 font-medium text-pine-dark">
                    {a.full_name || "—"}
                    {isSelf && (
                      <span className="ml-2 rounded-full bg-pine/10 px-2 py-0.5 text-[11px] font-medium text-pine-dark">
                        You
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-ink/70">{a.email}</td>
                  <td className="py-3 pr-4 capitalize text-ink/70">{a.role}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        a.is_active
                          ? "bg-pine/10 text-pine-dark"
                          : "bg-care/10 text-care"
                      }`}
                    >
                      {a.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-ink/50">{formatDate(a.created_at)}</td>
                  <td className="py-3 pr-0 text-right">
                    <button
                      type="button"
                      disabled={isSelf || savingId === a.id}
                      onClick={() => setPendingToggle(a)}
                      title={
                        isSelf
                          ? "You can't change your own status — ask another administrator."
                          : undefined
                      }
                      className="rounded-full border border-ink/15 px-3.5 py-1.5 text-xs font-semibold text-pine-dark hover:bg-ink/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {savingId === a.id
                        ? "Saving…"
                        : a.is_active
                        ? "Deactivate"
                        : "Activate"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!pendingToggle}
        title={
          pendingToggle?.is_active
            ? "Deactivate administrator?"
            : "Reactivate administrator?"
        }
        message={
          pendingToggle?.is_active
            ? `${pendingToggle?.full_name || pendingToggle?.email} will immediately lose access to the admin panel, including any devices where they're already signed in.`
            : `${pendingToggle?.full_name || pendingToggle?.email} will be able to sign in to the admin panel again.`
        }
        confirmLabel={pendingToggle?.is_active ? "Deactivate" : "Activate"}
        onConfirm={handleToggleConfirmed}
        onCancel={() => setPendingToggle(null)}
      />
    </motion.div>
  );
}
