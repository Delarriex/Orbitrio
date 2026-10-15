-- Run in the TEST Supabase SQL editor first. No users/balances/auth settings change.
-- Prerequisites: existing public.users (id text) and trusted public.is_admin().
-- The helper must work with an empty search_path. For the original Orbitrio
-- helper, run kyc_admin_helper_fix.sql first (see KYC_LOCAL_SETUP.md).
-- This migration is additive and safe to repeat. Keep legacy records for review.
begin;

do $$ begin
  if to_regclass('public.users') is null or to_regprocedure('public.is_admin()') is null then
    raise exception 'Install the existing application schema (users and is_admin) before this KYC migration.';
  end if;
end $$;

create table if not exists public.kyc_submissions (
  user_id text primary key references public.users(id),
  id_type text, document_type text, id_number text, dob date,
  address text, city text, country text,
  front_image text, back_image text, proof_of_address_image text,
  submission_date timestamptz default now(), status text default 'pending',
  admin_notes text default '', rejection_reason text default '', reviewed_at timestamptz
);
alter table public.kyc_submissions
  add column if not exists front_image text,
  add column if not exists back_image text,
  add column if not exists proof_of_address_image text,
  add column if not exists revision integer not null default 0,
  add column if not exists reviewed_by text;
-- The existing application already upserts on user_id. Fail on an incompatible
-- schema rather than merging/deleting any duplicate identity records silently.
create unique index if not exists kyc_submissions_user_id_unique on public.kyc_submissions(user_id);
alter table public.kyc_submissions enable row level security;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('kyc-documents', 'kyc-documents', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
do $$ begin
  if exists (select 1 from storage.buckets where id='kyc-documents' and
    (public is distinct from false or file_size_limit is distinct from 5242880::bigint or
     allowed_mime_types is distinct from array['image/jpeg','image/png','image/webp'])) then
    raise exception 'Existing kyc-documents bucket settings differ. Review them before proceeding; private, 5 MB, JPEG/PNG/WebP are required.';
  end if;
end $$;

-- Restrictive guards also constrain any pre-existing broad permissive policies.
-- Policies for other buckets remain unchanged.
drop policy if exists kyc_storage_read on storage.objects;
create policy kyc_storage_read on storage.objects for select to authenticated
using (bucket_id='kyc-documents' and ((storage.foldername(name))[1]=auth.jwt()->>'sub' or public.is_admin()));
drop policy if exists kyc_storage_read_guard on storage.objects;
create policy kyc_storage_read_guard on storage.objects as restrictive for select to public
using (bucket_id<>'kyc-documents' or ((storage.foldername(name))[1]=auth.jwt()->>'sub' or public.is_admin()));
drop policy if exists kyc_storage_insert on storage.objects;
create policy kyc_storage_insert on storage.objects for insert to authenticated
with check (bucket_id='kyc-documents' and (storage.foldername(name))[1]=auth.jwt()->>'sub'
 and name ~ '^[A-Za-z0-9_-]+/[0-9a-f-]+\.(jpg|png|webp)$');
drop policy if exists kyc_storage_insert_guard on storage.objects;
create policy kyc_storage_insert_guard on storage.objects as restrictive for insert to public
with check (bucket_id<>'kyc-documents' or ((storage.foldername(name))[1]=auth.jwt()->>'sub'
 and name ~ '^[A-Za-z0-9_-]+/[0-9a-f-]+\.(jpg|png|webp)$'));
drop policy if exists kyc_storage_no_update on storage.objects;
create policy kyc_storage_no_update on storage.objects as restrictive for update to public
using (bucket_id<>'kyc-documents') with check (bucket_id<>'kyc-documents');
drop policy if exists kyc_storage_no_delete on storage.objects;
create policy kyc_storage_no_delete on storage.objects as restrictive for delete to public
using (bucket_id<>'kyc-documents');

-- Server-side validation; this function is only callable as a trigger.
create or replace function public.guard_kyc_submission() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  actor text := auth.jwt()->>'sub';
  doc_type text;
  image_path text;
  is_review boolean := false;
begin
  if actor is null or actor='' then raise exception 'Sign in to submit or review KYC.'; end if;
  if tg_op='UPDATE' then
    if new.user_id is distinct from old.user_id then raise exception 'KYC ownership cannot change.'; end if;
    is_review := public.is_admin() and new.status in ('approved','rejected');
  end if;
  if is_review then
    if old.status is distinct from 'pending' then raise exception 'This submission is no longer pending. Refresh the list.'; end if;
    if actor=new.user_id then raise exception 'An administrator cannot review their own KYC.'; end if;
    if row(new.id_type,new.document_type,new.id_number,new.dob,new.address,new.city,new.country,new.front_image,new.back_image,new.proof_of_address_image,new.submission_date)
      is distinct from row(old.id_type,old.document_type,old.id_number,old.dob,old.address,old.city,old.country,old.front_image,old.back_image,old.proof_of_address_image,old.submission_date) then
      raise exception 'Review cannot change submitted identity information.';
    end if;
    new.admin_notes := btrim(coalesce(new.admin_notes,''));
    if length(new.admin_notes)>2000 then raise exception 'Review notes must be at most 2000 characters.'; end if;
    if new.status='rejected' and new.admin_notes='' then raise exception 'A rejection reason is required.'; end if;
    new.rejection_reason := case when new.status='rejected' then new.admin_notes else '' end;
    new.reviewed_at := now();
    new.reviewed_by := actor;
    new.revision := old.revision+1;
    -- Legacy submissions with no images can be rejected for resubmission.
    if new.status='rejected' then return new; end if;
  else
    if actor is distinct from new.user_id or new.status is distinct from 'pending' then
      raise exception 'Users can submit only their own pending KYC.';
    end if;
    if tg_op='UPDATE' and old.status not in ('unverified','rejected') then
      raise exception 'Pending or approved KYC cannot be replaced. Refresh your status.';
    end if;
    if coalesce(new.admin_notes,'')<>'' or coalesce(new.rejection_reason,'')<>'' or new.reviewed_at is not null or new.reviewed_by is not null then
      -- reviewed_by from a previously rejected record is cleared by the client.
      raise exception 'Review fields are reserved for administrators.';
    end if;
    new.submission_date := now();
    new.admin_notes := ''; new.rejection_reason := ''; new.reviewed_at := null; new.reviewed_by := null;
    new.revision := case when tg_op='INSERT' then 1 else old.revision+1 end;
  end if;
  doc_type := coalesce(nullif(new.document_type,''),new.id_type);
  if doc_type is null or doc_type not in ('Government ID','Passport','Driver''s License') then raise exception 'Choose a valid document type.'; end if;
  if not is_review then new.document_type := doc_type; new.id_type := doc_type; end if;
  if nullif(btrim(new.id_number),'') is null or length(new.id_number)>100
    or nullif(btrim(new.address),'') is null or length(new.address)>500
    or nullif(btrim(new.city),'') is null or length(new.city)>120
    or nullif(btrim(new.country),'') is null or length(new.country)>120 then
    raise exception 'Complete all identity and address fields within their limits.';
  end if;
  if new.dob is null or new.dob::date>current_date then raise exception 'Enter a valid date of birth.'; end if;
  if coalesce(new.front_image,'')='' or (doc_type<>'Passport' and coalesce(new.back_image,'')='') then
    raise exception 'Required identity images are missing. Request or upload a new submission.';
  end if;
  foreach image_path in array array[new.front_image,new.back_image,new.proof_of_address_image] loop
    if coalesce(image_path,'')='' then continue; end if;
    if split_part(image_path,'/',1) is distinct from new.user_id or image_path !~ '^[A-Za-z0-9_-]+/[0-9a-f-]+\.(jpg|png|webp)$' then
      raise exception 'Each image must be a private upload belonging to this user.';
    end if;
    if not exists(select 1 from storage.objects where bucket_id='kyc-documents' and name=image_path) then
      raise exception 'Each image must reference an existing upload.';
    end if;
  end loop;
  return new;
end $$;
revoke all on function public.guard_kyc_submission() from public;
drop trigger if exists guard_kyc_submission on public.kyc_submissions;
create trigger guard_kyc_submission before insert or update on public.kyc_submissions
for each row execute function public.guard_kyc_submission();

-- Preserve existing policy names; the restrictive guards prevent broader old
-- policies from granting cross-user access or destructive client operations.
drop policy if exists kyc_read on public.kyc_submissions;
create policy kyc_read on public.kyc_submissions for select to authenticated using (user_id=auth.jwt()->>'sub' or public.is_admin());
drop policy if exists kyc_read_guard on public.kyc_submissions;
create policy kyc_read_guard on public.kyc_submissions as restrictive for select to public using (user_id=auth.jwt()->>'sub' or public.is_admin());
drop policy if exists kyc_insert on public.kyc_submissions;
create policy kyc_insert on public.kyc_submissions for insert to authenticated with check (user_id=auth.jwt()->>'sub' and status='pending');
drop policy if exists kyc_insert_guard on public.kyc_submissions;
create policy kyc_insert_guard on public.kyc_submissions as restrictive for insert to public with check (user_id=auth.jwt()->>'sub' and status='pending');
drop policy if exists kyc_update on public.kyc_submissions;
create policy kyc_update on public.kyc_submissions for update to authenticated
using (user_id=auth.jwt()->>'sub' or public.is_admin()) with check (user_id=auth.jwt()->>'sub' or public.is_admin());
drop policy if exists kyc_update_guard on public.kyc_submissions;
create policy kyc_update_guard on public.kyc_submissions as restrictive for update to public
using (user_id=auth.jwt()->>'sub' or public.is_admin()) with check (user_id=auth.jwt()->>'sub' or public.is_admin());
drop policy if exists kyc_no_delete on public.kyc_submissions;
create policy kyc_no_delete on public.kyc_submissions as restrictive for delete to public using (false);
grant select, insert, update on public.kyc_submissions to authenticated;
revoke all on public.kyc_submissions from anon;

create or replace function public.review_kyc_submission(p_user_id text, p_status text, p_notes text, p_expected_revision integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare reviewed public.kyc_submissions;
begin
  if not coalesce(public.is_admin(),false) then raise exception 'Only an admin can review KYC.'; end if;
  if p_status is null or p_status not in ('approved','rejected') then raise exception 'Invalid review status.'; end if;
  select * into reviewed from public.kyc_submissions where user_id=p_user_id for update;
  if not found then raise exception 'Submission not found.'; end if;
  if p_expected_revision is null or reviewed.revision<>p_expected_revision or reviewed.status<>'pending' then
    raise exception 'This submission changed or was already reviewed. Refresh and review the current documents.';
  end if;
  update public.kyc_submissions set status=p_status, admin_notes=p_notes where user_id=p_user_id returning * into reviewed;
  return to_jsonb(reviewed);
end $$;
revoke all on function public.review_kyc_submission(text,text,text,integer) from public, anon;
grant execute on function public.review_kyc_submission(text,text,text,integer) to authenticated;
commit;
