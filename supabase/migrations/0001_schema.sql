-- ============================================================================
-- Ikhlass Welfare Foundation — Phase 2 database schema
-- ============================================================================
-- How to run this: Supabase dashboard -> SQL Editor -> New query -> paste
-- this whole file -> Run. See ../../docs/SUPABASE_SETUP.md for the full
-- step-by-step walkthrough.
--
-- This file only creates tables and relationships. Row Level Security
-- policies live in 0002_rls.sql, and public "safe" views live in
-- 0003_public_views.sql — run all three, in order.
-- ============================================================================

-- Postgres's gen_random_uuid() needs this extension (Supabase usually has
-- it on already, but this makes the migration work on a fresh project too).
create extension if not exists pgcrypto;


-- ----------------------------------------------------------------------------
-- 1. profiles — one row per admin user, linked to Supabase Auth
-- ----------------------------------------------------------------------------
-- There is no public sign-up. You create a user in Supabase Authentication
-- (dashboard -> Authentication -> Users -> Add user), then insert a matching
-- row here by hand so the app knows they're an admin. See the setup guide.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'admin' check (role in ('admin')),
  -- role only supports 'admin' for now. Adding a role later (e.g. 'editor')
  -- is just adding it to this check constraint — no schema change needed.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ----------------------------------------------------------------------------
-- 2. foundation_settings — a single row of site-wide settings
-- ----------------------------------------------------------------------------
-- Modeled as a "singleton" table: exactly one row, id is always 1. This is
-- simpler than a key-value settings table for a beginner project, and this
-- data doesn't need per-row history.
create table foundation_settings (
  id smallint primary key default 1 check (id = 1),
  name text not null default 'Ikhlass Welfare Foundation',
  logo_url text,
  about_text text,
  mission text,
  vision text,
  phone text,
  email text,
  address text,
  social_facebook text,
  social_instagram text,
  social_youtube text,
  founding_year int,
  -- Deliberately no "is_registered" or similar column: the foundation is
  -- not a legally registered organization, so the schema doesn't carry a
  -- field that could later be flipped to imply otherwise.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed the single settings row with the foundation's real founding year and
-- placeholders everywhere else, matching Phase 1's placeholder convention.
insert into foundation_settings (id, name, founding_year)
values (1, 'Ikhlass Welfare Foundation', 2019);


-- ----------------------------------------------------------------------------
-- 3. branches
-- ----------------------------------------------------------------------------
create table branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  description text,
  contact_phone text,
  contact_email text,
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ----------------------------------------------------------------------------
-- 4. executives
-- ----------------------------------------------------------------------------
create table executives (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  designation text,
  biography text,
  photo_url text,
  display_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ----------------------------------------------------------------------------
-- 5. members
-- ----------------------------------------------------------------------------
-- The brief listed a plain "branch" text field, but since branches already
-- exist as a table, a branch_id foreign key keeps branch names consistent
-- (rename a branch once, every member reflects it) instead of duplicating
-- the branch name as free text on every member row.
create table members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  designation text,
  branch_id uuid references branches(id) on delete set null,
  description text,
  photo_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ----------------------------------------------------------------------------
-- 6. projects
-- ----------------------------------------------------------------------------
create table projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('education', 'health', 'care')),
  -- Disaster relief lives here as a project under one of the three
  -- categories (usually 'care') rather than a fourth pillar, per the brief.
  description text,
  location text,
  branch_id uuid references branches(id) on delete set null,
  start_date date,
  end_date date,
  budget numeric(12, 2),
  amount_spent numeric(12, 2) not null default 0,
  status text not null default 'planned' check (status in ('planned', 'active', 'completed')),
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ----------------------------------------------------------------------------
-- 7. project_images — a project can have several gallery-style photos
-- ----------------------------------------------------------------------------
create table project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  image_url text not null,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);


-- ----------------------------------------------------------------------------
-- 8. gallery — general activity photos, not tied to one project
-- ----------------------------------------------------------------------------
create table gallery (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  caption text,
  category text check (category in ('education', 'health', 'care', 'general')),
  display_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ----------------------------------------------------------------------------
-- 9. donation_methods — bank transfer, Easypaisa, JazzCash, etc.
-- ----------------------------------------------------------------------------
create table donation_methods (
  id uuid primary key default gen_random_uuid(),
  method_name text not null,
  account_details text,
  instructions text,
  active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ----------------------------------------------------------------------------
-- 10. donations — the sensitive one: locked down by RLS in 0002_rls.sql
-- ----------------------------------------------------------------------------
create table donations (
  id uuid primary key default gen_random_uuid(),
  amount numeric(12, 2) not null check (amount > 0),
  donation_date date not null default current_date,
  category text check (category in ('education', 'health', 'care', 'general')),
  purpose text,
  payment_method text,
  donor_name text,
  is_anonymous boolean not null default false,
  is_public boolean not null default true,
  -- is_anonymous: hide the donor's name even from admins' public-facing
  -- reports. is_public: whether this donation is allowed to appear (as an
  -- amount, and name if not anonymous) in any public listing at all.
  notes text,
  reference_number text,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'rejected')),
  verified_by uuid references profiles(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ----------------------------------------------------------------------------
-- 11. expenses
-- ----------------------------------------------------------------------------
create table expenses (
  id uuid primary key default gen_random_uuid(),
  amount numeric(12, 2) not null check (amount > 0),
  expense_date date not null default current_date,
  category text not null
    check (category in ('education', 'health', 'care', 'administration', 'other')),
  description text,
  project_id uuid references projects(id) on delete set null,
  branch_id uuid references branches(id) on delete set null,
  receipt_url text,
  notes text,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'rejected')),
  verified_by uuid references profiles(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ----------------------------------------------------------------------------
-- 12. financial_reports — published, human-curated report documents
-- ----------------------------------------------------------------------------
-- IMPORTANT DESIGN DECISION:
-- This table is NOT where the live "Total donations / Total expenses /
-- Remaining balance" numbers on the public Transparency page come from.
-- Those should always be calculated on the fly from verified donations and
-- expenses (see the public_financial_summary view in 0003_public_views.sql),
-- so the live totals can never drift out of sync with the actual verified
-- transactions.
--
-- financial_reports is for distinct, dated, human-written report documents
-- — e.g. "Annual Report 2024" or "Q2 2025 Financial Summary" — that an
-- admin writes and publishes deliberately, along with a title and
-- description. The category totals here are a snapshot captured at
-- publish time (so a published report's numbers stay fixed even if a
-- transaction is corrected later), which is why they're stored rather
-- than computed — but the live transparency page still uses the view, not
-- this table.
create table financial_reports (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  month int check (month between 1 and 12), -- null = a full-year report
  total_donations numeric(12, 2) not null default 0,
  total_expenses numeric(12, 2) not null default 0,
  education_spending numeric(12, 2) not null default 0,
  health_spending numeric(12, 2) not null default 0,
  care_spending numeric(12, 2) not null default 0,
  administration_spending numeric(12, 2) not null default 0,
  other_spending numeric(12, 2) not null default 0,
  report_title text not null,
  description text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ----------------------------------------------------------------------------
-- Helpful indexes for the queries the public site and admin will run most
-- ----------------------------------------------------------------------------
create index idx_projects_category on projects(category);
create index idx_projects_status on projects(status);
create index idx_donations_verification on donations(verification_status);
create index idx_donations_date on donations(donation_date);
create index idx_expenses_verification on expenses(verification_status);
create index idx_expenses_date on expenses(expense_date);
create index idx_expenses_category on expenses(category);
create index idx_members_branch on members(branch_id);
create index idx_project_images_project on project_images(project_id);


-- ----------------------------------------------------------------------------
-- Keep updated_at current automatically on every UPDATE
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();
create trigger trg_foundation_settings_updated_at before update on foundation_settings
  for each row execute function set_updated_at();
create trigger trg_branches_updated_at before update on branches
  for each row execute function set_updated_at();
create trigger trg_executives_updated_at before update on executives
  for each row execute function set_updated_at();
create trigger trg_members_updated_at before update on members
  for each row execute function set_updated_at();
create trigger trg_projects_updated_at before update on projects
  for each row execute function set_updated_at();
create trigger trg_gallery_updated_at before update on gallery
  for each row execute function set_updated_at();
create trigger trg_donation_methods_updated_at before update on donation_methods
  for each row execute function set_updated_at();
create trigger trg_donations_updated_at before update on donations
  for each row execute function set_updated_at();
create trigger trg_expenses_updated_at before update on expenses
  for each row execute function set_updated_at();
create trigger trg_financial_reports_updated_at before update on financial_reports
  for each row execute function set_updated_at();
