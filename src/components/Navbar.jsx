import { Fragment, useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { foundation } from "../data/sampleData";
import { MotionLink } from "./MotionLink";
import BrandLogo from "./BrandLogo";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/team", label: "Team" },
  { to: "/branches", label: "Branches" },
  { to: "/projects", label: "Projects" },
  { to: "/activities", label: "Activities" },
  { to: "/transparency", label: "Transparency" },
  { to: "/gallery", label: "Gallery" },
  { to: "/contact", label: "Contact" },
];

function NavItem({ to, label, onClick }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      onClick={onClick}
      className={({ isActive }) =>
        `relative py-1 text-sm font-medium transition-colors ${
          isActive ? "text-pine-dark" : "text-ink/70 hover:text-pine-dark"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {label}
          {isActive && (
            <motion.span
              layoutId="nav-active-indicator"
              className="absolute -bottom-1 left-0 right-0 thread-rule rounded-full"
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            />
          )}
        </>
      )}
    </NavLink>
  );
}

const mobileMenu = {
  hidden: { x: "-100%" },
  show: { x: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { x: "-100%", transition: { duration: 0.2, ease: "easeIn" } },
};

const mobileList = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.05 } },
};

const mobileItem = {
  hidden: { opacity: 0, y: -8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
};

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  // Close the mobile menu on any route change (e.g. browser back/forward),
  // not just the explicit link clicks handled below.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent the page from scrolling behind the open mobile menu, and let
  // Escape close it like any other overlay.
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

  return (
    <Fragment>
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="sticky top-0 z-50 bg-paper/95 backdrop-blur border-b border-ink/10"
      >
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="flex h-16 items-center gap-8">
          <NavLink to="/" className="flex items-center gap-2.5 group shrink-0">
            <BrandLogo />
            <span className="font-display text-lg text-pine-dark leading-tight whitespace-nowrap">
              {foundation.shortName}
              <span className="hidden sm:inline"> Welfare Foundation</span>
            </span>
          </NavLink>

          <nav className="hidden xl:flex items-center gap-6">
            {links.map((l) => (
              <NavItem key={l.to} {...l} />
            ))}
          </nav>

          <div className="hidden xl:block shrink-0 ml-auto">
            <MotionLink
              to="/donate"
              whileHover={{ y: -2 }}
              whileTap={{ y: 0, scale: 0.98 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="inline-flex items-center rounded-full bg-education px-5 py-2 text-sm font-semibold text-white hover:bg-education-dark transition-colors"
            >
              Donate
            </MotionLink>
          </div>

          <button
            className="xl:hidden ml-auto inline-flex items-center justify-center h-10 w-10 rounded-md text-pine-dark shrink-0"
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
      </div>

      </motion.header>

      {/* Rendered as siblings of <motion.header>, NOT children of it. A
          motion component leaves an inline `transform` on itself even
          after its own entrance animation finishes, and any transform
          creates a new CSS containing block — so a `position: fixed`
          descendant would end up positioned relative to the header's own
          box instead of the viewport (rendered squashed into the header's
          strip, not covering the page). Being siblings instead means these
          are always real, full-viewport fixed overlays. This also mirrors
          the admin panel's mobile drawer (see layouts/AdminLayout.jsx),
          whose backdrop reliably covers all page content underneath it,
          plus a click-through backdrop here as a second, always-reliable
          way to close the menu in addition to picking a link. */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile-menu-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-ink/30 xl:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.nav
            key="mobile-menu"
            variants={mobileMenu}
            initial="hidden"
            animate="show"
            exit="exit"
            aria-label="Mobile"
            className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] overflow-y-auto bg-paper px-5 py-6 shadow-xl xl:hidden"
          >
            <div className="flex items-center justify-between pb-6">
              <span className="flex items-center gap-2.5">
                <BrandLogo />
                <span className="font-display text-base text-pine-dark">
                  {foundation.shortName}
                </span>
              </span>
              <button
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-pine-dark"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <motion.div
              variants={mobileList}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-4"
            >
              {links.map((l) => (
                <motion.div key={l.to} variants={mobileItem}>
                  <NavItem {...l} onClick={() => setOpen(false)} />
                </motion.div>
              ))}
              <motion.div variants={mobileItem}>
                <NavLink
                  to="/donate"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center rounded-full bg-education px-5 py-2.5 text-sm font-semibold text-white w-full"
                >
                  Donate
                </NavLink>
              </motion.div>
            </motion.div>
          </motion.nav>
        )}
      </AnimatePresence>
    </Fragment>
  );
}
