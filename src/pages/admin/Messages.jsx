import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import Toast from "../../components/admin/Toast";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import { useToast } from "../../components/admin/useToast";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Inbox for src/pages/Contact.jsx submissions (see supabase/migrations/
// 0010_contact_messages.sql). Anyone can submit; only an authorized admin
// can read, mark read/unread, or delete — enforced by RLS, not just this
// page not linking anywhere else.
export default function Messages() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState("all"); // all | unread
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [toast, showToast] = useToast();

  async function loadMessages() {
    setLoading(true);
    setLoadError(false);
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setLoadError(true);
      setLoading(false);
      return;
    }
    setItems(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadMessages();
  }, []);

  async function toggleRead(item) {
    const { error } = await supabase
      .from("contact_messages")
      .update({ is_read: !item.is_read })
      .eq("id", item.id);
    if (error) {
      showToast("error", "Couldn't update that message. Please try again.");
      return;
    }
    setItems((prev) =>
      prev.map((m) => (m.id === item.id ? { ...m, is_read: !m.is_read } : m))
    );
  }

  function openMessage(item) {
    setExpandedId((prev) => (prev === item.id ? null : item.id));
    // Opening an unread message marks it read, same as any email inbox —
    // but collapsing it again doesn't mark it unread, and this never
    // fires twice for an already-read message.
    if (!item.is_read) toggleRead(item);
  }

  async function handleDelete() {
    const target = deleteTarget;
    setDeleteTarget(null);
    const { error } = await supabase.from("contact_messages").delete().eq("id", target.id);
    if (error) {
      showToast("error", "Couldn't delete message. Please try again.");
      return;
    }
    setItems((prev) => prev.filter((m) => m.id !== target.id));
    showToast("success", "Message deleted.");
  }

  const filtered = items.filter((m) => filter === "all" || !m.is_read);
  const unreadCount = items.filter((m) => !m.is_read).length;

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="eyebrow mb-2">Admin</p>
        <h1 className="font-display text-2xl sm:text-3xl text-pine-dark">Messages</h1>
        <p className="mt-2 text-sm text-ink/60 max-w-xl">
          Submissions from the public Contact page.
        </p>
      </motion.div>

      <div className="mt-6 flex flex-wrap gap-2">
        {[
          { value: "all", label: "All" },
          { value: "unread", label: `Unread${unreadCount ? ` (${unreadCount})` : ""}` },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors ${
              filter === f.value
                ? "bg-pine text-white border-pine"
                : "border-ink/15 text-ink/60 hover:border-pine/40"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {loading && <p className="text-sm text-ink/50">Loading messages…</p>}

        {!loading && loadError && (
          <div className="rounded-2xl border border-care/30 bg-care/5 p-6">
            <p className="text-sm text-care">
              Couldn't load messages. Make sure migration
              0010_contact_messages.sql has been run and your .env is
              configured — see docs/SUPABASE_SETUP.md.
            </p>
          </div>
        )}

        {!loading && !loadError && filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-ink/20 p-10 text-center">
            <p className="text-sm text-ink/50">
              {items.length === 0
                ? "No messages yet."
                : "No unread messages."}
            </p>
          </div>
        )}

        {!loading && !loadError && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((item, i) => {
              const expanded = expandedId === item.id;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
                  className={`rounded-2xl border p-4 transition-colors ${
                    item.is_read ? "border-ink/10 bg-white/60" : "border-pine/30 bg-pine/5"
                  }`}
                >
                  <button
                    onClick={() => openMessage(item)}
                    className="flex w-full flex-col gap-1 text-left sm:flex-row sm:items-center sm:gap-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {!item.is_read && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-pine" aria-hidden="true" />
                      )}
                      <div className="min-w-0">
                        <p className={`text-sm truncate ${item.is_read ? "font-medium text-pine-dark" : "font-semibold text-pine-dark"}`}>
                          {item.name}
                        </p>
                        <p className="text-xs text-ink/50 truncate">{item.email}</p>
                      </div>
                    </div>
                    <p className="min-w-0 flex-1 text-sm text-ink/60 truncate sm:pl-2">
                      {item.message}
                    </p>
                    <p className="text-xs text-ink/40 shrink-0">{formatDate(item.created_at)}</p>
                  </button>

                  {expanded && (
                    <div className="mt-3 border-t border-ink/10 pt-3">
                      <p className="text-sm text-ink/80 whitespace-pre-wrap">{item.message}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <a
                          href={`mailto:${item.email}`}
                          className="rounded-full px-3 py-1.5 text-xs font-semibold text-pine-dark border border-ink/15 hover:bg-ink/5 transition-colors"
                        >
                          Reply by email
                        </a>
                        <button
                          onClick={() => toggleRead(item)}
                          className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink/60 border border-ink/15 hover:bg-ink/5 transition-colors"
                        >
                          {item.is_read ? "Mark unread" : "Mark read"}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="rounded-full px-3 py-1.5 text-xs font-semibold text-care border border-care/30 hover:bg-care/10 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete message?"
        message={
          deleteTarget
            ? `This will permanently remove the message from ${deleteTarget.name}. This can't be undone.`
            : ""
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Toast toast={toast} />
    </div>
  );
}
