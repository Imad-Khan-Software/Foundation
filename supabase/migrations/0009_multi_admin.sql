-- ============================================================================
-- Ikhlass Welfare Foundation — Phase 5: multi-admin management
-- ============================================================================
-- Run this AFTER 0001-0008. Builds on the profiles/is_admin() foundation
-- from 0001_schema.sql and 0002_rls.sql (which already supports any number
-- of independent Supabase Auth users as admins — this migration does not
-- replace that, it hardens and extends it):
--
--   1. profiles gets `email` (so the Administrators list can show who's
--      who without granting the app read access to auth.users) and
--      `is_active` (so a disabled admin is actually locked out — at the
--      database level, not just hidden in the UI).
--   2. is_admin() now also requires is_active = true, so RLS on every
--      other table automatically respects a disabled admin.
--   3. profiles gains RLS so admins can see the full admin list and
--      (de)activate each other, plus a trigger that stops any client
--      request from touching role/email or its own is_active flag —
--      privilege escalation and self-reactivation are only possible from
--      the Supabase dashboard/SQL editor, never from the browser.
--   4. created_by/updated_by audit columns are added to the tables
--      listed in the brief (projects, donations, expenses, members,
--      branches, activities, gallery), auto-filled by a trigger from
--      auth.uid() — never trusted from client input.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. profiles: add email + is_active
-- ----------------------------------------------------------------------------
alter table profiles
  add column if not exists email text,
  add column if not exists is_active boolean not null default true;

-- Backfill email for any admin rows created before this migration, so the
-- Administrators list below has something to show immediately.
update profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;


-- ----------------------------------------------------------------------------
-- 2. is_admin(): a disabled admin is no longer "an admin" anywhere in RLS
-- ----------------------------------------------------------------------------
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin' and is_active = true
  );
$$ language sql stable security definer set search_path = public;
-- Every policy on every other table (branches, projects, donations, ...)
-- already calls is_admin() rather than checking role directly, so this one
-- change is enough to lock a disabled admin out of every table and every
-- storage bucket immediately, without touching any other policy.


-- ----------------------------------------------------------------------------
-- 3. profiles RLS: let admins see and manage the admin list
-- ----------------------------------------------------------------------------

-- Admins can see every admin's row (needed for the Administrators panel).
-- The existing "profiles: read own row" policy from 0002_rls.sql stays —
-- it's what lets a *disabled* admin (for whom is_admin() is now false)
-- still read their own row, which the app needs in order to detect
-- "you've been disabled" and sign them out.
create policy "profiles: admin read all"
  on profiles for select
  using (is_admin());

-- Any admin can update their own row (e.g. their display name).
create policy "profiles: self update"
  on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- An active admin can update any *other* admin's row (used for the
-- (de)activate toggle in the Administrators panel).
create policy "profiles: admin update others"
  on profiles for update
  using (is_admin())
  with check (is_admin());

-- No insert/delete policy on profiles at all, same as before — admin
-- accounts are still only created directly in Supabase (see
-- docs/SUPABASE_SETUP.md), never through the app.

-- The two update policies above only gate *which rows* can be touched.
-- Without the trigger below, an admin could still use either policy to
-- edit their own role, email, or id, or to reactivate themselves after
-- being disabled. This trigger closes both gaps.
create or replace function enforce_profile_update_rules()
returns trigger as $$
begin
  -- auth.uid() is set on every request that carries a logged-in user's
  -- JWT (i.e. anything coming from the app). It's null for requests run
  -- as the service role or from the SQL editor, which stay unrestricted
  -- so the dashboard workflow in docs/SUPABASE_SETUP.md keeps working.
  if auth.uid() is not null then
    -- role/email/id are never editable from the app, under any admin's
    -- session — only from the Supabase dashboard/SQL editor. This is
    -- what stops a compromised or malicious admin session from granting
    -- itself (or anyone) elevated access.
    new.role := old.role;
    new.email := old.email;
    new.id := old.id;

    -- Nobody can change their own is_active flag — an admin can only be
    -- enabled or disabled by a *different* authorized admin.
    if old.id = auth.uid() then
      new.is_active := old.is_active;
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_profiles_enforce_update
  before update on profiles
  for each row execute function enforce_profile_update_rules();


-- ----------------------------------------------------------------------------
-- 4. created_by / updated_by audit columns
-- ----------------------------------------------------------------------------
-- Added to the record-managing tables called out in the brief. Nullable +
-- "on delete set null" so removing an admin's account later never breaks
-- or deletes the records they created.
do $$
declare
  t text;
  audited_tables text[] := array[
    'projects', 'donations', 'expenses', 'members', 'branches',
    'activities', 'gallery'
  ];
begin
  foreach t in array audited_tables loop
    execute format(
      'alter table %I
         add column if not exists created_by uuid references profiles(id) on delete set null,
         add column if not exists updated_by uuid references profiles(id) on delete set null;',
      t
    );
  end loop;
end $$;

-- Fills created_by/updated_by from the authenticated user automatically —
-- deliberately NOT trusting these values if a client tried to send them,
-- since that would let one admin misattribute their own changes to
-- someone else.
create or replace function set_admin_audit_fields()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    new.created_by := auth.uid();
    new.updated_by := auth.uid();
  elsif TG_OP = 'UPDATE' then
    new.created_by := old.created_by; -- immutable after creation
    new.updated_by := auth.uid();
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

do $$
declare
  t text;
  audited_tables text[] := array[
    'projects', 'donations', 'expenses', 'members', 'branches',
    'activities', 'gallery'
  ];
begin
  foreach t in array audited_tables loop
    execute format(
      'drop trigger if exists trg_%1$s_audit_fields on %1$I;
       create trigger trg_%1$s_audit_fields
         before insert or update on %1$I
         for each row execute function set_admin_audit_fields();',
      t
    );
  end loop;
end $$;
