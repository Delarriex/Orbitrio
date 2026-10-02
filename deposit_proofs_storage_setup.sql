-- REVIEW BEFORE EXECUTION. Not applied by the upload verification task.
-- Orbitrio-test currently returns "Bucket not found" for deposit-proofs.
-- Requires the existing Clerk integration and public.is_admin().
-- Does not change transactions, balances, gift-card storage, or existing policies.
-- Review ALL storage.objects policies first: permissive policies combine with OR.
-- select policyname, cmd, roles, qual, with_check
-- from pg_policies where schemaname = 'storage' and tablename = 'objects';
begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('deposit-proofs', 'deposit-proofs', false, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Never silently accept a pre-existing public bucket or rewrite its settings.
do $$
begin
  if exists (select 1 from storage.buckets where id = 'deposit-proofs' and public) then
    raise exception 'deposit-proofs is public. Review existing storage configuration before proceeding.';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage'
                 and tablename = 'objects' and policyname = 'deposit_proofs_insert_own') then
    execute $policy$
      create policy "deposit_proofs_insert_own" on storage.objects
      for insert to authenticated
      with check (bucket_id = 'deposit-proofs'
                  and (storage.foldername(name))[1] = (auth.jwt() ->> 'sub'))
    $policy$;
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage'
                 and tablename = 'objects' and policyname = 'deposit_proofs_select_own_or_admin') then
    execute $policy$
      create policy "deposit_proofs_select_own_or_admin" on storage.objects
      for select to authenticated
      using (bucket_id = 'deposit-proofs'
             and ((storage.foldername(name))[1] = (auth.jwt() ->> 'sub') or public.is_admin()))
    $policy$;
  end if;
end;
$$;

-- Existing named policies are deliberately preserved for manual review.
-- No UPDATE or DELETE policy: uploaded evidence remains immutable.
commit;
