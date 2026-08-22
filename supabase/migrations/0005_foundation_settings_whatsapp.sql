-- ============================================================================
-- Ikhlass Welfare Foundation — Phase 3A: add WhatsApp to foundation_settings
-- ============================================================================
-- Phase 2's foundation_settings table already covers everything Phase 3A's
-- settings form needs (name, logo_url, about_text, mission, vision, phone,
-- email, address, social_facebook, social_instagram) except a WhatsApp
-- contact, which is distinct from the phone number on the public site
-- (see src/data/sampleData.js — Phase 1 already models phone and whatsapp
-- separately). Rather than recreate the table, this just adds the one
-- missing column. Run it once in the SQL Editor, after 0001-0004.

alter table foundation_settings
  add column if not exists whatsapp text;
