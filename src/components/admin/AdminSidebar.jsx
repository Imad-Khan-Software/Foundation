import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import BrandLogo from "../BrandLogo";

const links = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/executives", label: "Executives" },
  { to: "/admin/members", label: "Members" },
  { to: "/admin/branches", label: "Branches" },
  { to: "/admin/activities", label: "Activities" },
  { to: "/admin/gallery", label: "Gallery" },
  { to: "/admin/projects", label: "Projects" },
  { to: "/admin/donation-methods", label: "Donation Methods" },
  { to: "/admin/donations", label: "Donations" },
  { to: "/admin/expenses", label: "Expenses" },
  { to: "/admin/settings", label: "Foundation Settings" },
];

// Sections that don't exist yet — shown so the admin can see what's coming,
// but they're plain text, not links, so there's nothing to click through to
// a page that doesn't exist.
const comingSoon = [];

function NavItem({ to, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `block rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? "bg-pine text-paper"
            : "text-ink/70 hover:bg-ink/5 hover:text-pine-dark"
        }`
      }
    >
      {label}
    </NavLink>
  );
}

// Shared between the fixed desktop sidebar and the mobile drawer in
// AdminLayout, so both stay in sync automatically.
export default function AdminSidebar({ onNavigate, onSignOut }) {
  const { profile } = useAuth();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-1 pb-6">
        <BrandLogo className="h-9 w-9 shrink-0 bg-pine text-paper text-base" />
        <span className="font-display text-base leading-tight text-pine-dark">
          Ikhlass Welfare Foundation
        </span>
      </div>

      <nav className="flex-1 space-y-1">
        {links.map((l) => (
          <NavItem key={l.to} {...l} onClick={onNavigate} />
        ))}

        {comingSoon.length > 0 && (
          <>
            <p className="eyebrow px-3.5 pt-6 pb-1">Coming soon</p>
            {comingSoon.map((label) => (
              <span
                key={label}
                className="block cursor-not-allowed rounded-lg px-3.5 py-2 text-sm text-ink/35"
              >
                {label}
              </span>
            ))}
          </>
        )}
      </nav>

      {profile && (
        <div className="mt-6 border-t border-ink/10 px-3.5 pt-4">
          <p className="text-sm font-semibold text-pine-dark truncate">
            Welcome back, {profile.full_name || profile.email}
          </p>
          <p className="text-xs text-ink/50 truncate">{profile.email}</p>
          <p className="mt-1 inline-block rounded-full bg-pine/10 px-2 py-0.5 text-[11px] font-medium capitalize text-pine-dark">
            {profile.role}
          </p>
        </div>
      )}

      <button
        onClick={onSignOut}
        className="mt-3 rounded-lg px-3.5 py-2.5 text-left text-sm font-semibold text-care hover:bg-care/10 transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}
