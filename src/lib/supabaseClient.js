import { createClient } from "@supabase/supabase-js";

// These come from the .env file at the project root (copy .env.example to
// .env and fill in your own project's values — see that file for where to
// find them in the Supabase dashboard). Vite reads any variable prefixed
// with VITE_ from .env and makes it available here as import.meta.env.*
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // This won't crash the public website — it just means anything that
  // talks to Supabase (admin login, future admin CRUD) won't work until
  // you create your .env file. See docs/SUPABASE_SETUP.md.
  console.warn(
    "[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. " +
      "Copy .env.example to .env and fill in your project's values."
  );
}

// createClient() throws immediately if the URL is empty, which would crash
// the *entire* app (including all the public pages that have nothing to do
// with Supabase) before .env is ever set up. Falling back to a harmless
// placeholder URL means the app renders normally either way — actual
// Supabase calls (admin login, future admin data) will just fail with a
// clear network/auth error until real credentials are in .env, instead of
// taking down the whole site.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  {
    auth: {
      // Keeps the admin signed in across page reloads (stored in the
      // browser's localStorage) and refreshes their session automatically.
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
