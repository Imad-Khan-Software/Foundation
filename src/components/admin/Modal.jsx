import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// A simple modal shell shared by the Executives/Members/Branches add-edit
// forms. Locks background scroll and closes on Escape, same pattern used
// elsewhere in the admin (see layouts/AdminLayout.jsx) and the public nav.
export default function Modal({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 overflow-y-auto bg-ink/40 px-4 py-8 sm:px-6"
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-modal-title"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="mx-auto w-full max-w-lg min-w-0 rounded-2xl bg-paper p-5 sm:p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 id="admin-modal-title" className="font-display text-lg text-pine-dark">
                {title}
              </h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="rounded-full p-1.5 text-ink/40 hover:bg-ink/5 hover:text-ink/70 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
