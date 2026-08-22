# Supabase setup — Phase 2

This is a step-by-step walkthrough for connecting the project to a real
Supabase backend. Nothing here assumes you've used Supabase before.

## 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in (or create a free
   account).
2. Click **New project**.
3. Pick an organization (or create one), give the project a name (e.g.
   `ikhlass-foundation`), set a database password (save it somewhere safe —
   you won't need it for this app, but you might later), and pick a region
   close to your users.
4. Click **Create new project** and wait a minute or two while it spins up.

## 2. Get your API keys

1. In your new project, go to **Settings** (gear icon, bottom of the left
   sidebar) **-> API**.
2. You'll see two values you need:
   - **Project URL** — looks like `https://xxxxx.supabase.co`
   - **anon public** key — a long string under "Project API keys"
3. **Do not copy the `service_role` key anywhere in this project.** That key
   bypasses all security rules and must never be used in frontend code.

## 3. Create your `.env` file

1. In the project folder (next to `package.json`), copy `.env.example` to a
   new file named exactly `.env`.
2. Paste in your Project URL and anon key:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
3. Save the file. `.env` is already in `.gitignore`, so it won't
   accidentally get committed.
4. Restart your dev server if it's running (`Ctrl+C`, then `npm run dev`
   again) so Vite picks up the new variables.

## 4. Run the database migrations

In your Supabase project, go to the **SQL Editor** (left sidebar) and run
each of these files, **in this exact order**, one at a time (paste the
whole file into a new query and click **Run**):

1. `supabase/migrations/0001_schema.sql` — creates all 12 tables
2. `supabase/migrations/0002_rls.sql` — locks every table down with Row
   Level Security
3. `supabase/migrations/0003_public_views.sql` — creates the safe public
   views the transparency page will use
4. `supabase/migrations/0004_storage.sql` — creates the 7 storage buckets
   and their access rules
5. `supabase/migrations/0005_foundation_settings_whatsapp.sql` — adds the
   WhatsApp field used by the Phase 3A admin settings page
6. `supabase/migrations/0006_activities.sql` — creates the `activities`
   table, its RLS policies, and a new `activity-images` storage bucket
7. `supabase/migrations/0007_gallery_title.sql` — adds a `title` field to
   the existing `gallery` table (used alongside the existing `caption`
   field as description, and `active` as the publish/unpublish flag)
8. `supabase/migrations/0008_donations_other_and_receipts.sql` — adds an
   "Other" donation category and a private `donation-receipts` storage
   bucket for optional receipt/proof uploads
9. `supabase/migrations/0009_multi_admin.sql` — adds `is_active`/audit
   support for multiple independent admins
10. `supabase/migrations/0010_contact_messages.sql` — creates the
    `contact_messages` table the public Contact page submits to, and the
    admin-only Messages inbox reads from

If a script errors partway through, read the error message — it's usually
because a previous script wasn't run first (they depend on each other in
order).

## 5. Create your admin account

There's no public sign-up page on purpose — admin accounts are created by
you, directly in Supabase.

1. In Supabase, go to **Authentication -> Users -> Add user -> Create new
   user**.
2. Enter your email and a password. Toggle **Auto Confirm User** on (so you
   don't have to click a confirmation email) and click **Create user**.
3. Copy the new user's **UID** (shown in the users list).
4. Go back to **SQL Editor** and run this, replacing the placeholder with
   your real UID and name:
   ```sql
   insert into profiles (id, full_name, role)
   values ('paste-the-uid-here', 'Your Name', 'admin');
   ```

That's it — this user can now sign in at `/admin/login`.

## 6. Test it

1. Run `npm run dev` and open the site.
2. The public pages (`/`, `/about`, `/projects`, etc.) should look and work
   exactly as before — Phase 2 doesn't change them.
3. Go to `/admin/login` and sign in with the email/password you created in
   step 5.
4. You should land on `/admin/dashboard`, showing the welcome message and
   your email. Try `/admin/settings` too — it loads the foundation's
   current details from Supabase, and **Save settings** should show a
   "Settings saved successfully" notification at the bottom of the screen.
   Click **Sign out** to confirm that works too, and try visiting `/admin`
   directly while signed out — it should redirect you back to
   `/admin/login`.

## What's intentionally NOT done yet

- No management screens for members, executives, branches, projects,
  donations, expenses, or gallery — the sidebar shows these as "Coming
  soon". Those are built in later phases.
- No Excel data import — your real financial records stay untouched until
  a later phase.
- The public pages still use the static sample data from
  `src/data/sampleData.js`, not live Supabase data yet — wiring the public
  pages up to real data also happens in a later phase, once there's
  actually data in the database to show. (The admin settings page at
  `/admin/settings` does use live Supabase data — it's the one exception
  so far.)
- The dashboard's stat cards (donations, expenses, projects, etc.) show
  "Not available yet" on purpose — they're wired to real Supabase counts
  once the matching management screens exist.
