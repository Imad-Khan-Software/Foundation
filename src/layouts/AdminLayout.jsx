import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/useAuth";
import AdminSidebar from "../components/admin/AdminSidebar";
import BrandLogo from "../components/BrandLogo";

const drawer = {
  hidden: { x: "-100%" },
  show: { x: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { x: "-100%", transition: { duration: 0.2, ease: "easeIn" } },
};

export default function AdminLayout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  // Close the mobile drawer on any route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock background scroll and allow Escape to close, same pattern as the
  // public site's mobile nav (see components/Navbar.jsx).
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    function handleKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  async function handleSignOut() {
    await signOut();
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-paper lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block lg:w-64 lg:shrink-0 lg:border-r lg:border-ink/10 lg:bg-white/50 lg:px-4 lg:py-6">
        <AdminSidebar onSignOut={handleSignOut} />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-ink/10 bg-paper/95 backdrop-blur px-5 h-16">
        <div className="flex items-center gap-2.5">
          <BrandLogo />
          <span className="font-display text-base text-pine-dark">
            Admin
          </span>
        </div>
        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-pine-dark"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-ink/30 lg:hidden"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              key="drawer"
              variants={drawer}
              initial="hidden"
              animate="show"
              exit="exit"
              className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] overflow-y-auto bg-paper px-4 py-6 shadow-xl lg:hidden"
            >
              <AdminSidebar
                onNavigate={() => setOpen(false)}
                onSignOut={handleSignOut}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 min-w-0 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <Outlet />
      </main>
    </div>
  );
}
