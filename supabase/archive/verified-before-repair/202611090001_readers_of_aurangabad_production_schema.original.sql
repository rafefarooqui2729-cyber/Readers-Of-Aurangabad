-- =============================================================================
-- READERS OF AURANGABAD — UNIFIED PRODUCTION DATABASE SCHEMA
-- Migration: 202611090001_readers_of_aurangabad_production_schema.sql
-- Revision: 5.0 (Consolidated Baseline Schema & Security Architecture)
-- Date: 2026-11-09
-- Purpose: Complete, self-contained, idempotent baseline schema for the entire
--          Readers of Aurangabad platform. Incorporates all table definitions,
--          custom enums, concurrency-safe capacity locks, tamper-proof triggers,
--          dual-format JWT resolution, storage buckets, and granular RLS policies.
-- =============================================================================

begin;

-- =============================================================================
-- 1. SCHEMA ACCESS HARDENING
-- =============================================================================
grant usage on schema public to anon, authenticated;
revoke create on schema public from PUBLIC, anon, authenticated;
alter default privileges in schema public revoke execute on functions from PUBLIC, anon, authenticated;


-- =============================================================================
-- 2. CUSTOM ENUMS
-- =============================================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'admin_role' and typnamespace = 'public'::regnamespace) then
    create type public.admin_role as enum ('admin', 'editor');
  end if;

  if not exists (select 1 from pg_type where typname = 'registration_status' and typnamespace = 'public'::regnamespace) then
    create type public.registration_status as enum ('open', 'closed', 'announced', 'past');
  end if;

  if not exists (select 1 from pg_type where typname = 'activity_status' and typnamespace = 'public'::regnamespace) then
    create type public.activity_status as enum ('new', 'contacted', 'resolved');
  end if;

  if not exists (select 1 from pg_type where typname = 'enquiry_type' and typnamespace = 'public'::regnamespace) then
    create type public.enquiry_type as enum ('contact', 'volunteer', 'book_donation', 'collaboration');
  end if;
end $$;


-- =============================================================================
-- 3. APPLICATION TABLES & CONSTRAINTS
-- =============================================================================

-- 3.1 PROFILES TABLE
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique check (
    char_length(trim(email)) between 5 and 255
    and email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  ),
  full_name text check (full_name is null or char_length(trim(full_name)) between 1 and 150),
  role public.admin_role default null,
  designation text check (designation is null or char_length(trim(designation)) between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3.2 MEETUPS TABLE
create table if not exists public.meetups (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 2 and 200),
  slug text not null unique check (
    char_length(trim(slug)) between 2 and 200
    and slug ~* '^[a-z0-9-]+$'
  ),
  edition text check (edition is null or char_length(trim(edition)) <= 100),
  starts_at timestamptz not null,
  ends_at timestamptz check (ends_at is null or ends_at >= starts_at),
  time_label text check (time_label is null or char_length(trim(time_label)) <= 100),
  venue text not null check (char_length(trim(venue)) between 2 and 200),
  address text check (address is null or char_length(address) <= 500),
  description text not null default '' check (char_length(description) <= 5000),
  featured_image text check (featured_image is null or char_length(featured_image) <= 500),
  registration_url text check (registration_url is null or char_length(registration_url) <= 500),
  registration_status public.registration_status not null default 'announced',
  capacity integer check (capacity is null or (capacity >= 1 and capacity <= 5000)),
  activities jsonb not null default '[]'::jsonb check (jsonb_typeof(activities) = 'array'),
  schedule jsonb not null default '[]'::jsonb check (jsonb_typeof(schedule) = 'array'),
  highlights text check (highlights is null or char_length(highlights) <= 2000),
  is_published boolean not null default false,
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3.3 REGISTRATIONS TABLE
create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  meetup_id uuid not null references public.meetups(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 100),
  email text not null check (
    char_length(trim(email)) between 5 and 255
    and email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  ),
  phone text check (
    phone is null
    or (char_length(trim(phone)) between 7 and 20 and phone ~* '^[+0-9\s()-]+$')
  ),
  message text check (message is null or char_length(message) <= 1000),
  consent boolean not null check (consent = true),
  status public.activity_status not null default 'new',
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object'),
  created_at timestamptz not null default now()
);

-- 3.4 GALLERY IMAGES TABLE
create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 2 and 200),
  caption text check (caption is null or char_length(caption) <= 1000),
  image_path text not null check (char_length(trim(image_path)) between 3 and 500),
  thumbnail_path text check (thumbnail_path is null or char_length(trim(thumbnail_path)) between 3 and 500),
  alt_text text check (alt_text is null or char_length(alt_text) <= 300),
  meetup_id uuid references public.meetups(id) on delete set null,
  display_order integer not null default 0 check (display_order >= 0),
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3.5 REELS TABLE
create table if not exists public.reels (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 2 and 200),
  caption text check (caption is null or char_length(caption) <= 1000),
  video_path text not null check (char_length(trim(video_path)) between 3 and 500),
  poster_path text check (poster_path is null or char_length(trim(poster_path)) between 3 and 500),
  external_video_url text check (external_video_url is null or char_length(trim(external_video_url)) <= 500),
  duration_seconds numeric check (duration_seconds is null or duration_seconds > 0),
  display_order integer not null default 0 check (display_order >= 0),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3.6 ANNOUNCEMENTS TABLE
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 2 and 200),
  content text not null check (char_length(trim(content)) between 2 and 5000),
  action_url text check (action_url is null or char_length(action_url) <= 500),
  is_published boolean not null default false,
  published_at timestamptz not null default now(),
  expires_at timestamptz check (expires_at is null or expires_at > published_at),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3.7 ARTICLES TABLE
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 2 and 250),
  slug text not null unique check (
    char_length(trim(slug)) between 2 and 250
    and slug ~* '^[a-z0-9-]+$'
  ),
  author text not null check (char_length(trim(author)) between 2 and 150),
  author_role text check (author_role is null or char_length(author_role) <= 150),
  category text not null check (char_length(trim(category)) between 2 and 100),
  language text not null check (
    char_length(trim(language)) between 2 and 10
    and language ~* '^[a-z]{2,3}(-[a-z0-9]+)*$'
  ),
  reading_time text check (reading_time is null or char_length(reading_time) <= 50),
  cover_image text check (cover_image is null or char_length(cover_image) <= 500),
  excerpt text not null check (char_length(trim(excerpt)) between 10 and 1000),
  content text not null check (char_length(trim(content)) >= 10),
  tags jsonb not null default '[]'::jsonb check (jsonb_typeof(tags) = 'array'),
  featured boolean not null default false,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3.8 ENQUIRIES TABLE
create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  type public.enquiry_type not null,
  name text not null check (char_length(trim(name)) between 2 and 100),
  email text not null check (
    char_length(trim(email)) between 5 and 255
    and email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  ),
  phone text check (
    phone is null
    or (char_length(trim(phone)) between 7 and 20 and phone ~* '^[+0-9\s()-]+$')
  ),
  message text not null check (char_length(trim(message)) between 5 and 5000),
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object'),
  consent boolean not null check (consent = true),
  status public.activity_status not null default 'new',
  created_at timestamptz not null default now()
);


-- =============================================================================
-- 4. PERFORMANCE & SEARCH INDEXES
-- =============================================================================
create index if not exists idx_meetups_starts_at on public.meetups (starts_at);
create index if not exists idx_meetups_is_published on public.meetups (is_published);
create index if not exists idx_registrations_meetup_id on public.registrations (meetup_id);
create index if not exists idx_registrations_status on public.registrations (status);
-- Compound unique index prevents duplicate attendee submissions for the same meetup
create unique index if not exists uq_registrations_meetup_email on public.registrations (meetup_id, lower(trim(email)));

create index if not exists idx_gallery_display_order on public.gallery_images (display_order);
create index if not exists idx_gallery_is_published on public.gallery_images (is_published);
-- Foreign key index on gallery_images meetup_id to prevent table-level locks on parent meetup mutations
create index if not exists idx_gallery_meetup_id on public.gallery_images (meetup_id);
create index if not exists idx_reels_display_order on public.reels (display_order);
create index if not exists idx_reels_is_published on public.reels (is_published);
create index if not exists idx_announcements_published on public.announcements (is_published, published_at, expires_at);
create index if not exists idx_articles_published on public.articles (is_published, published_at);
create index if not exists idx_articles_language on public.articles (language);
create index if not exists idx_enquiries_status on public.enquiries (status);
create index if not exists idx_enquiries_type on public.enquiries (type);


-- =============================================================================
-- 5. STORAGE BUCKETS SETUP
-- =============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'roa-reels',
    'roa-reels',
    false, -- Private bucket for video streams
    524288000, -- 500 MB
    array['video/mp4', 'video/webm', 'video/quicktime', 'image/webp', 'image/jpeg', 'image/png']
  ),
  (
    'roa-gallery',
    'roa-gallery',
    true, -- Public CDN delivery for photo gallery
    20971520, -- 20 MB
    array['image/webp', 'image/jpeg', 'image/png']
  ),
  (
    'roa-thumbnails',
    'roa-thumbnails',
    true, -- Public CDN delivery for thumbnails
    10485760, -- 10 MB
    array['image/webp', 'image/jpeg', 'image/png']
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;


-- =============================================================================
-- 6. SECURITY DEFINER FUNCTIONS & AUTHORIZATION HELPERS
-- =============================================================================

-- 6.1 DUAL-FORMAT JWT ROLE DETECTION
create or replace function public.get_jwt_role()
returns text
language plpgsql
stable
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_claim_role text;
  v_raw_claims text;
  v_json_role text;
  v_session_role text;
begin
  -- 1. Check legacy GUC setting
  v_claim_role := nullif(current_setting('request.jwt.claim.role', true), '');
  if v_claim_role is not null then
    return v_claim_role;
  end if;

  -- 2. Check modern JSONB claims setting
  v_raw_claims := nullif(current_setting('request.jwt.claims', true), '');
  if v_raw_claims is not null then
    begin
      v_json_role := (v_raw_claims::jsonb ->> 'role');
      if nullif(v_json_role, '') is not null then
        return v_json_role;
      end if;
    exception when others then
      return 'untrusted_client';
    end;
  end if;

  -- 3. Check PostgREST session role setting as fallback
  v_session_role := current_setting('role', true);
  if v_session_role in ('anon', 'authenticated') then
    return v_session_role;
  end if;

  -- 4. NULL indicates direct database engine connection (outside PostgREST)
  return null;
end;
$$;

revoke all on function public.get_jwt_role() from PUBLIC, anon, authenticated;


-- 6.2 IS_ADMIN CHECK (Founder Full Access)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'::public.admin_role
  );
$$;

-- 6.3 IS_EDITOR CHECK (Community Lead Access)
create or replace function public.is_editor()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'editor'::public.admin_role
  );
$$;

-- 6.4 CAN_MANAGE_CONTENT CHECK (Admin OR Editor)
create or replace function public.can_manage_content()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin'::public.admin_role, 'editor'::public.admin_role)
  );
$$;

-- Grant EXECUTE on authorization helpers for RLS evaluation
revoke all on function public.is_admin() from PUBLIC, anon, authenticated;
revoke all on function public.is_editor() from PUBLIC, anon, authenticated;
revoke all on function public.can_manage_content() from PUBLIC, anon, authenticated;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_editor() to anon, authenticated;
grant execute on function public.can_manage_content() to anon, authenticated;


-- 6.5 PROFILE PRIVILEGE PROTECTION TRIGGER
create or replace function public.protect_profile_roles()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_jwt_role text := public.get_jwt_role();
  v_caller uuid := auth.uid();
  v_auth_email_sync boolean := false;
  v_privileged_change boolean := false;
begin
  -- Profile ID is immutable
  if old.id is distinct from new.id then
    raise exception 'Tamper protection: Profile ID is immutable.' using errcode = '42501';
  end if;

  v_privileged_change :=
    old.role is distinct from new.role
    or old.designation is distinct from new.designation;

  -- Verify Auth email synchronization trigger depth
  v_auth_email_sync :=
    old.email is distinct from new.email
    and pg_trigger_depth() > 1
    and old.role is not distinct from new.role
    and old.designation is not distinct from new.designation;

  -- Direct email modification through client API is forbidden
  if old.email is distinct from new.email and not v_auth_email_sync then
    if v_jwt_role is not null then
      raise exception 'Tamper protection: Email must be updated through Supabase Auth verification.' using errcode = '42501';
    end if;

    if session_user not in ('postgres', 'supabase_admin') then
      raise exception 'Tamper protection: Unverified database session cannot modify profile email.' using errcode = '42501';
    end if;
  end if;

  -- Only administrators can modify staff privileges
  if v_privileged_change then
    if v_jwt_role is not null then
      if v_jwt_role in ('anon', 'untrusted_client') or v_caller is null or not public.is_admin() then
        raise exception 'Privilege escalation rejected: Only verified administrators can modify staff privileges.' using errcode = '42501';
      end if;
    else
      if session_user not in ('postgres', 'supabase_admin') then
        raise exception 'Privilege escalation rejected: Unverified database session cannot modify staff privileges.' using errcode = '42501';
      end if;
    end if;
  end if;

  -- Preserve creation timestamp
  new.created_at := old.created_at;
  new.updated_at := now();

  return new;
end;
$$;

revoke all on function public.protect_profile_roles() from PUBLIC, anon, authenticated;


-- 6.6 AUTH USER SYNCHRONIZATION TRIGGERS
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, full_name, designation, role)
  values (
    new.id,
    new.email,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    null,
    null
  )
  on conflict (id) do update set email = excluded.email;

  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from PUBLIC, anon, authenticated;


create or replace function public.handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.email is distinct from new.email then
    update public.profiles
    set email = new.email
    where id = new.id;
  end if;

  return new;
end;
$$;

revoke all on function public.handle_auth_user_updated() from PUBLIC, anon, authenticated;


-- 6.7 CONCURRENCY-SAFE REGISTRATION CAPACITY GUARD
create or replace function public.guard_registration_insert()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_published boolean;
  v_registration_status public.registration_status;
  v_capacity integer;
  v_registration_count bigint;
  v_is_admin boolean := public.is_admin();
begin
  -- Transactional row lock on target meetup prevents capacity race conditions
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
    raise exception 'Meetup does not exist.' using errcode = '23503';
  end if;

  if not v_is_admin then
    if not v_published or v_registration_status <> 'open' then
      raise exception 'Registration is not open for this meetup.' using errcode = '42501';
    end if;
  end if;

  -- Count existing registrations under row lock
  select count(*)
  into v_registration_count
  from public.registrations r
  where r.meetup_id = new.meetup_id;

  if v_capacity is not null and v_registration_count >= v_capacity then
    raise exception 'Meetup registration capacity has been reached.' using errcode = '23514';
  end if;

  -- Normalize user-supplied text
  new.name := trim(new.name);
  new.email := lower(trim(new.email));
  if new.phone is not null then
    new.phone := trim(new.phone);
  end if;

  -- Prevent unprivileged visitors from assigning administrative fields
  if not v_is_admin then
    new.status := 'new';
    new.created_at := now();
    new.details := '{}'::jsonb;
  end if;

  return new;
end;
$$;

revoke all on function public.guard_registration_insert() from PUBLIC, anon, authenticated;


-- 6.8 REGISTRATION UPDATE GUARD (PREVENTS MEETUP REASSIGNMENT)
create or replace function public.guard_registration_update()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.meetup_id is distinct from new.meetup_id then
    raise exception 'Tamper protection: Registration meetup cannot be reassigned.' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function public.guard_registration_update() from PUBLIC, anon, authenticated;


-- 6.9 PUBLIC ENQUIRY GUARD
create or replace function public.guard_enquiry_insert()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
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
$$;

revoke all on function public.guard_enquiry_insert() from PUBLIC, anon, authenticated;


-- 6.9 AUTOMATED UPDATED_AT TRIGGER FUNCTION
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.touch_updated_at() from PUBLIC, anon, authenticated;


-- =============================================================================
-- 7. TRIGGERS BINDINGS
-- =============================================================================

-- Auth user triggers
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email on auth.users
  for each row execute function public.handle_auth_user_updated();

-- Profile anti-tamper trigger
drop trigger if exists trg_protect_profile_roles on public.profiles;
create trigger trg_protect_profile_roles
  before update on public.profiles
  for each row execute function public.protect_profile_roles();

-- Registration and Enquiry guards
drop trigger if exists trg_guard_registration_insert on public.registrations;
create trigger trg_guard_registration_insert
  before insert on public.registrations
  for each row execute function public.guard_registration_insert();

drop trigger if exists trg_guard_registration_update on public.registrations;
create trigger trg_guard_registration_update
  before update on public.registrations
  for each row execute function public.guard_registration_update();

drop trigger if exists trg_guard_enquiry_insert on public.enquiries;
create trigger trg_guard_enquiry_insert
  before insert on public.enquiries
  for each row execute function public.guard_enquiry_insert();

-- Updated_at triggers
drop trigger if exists trg_touch_meetups on public.meetups;
create trigger trg_touch_meetups before update on public.meetups for each row execute function public.touch_updated_at();

drop trigger if exists trg_touch_gallery on public.gallery_images;
create trigger trg_touch_gallery before update on public.gallery_images for each row execute function public.touch_updated_at();

drop trigger if exists trg_touch_reels on public.reels;
create trigger trg_touch_reels before update on public.reels for each row execute function public.touch_updated_at();

drop trigger if exists trg_touch_announcements on public.announcements;
create trigger trg_touch_announcements before update on public.announcements for each row execute function public.touch_updated_at();

drop trigger if exists trg_touch_articles on public.articles;
create trigger trg_touch_articles before update on public.articles for each row execute function public.touch_updated_at();


-- =============================================================================
-- 8. ROW LEVEL SECURITY (RLS) & TABLE PRIVILEGES AUDIT
-- =============================================================================

-- Enable RLS across all 8 tables
alter table public.profiles enable row level security;
alter table public.meetups enable row level security;
alter table public.registrations enable row level security;
alter table public.gallery_images enable row level security;
alter table public.reels enable row level security;
alter table public.announcements enable row level security;
alter table public.articles enable row level security;
alter table public.enquiries enable row level security;

-- Revoke all table privileges from public, anon, and authenticated
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.meetups from anon, authenticated;
revoke all on table public.registrations from anon, authenticated;
revoke all on table public.gallery_images from anon, authenticated;
revoke all on table public.reels from anon, authenticated;
revoke all on table public.announcements from anon, authenticated;
revoke all on table public.articles from anon, authenticated;
revoke all on table public.enquiries from anon, authenticated;

-- Grant strict least-privilege permissions
-- 1. Profiles: authenticated can read/update (guarded by owner/admin RLS); zero DELETE grant to prevent orphaned Auth accounts
grant select, update on table public.profiles to authenticated;

-- 2. Public content tables: anon can only SELECT published rows; authenticated staff have full CRUD
grant select on table public.meetups to anon;
grant select, insert, update, delete on table public.meetups to authenticated;

grant select on table public.gallery_images to anon;
grant select, insert, update, delete on table public.gallery_images to authenticated;

grant select on table public.reels to anon;
grant select, insert, update, delete on table public.reels to authenticated;

grant select on table public.announcements to anon;
grant select, insert, update, delete on table public.announcements to authenticated;

grant select on table public.articles to anon;
grant select, insert, update, delete on table public.articles to authenticated;

-- 3. Inbound attendee & contact tables: anon can only INSERT; authenticated can SELECT, INSERT, UPDATE, DELETE (RLS restricts reads/updates/deletes to admins)
grant insert on table public.registrations to anon;
grant select, insert, update, delete on table public.registrations to authenticated;

grant insert on table public.enquiries to anon;
grant select, insert, update, delete on table public.enquiries to authenticated;


-- =============================================================================
-- 9. ROW LEVEL SECURITY POLICIES (EXPLICIT SINGLE-OPERATION ACTIONS)
-- =============================================================================

-- 9.1 PROFILES POLICIES
create policy "Profiles are readable by owner or admin"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy "Profiles update by owner or admin"
  on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- Note: No DELETE policy is granted on public.profiles. Account deletion must be executed
-- through the Supabase Auth Admin API (auth.users deletion), cascading to public.profiles.

-- 9.2 MEETUPS POLICIES
create policy "Meetups are public when published"
  on public.meetups for select to anon, authenticated
  using (is_published = true or public.can_manage_content());

create policy "Staff insert meetups"
  on public.meetups for insert to authenticated
  with check (public.can_manage_content());

create policy "Staff update meetups"
  on public.meetups for update to authenticated
  using (public.can_manage_content())
  with check (public.can_manage_content());

create policy "Staff delete meetups"
  on public.meetups for delete to authenticated
  using (public.can_manage_content());

-- 9.3 REGISTRATIONS POLICIES (ATTENDEE PII STRICTLY ADMIN-ONLY)
create policy "Public registration submission"
  on public.registrations for insert to anon, authenticated
  with check (
    exists (
      select 1 from public.meetups
      where meetups.id = registrations.meetup_id
        and meetups.is_published = true
        and meetups.registration_status = 'open'
    )
    or public.is_admin()
  );

create policy "Admins read registrations"
  on public.registrations for select to authenticated
  using (public.is_admin());

create policy "Admins update registrations"
  on public.registrations for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins delete registrations"
  on public.registrations for delete to authenticated
  using (public.is_admin());

-- 9.4 GALLERY IMAGES POLICIES
create policy "Gallery is public when published"
  on public.gallery_images for select to anon, authenticated
  using (is_published = true or public.can_manage_content());

create policy "Staff insert gallery"
  on public.gallery_images for insert to authenticated
  with check (public.can_manage_content());

create policy "Staff update gallery"
  on public.gallery_images for update to authenticated
  using (public.can_manage_content())
  with check (public.can_manage_content());

create policy "Staff delete gallery"
  on public.gallery_images for delete to authenticated
  using (public.can_manage_content());

-- 9.5 REELS POLICIES
create policy "Reels are public when published"
  on public.reels for select to anon, authenticated
  using (is_published = true or public.can_manage_content());

create policy "Staff insert reels"
  on public.reels for insert to authenticated
  with check (public.can_manage_content());

create policy "Staff update reels"
  on public.reels for update to authenticated
  using (public.can_manage_content())
  with check (public.can_manage_content());

create policy "Staff delete reels"
  on public.reels for delete to authenticated
  using (public.can_manage_content());

-- 9.6 ANNOUNCEMENTS POLICIES
create policy "Announcements are public when published and active"
  on public.announcements for select to anon, authenticated
  using (
    (
      is_published = true
      and published_at <= now()
      and (expires_at is null or expires_at > now())
    )
    or public.can_manage_content()
  );

create policy "Staff insert announcements"
  on public.announcements for insert to authenticated
  with check (public.can_manage_content());

create policy "Staff update announcements"
  on public.announcements for update to authenticated
  using (public.can_manage_content())
  with check (public.can_manage_content());

create policy "Staff delete announcements"
  on public.announcements for delete to authenticated
  using (public.can_manage_content());

-- 9.7 ARTICLES POLICIES
create policy "Articles are public when published"
  on public.articles for select to anon, authenticated
  using (is_published = true or public.can_manage_content());

create policy "Staff insert articles"
  on public.articles for insert to authenticated
  with check (public.can_manage_content());

create policy "Staff update articles"
  on public.articles for update to authenticated
  using (public.can_manage_content())
  with check (public.can_manage_content());

create policy "Staff delete articles"
  on public.articles for delete to authenticated
  using (public.can_manage_content());

-- 9.8 ENQUIRIES POLICIES (CONTACT PII STRICTLY ADMIN-ONLY)
create policy "Public enquiry submission"
  on public.enquiries for insert to anon, authenticated
  with check (true);

create policy "Admins read enquiries"
  on public.enquiries for select to authenticated
  using (public.is_admin());

create policy "Admins update enquiries"
  on public.enquiries for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins delete enquiries"
  on public.enquiries for delete to authenticated
  using (public.is_admin());


-- =============================================================================
-- 10. STORAGE ACCESS POLICIES
-- =============================================================================

-- 10.1 ROA-REELS POLICIES (EXACT OBJECT PATH MATCHING ON PUBLISHED REELS)
create policy "Staff read all reel objects"
  on storage.objects for select to authenticated
  using (bucket_id = 'roa-reels' and public.can_manage_content());

create policy "Public read published reel objects"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'roa-reels'
    and exists (
      select 1 from public.reels
      where reels.is_published = true
        and (
          reels.video_path = storage.objects.name
          or reels.video_path like ('%/' || storage.objects.name)
          or reels.poster_path = storage.objects.name
          or reels.poster_path like ('%/' || storage.objects.name)
        )
    )
  );

create policy "Staff upload reel objects"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'roa-reels' and public.can_manage_content());

create policy "Staff update reel objects"
  on storage.objects for update to authenticated
  using (bucket_id = 'roa-reels' and public.can_manage_content())
  with check (bucket_id = 'roa-reels' and public.can_manage_content());

create policy "Staff delete reel objects"
  on storage.objects for delete to authenticated
  using (bucket_id = 'roa-reels' and public.can_manage_content());

-- 10.2 ROA-GALLERY POLICIES
create policy "Public gallery thumbnails select"
  on storage.objects for select to anon, authenticated
  using (bucket_id in ('roa-gallery', 'roa-thumbnails'));

create policy "Staff upload gallery objects"
  on storage.objects for insert to authenticated
  with check (bucket_id in ('roa-gallery', 'roa-thumbnails') and public.can_manage_content());

create policy "Staff update gallery objects"
  on storage.objects for update to authenticated
  using (bucket_id in ('roa-gallery', 'roa-thumbnails') and public.can_manage_content())
  with check (bucket_id in ('roa-gallery', 'roa-thumbnails') and public.can_manage_content());

create policy "Staff delete gallery objects"
  on storage.objects for delete to authenticated
  using (bucket_id in ('roa-gallery', 'roa-thumbnails') and public.can_manage_content());

commit;
