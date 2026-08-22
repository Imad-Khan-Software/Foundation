import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { FoundationSettingsContext } from "./foundationSettingsContextObject";

// The single settings row always has id = 1 (see
// supabase/migrations/0001_schema.sql — foundation_settings is a
// "singleton" table by design). Same convention as pages/admin/Settings.jsx.
const SETTINGS_ID = 1;

// Wraps the whole app (see App.jsx) so any component — public navbar/footer
// or admin sidebar/header — can read the foundation's current branding via
// useFoundationSettings() below, instead of each component querying
// foundation_settings directly. This makes the logo uploaded in
// Admin → Foundation Settings the single source of truth everywhere it's
// displayed, with no hard-coded logo URLs anywhere else in the app.
export function FoundationSettingsProvider({ children }) {
  const [logoUrl, setLogoUrl] = useState(null);
  const [name, setName] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("foundation_settings")
      .select("logo_url, name")
      .eq("id", SETTINGS_ID)
      .maybeSingle();

    if (error) {
      // Branding is non-critical — on failure every consumer just keeps
      // rendering the "IK" fallback mark, so this must never block the
      // public site or the admin panel from loading.
      console.error("Failed to load foundation branding:", error);
      return;
    }

    if (data) {
      setLogoUrl(data.logo_url || null);
      setName(data.name || null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      await refresh();
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [refresh]);

  return (
    <FoundationSettingsContext.Provider
      value={{ logoUrl, name, loading, refresh, setLogoUrl }}
    >
      {children}
    </FoundationSettingsContext.Provider>
  );
}
