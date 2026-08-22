-- ============================================================================
-- Ikhlass Welfare Foundation — contact form inbox
-- ============================================================================
-- Run this AFTER 0001-0009. Gives the public Contact page (src/pages/
-- Contact.jsx) somewhere real to submit to — until now it only faked a
-- "sent" state with setTimeout and the message went nowhere — and gives
-- admins an inbox to read them in (src/pages/admin/Messages.jsx).
-- ============================================================================

create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table contact_messages enable row level security;

-- Anyone (including a signed-out visitor) can submit the contact form —
-- but only insert. No select/update/delete policy for the public means
-- a submitter can never read back their own message or anyone else's,
-- and can't edit or delete after sending. This mirrors the "public write,
-- admin manage" shape used nowhere else in this schema (every other table
-- is admin-write) because this is the one form open to non-admins.
create policy "contact_messages: public insert"
  on contact_messages for insert
  to anon, authenticated
  with check (true);

-- Only authorized, active admins (is_admin(), defined in 0002_rls.sql —
-- already respects is_active from 0009_multi_admin.sql) can read, mark
-- read/unread, or delete messages. Nobody else — including a disabled
-- admin — can see what visitors wrote in.
create policy "contact_messages: admin read"
  on contact_messages for select
  using (is_admin());

create policy "contact_messages: admin update"
  on contact_messages for update
  using (is_admin())
  with check (is_admin());

create policy "contact_messages: admin delete"
  on contact_messages for delete
  using (is_admin());

create index if not exists contact_messages_created_at_idx
  on contact_messages (created_at desc);
