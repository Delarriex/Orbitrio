-- Run in the TEST Supabase SQL editor before retrying KYC review.
-- Matches the existing Orbitrio helper: the Clerk subject must have role='admin'.
-- CREATE OR REPLACE preserves the function's owner and existing execution grants.
-- No user roles, balances, KYC records, or storage objects are changed.
begin;

create or replace function public.is_admin()
returns boolean
language sql
stable security definer
set search_path = ''
as $function$
  select exists (
    select 1 from public.users
    where id = auth.jwt()->>'sub'
      and role = 'admin'
  );
$function$;

commit;
