-- Supabase Storage buckets + policies for the two file-upload flows
-- currently on Firebase Storage: deposit proof-of-payment uploads and
-- deposit-wallet QR code images. Run this once in the Supabase SQL editor.
-- Depends on is_admin() already existing (core schema migration).

insert into storage.buckets (id, name, public)
values ('deposit-proofs', 'deposit-proofs', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('deposit-wallet-qr', 'deposit-wallet-qr', true)
on conflict (id) do nothing;

-- deposit-proofs: private. Each user uploads into a folder named after
-- their own Clerk user id (first path segment). Owner or admin can read;
-- only the owner can upload; no update/delete policy — these are
-- permanent evidence attached to a transaction, not editable.

drop policy if exists "deposit_proofs_insert_own" on storage.objects;
create policy "deposit_proofs_insert_own" on storage.objects
  for insert
  with check (
    bucket_id = 'deposit-proofs'
    and (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
  );

drop policy if exists "deposit_proofs_select_own_or_admin" on storage.objects;
create policy "deposit_proofs_select_own_or_admin" on storage.objects
  for select
  using (
    bucket_id = 'deposit-proofs'
    and ((storage.foldername(name))[1] = (auth.jwt() ->> 'sub') or public.is_admin())
  );

-- deposit-wallet-qr: public read (rendered directly in <img> tags for any
-- depositing user, including logged-out browsing), admin-only write.

drop policy if exists "deposit_wallet_qr_public_read" on storage.objects;
create policy "deposit_wallet_qr_public_read" on storage.objects
  for select
  using (bucket_id = 'deposit-wallet-qr');

drop policy if exists "deposit_wallet_qr_admin_insert" on storage.objects;
create policy "deposit_wallet_qr_admin_insert" on storage.objects
  for insert
  with check (bucket_id = 'deposit-wallet-qr' and public.is_admin());

drop policy if exists "deposit_wallet_qr_admin_update" on storage.objects;
create policy "deposit_wallet_qr_admin_update" on storage.objects
  for update
  using (bucket_id = 'deposit-wallet-qr' and public.is_admin());

drop policy if exists "deposit_wallet_qr_admin_delete" on storage.objects;
create policy "deposit_wallet_qr_admin_delete" on storage.objects
  for delete
  using (bucket_id = 'deposit-wallet-qr' and public.is_admin());
