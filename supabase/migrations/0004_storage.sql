-- ============================================================================
-- Ikhlass Welfare Foundation — Phase 2 storage buckets & policies
-- ============================================================================
-- Run this AFTER 0001-0003. Creates all 7 buckets and their access rules
-- in one place. You could also create buckets by clicking "New bucket" in
-- the dashboard (Storage tab) — this SQL just does the same thing
-- repeatably and documents the intended settings.
--
-- Public buckets (public = true): anyone can VIEW files directly by URL —
-- fine for logos, executive/member/branch/project photos, and gallery
-- images. Only admins can upload/replace/delete.
--
-- expense-receipts is PRIVATE (public = false): these are financial
-- documents. Nobody can view or download them except an admin, and only
-- through an authenticated Supabase request — never a plain public URL.
-- ============================================================================

insert into storage.buckets (id, name, public)
values
  ('foundation-assets', 'foundation-assets', true),
  ('executive-images', 'executive-images', true),
  ('member-images', 'member-images', true),
  ('branch-images', 'branch-images', true),
  ('project-images', 'project-images', true),
  ('gallery', 'gallery', true),
  ('expense-receipts', 'expense-receipts', false)
on conflict (id) do nothing;


-- ----------------------------------------------------------------------------
-- Public buckets: anyone can read, only admins can write
-- ----------------------------------------------------------------------------
do $$
declare
  bucket text;
  public_buckets text[] := array[
    'foundation-assets', 'executive-images', 'member-images',
    'branch-images', 'project-images', 'gallery'
  ];
begin
  foreach bucket in array public_buckets loop
    execute format(
      'create policy "%1$s: public read" on storage.objects for select
         using (bucket_id = %2$L);',
      bucket, bucket
    );
    execute format(
      'create policy "%1$s: admin insert" on storage.objects for insert
         with check (bucket_id = %2$L and is_admin());',
      bucket, bucket
    );
    execute format(
      'create policy "%1$s: admin update" on storage.objects for update
         using (bucket_id = %2$L and is_admin())
         with check (bucket_id = %2$L and is_admin());',
      bucket, bucket
    );
    execute format(
      'create policy "%1$s: admin delete" on storage.objects for delete
         using (bucket_id = %2$L and is_admin());',
      bucket, bucket
    );
  end loop;
end $$;


-- ----------------------------------------------------------------------------
-- expense-receipts: admin-only for read AND write — never public
-- ----------------------------------------------------------------------------
create policy "expense-receipts: admin read"
  on storage.objects for select
  using (bucket_id = 'expense-receipts' and is_admin());

create policy "expense-receipts: admin insert"
  on storage.objects for insert
  with check (bucket_id = 'expense-receipts' and is_admin());

create policy "expense-receipts: admin update"
  on storage.objects for update
  using (bucket_id = 'expense-receipts' and is_admin())
  with check (bucket_id = 'expense-receipts' and is_admin());

create policy "expense-receipts: admin delete"
  on storage.objects for delete
  using (bucket_id = 'expense-receipts' and is_admin());
