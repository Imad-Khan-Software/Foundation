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
  // Everything else from the settings row, grouped separately from
  // logoUrl/name above so existing consumers (BrandLogo.jsx) that only
  // destructure { logoUrl, name } keep working unchanged.
  const [aboutText, setAboutText] = useState(null);
  const [mission, setMission] = useState(null);
  const [vision, setVision] = useState(null);
  const [phone, setPhone] = useState(null);
  const [whatsapp, setWhatsapp] = useState(null);
  const [email, setEmail] = useState(null);
  const [address, setAddress] = useState(null);
  const [socialFacebook, setSocialFacebook] = useState(null);
  const [socialInstagram, setSocialInstagram] = useState(null);
  const [socialYoutube, setSocialYoutube] = useState(null);
  const [foundingYear, setFoundingYear] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("foundation_settings")
      .select("*")
      .eq("id", SETTINGS_ID)
      .maybeSingle();

    if (error) {
      // Branding is non-critical — on failure every consumer just keeps
      // rendering its own fallback (BrandLogo's "IK" mark, or whatever
      // placeholder each public page chooses), so this must never block
      // the public site or the admin panel from loading.
      console.error("Failed to load foundation settings:", error);
      return;
    }

    if (data) {
      setLogoUrl(data.logo_url || null);
      setName(data.name || null);
      setAboutText(data.about_text || null);
      setMission(data.mission || null);
      setVision(data.vision || null);
      setPhone(data.phone || null);
      setWhatsapp(data.whatsapp || null);
      setEmail(data.email || null);
      setAddress(data.address || null);
      setSocialFacebook(data.social_facebook || null);
      setSocialInstagram(data.social_instagram || null);
      setSocialYoutube(data.social_youtube || null);
      setFoundingYear(data.founding_year || null);
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
      value={{
        logoUrl,
        name,
        aboutText,
        mission,
        vision,
        phone,
        whatsapp,
        email,
        address,
        socialFacebook,
        socialInstagram,
        socialYoutube,
        foundingYear,
        loading,
        refresh,
        setLogoUrl,
      }}
    >
      {children}
    </FoundationSettingsContext.Provider>
  );
}
