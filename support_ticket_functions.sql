-- Support tickets: table, RLS, and RPC functions.
-- Run this entire block once in the Supabase SQL editor.
-- Assumes `users` (with a text `id` matching Clerk's user id) and
-- `is_admin()` already exist from the core schema migration.

create table if not exists support_tickets (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  subject text not null,
  category text not null check (category in ('deposit', 'withdrawal', 'trading', 'general')),
  status text not null default 'open' check (status in ('open', 'pending', 'resolved')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_tickets_user_id_idx on support_tickets(user_id);
create index if not exists support_tickets_status_idx on support_tickets(status);

alter table support_tickets enable row level security;

drop policy if exists "support_tickets_select" on support_tickets;
create policy "support_tickets_select" on support_tickets
  for select
  using (user_id = (auth.jwt() ->> 'sub') or is_admin());

drop policy if exists "support_tickets_insert" on support_tickets;
create policy "support_tickets_insert" on support_tickets
  for insert
  with check (user_id = (auth.jwt() ->> 'sub') and status = 'open');

-- No update/delete policy: every mutation after creation (replies, closing,
-- priority changes) goes through the security-definer RPCs below, so the
-- messages array can never be clobbered by a stale client-side
-- read-modify-write racing another writer.

-- User replies to their own ticket. Appends a "user" message and moves
-- status to "pending" so it surfaces back on the admin queue.
create or replace function reply_to_ticket(p_ticket_id text, p_text text, p_time text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update support_tickets
  set
    messages = messages || jsonb_build_array(jsonb_build_object('sender', 'user', 'text', p_text, 'time', p_time)),
    status = 'pending',
    updated_at = now()
  where id = p_ticket_id
    and user_id = (auth.jwt() ->> 'sub');

  if not found then
    raise exception 'Ticket not found or not owned by caller';
  end if;
end;
$$;

grant execute on function reply_to_ticket(text, text, text) to authenticated;

-- Support-side reply. Callable by a real admin (genuine helpdesk reply) OR
-- by the ticket's own owner (used only for the client's simulated
-- "agent assigned" auto-response fired on a timer right after a ticket is
-- created — this mirrors the existing Firestore-era behavior exactly,
-- where createTicket calls this same reply path either way). Appends a
-- "support" message and marks the ticket resolved, matching prior
-- behavior exactly (including the pre-existing quirk that an admin reply
-- immediately resolves the ticket rather than leaving it open).
create or replace function reply_to_ticket_as_support(p_ticket_id text, p_text text, p_time text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update support_tickets
  set
    messages = messages || jsonb_build_array(jsonb_build_object('sender', 'support', 'text', p_text, 'time', p_time)),
    status = 'resolved',
    updated_at = now()
  where id = p_ticket_id
    and (is_admin() or user_id = (auth.jwt() ->> 'sub'));

  if not found then
    raise exception 'Ticket not found or not permitted';
  end if;
end;
$$;

grant execute on function reply_to_ticket_as_support(text, text, text) to authenticated;

-- Admin marks a ticket resolved without adding a message.
create or replace function close_ticket(p_ticket_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Only admins can close tickets';
  end if;

  update support_tickets
  set status = 'resolved', updated_at = now()
  where id = p_ticket_id;

  if not found then
    raise exception 'Ticket not found';
  end if;
end;
$$;

grant execute on function close_ticket(text) to authenticated;

-- Admin sets a ticket's priority.
create or replace function set_ticket_priority(p_ticket_id text, p_priority text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Only admins can set ticket priority';
  end if;

  if p_priority not in ('low', 'medium', 'high') then
    raise exception 'Invalid priority: %', p_priority;
  end if;

  update support_tickets
  set priority = p_priority, updated_at = now()
  where id = p_ticket_id;

  if not found then
    raise exception 'Ticket not found';
  end if;
end;
$$;

grant execute on function set_ticket_priority(text, text) to authenticated;
