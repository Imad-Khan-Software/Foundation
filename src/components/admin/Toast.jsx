import { motion, AnimatePresence } from "framer-motion";

// A small inline notification, not a browser alert(). Pass `toast` as
// either null (nothing shown) or { type: "success" | "error", message }.
export default function Toast({ toast }) {
  return (
    <div
      aria-live="polite"
      className="fixed inset-x-0 bottom-5 z-50 flex justify-center px-5 pointer-events-none"
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.message}
            role="status"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={`pointer-events-auto rounded-full px-5 py-2.5 text-sm font-medium shadow-lg ${
              toast.type === "error"
                ? "bg-care text-white"
                : "bg-pine text-paper"
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
