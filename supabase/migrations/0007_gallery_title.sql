-- ============================================================================
-- Ikhlass Welfare Foundation — Phase 4: add title to the existing gallery table
-- ============================================================================
-- The gallery table already exists from Phase 2 (0001_schema.sql) with
-- image_url, caption, category, display_order, active, created_at,
-- updated_at — reused as-is per this phase's "don't create duplicate
-- tables" instruction. It's just missing a short "title" separate from the
-- longer "caption" (used here as the optional description), so this adds
-- the one missing column rather than recreating the table — same approach
-- as 0005_foundation_settings_whatsapp.sql.
--
-- Field mapping used by the Phase 4 admin/public Gallery pages:
--   title       -> new column added below
--   description -> existing "caption" column (reused, not renamed)
--   published   -> existing "active" column (reused, not renamed)

alter table gallery
  add column if not exists title text;
