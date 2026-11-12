
-- =============================================================================
-- READERS OF AURANGABAD
-- REVISION 4.0 — INCREMENTAL PRODUCTION SECURITY HARDENING
-- Migration: 202611090001_revision_4_0_hardening.sql
-- Previous migration: 202611080001_admin_portal.sql (Revision 3.3)
-- Date: 2026-11-09
--
-- IMPORTANT:
-- This migration upgrades an existing Revision 3.3 installation.
-- It does not drop application tables or delete application records.
--
-- Changes:
-- 1. Rebuild application RLS policies.
-- 2. Correct profile privilege management.
-- 3. Secure Auth email synchronization.
-- 4. Restrict public insertion privileges.
-- 5. Add concurrency-safe meetup capacity enforcement.
-- 6. Normalize public registration and enquiry submissions.
-- 7. Harden SECURITY DEFINER functions.
-- 8. Audit policies for ROA storage buckets.
-- 9. Improve language and JSONB validation.
-- 10. Preserve existing application data.
-- =============================================================================

begin;

-- =============================================================================
-- 1. SCHEMA ACCESS HARDENING
-- =============================================================================

grant usage on schema public to anon, authenticated;

-- Prevent browser roles from creating objects in the application schema.
revoke create on schema public from PUBLIC, anon, authenticated;


-- =============================================================================
-- 2. JWT ROLE DETECTION
-- =============================================================================

create or replace function public.get_jwt_role()
returns text
language plpgsql
stable
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_legacy_role text;
  v_claims text;
  v_json_role text;
  v_session_role text;
begin
  v_legacy_role :=
    nullif(current_setting('request.jwt.claim.role', true), '');

  if v_legacy_role is not null then
    return v_legacy_role;
  end if;

  v_claims :=
    nullif(current_setting('request.jwt.claims', true), '');

  if v_claims is not null then
    begin
      v_json_role := v_claims::jsonb ->> 'role';

      if nullif(v_json_role, '') is not null then
        return v_json_role;
      end if;

    exception when others then
      return 'untrusted_client';
    end;
  end if;

  v_session_role := current_setting('role', true);

  if v_session_role in ('anon', 'authenticated') then
    return v_session_role;
  end if;

  return null;
end;
$function$;

revoke all on function public.get_jwt_role()
from PUBLIC, anon, authenticated;


-- =============================================================================
-- 3. AUTHORIZATION HELPERS
-- =============================================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, pg_temp
as $function$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'::public.admin_role
  );
$function$;


create or replace function public.is_editor()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, pg_temp
as $function$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'editor'::public.admin_role
  );
$function$;


create or replace function public.can_manage_content()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, pg_temp
as $function$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in (
        'admin'::public.admin_role,
        'editor'::public.admin_role
      )
  );
$function$;

-- Remove implicit PUBLIC execution.
revoke all on function public.is_admin()
from PUBLIC, anon, authenticated;

revoke all on function public.is_editor()
from PUBLIC, anon, authenticated;

revoke all on function public.can_manage_content()
from PUBLIC, anon, authenticated;

-- RLS needs these helpers available to browser roles.
grant execute on function public.is_admin()
to anon, authenticated;

grant execute on function public.is_editor()
to anon, authenticated;

grant execute on function public.can_manage_content()
to anon, authenticated;


-- =============================================================================
-- 4. PROFILE PRIVILEGE PROTECTION
-- =============================================================================

create or replace function public.protect_profile_roles()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_jwt_role text;
  v_caller uuid;
  v_auth_email_sync boolean := false;
  v_privileged_change boolean := false;
begin
  v_jwt_role := public.get_jwt_role();
  v_caller := auth.uid();

  -- Profile identifiers are immutable.
  if old.id is distinct from new.id then
    raise exception 'Profile ID is immutable.'
      using errcode = '42501';
  end if;

  v_privileged_change :=
    old.role is distinct from new.role
    or old.designation is distinct from new.designation;

  -- Trusted Auth-triggered email synchronization:
  -- Auth update trigger -> profile update trigger.
  -- The nested trigger depth must be greater than one.
  v_auth_email_sync :=
    old.email is distinct from new.email
    and pg_trigger_depth() > 1
    and old.role is not distinct from new.role
    and old.designation is not distinct from new.designation;

  -- Email cannot be changed directly through the application API,
  -- including by administrators.
  if old.email is distinct from new.email
     and not v_auth_email_sync then

    if v_jwt_role is not null then
      raise exception
        'Email changes must be performed through Supabase Auth verification.'
        using errcode = '42501';
    end if;

    if session_user not in ('postgres', 'supabase_admin') then
      raise exception
        'Unverified database session cannot modify profile email.'
        using errcode = '42501';
    end if;
  end if;

  -- Only administrators may modify staff privileges.
  if v_privileged_change then

    if v_jwt_role is not null then

      if v_jwt_role in ('anon', 'untrusted_client')
         or v_caller is null
         or not public.is_admin() then

        raise exception
          'Only verified administrators can modify staff privileges.'
          using errcode = '42501';
      end if;

    else

      if session_user not in ('postgres', 'supabase_admin') then
        raise exception
          'Unverified database session cannot modify staff privileges.'
          using errcode = '42501';
      end if;

    end if;
  end if;

  -- Preserve system-managed fields.
  new.created_at := old.created_at;
  new.updated_at := now();

  return new;
end;
$function$;

revoke all on function public.protect_profile_roles()
from PUBLIC, anon, authenticated;


-- =============================================================================
-- 5. AUTH USER TRIGGERS
-- =============================================================================

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
begin

  insert into public.profiles (
    id,
    email,
    full_name,
    designation,
    role
  )
  values (
    new.id,
    new.email,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      split_part(new.email, '@', 1)
    ),
    null,
    null
  )
  on conflict (id)
  do update set email = excluded.email;

  return new;
end;
$function$;


create or replace function public.handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
begin

  if old.email is distinct from new.email then

    update public.profiles
    set email = new.email
    where id = new.id;

  end if;

  return new;
end;
$function$;


revoke all on function public.handle_new_auth_user()
from PUBLIC, anon, authenticated;

revoke all on function public.handle_auth_user_updated()
from PUBLIC, anon, authenticated;


-- =============================================================================
-- 6. PROFILE AND AUTH TRIGGERS
-- =============================================================================

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();


drop trigger if exists on_auth_user_updated on auth.users;

create trigger on_auth_user_updated
after update of email on auth.users
for each row
execute function public.handle_auth_user_updated();


drop trigger if exists trg_protect_profile_roles on public.profiles;

create trigger trg_protect_profile_roles
before update on public.profiles
for each row
execute function public.protect_profile_roles();


-- =============================================================================
-- 7. PUBLIC REGISTRATION GUARD
-- CONCURRENCY-SAFE CAPACITY ENFORCEMENT
-- =============================================================================

create or replace function public.guard_registration_insert()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_published boolean;
  v_registration_status public.registration_status;
  v_capacity integer;
  v_registration_count bigint;
  v_is_admin boolean;
begin

  v_is_admin := public.is_admin();

  -- Lock meetup row to serialize simultaneous registrations.
  select
    m.is_published,
    m.registration_status,
    m.capacity
  into
    v_published,
    v_registration_status,
    v_capacity
  from public.meetups m
  where m.id = new.meetup_id
  for update;

  if not found then
    raise exception 'Meetup does not exist.'
      using errcode = '23503';
  end if;

  if not v_is_admin then

    if not v_published
       or v_registration_status <> 'open' then

      raise exception 'Registration is not open for this meetup.'
        using errcode = '42501';
    end if;

  end if;

  select count(*)
  into v_registration_count
  from public.registrations r
  where r.meetup_id = new.meetup_id;

  if v_capacity is not null
     and v_registration_count >= v_capacity then

    raise exception 'Meetup registration capacity has been reached.'
      using errcode = '23514';
  end if;

  -- Normalize user-provided fields.
  new.name := trim(new.name);
  new.email := lower(trim(new.email));

  if new.phone is not null then
    new.phone := trim(new.phone);
  end if;

  if not v_is_admin then
    -- Public and editor submissions cannot assign admin fields.
    new.status := 'new';
    new.created_at := now();
    new.details := '{}'::jsonb;
    new.duplicate_key := null;
  end if;

  return new;
end;
$function$;

revoke all on function public.guard_registration_insert()
from PUBLIC, anon, authenticated;


drop trigger if exists trg_guard_registration_insert
on public.registrations;

create trigger trg_guard_registration_insert
before insert on public.registrations
for each row
execute function public.guard_registration_insert();


-- =============================================================================
-- 8. PUBLIC ENQUIRY GUARD
-- =============================================================================

create or replace function public.guard_enquiry_insert()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
begin

  new.name := trim(new.name);
  new.email := lower(trim(new.email));
  new.message := trim(new.message);

  if new.phone is not null then
    new.phone := trim(new.phone);
  end if;

  if not public.is_admin() then
    new.status := 'new';
    new.created_at := now();
    new.details := '{}'::jsonb;
  end if;

  return new;
end;
$function$;

revoke all on function public.guard_enquiry_insert()
from PUBLIC, anon, authenticated;


drop trigger if exists trg_guard_enquiry_insert
on public.enquiries;

create trigger trg_guard_enquiry_insert
before insert on public.enquiries
for each row
execute function public.guard_enquiry_insert();


-- =============================================================================
-- 9. UPDATED_AT FUNCTION HARDENING
-- =============================================================================

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
begin
  new.updated_at := now();
  return new;
end;
$function$;

revoke all on function public.touch_updated_at()
from PUBLIC, anon, authenticated;


-- =============================================================================
-- 10. DATA VALIDATION
-- =============================================================================

-- Activities and schedules must be JSON arrays.
-- NOT VALID preserves existing rows while enforcing new writes.

do $block$
begin

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.meetups'::regclass
      and conname = 'meetups_activities_array_check'
  ) then

    alter table public.meetups
    add constraint meetups_activities_array_check
    check (jsonb_typeof(activities) = 'array')
    not valid;

  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.meetups'::regclass
      and conname = 'meetups_schedule_array_check'
  ) then

    alter table public.meetups
    add constraint meetups_schedule_array_check
    check (jsonb_typeof(schedule) = 'array')
    not valid;

  end if;

end;
$block$;


-- Support additional language codes, including Marathi.
alter table public.articles
drop constraint if exists articles_language_check;

do $block$
begin

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.articles'::regclass
      and conname = 'articles_language_bcp47_check'
  ) then

    alter table public.articles
    add constraint articles_language_bcp47_check
    check (
      language ~ '^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$'
    )
    not valid;

  end if;

end;
$block$;


-- =============================================================================
-- 11. APPLICATION TABLE PRIVILEGE RESET
-- =============================================================================

revoke all on table public.profiles
from PUBLIC, anon, authenticated;

revoke all on table public.meetups
from PUBLIC, anon, authenticated;

revoke all on table public.registrations
from PUBLIC, anon, authenticated;

revoke all on table public.gallery_images
from PUBLIC, anon, authenticated;

revoke all on table public.reels
from PUBLIC, anon, authenticated;

revoke all on table public.announcements
from PUBLIC, anon, authenticated;

revoke all on table public.articles
from PUBLIC, anon, authenticated;

revoke all on table public.enquiries
from PUBLIC, anon, authenticated;


-- Public content reading.
grant select on public.meetups,
  public.gallery_images,
  public.reels,
  public.announcements,
  public.articles
to anon;


-- Anonymous users can insert only approved registration fields.
grant insert (
  meetup_id,
  name,
  email,
  phone,
  message,
  consent
)
on public.registrations to anon;


-- Anonymous users can insert only approved enquiry fields.
grant insert (
  type,
  name,
  email,
  phone,
  message,
  consent
)
on public.enquiries to anon;


-- Authenticated profile permissions.
grant select on public.profiles to authenticated;

grant update (
  full_name,
  role,
  designation
)
on public.profiles to authenticated;


-- Content management permissions.
grant select, insert, update, delete
on public.meetups,
   public.gallery_images,
   public.reels,
   public.announcements,
   public.articles
to authenticated;


-- Authenticated users can submit registrations and enquiries.
-- RLS and BEFORE INSERT triggers protect administrative fields.
grant select, insert, update, delete
on public.registrations,
   public.enquiries
to authenticated;


-- =============================================================================
-- 12. APPLICATION RLS POLICY RECONSTRUCTION
-- =============================================================================

-- These eight tables belong to the Readers of Aurangabad application.
-- Remove their existing policies before installing the authoritative set.

do $block$
declare
  v_policy record;
begin

  for v_policy in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = any(array[
        'profiles',
        'meetups',
        'registrations',
        'gallery_images',
        'reels',
        'announcements',
        'articles',
        'enquiries'
      ])
  loop

    execute format(
      'drop policy %I on %I.%I',
      v_policy.policyname,
      v_policy.schemaname,
      v_policy.tablename
    );

  end loop;

end;
$block$;


-- Ensure RLS is enabled.
alter table public.profiles enable row level security;
alter table public.meetups enable row level security;
alter table public.registrations enable row level security;
alter table public.gallery_images enable row level security;
alter table public.reels enable row level security;
alter table public.announcements enable row level security;
alter table public.articles enable row level security;
alter table public.enquiries enable row level security;


-- 12.1 PROFILES

create policy "Profiles readable by owner or admin"
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or (select public.is_admin())
);


create policy "Profiles update own name or admin management"
on public.profiles
for update
to authenticated
using (
  id = (select auth.uid())
  or (select public.is_admin())
)
with check (
  id = (select auth.uid())
  or (select public.is_admin())
);

-- Deliberately no browser DELETE policy.
-- Account deletion must use a trusted Supabase Auth Admin API workflow.


-- 12.2 MEETUPS

create policy "Published meetups public read"
on public.meetups
for select
to anon, authenticated
using (
  is_published
  or (select public.can_manage_content())
);

create policy "Staff insert meetups"
on public.meetups
for insert
to authenticated
with check (
  (select public.can_manage_content())
);

create policy "Staff update meetups"
on public.meetups
for update
to authenticated
using (
  (select public.can_manage_content())
)
with check (
  (select public.can_manage_content())
);

create policy "Staff delete meetups"
on public.meetups
for delete
to authenticated
using (
  (select public.can_manage_content())
);


-- 12.3 REGISTRATIONS

create policy "Public registration submission"
on public.registrations
for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.meetups m
    where m.id = registrations.meetup_id
      and m.is_published = true
      and m.registration_status = 'open'
  )
);

create policy "Admins read registrations"
on public.registrations
for select
to authenticated
using (
  (select public.is_admin())
);

create policy "Admins update registrations"
on public.registrations
for update
to authenticated
using (
  (select public.is_admin())
)
with check (
  (select public.is_admin())
);

create policy "Admins delete registrations"
on public.registrations
for delete
to authenticated
using (
  (select public.is_admin())
);


-- 12.4 GALLERY

create policy "Published gallery public read"
on public.gallery_images
for select
to anon, authenticated
using (
  is_published
  or (select public.can_manage_content())
);

create policy "Staff insert gallery"
on public.gallery_images
for insert
to authenticated
with check (
  (select public.can_manage_content())
);

create policy "Staff update gallery"
on public.gallery_images
for update
to authenticated
using (
  (select public.can_manage_content())
)
with check (
  (select public.can_manage_content())
);

create policy "Staff delete gallery"
on public.gallery_images
for delete
to authenticated
using (
  (select public.can_manage_content())
);


-- 12.5 REELS

create policy "Published reels public read"
on public.reels
for select
to anon, authenticated
using (
  is_published
  or (select public.can_manage_content())
);

create policy "Staff insert reels"
on public.reels
for insert
to authenticated
with check (
  (select public.can_manage_content())
);

create policy "Staff update reels"
on public.reels
for update
to authenticated
using (
  (select public.can_manage_content())
)
with check (
  (select public.can_manage_content())
);

create policy "Staff delete reels"
on public.reels
for delete
to authenticated
using (
  (select public.can_manage_content())
);


-- 12.6 ANNOUNCEMENTS

create policy "Active announcements public read"
on public.announcements
for select
to anon, authenticated
using (
  (
    is_published
    and publish_at <= now()
    and (
      unpublish_at is null
      or unpublish_at >= now()
    )
  )
  or (select public.can_manage_content())
);

create policy "Staff insert announcements"
on public.announcements
for insert
to authenticated
with check (
  (select public.can_manage_content())
);

create policy "Staff update announcements"
on public.announcements
for update
to authenticated
using (
  (select public.can_manage_content())
)
with check (
  (select public.can_manage_content())
);

create policy "Staff delete announcements"
on public.announcements
for delete
to authenticated
using (
  (select public.can_manage_content())
);


-- 12.7 ARTICLES

create policy "Published articles public read"
on public.articles
for select
to anon, authenticated
using (
  is_published
  or (select public.can_manage_content())
);

create policy "Staff insert articles"
on public.articles
for insert
to authenticated
with check (
  (select public.can_manage_content())
);

create policy "Staff update articles"
on public.articles
for update
to authenticated
using (
  (select public.can_manage_content())
)
with check (
  (select public.can_manage_content())
);

create policy "Staff delete articles"
on public.articles
for delete
to authenticated
using (
  (select public.can_manage_content())
);


-- 12.8 ENQUIRIES

create policy "Public enquiry submission"
on public.enquiries
for insert
to anon, authenticated
with check (
  char_length(trim(name)) between 2 and 100
  and char_length(trim(email)) between 5 and 255
  and char_length(trim(message)) between 5 and 3000
  and consent = true
);

create policy "Admins read enquiries"
on public.enquiries
for select
to authenticated
using (
  (select public.is_admin())
);

create policy "Admins update enquiries"
on public.enquiries
for update
to authenticated
using (
  (select public.is_admin())
)
with check (
  (select public.is_admin())
);

create policy "Admins delete enquiries"
on public.enquiries
for delete
to authenticated
using (
  (select public.is_admin())
);


-- =============================================================================
-- 13. STORAGE POLICY AUDIT AND RECONSTRUCTION
-- =============================================================================

-- Remove existing policies that reference ROA bucket identifiers.
-- Other unrelated Storage bucket policies are preserved.

do $block$
declare
  v_policy record;
begin

  for v_policy in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and (
        coalesce(qual, '') || ' ' ||
        coalesce(with_check, '')
      ) ~ 'roa-(reels|gallery|thumbnails)'
  loop

    execute format(
      'drop policy %I on %I.%I',
      v_policy.policyname,
      v_policy.schemaname,
      v_policy.tablename
    );

  end loop;

end;
$block$;


-- Preserve existing bucket visibility.
-- Gallery and thumbnail buckets remain public.
-- Reels remain private.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values
(
  'roa-reels',
  'roa-reels',
  false,
  524288000,
  array['video/mp4','video/webm','video/quicktime']
),
(
  'roa-gallery',
  'roa-gallery',
  true,
  20971520,
  array['image/jpeg','image/png','image/webp','image/avif']
),
(
  'roa-thumbnails',
  'roa-thumbnails',
  true,
  10485760,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id)
do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;


-- 13.1 REELS STORAGE

create policy "ROA staff read reel objects"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'roa-reels'
  and (select public.can_manage_content())
);

create policy "ROA public read published reel objects"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'roa-reels'
  and exists (
    select 1
    from public.reels r
    where r.is_published = true
      and (
        r.video_path = storage.objects.name
        or r.poster_path = storage.objects.name
      )
  )
);

create policy "ROA staff upload reel objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'roa-reels'
  and (select public.can_manage_content())
);

create policy "ROA staff update reel objects"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'roa-reels'
  and (select public.can_manage_content())
)
with check (
  bucket_id = 'roa-reels'
  and (select public.can_manage_content())
);

create policy "ROA staff delete reel objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'roa-reels'
  and (select public.can_manage_content())
);


-- 13.2 GALLERY AND THUMBNAILS

create policy "ROA staff read gallery objects"
on storage.objects
for select
to authenticated
using (
  bucket_id in ('roa-gallery', 'roa-thumbnails')
  and (select public.can_manage_content())
);

create policy "ROA public read published gallery objects"
on storage.objects
for select
to anon, authenticated
using (
  (
    bucket_id = 'roa-gallery'
    and exists (
      select 1
      from public.gallery_images g
      where g.is_published = true
        and g.image_path = storage.objects.name
    )
  )
  or
  (
    bucket_id = 'roa-thumbnails'
    and exists (
      select 1
      from public.gallery_images g
      where g.is_published = true
        and g.thumbnail_path = storage.objects.name
    )
  )
);

create policy "ROA staff upload gallery objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('roa-gallery', 'roa-thumbnails')
  and (select public.can_manage_content())
);

create policy "ROA staff update gallery objects"
on storage.objects
for update
to authenticated
using (
  bucket_id in ('roa-gallery', 'roa-thumbnails')
  and (select public.can_manage_content())
)
with check (
  bucket_id in ('roa-gallery', 'roa-thumbnails')
  and (select public.can_manage_content())
);

create policy "ROA staff delete gallery objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('roa-gallery', 'roa-thumbnails')
  and (select public.can_manage_content())
);


-- =============================================================================
-- 14. FINAL MIGRATION MARKER
-- =============================================================================

comment on schema public is
  'Readers of Aurangabad application schema. Security baseline Revision 4.0.';

commit;

-- =============================================================================
-- END REVISION 4.0
-- =============================================================================
