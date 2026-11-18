-- =============================================================================
-- READERS OF AURANGABAD — MEMBER NOTIFICATIONS & EVENT BROADCASTS
-- Migration: 202611162314_member_notifications.sql
-- Purpose:
--   1. Add persistent notification broadcasts and per-member read receipts.
--   2. Enable secure Realtime delivery for authenticated members.
--   3. Generate notifications automatically for qualifying meetup/announcement events.
--   4. Notify members when a meetup is explicitly cancelled. (The 'cancelled'
--      registration_status label itself is added by migration
--      202611162313_add_cancelled_registration_status.sql.)
--
-- Notes:
--   - Review-only migration. Do not apply to production automatically.
--   - Preserves existing admin/editor/member role semantics.
--   - Members may only manage their own read receipts.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. MEETUP STATUS & PUBLICATION EVENT TRACKING (additive)
-- -----------------------------------------------------------------------------
-- registration_status is a native enum (public.registration_status). Valid
-- values are enforced by the type itself; do not duplicate them in a CHECK
-- constraint. The 'cancelled' label is added by the preceding migration
-- 202611162313_add_cancelled_registration_status.sql.
alter table public.meetups
  add column if not exists publication_version integer not null default 0;

alter table public.announcements
  add column if not exists publication_version integer not null default 0;

-- Backfill deterministic publication versions for existing rows.
update public.meetups
set publication_version = case when is_published then 1 else 0 end
where publication_version = 0;

update public.announcements
set publication_version = case when is_published then 1 else 0 end
where publication_version = 0;

-- -----------------------------------------------------------------------------
-- 2. NOTIFICATION TABLES
-- -----------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null check (
    type in (
      'meetup_published',
      'meetup_schedule_updated',
      'meetup_venue_updated',
      'meetup_cancelled',
      'announcement_published',
      'community_update_published'
    )
  ),
  title text not null check (char_length(title) between 1 and 200),
  message text not null check (char_length(message) between 1 and 2000),
  meetup_id uuid references public.meetups(id) on delete set null,
  announcement_id uuid references public.announcements(id) on delete set null,
  action_url text,
  dedupe_key text not null unique,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint notifications_target_check check (
    (meetup_id is not null and announcement_id is null)
    or (meetup_id is null and announcement_id is not null)
    or (meetup_id is null and announcement_id is null)
  )
);

create table if not exists public.notification_receipts (
  notification_id uuid not null references public.notifications(id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notification_id, member_id)
);

create index if not exists notifications_created_at_idx
  on public.notifications(created_at desc);

create index if not exists notifications_meetup_id_idx
  on public.notifications(meetup_id);

create index if not exists notifications_announcement_id_idx
  on public.notifications(announcement_id);

create index if not exists notification_receipts_member_id_idx
  on public.notification_receipts(member_id);

create index if not exists notification_receipts_notification_id_idx
  on public.notification_receipts(notification_id);

-- -----------------------------------------------------------------------------
-- 3. RLS
-- -----------------------------------------------------------------------------
alter table public.notifications enable row level security;
alter table public.notification_receipts enable row level security;

drop policy if exists notifications_select_authenticated on public.notifications;
create policy notifications_select_authenticated
  on public.notifications
  for select
  to authenticated
  using (true);

drop policy if exists notifications_insert_staff on public.notifications;
create policy notifications_insert_staff
  on public.notifications
  for insert
  to authenticated
  with check (public.can_manage_content());

drop policy if exists notifications_update_staff on public.notifications;
create policy notifications_update_staff
  on public.notifications
  for update
  to authenticated
  using (public.can_manage_content())
  with check (public.can_manage_content());

drop policy if exists notifications_delete_staff on public.notifications;
create policy notifications_delete_staff
  on public.notifications
  for delete
  to authenticated
  using (public.can_manage_content());

drop policy if exists notification_receipts_select_self on public.notification_receipts;
create policy notification_receipts_select_self
  on public.notification_receipts
  for select
  to authenticated
  using (member_id = auth.uid());

drop policy if exists notification_receipts_insert_self on public.notification_receipts;
create policy notification_receipts_insert_self
  on public.notification_receipts
  for insert
  to authenticated
  with check (
    member_id = auth.uid()
    and exists (
      select 1
      from public.notifications n
      where n.id = notification_id
    )
  );

drop policy if exists notification_receipts_update_self on public.notification_receipts;
create policy notification_receipts_update_self
  on public.notification_receipts
  for update
  to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

drop policy if exists notification_receipts_delete_self on public.notification_receipts;
create policy notification_receipts_delete_self
  on public.notification_receipts
  for delete
  to authenticated
  using (member_id = auth.uid());

revoke all on public.notifications from anon, authenticated;
revoke all on public.notification_receipts from anon, authenticated;

grant select on public.notifications to authenticated;
grant insert, update, delete on public.notifications to authenticated;

grant select, insert, update, delete on public.notification_receipts to authenticated;

-- -----------------------------------------------------------------------------
-- 4. REALTIME (authenticated members subscribe to broadcasts)
-- -----------------------------------------------------------------------------
do $$
begin
  begin
    alter publication supabase_realtime add table public.notifications;
  exception
    when duplicate_object then null;
    when undefined_object then
      raise notice 'supabase_realtime publication not found; skipping realtime publication for notifications.';
  end;
end $$;

-- -----------------------------------------------------------------------------
-- 5. AUTOMATIC NOTIFICATION GENERATION (reliable, DB-side)
-- -----------------------------------------------------------------------------
create or replace function public.bump_meetup_publication_version()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.publication_version := case when coalesce(new.is_published, false) then 1 else 0 end;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if coalesce(old.is_published, false) = false and coalesce(new.is_published, false) = true then
      new.publication_version := greatest(coalesce(old.publication_version, 0), 0) + 1;
    else
      new.publication_version := greatest(coalesce(old.publication_version, 0), 0);
    end if;
    return new;
  end if;

  return new;
end;
$$;

create or replace function public.bump_announcement_publication_version()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.publication_version := case when coalesce(new.is_published, false) then 1 else 0 end;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if coalesce(old.is_published, false) = false and coalesce(new.is_published, false) = true then
      new.publication_version := greatest(coalesce(old.publication_version, 0), 0) + 1;
    else
      new.publication_version := greatest(coalesce(old.publication_version, 0), 0);
    end if;
    return new;
  end if;

  return new;
end;
$$;

revoke all on function public.bump_meetup_publication_version() from public;
revoke all on function public.bump_meetup_publication_version() from anon;
revoke all on function public.bump_meetup_publication_version() from authenticated;
revoke all on function public.bump_announcement_publication_version() from public;
revoke all on function public.bump_announcement_publication_version() from anon;
revoke all on function public.bump_announcement_publication_version() from authenticated;

drop trigger if exists trg_bump_meetup_publication_version on public.meetups;
create trigger trg_bump_meetup_publication_version
  before insert or update on public.meetups
  for each row
  execute function public.bump_meetup_publication_version();

drop trigger if exists trg_bump_announcement_publication_version on public.announcements;
create trigger trg_bump_announcement_publication_version
  before insert or update on public.announcements
  for each row
  execute function public.bump_announcement_publication_version();

create or replace function public.create_notification_broadcast(
  p_type text,
  p_title text,
  p_message text,
  p_meetup_id uuid,
  p_announcement_id uuid,
  p_action_url text,
  p_dedupe_key text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (
    type,
    title,
    message,
    meetup_id,
    announcement_id,
    action_url,
    dedupe_key,
    created_by
  )
  values (
    p_type,
    p_title,
    p_message,
    p_meetup_id,
    p_announcement_id,
    p_action_url,
    p_dedupe_key,
    auth.uid()
  )
  on conflict (dedupe_key) do nothing;
end;
$$;

revoke all on function public.create_notification_broadcast(text, text, text, uuid, uuid, text, text) from public;
revoke all on function public.create_notification_broadcast(text, text, text, uuid, uuid, text, text) from anon;
revoke all on function public.create_notification_broadcast(text, text, text, uuid, uuid, text, text) from authenticated;

create or replace function public.notify_on_meetup_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_action_url text := '/gatherings';
begin
  if tg_op = 'INSERT' then
    if new.is_published = true then
      perform public.create_notification_broadcast(
        'meetup_published',
        'New reading meetup announced!',
        format('"%s" has been published. Check the details and registration.', new.title),
        new.id,
        null,
        v_action_url,
        format('meetup:%s:published:%s', new.id, new.publication_version)
      );
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    -- New meetup publication cycle (draft/unpublished -> published)
    if coalesce(old.is_published, false) = false and coalesce(new.is_published, false) = true then
      perform public.create_notification_broadcast(
        'meetup_published',
        'New reading meetup announced!',
        format('"%s" has been published. Check the details and registration.', new.title),
        new.id,
        null,
        v_action_url,
        format('meetup:%s:published:%s', new.id, new.publication_version)
      );
    end if;

    -- Only generate change notifications for currently published meetups
    if coalesce(new.is_published, false) = true then
      -- Event date/time changed
      if old.starts_at is distinct from new.starts_at
         or coalesce(old.time_label, '') is distinct from coalesce(new.time_label, '') then
        perform public.create_notification_broadcast(
          'meetup_schedule_updated',
          'Event date updated',
          format('The schedule for "%s" has changed. Please review the latest timing.', new.title),
          new.id,
          null,
          v_action_url,
          format(
            'meetup:%s:schedule:%s:%s',
            new.id,
            coalesce(to_char(new.starts_at at time zone 'UTC', 'YYYYMMDDHH24MISS'), 'na'),
            md5(coalesce(new.time_label, ''))
          )
        );
      end if;

      -- Venue changed
      if coalesce(old.venue, '') is distinct from coalesce(new.venue, '')
         or coalesce(old.address, '') is distinct from coalesce(new.address, '') then
        perform public.create_notification_broadcast(
          'meetup_venue_updated',
          'Event venue updated',
          format('The venue for "%s" has changed. Please check the latest location details.', new.title),
          new.id,
          null,
          v_action_url,
          format(
            'meetup:%s:venue:%s:%s',
            new.id,
            md5(coalesce(new.venue, '')),
            md5(coalesce(new.address, ''))
          )
        );
      end if;
    end if;

    -- Event cancelled (explicit cancellation state transition)
    if old.registration_status is distinct from new.registration_status
       and new.registration_status = 'cancelled' then
      perform public.create_notification_broadcast(
        'meetup_cancelled',
        'Event cancelled',
        format('"%s" has been cancelled. Please check for future gatherings and updates.', new.title),
        new.id,
        null,
        v_action_url,
        format('meetup:%s:cancelled', new.id)
      );
    end if;

    return new;
  end if;

  return new;
end;
$$;

revoke all on function public.notify_on_meetup_change() from public;
revoke all on function public.notify_on_meetup_change() from anon;
revoke all on function public.notify_on_meetup_change() from authenticated;

drop trigger if exists trg_notify_on_meetup_change on public.meetups;
create trigger trg_notify_on_meetup_change
  after insert or update on public.meetups
  for each row
  execute function public.notify_on_meetup_change();

create or replace function public.notify_on_announcement_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_action_url text := '/';
  v_type text := 'announcement_published';
  v_title text := 'Community announcement';
begin
  -- Only notify when becoming published (insert published or draft/unpublished -> published)
  if coalesce(new.is_published, false) = true
     and (tg_op = 'INSERT' or coalesce(old.is_published, false) = false) then

    if lower(coalesce(new.title, '')) like '%important%'
       or lower(coalesce(new.content, '')) like '%important%' then
      v_type := 'community_update_published';
      v_title := 'Important community update';
    end if;

    v_action_url := coalesce(nullif(new.action_url, ''), '/');

    perform public.create_notification_broadcast(
      v_type,
      v_title,
      format('New update: "%s"', new.title),
      null,
      new.id,
      v_action_url,
      format('announcement:%s:published:%s', new.id, new.publication_version)
    );
  end if;

  return new;
end;
$$;

revoke all on function public.notify_on_announcement_change() from public;
revoke all on function public.notify_on_announcement_change() from anon;
revoke all on function public.notify_on_announcement_change() from authenticated;

drop trigger if exists trg_notify_on_announcement_change on public.announcements;
create trigger trg_notify_on_announcement_change
  after insert or update on public.announcements
  for each row
  execute function public.notify_on_announcement_change();

commit;
