import { useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

// Wrap any admin route with this. It enforces admin authorization at the
// React level to match what RLS already enforces at the database level
// (see supabase/migrations/0009_multi_admin.sql):
//   - nobody signed in            -> /admin/login
//   - signed in but no admin row,
//     or role isn't "admin"       -> signed out, /admin/login
//   - signed in as a *disabled*
//     admin (is_active = false)   -> signed out, /admin/login
// This is a UX/defense-in-depth layer only — the database is the real
// authority, so even if this component were somehow bypassed, RLS still
// blocks every read/write for an unauthorized or disabled user.
export default function ProtectedRoute({ children }) {
  const {
    user,
    loading,
    profile,
    profileLoading,
    isAuthorizedAdmin,
    refreshProfile,
    signOut,
  } = useAuth();
  const location = useLocation();
  const signingOutRef = useRef(false);

  // Periodically re-check this admin's own profile row so a disabled
  // admin's *existing* session gets kicked out promptly, not just on their
  // next full page load.
  useEffect(() => {
    if (!user) return;
    const interval = window.setInterval(() => {
      refreshProfile();
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [user, refreshProfile]);

  const shouldSignOut =
    user && !loading && !profileLoading && !isAuthorizedAdmin;

  useEffect(() => {
    if (shouldSignOut && !signingOutRef.current) {
      signingOutRef.current = true;
      signOut();
    }
  }, [shouldSignOut, signOut]);

  if (loading || (user && profileLoading)) {
    return (
      <div className="min-h-screen grid place-items-center bg-paper">
        <p className="text-sm text-ink/50">Checking session…</p>
      </div>
    );
  }

  if (!user || shouldSignOut) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{
          from: location,
          // Only shown for an authenticated-but-unauthorized/disabled
          // user — a plain logged-out visitor gets the ordinary login
          // screen with no extra message.
          reason:
            user && profile === null
              ? "not-authorized"
              : user
              ? "disabled"
              : undefined,
        }}
      />
    );
  }

  return children;
}
