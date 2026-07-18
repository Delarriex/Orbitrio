-- bug #25: announcements.priority was created as INTEGER, but the app uses
-- STRING priorities ('Normal' | 'Important' | 'Critical') everywhere — the
-- Announcement type, the admin bulletins UI, and the ANNOUNCEMENT email
-- template. Every write therefore failed with
--   invalid input syntax for type integer: "Normal"   (code 22P02)
-- which surfaced when an admin loaded an empty announcements table and it tried
-- to seed the two default announcements. This converts the column to text to
-- match the app (consistent with the other text-enum columns, e.g.
-- support_tickets.status), mapping any pre-existing integer values to names.
--
-- Run once in the Supabase SQL editor. Safe to re-run.

alter table announcements alter column priority drop default;

alter table announcements
  alter column priority type text
  using (
    case priority::text
      when '0' then 'Normal'
      when '1' then 'Important'
      when '2' then 'Critical'
      else coalesce(nullif(priority::text, ''), 'Normal')
    end
  );

alter table announcements alter column priority set default 'Normal';

-- Enforce the app's allowed set going forward (matches AnnouncementPriority).
alter table announcements drop constraint if exists announcements_priority_check;
alter table announcements add constraint announcements_priority_check
  check (priority in ('Normal', 'Important', 'Critical'));
