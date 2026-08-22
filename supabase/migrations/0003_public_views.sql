-- ============================================================================
-- Ikhlass Welfare Foundation — Phase 2 public views
-- ============================================================================
-- Run this AFTER 0001_schema.sql and 0002_rls.sql.
--
-- donations and expenses have NO public read policy at all (see
-- 0002_rls.sql) — the public site never touches those tables directly.
-- Instead it queries these views, which are owned by the migration-running
-- role (not "security invoker"), so they can read the full tables
-- internally while only ever returning safe, already-filtered columns to
-- whoever queries the view. This keeps column-level privacy simple and
-- explicit: if a column isn't listed below, the public can never see it —
-- there's no separate policy to keep in sync with the schema.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- public_financial_summary — ONE row: live totals for the Transparency page
-- ----------------------------------------------------------------------------
-- This is what "Total donations / Total expenses / Remaining balance" on
-- the public site should be calculated from. It only sums VERIFIED rows, so
-- an unverified/pending donation or expense never affects the public
-- numbers, and there is no separate total to keep in sync — it's always
-- computed fresh from the actual transactions.
create view public_financial_summary as
select
  coalesce((select sum(amount) from donations where verification_status = 'verified'), 0) as total_donations,
  coalesce((select sum(amount) from expenses where verification_status = 'verified'), 0) as total_expenses,
  coalesce((select sum(amount) from expenses where verification_status = 'verified' and category = 'education'), 0) as education_spending,
  coalesce((select sum(amount) from expenses where verification_status = 'verified' and category = 'health'), 0) as health_spending,
  coalesce((select sum(amount) from expenses where verification_status = 'verified' and category = 'care'), 0) as care_spending,
  coalesce((select sum(amount) from expenses where verification_status = 'verified' and category = 'administration'), 0) as administration_spending,
  coalesce((select sum(amount) from expenses where verification_status = 'verified' and category = 'other'), 0) as other_spending;

grant select on public_financial_summary to anon, authenticated;


-- ----------------------------------------------------------------------------
-- public_donations — verified + is_public donations, safe columns only
-- ----------------------------------------------------------------------------
-- Excludes: notes, reference_number, verified_by (internal-only columns).
-- donor_name is only exposed when the donor did not choose to stay
-- anonymous — otherwise it comes through as null.
create view public_donations as
select
  id,
  amount,
  donation_date,
  category,
  case when is_anonymous then null else donor_name end as donor_name,
  is_anonymous
from donations
where verification_status = 'verified' and is_public = true;

grant select on public_donations to anon, authenticated;


-- ----------------------------------------------------------------------------
-- public_expenses — verified expenses, safe columns only
-- ----------------------------------------------------------------------------
-- Excludes: receipt_url (private financial document), notes, verified_by.
create view public_expenses as
select
  id,
  amount,
  expense_date,
  category,
  description,
  project_id,
  branch_id
from expenses
where verification_status = 'verified';

grant select on public_expenses to anon, authenticated;
