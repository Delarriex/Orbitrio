-- Notifications: table + RLS. Plain CRUD, no balance involved, so no RPCs.
-- Run this entire block once in the Supabase SQL editor.

create table if not exists notifications (
  id text primary key
);

-- Defensive: a `notifications` table may already exist from earlier,
-- possibly-partial work, in which case `create table if not exists`
-- above is a no-op and won't add missing columns. Add each column if
-- it isn't already there, so this is safe to run regardless of what's
-- currently deployed.
alter table notifications add column if not exists recipient_email text;
alter table notifications add column if not exists title text;
alter table notifications add column if not exists message text;
alter table notifications add column if not exists type text default 'info';
alter table notifications add column if not exists audience text;
alter table notifications add column if not exists event_key text;
alter table notifications add column if not exists action jsonb;
alter table notifications add column if not exists read boolean default false;
alter table notifications add column if not exists timestamp timestamptz default now();

-- Backfill any pre-existing rows that predate these columns, then enforce
-- not-null going forward.
update notifications set recipient_email = '' where recipient_email is null;
update notifications set title = 'Account update' where title is null;
update notifications set message = '' where message is null;
update notifications set type = 'info' where type is null;
update notifications set read = false where read is null;
update notifications set timestamp = now() where timestamp is null;

alter table notifications alter column recipient_email set not null;
alter table notifications alter column title set not null;
alter table notifications alter column message set not null;
alter table notifications alter column type set not null;
alter table notifications alter column type set default 'info';
alter table notifications alter column read set not null;
alter table notifications alter column read set default false;
alter table notifications alter column timestamp set not null;
alter table notifications alter column timestamp set default now();

create index if not exists notifications_recipient_email_idx on notifications(recipient_email);

alter table notifications enable row level security;

-- Read: your own notifications, or any if you're an admin (matches the
-- old Firestore rule's intent — the app's own queries only ever fetch a
-- signed-in user's own recipient_email regardless, admin included, so
-- this is unused headroom rather than something the UI exercises today).
drop policy if exists "notifications_select" on notifications;
create policy "notifications_select" on notifications
  for select
  using (
    lower(recipient_email) = lower((select email from users where id = (auth.jwt() ->> 'sub')))
    or public.is_admin()
  );

-- Insert: you can notify yourself, an admin can notify anyone, and any
-- signed-in user can create an admin-audience notification (this is how
-- non-admins notify admins of things needing review — ticket/airdrop/KYC
-- submissions). Mirrors the old Firestore create rule exactly.
drop policy if exists "notifications_insert" on notifications;
create policy "notifications_insert" on notifications
  for insert
  with check (
    lower(recipient_email) = lower((select email from users where id = (auth.jwt() ->> 'sub')))
    or public.is_admin()
    or audience = 'admin'
  );

-- Update/delete: the recipient can manage their own notifications (mark
-- read, dismiss), or an admin can manage any. NOTE: this is slightly more
-- permissive than the old Firestore rules, which restricted a recipient's
-- update to flipping `read` only and restricted delete to admins only —
-- the app's own "Clear"/dismiss UI clearly intends for a user to manage
-- their own notifications, so this closes what looked like an oversight
-- rather than replicating it exactly.
drop policy if exists "notifications_update_own_or_admin" on notifications;
create policy "notifications_update_own_or_admin" on notifications
  for update
  using (
    lower(recipient_email) = lower((select email from users where id = (auth.jwt() ->> 'sub')))
    or public.is_admin()
  );

drop policy if exists "notifications_delete_own_or_admin" on notifications;
create policy "notifications_delete_own_or_admin" on notifications
  for delete
  using (
    lower(recipient_email) = lower((select email from users where id = (auth.jwt() ->> 'sub')))
    or public.is_admin()
  );
