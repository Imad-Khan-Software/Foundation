import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// A reusable "are you sure?" dialog for destructive actions, so no admin
// page needs the browser's alert()/confirm(). Pass `open` as the item being
// confirmed (or null when closed), plus onConfirm/onCancel.
export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmLabel = "Delete" }) {
  // Same Escape-to-close behavior as Modal.jsx, so every admin overlay
  // behaves consistently from the keyboard.
  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 grid place-items-center bg-ink/40 px-5"
          onClick={onCancel}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-paper p-6 shadow-xl"
          >
            <h2 id="confirm-dialog-title" className="font-display text-lg text-pine-dark">
              {title}
            </h2>
            <p className="mt-2 text-sm text-ink/60">{message}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={onCancel}
                className="rounded-full px-4 py-2 text-sm font-semibold text-ink/60 hover:bg-ink/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="rounded-full bg-care px-4 py-2 text-sm font-semibold text-white hover:bg-care/90 transition-colors"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
