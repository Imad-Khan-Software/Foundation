import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { AuthContext } from "./authContextObject";

// Wraps the whole app (see App.jsx) so any component can ask "is someone
// logged in right now, and are they an authorized admin?" via useAuth()
// below, instead of every page talking to Supabase auth/profiles directly.
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Loads this user's row from `profiles` — the table 0009_multi_admin.sql
  // uses (together with RLS + is_admin()) as the real source of truth for
  // "is this person an authorized, active admin". A session existing just
  // means Supabase accepted the password; it does NOT mean the account is
  // an authorized admin, so the UI must check this separately (RLS already
  // enforces it at the database level either way).
  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, is_active, created_at")
      .eq("id", userId)
      .maybeSingle();

    // No row, an error, or is_active === false all mean "not a usable
    // admin" from the UI's point of view — ProtectedRoute below treats
    // them identically.
    if (error) {
      console.error("Failed to load admin profile:", error);
      setProfile(null);
    } else {
      setProfile(data);
    }
    setProfileLoading(false);
  }, []);

  useEffect(() => {
    // onAuthStateChange is the single source of truth for session state.
    // It fires immediately with the current session on subscribe (event
    // "INITIAL_SESSION"), then again on every SIGNED_IN/SIGNED_OUT/
    // TOKEN_REFRESHED event — so there's no need to *also* call
    // supabase.auth.getSession() separately. Running both at once raced
    // two independent async calls against the same setSession/setLoading
    // state with no ordering guarantee between them, which could let a
    // stale result silently overwrite a just-set valid session after a
    // fast logout -> login cycle.
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setLoading(false);
        loadProfile(newSession?.user?.id ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [loadProfile]);

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  // Re-fetches the profile row on demand — used to notice mid-session that
  // an admin has just been disabled by someone else (see ProtectedRoute).
  const refreshProfile = useCallback(
    () => loadProfile(session?.user?.id ?? null),
    [loadProfile, session]
  );

  const isAuthorizedAdmin =
    !!profile && profile.role === "admin" && profile.is_active === true;

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    profile,
    profileLoading,
    isAuthorizedAdmin,
    refreshProfile,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
