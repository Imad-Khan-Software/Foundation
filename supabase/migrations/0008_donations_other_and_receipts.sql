-- ============================================================================
-- Ikhlass Welfare Foundation — Phase 5: donations "other" category + receipts
-- ============================================================================
-- donations and donation_methods already existed from Phase 2
-- (0001_schema.sql), with RLS already correct (0002_rls.sql — donations has
-- NO public read policy at all; donation_methods is public-read-active,
-- admin-write) and a public_donations view already excluding private
-- columns (0003_public_views.sql). None of that needs to change for this
-- phase — reused as-is.
--
-- Two small additions only:
--   1. Phase 5 asks for an "Other" donation category alongside the existing
--      Education/Health/Care/General.
--   2. A private storage bucket for optional receipt/proof uploads, same
--      pattern as expense-receipts from 0004_storage.sql.
--
-- Run this once, after 0001-0007, in the Supabase SQL Editor.

-- ----------------------------------------------------------------------------
-- 1. Add 'other' to donations.category
-- ----------------------------------------------------------------------------
-- Postgres has no "ALTER CHECK to add a value" — the existing constraint
-- has to be dropped and recreated with the extra option.
alter table donations drop constraint donations_category_check;
alter table donations add constraint donations_category_check
  check (category in ('education', 'health', 'care', 'general', 'other'));


-- ----------------------------------------------------------------------------
-- 1b. A place to store the uploaded receipt's storage PATH (not a URL)
-- ----------------------------------------------------------------------------
-- Deliberately a path, not a public URL: donation-receipts is a private
-- bucket (see below), so there is no public URL to store. The app
-- generates a short-lived signed URL on demand (via
-- supabase.storage.from('donation-receipts').createSignedUrl(path, ...))
-- only when an authenticated admin actually wants to view a receipt.
alter table donations
  add column if not exists receipt_path text;


-- ----------------------------------------------------------------------------
-- 2. donation-receipts storage bucket — private, admin-only
-- ----------------------------------------------------------------------------
-- Receipts are optional proof of a donation (e.g. a bank transfer
-- screenshot). Like expense-receipts, this must never be public: a receipt
-- can contain a donor's bank details or full name, so only an
-- authenticated admin should ever be able to read or write to it.
insert into storage.buckets (id, name, public)
values ('donation-receipts', 'donation-receipts', false)
on conflict (id) do nothing;

create policy "donation-receipts: admin read"
  on storage.objects for select
  using (bucket_id = 'donation-receipts' and is_admin());

create policy "donation-receipts: admin insert"
  on storage.objects for insert
  with check (bucket_id = 'donation-receipts' and is_admin());

create policy "donation-receipts: admin update"
  on storage.objects for update
  using (bucket_id = 'donation-receipts' and is_admin())
  with check (bucket_id = 'donation-receipts' and is_admin());

create policy "donation-receipts: admin delete"
  on storage.objects for delete
  using (bucket_id = 'donation-receipts' and is_admin());
