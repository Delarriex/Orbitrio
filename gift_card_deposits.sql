-- Run once in Supabase SQL Editor BEFORE deploying the gift-card UI.
-- Additive and repeatable; preserves existing deposits and balance RPCs.
-- Depends on public.transactions, public.is_admin() and Clerk third-party auth.
begin;

alter table public.transactions
  add column if not exists payment_method text not null default 'crypto',
  add column if not exists gift_card_details jsonb,
  add column if not exists gift_card_image_paths text[];

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gift-card-proofs', 'gift-card-proofs', false, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = false, file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "gift_card_proofs_insert_own" on storage.objects;
create policy "gift_card_proofs_insert_own" on storage.objects for insert to authenticated
with check (bucket_id = 'gift-card-proofs'
  and (storage.foldername(name))[1] = (auth.jwt() ->> 'sub'));

drop policy if exists "gift_card_proofs_select_own_or_admin" on storage.objects;
create policy "gift_card_proofs_select_own_or_admin" on storage.objects for select to authenticated
using (bucket_id = 'gift-card-proofs'
  and ((storage.foldername(name))[1] = (auth.jwt() ->> 'sub') or public.is_admin()));
-- No user update/delete policies: submitted evidence is immutable.

-- Validate at the database boundary too. Reusing another user's object path,
-- bypassing the required images, or sending invalid amounts must fail even
-- when a caller bypasses the React form. Existing transaction RLS still gates
-- row ownership/status; existing admin-only RPCs still gate all balance credit.
create or replace function public.validate_gift_card_deposit()
returns trigger language plpgsql set search_path = '' as $$
declare image_path text;
begin
  if new.payment_method = 'gift_card' then
    if new.type is distinct from 'deposit' or new.currency is distinct from 'USD'
       or new.amount is null or new.amount <= 0
       or new.amount::text in ('NaN', 'Infinity', '-Infinity') then
      raise exception 'Gift card deposits require a positive USD deposit amount';
    end if;
    if jsonb_typeof(new.gift_card_details) is distinct from 'object'
       or jsonb_typeof(new.gift_card_details -> 'brand') is distinct from 'string'
       or length(trim(new.gift_card_details ->> 'brand')) not between 1 and 80
       or jsonb_typeof(new.gift_card_details -> 'currency') is distinct from 'string'
       or (new.gift_card_details ->> 'currency') !~ '^[A-Z]{3}$'
       or jsonb_typeof(new.gift_card_details -> 'faceValue') is distinct from 'number' then
      raise exception 'Gift card brand, currency and face value are required';
    end if;
    if (new.gift_card_details ->> 'faceValue')::numeric <= 0 then
      raise exception 'Card face value must be positive';
    end if;
    if coalesce(cardinality(new.gift_card_image_paths), 0) not between 1 and 4 then
      raise exception 'Upload between 1 and 4 gift card images';
    end if;
    foreach image_path in array new.gift_card_image_paths loop
      if image_path is null or split_part(image_path, '/', 1) is distinct from new.user_id
         or not exists (select 1 from storage.objects
                        where bucket_id = 'gift-card-proofs' and name = image_path) then
        raise exception 'Gift card image must be an existing upload belonging to this user';
      end if;
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists validate_gift_card_deposit on public.transactions;
create trigger validate_gift_card_deposit
before insert or update of payment_method, gift_card_details, gift_card_image_paths, user_id, type, amount, currency
on public.transactions for each row execute function public.validate_gift_card_deposit();

commit;
