-- ============================================================================
-- Ikhlass Welfare Foundation — Phase 2 Row Level Security policies
-- ============================================================================
-- Run this AFTER 0001_schema.sql. Together, these two rules govern
-- everything below:
--
--   1. Every table has RLS turned ON, with NO default access — a table
--      with RLS enabled and zero policies denies everyone, including
--      admins, until a policy explicitly allows something.
--   2. "Admin" means: a row exists in profiles for auth.uid() with
--      role = 'admin'. The is_admin() helper below checks that in one
--      place so every policy stays short and consistent.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper: is the currently-authenticated user an admin?
-- ----------------------------------------------------------------------------
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql stable security definer set search_path = public;
-- security definer + fixed search_path: lets this function read `profiles`
-- even from inside a policy on another table, without needing a separate
-- policy that lets every user read all of `profiles`.


-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
alter table profiles enable row level security;

-- Admins can see their own profile row (used to confirm their own role in
-- the app). They are NOT able to see other admins' rows through this
-- policy — only their own.
create policy "profiles: read own row"
  on profiles for select
  using (id = auth.uid());

-- No public policy, no insert/update/delete policy at all: profile rows
-- are created and managed by hand in the Supabase dashboard for now (see
-- docs/SUPABASE_SETUP.md), not through the app.


-- ----------------------------------------------------------------------------
-- foundation_settings
-- ----------------------------------------------------------------------------
alter table foundation_settings enable row level security;

create policy "foundation_settings: public read"
  on foundation_settings for select
  using (true);

create policy "foundation_settings: admin write"
  on foundation_settings for all
  using (is_admin())
  with check (is_admin());


-- ----------------------------------------------------------------------------
-- branches
-- ----------------------------------------------------------------------------
alter table branches enable row level security;

create policy "branches: public read active"
  on branches for select
  using (active = true or is_admin());

create policy "branches: admin write"
  on branches for insert
  with check (is_admin());
create policy "branches: admin update"
  on branches for update
  using (is_admin())
  with check (is_admin());
create policy "branches: admin delete"
  on branches for delete
  using (is_admin());


-- ----------------------------------------------------------------------------
-- executives
-- ----------------------------------------------------------------------------
alter table executives enable row level security;

create policy "executives: public read active"
  on executives for select
  using (active = true or is_admin());

create policy "executives: admin insert"
  on executives for insert
  with check (is_admin());
create policy "executives: admin update"
  on executives for update
  using (is_admin())
  with check (is_admin());
create policy "executives: admin delete"
  on executives for delete
  using (is_admin());


-- ----------------------------------------------------------------------------
-- members
-- ----------------------------------------------------------------------------
alter table members enable row level security;

create policy "members: public read active"
  on members for select
  using (active = true or is_admin());

create policy "members: admin insert"
  on members for insert
  with check (is_admin());
create policy "members: admin update"
  on members for update
  using (is_admin())
  with check (is_admin());
create policy "members: admin delete"
  on members for delete
  using (is_admin());


-- ----------------------------------------------------------------------------
-- projects
-- ----------------------------------------------------------------------------
alter table projects enable row level security;

create policy "projects: public read"
  on projects for select
  using (true);

create policy "projects: admin insert"
  on projects for insert
  with check (is_admin());
create policy "projects: admin update"
  on projects for update
  using (is_admin())
  with check (is_admin());
create policy "projects: admin delete"
  on projects for delete
  using (is_admin());


-- ----------------------------------------------------------------------------
-- project_images
-- ----------------------------------------------------------------------------
alter table project_images enable row level security;

create policy "project_images: public read"
  on project_images for select
  using (true);

create policy "project_images: admin insert"
  on project_images for insert
  with check (is_admin());
create policy "project_images: admin update"
  on project_images for update
  using (is_admin())
  with check (is_admin());
create policy "project_images: admin delete"
  on project_images for delete
  using (is_admin());


-- ----------------------------------------------------------------------------
-- gallery
-- ----------------------------------------------------------------------------
alter table gallery enable row level security;

create policy "gallery: public read active"
  on gallery for select
  using (active = true or is_admin());

create policy "gallery: admin insert"
  on gallery for insert
  with check (is_admin());
create policy "gallery: admin update"
  on gallery for update
  using (is_admin())
  with check (is_admin());
create policy "gallery: admin delete"
  on gallery for delete
  using (is_admin());


-- ----------------------------------------------------------------------------
-- donation_methods
-- ----------------------------------------------------------------------------
alter table donation_methods enable row level security;

create policy "donation_methods: public read active"
  on donation_methods for select
  using (active = true or is_admin());

create policy "donation_methods: admin insert"
  on donation_methods for insert
  with check (is_admin());
create policy "donation_methods: admin update"
  on donation_methods for update
  using (is_admin())
  with check (is_admin());
create policy "donation_methods: admin delete"
  on donation_methods for delete
  using (is_admin());


-- ----------------------------------------------------------------------------
-- donations — no public policy at all. The public site never queries this
-- table directly; it reads the public_financial_summary view instead
-- (0003_public_views.sql), which only exposes verified, aggregated totals.
-- ----------------------------------------------------------------------------
alter table donations enable row level security;

create policy "donations: admin read"
  on donations for select
  using (is_admin());
create policy "donations: admin insert"
  on donations for insert
  with check (is_admin());
create policy "donations: admin update"
  on donations for update
  using (is_admin())
  with check (is_admin());
create policy "donations: admin delete"
  on donations for delete
  using (is_admin());


-- ----------------------------------------------------------------------------
-- expenses — same pattern as donations: admin-only on the raw table,
-- public access only through the view.
-- ----------------------------------------------------------------------------
alter table expenses enable row level security;

create policy "expenses: admin read"
  on expenses for select
  using (is_admin());
create policy "expenses: admin insert"
  on expenses for insert
  with check (is_admin());
create policy "expenses: admin update"
  on expenses for update
  using (is_admin())
  with check (is_admin());
create policy "expenses: admin delete"
  on expenses for delete
  using (is_admin());


-- ----------------------------------------------------------------------------
-- financial_reports
-- ----------------------------------------------------------------------------
alter table financial_reports enable row level security;

create policy "financial_reports: public read published"
  on financial_reports for select
  using (published = true or is_admin());

create policy "financial_reports: admin insert"
  on financial_reports for insert
  with check (is_admin());
create policy "financial_reports: admin update"
  on financial_reports for update
  using (is_admin())
  with check (is_admin());
create policy "financial_reports: admin delete"
  on financial_reports for delete
  using (is_admin());
