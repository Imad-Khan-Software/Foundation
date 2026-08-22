-- ============================================================================
-- Ikhlass Welfare Foundation — Phase 4: activities table, RLS, and storage
-- ============================================================================
-- No "activities" table existed before this phase (checked: only
-- executives, members, branches, projects, gallery, etc. from 0001), so
-- this creates it fresh — one migration covering schema + RLS + storage
-- together since it's a single self-contained feature. Run this once, after
-- 0001-0005, in the Supabase SQL Editor.
--
-- gallery already existed from Phase 2 (0001_schema.sql) and is reused
-- as-is in this phase except for one additive column — see
-- 0007_gallery_title.sql.

create table activities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('education', 'health', 'care')),
  description text,
  location text,
  activity_date date,
  image_url text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_activities_published on activities(published);
create index idx_activities_category on activities(category);
create index idx_activities_date on activities(activity_date);

-- Reuses the same set_updated_at() trigger function created in
-- 0001_schema.sql — no need to redefine it here.
create trigger trg_activities_updated_at before update on activities
  for each row execute function set_updated_at();


-- ----------------------------------------------------------------------------
-- RLS — same pattern as every other content table (see 0002_rls.sql):
-- public can read published rows, is_admin() can do everything.
-- ----------------------------------------------------------------------------
alter table activities enable row level security;

create policy "activities: public read published"
  on activities for select
  using (published = true or is_admin());

create policy "activities: admin insert"
  on activities for insert
  with check (is_admin());
create policy "activities: admin update"
  on activities for update
  using (is_admin())
  with check (is_admin());
create policy "activities: admin delete"
  on activities for delete
  using (is_admin());


-- ----------------------------------------------------------------------------
-- Storage — a new public bucket for activity photos, same access pattern
-- as executive-images/member-images/branch-images/gallery from 0004.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('activity-images', 'activity-images', true)
on conflict (id) do nothing;

create policy "activity-images: public read"
  on storage.objects for select
  using (bucket_id = 'activity-images');

create policy "activity-images: admin insert"
  on storage.objects for insert
  with check (bucket_id = 'activity-images' and is_admin());

create policy "activity-images: admin update"
  on storage.objects for update
  using (bucket_id = 'activity-images' and is_admin())
  with check (bucket_id = 'activity-images' and is_admin());

create policy "activity-images: admin delete"
  on storage.objects for delete
  using (bucket_id = 'activity-images' and is_admin());
