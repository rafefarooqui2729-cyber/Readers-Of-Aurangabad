-- ==============================================================================
-- READERS OF AURANGABAD — ADMINISTRATIVE PORTAL & BACKEND MIGRATION
-- File: supabase/migrations/202611080001_admin_portal.sql
-- Revision: 3.3 (Comprehensive Privilege Hardening & Explicit Error Codes)
-- Date: 2026-11-09
-- Architect: Senior Supabase Architect & PostgreSQL Security Engineer
--
-- Security Specifications Implemented:
-- 1. Dual-format JWT role detection supporting both legacy 'request.jwt.claim.role'
--    and modern JSONB 'request.jwt.claims ->> role', handling NULL and empty values.
-- 2. Fail-closed security with explicit SQLSTATE '42501' (insufficient_privilege) exceptions.
-- 3. Application authorization helpers evaluate strictly against verified auth.uid().
-- 4. Trusted database administrator provisioning distinguished from PostgREST client requests
--    via get_jwt_role() and session_user verification.
-- 5. Complete Table Privilege Audit: Revoked all default privileges (TRUNCATE, REFERENCES,
--    TRIGGER) from browser roles. Granted least-privilege SELECT/INSERT/UPDATE/DELETE.
-- 6. Function Privilege Audit: Revoked PUBLIC execution on all trigger and internal routines.
-- 7. Exact object-path matching in storage.objects policy (zero LIKE conditions).
-- 8. Valid single-action PostgreSQL grammar across all 40 policies.
-- 9. Hardened search_path = public, pg_temp across all functions.
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "pgcrypto";

-- 2. IDEMPOTENT CUSTOM ENUM TYPES
do $$
begin
  if not exists (select 1 from pg_type where typname = 'admin_role') then
    create type public.admin_role as enum ('admin', 'editor');
  end if;

  if not exists (select 1 from pg_type where typname = 'registration_status') then
    create type public.registration_status as enum ('open', 'closed', 'announced', 'past');
  end if;

  if not exists (select 1 from pg_type where typname = 'activity_status') then
    create type public.activity_status as enum ('new', 'contacted', 'resolved');
  end if;
end $$;

-- 3. CORE APPLICATION TABLES

-- 3.1 PROFILES TABLE
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  designation text,
  role public.admin_role default null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Idempotently ensure designation column exists if table was previously created
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'designation'
  ) then
    alter table public.profiles add column designation text;
  end if;
end $$;

-- Idempotently attach constraints to profiles table
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'check_profiles_email') then
    alter table public.profiles add constraint check_profiles_email
      check (char_length(trim(email)) between 5 and 255 and email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'check_profiles_full_name') then
    alter table public.profiles add constraint check_profiles_full_name
      check (full_name is null or char_length(trim(full_name)) between 1 and 150);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'check_profiles_designation') then
    alter table public.profiles add constraint check_profiles_designation
      check (designation is null or char_length(trim(designation)) between 1 and 100);
  end if;
end $$;

-- 3.2 MEETUPS TABLE
create table if not exists public.meetups (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 2 and 200),
  slug text not null unique check (char_length(trim(slug)) between 2 and 250 and slug ~* '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  edition text check (edition is null or char_length(trim(edition)) <= 100),
  starts_at timestamptz not null,
  time_label text check (time_label is null or char_length(trim(time_label)) <= 100),
  venue text not null check (char_length(trim(venue)) between 2 and 200),
  address text check (address is null or char_length(address) <= 500),
  description text not null default '' check (char_length(description) <= 5000),
  featured_image text check (featured_image is null or char_length(featured_image) <= 500),
  registration_url text check (registration_url is null or char_length(registration_url) <= 500),
  registration_status public.registration_status not null default 'announced',
  capacity integer check (capacity is null or capacity > 0),
  activities jsonb not null default '[]'::jsonb,
  schedule jsonb not null default '[]'::jsonb,
  highlights text check (highlights is null or char_length(highlights) <= 2000),
  is_published boolean not null default false,
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Backfill legacy deployments that were created before the meetup slug column existed.
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'meetups'
      and column_name = 'slug'
  ) then
    alter table public.meetups add column slug text;
    update public.meetups set slug = lower(replace(trim(title), ' ', '-')) where slug is null;
    alter table public.meetups alter column slug set not null;
    alter table public.meetups add constraint meetups_slug_check
      check (char_length(trim(slug)) between 2 and 250 and slug ~* '^[a-z0-9]+(?:-[a-z0-9]+)*$');
    create unique index if not exists meetups_slug_idx on public.meetups (slug);
  end if;
end $$;

-- 3.3 REGISTRATIONS TABLE (STRICT PII PROTECTION — ADMIN ONLY)
create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  meetup_id uuid not null references public.meetups(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 2 and 100),
  email text not null check (char_length(trim(email)) between 5 and 255 and email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone text check (phone is null or char_length(trim(phone)) between 7 and 25),
  message text check (message is null or char_length(message) <= 2000),
  consent boolean not null default false check (consent = true),
  duplicate_key text check (duplicate_key is null or char_length(duplicate_key) <= 128),
  details jsonb not null default '{}'::jsonb,
  status public.activity_status not null default 'new',
  created_at timestamptz not null default now()
);

-- Unique composite index preventing duplicate registrations for the same meetup by email
create unique index if not exists registrations_meetup_email_idx
  on public.registrations (meetup_id, lower(trim(email)));

create unique index if not exists registrations_duplicate_key_idx
  on public.registrations (duplicate_key)
  where duplicate_key is not null;

-- 3.4 GALLERY IMAGES TABLE
create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 2 and 200),
  caption text not null default '' check (char_length(caption) <= 1000),
  image_path text not null check (char_length(image_path) between 1 and 500),
  thumbnail_path text check (thumbnail_path is null or char_length(thumbnail_path) <= 500),
  category text not null default 'Community Moments' check (char_length(trim(category)) between 2 and 100),
  meetup_id uuid references public.meetups(id) on delete set null,
  display_order integer not null default 0 check (display_order >= 0),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3.5 REELS TABLE
create table if not exists public.reels (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 2 and 200),
  caption text not null default '' check (char_length(caption) <= 1000),
  video_path text not null check (char_length(video_path) between 1 and 500),
  poster_path text check (poster_path is null or char_length(poster_path) <= 500),
  display_order integer not null default 0 check (display_order >= 0),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3.6 ANNOUNCEMENTS TABLE
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 2 and 200),
  body text not null check (char_length(body) between 2 and 3000),
  cta_label text check (cta_label is null or char_length(cta_label) <= 100),
  cta_url text check (cta_url is null or char_length(cta_url) <= 500),
  meetup_id uuid references public.meetups(id) on delete set null,
  publish_at timestamptz not null default now(),
  unpublish_at timestamptz check (unpublish_at is null or unpublish_at > publish_at),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3.7 ARTICLES TABLE
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 2 and 250),
  slug text not null unique check (char_length(trim(slug)) between 2 and 250 and slug ~* '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  author text not null check (char_length(trim(author)) between 2 and 150),
  author_role text check (author_role is null or char_length(author_role) <= 150),
  category text not null check (char_length(trim(category)) between 2 and 100),
  published_at timestamptz,
  reading_time text check (reading_time is null or char_length(reading_time) <= 50),
  cover_image text check (cover_image is null or char_length(cover_image) <= 500),
  excerpt text not null default '' check (char_length(excerpt) <= 1000),
  content text not null default '' check (char_length(content) <= 50000),
  language text not null default 'en' check (language in ('en', 'hi', 'ur')),
  tags text[] not null default '{}',
  featured boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3.8 ENQUIRIES TABLE (STRICT PII PROTECTION — ADMIN ONLY)
create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'contact' check (type in ('contact', 'volunteer', 'partnership', 'press', 'general')),
  name text not null check (char_length(trim(name)) between 2 and 100),
  email text not null check (char_length(trim(email)) between 5 and 255 and email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone text check (phone is null or char_length(trim(phone)) between 7 and 25),
  message text not null check (char_length(trim(message)) between 5 and 3000),
  details jsonb not null default '{}'::jsonb,
  status public.activity_status not null default 'new',
  consent boolean not null default false check (consent = true),
  created_at timestamptz not null default now()
);

-- 4. PERFORMANCE & LOOKUP INDEXES
create index if not exists meetups_starts_at_idx on public.meetups (starts_at desc);
create index if not exists meetups_published_idx on public.meetups (is_published);
create index if not exists registrations_meetup_id_idx on public.registrations (meetup_id);
create index if not exists gallery_display_order_idx on public.gallery_images (display_order asc, created_at desc);
create index if not exists reels_display_order_idx on public.reels (display_order asc, created_at desc);
create index if not exists announcements_publish_window_idx on public.announcements (is_published, publish_at, unpublish_at);
create index if not exists articles_slug_idx on public.articles (slug);
create index if not exists articles_published_idx on public.articles (is_published, published_at desc);
create index if not exists enquiries_created_at_idx on public.enquiries (created_at desc);

-- 5. SECURE AUTHORIZATION HELPER FUNCTIONS
-- Strict security model: Functions evaluate auth.uid() against public.profiles.
-- Zero dependence on current_user or unverified client inputs.

-- 5.1 Dual-Format JWT Role Detection Helper
create or replace function public.get_jwt_role()
returns text
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_raw_claims text;
  v_claim_role text;
  v_json_role text;
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
      if v_json_role is not null and v_json_role <> '' then
        return v_json_role;
      end if;
    exception when others then
      -- Malformed JSON claims: fail-closed by reporting untrusted client
      return 'untrusted_client';
    end;
  end if;

  -- 3. Check PostgREST session role setting as fallback
  if current_setting('role', true) in ('anon', 'authenticated') then
    return current_setting('role', true);
  end if;

  -- 4. NULL indicates direct database engine connection (outside of PostgREST)
  return null;
end;
$$;

revoke execute on function public.get_jwt_role() from public, anon, authenticated;

-- 5.2 Strictly Admin Check (Founder full administrative access)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 5.3 Strictly Editor Check (Community Lead editorial access)
create or replace function public.is_editor()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'editor'
  );
$$;

-- 5.4 Combined Content Management Check (Admin OR Editor)
create or replace function public.can_manage_content()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'editor')
  );
$$;

-- Grant EXECUTE on authorization helpers
grant execute on function public.is_admin() to authenticated, anon;
grant execute on function public.is_editor() to authenticated, anon;
grant execute on function public.can_manage_content() to authenticated, anon;

-- 5.5 Fail-Closed Profile Role & Designation Protection Trigger
create or replace function public.protect_profile_roles()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_jwt_role text := public.get_jwt_role();
  v_caller uuid := auth.uid();
  v_is_direct_admin_session boolean;
begin
  -- 1. Prevent Profile ID tampering under all circumstances
  if old.id is distinct from new.id then
    raise exception 'Tamper protection: Profile ID is immutable.' using errcode = '42501';
  end if;

  -- 2. Evaluate modifications to privileged fields (role, designation, email)
  if (old.role is distinct from new.role or old.designation is distinct from new.designation or old.email is distinct from new.email) then

    -- CASE A: Request originates from PostgREST client (browser/API)
    if v_jwt_role is not null then
      -- Fail-closed: Anonymous or untrusted clients are strictly rejected
      if v_jwt_role = 'anon' or v_jwt_role = 'untrusted_client' or v_caller is null then
        raise exception 'Privilege escalation rejected: Anonymous or untrusted clients cannot modify privileged profile fields.' using errcode = '42501';
      end if;

      -- Authenticated client: Only an active admin can modify roles or designations
      if not public.is_admin() then
        raise exception 'Privilege escalation rejected: Only administrators can modify roles or designations.' using errcode = '42501';
      end if;

      -- Prevent direct email modification via profiles table (must use auth.updateUser)
      if old.email is distinct from new.email then
        raise exception 'Tamper protection: Email must be updated through Supabase Auth verification.' using errcode = '42501';
      end if;

    -- CASE B: Direct database engine session (v_jwt_role is NULL)
    else
      -- Verify that session_user is genuinely a trusted database administrator (postgres or supabase_admin)
      v_is_direct_admin_session := session_user in ('postgres', 'supabase_admin');

      if not v_is_direct_admin_session then
        -- Fail closed: Ambiguous context or unprivileged database user attempting role mutation
        raise exception 'Privilege escalation rejected: Privileged fields cannot be modified in an unverified database session.' using errcode = '42501';
      end if;

      -- Trusted database administrator session (e.g. Supabase Dashboard SQL Editor) is permitted
    end if;

  end if;

  -- 3. Preserve creation timestamp
  new.created_at = old.created_at;
  new.updated_at = now();

  return new;
end;
$$;

revoke execute on function public.protect_profile_roles() from public, anon, authenticated;

-- 5.6 Automated Profile Provisioning on User Signup (No Role or Designation Conferred)
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
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    null, -- Designation remains NULL until explicitly assigned
    null  -- Role remains NULL until explicitly assigned
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;

-- 5.7 Automated Email Synchronization on Auth User Update
create or replace function public.handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.email is distinct from new.email then
    update public.profiles
    set email = new.email, updated_at = now()
    where id = new.id;
  end if;
  return new;
end;
$$;

revoke execute on function public.handle_auth_user_updated() from public, anon, authenticated;

-- 5.8 Automated Updated_At Timestamp Function
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.touch_updated_at() from public, anon, authenticated;

-- 6. TRIGGERS SETUP

-- Auth Triggers
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email on auth.users
  for each row execute function public.handle_auth_user_updated();

-- Profile Protection Trigger
drop trigger if exists trg_protect_profile_roles on public.profiles;
create trigger trg_protect_profile_roles
  before update on public.profiles
  for each row execute function public.protect_profile_roles();

-- Timestamp Triggers
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

-- 7. ENABLE ROW LEVEL SECURITY ACROSS ALL TABLES
alter table public.profiles enable row level security;
alter table public.meetups enable row level security;
alter table public.registrations enable row level security;
alter table public.gallery_images enable row level security;
alter table public.reels enable row level security;
alter table public.announcements enable row level security;
alter table public.articles enable row level security;
alter table public.enquiries enable row level security;

-- 8. TABLE PRIVILEGES AUDIT: LEAST PRIVILEGE GRANTS & REVOKES
-- Revoke all table privileges from public, anon, and authenticated
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.meetups from anon, authenticated;
revoke all on table public.registrations from anon, authenticated;
revoke all on table public.gallery_images from anon, authenticated;
revoke all on table public.reels from anon, authenticated;
revoke all on table public.announcements from anon, authenticated;
revoke all on table public.articles from anon, authenticated;
revoke all on table public.enquiries from anon, authenticated;

-- Grant least-privilege operations to anon:
grant select on public.meetups to anon;
grant select on public.gallery_images to anon;
grant select on public.reels to anon;
grant select on public.announcements to anon;
grant select on public.articles to anon;
grant insert on public.registrations to anon;
grant insert on public.enquiries to anon;

-- Grant operations to authenticated (RLS policies govern all row-level access):
-- Authenticated users may read their permitted profile rows.
grant select on public.profiles to authenticated;

-- Users may update only their own full_name through the application.
grant update (full_name) on public.profiles to authenticated;grant select, insert, update, delete on public.meetups to authenticated;
grant select, insert, update, delete on public.registrations to authenticated;
grant select, insert, update, delete on public.gallery_images to authenticated;
grant select, insert, update, delete on public.reels to authenticated;
grant select, insert, update, delete on public.announcements to authenticated;
grant select, insert, update, delete on public.articles to authenticated;
grant select, insert, update, delete on public.enquiries to authenticated;

-- 9. ROW LEVEL SECURITY POLICIES (EXACT SINGLE-OPERATION SYNTAX)

-- 9.1 PROFILES POLICIES
drop policy if exists "Profiles are readable by owner or admin" on public.profiles;
create policy "Profiles are readable by owner or admin"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "Profiles update by owner or admin" on public.profiles;
drop policy if exists "Profiles update own full name" on public.profiles;

create policy "Profiles update own full name"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists "Admins can delete profiles" on public.profiles;
create policy "Admins can delete profiles"
  on public.profiles for delete
  to authenticated
  using (public.is_admin() and id != auth.uid());

-- 9.2 MEETUPS POLICIES
drop policy if exists "Meetups are public when published" on public.meetups;
create policy "Meetups are public when published"
  on public.meetups for select
  to anon, authenticated
  using (is_published or public.can_manage_content());

drop policy if exists "Staff insert meetups" on public.meetups;
create policy "Staff insert meetups"
  on public.meetups for insert
  to authenticated
  with check (public.can_manage_content());

drop policy if exists "Staff update meetups" on public.meetups;
create policy "Staff update meetups"
  on public.meetups for update
  to authenticated
  using (public.can_manage_content())
  with check (public.can_manage_content());

drop policy if exists "Staff delete meetups" on public.meetups;
create policy "Staff delete meetups"
  on public.meetups for delete
  to authenticated
  using (public.can_manage_content());

-- 9.3 REGISTRATIONS POLICIES (STRICT ADMIN-ONLY SEPARATION OF DUTIES)
drop policy if exists "Public registration submission" on public.registrations;
create policy "Public registration submission"
  on public.registrations for insert
  to anon, authenticated
  with check (
    meetup_id is not null and exists (
      select 1 from public.meetups
      where id = registrations.meetup_id
        and is_published = true
        and registration_status = 'open'
    )
  );

-- Community Lead (editor) CANNOT read registrations. Only Founder (admin) can inspect PII and export CSVs.
drop policy if exists "Admins read registrations" on public.registrations;
create policy "Admins read registrations"
  on public.registrations for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins update registrations" on public.registrations;
create policy "Admins update registrations"
  on public.registrations for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins delete registrations" on public.registrations;
create policy "Admins delete registrations"
  on public.registrations for delete
  to authenticated
  using (public.is_admin());

-- 9.4 GALLERY IMAGES POLICIES
drop policy if exists "Gallery is public when published" on public.gallery_images;
create policy "Gallery is public when published"
  on public.gallery_images for select
  to anon, authenticated
  using (is_published or public.can_manage_content());

drop policy if exists "Staff insert gallery" on public.gallery_images;
create policy "Staff insert gallery"
  on public.gallery_images for insert
  to authenticated
  with check (public.can_manage_content());

drop policy if exists "Staff update gallery" on public.gallery_images;
create policy "Staff update gallery"
  on public.gallery_images for update
  to authenticated
  using (public.can_manage_content())
  with check (public.can_manage_content());

drop policy if exists "Staff delete gallery" on public.gallery_images;
create policy "Staff delete gallery"
  on public.gallery_images for delete
  to authenticated
  using (public.can_manage_content());

-- 9.5 REELS POLICIES
drop policy if exists "Reels are public when published" on public.reels;
create policy "Reels are public when published"
  on public.reels for select
  to anon, authenticated
  using (is_published or public.can_manage_content());

drop policy if exists "Staff insert reels" on public.reels;
create policy "Staff insert reels"
  on public.reels for insert
  to authenticated
  with check (public.can_manage_content());

drop policy if exists "Staff update reels" on public.reels;
create policy "Staff update reels"
  on public.reels for update
  to authenticated
  using (public.can_manage_content())
  with check (public.can_manage_content());

drop policy if exists "Staff delete reels" on public.reels;
create policy "Staff delete reels"
  on public.reels for delete
  to authenticated
  using (public.can_manage_content());

-- 9.6 ANNOUNCEMENTS POLICIES
drop policy if exists "Announcements are public when published and active" on public.announcements;
create policy "Announcements are public when published and active"
  on public.announcements for select
  to anon, authenticated
  using (
    (is_published and publish_at <= now() and (unpublish_at is null or unpublish_at >= now()))
    or public.can_manage_content()
  );

drop policy if exists "Staff insert announcements" on public.announcements;
create policy "Staff insert announcements"
  on public.announcements for insert
  to authenticated
  with check (public.can_manage_content());

drop policy if exists "Staff update announcements" on public.announcements;
create policy "Staff update announcements"
  on public.announcements for update
  to authenticated
  using (public.can_manage_content())
  with check (public.can_manage_content());

drop policy if exists "Staff delete announcements" on public.announcements;
create policy "Staff delete announcements"
  on public.announcements for delete
  to authenticated
  using (public.can_manage_content());

-- 9.7 ARTICLES POLICIES
drop policy if exists "Articles are public when published" on public.articles;
create policy "Articles are public when published"
  on public.articles for select
  to anon, authenticated
  using (is_published or public.can_manage_content());

drop policy if exists "Staff insert articles" on public.articles;
create policy "Staff insert articles"
  on public.articles for insert
  to authenticated
  with check (public.can_manage_content());

drop policy if exists "Staff update articles" on public.articles;
create policy "Staff update articles"
  on public.articles for update
  to authenticated
  using (public.can_manage_content())
  with check (public.can_manage_content());

drop policy if exists "Staff delete articles" on public.articles;
create policy "Staff delete articles"
  on public.articles for delete
  to authenticated
  using (public.can_manage_content());

-- 9.8 ENQUIRIES POLICIES (STRICT ADMIN-ONLY SEPARATION OF DUTIES)
drop policy if exists "Public enquiry submission" on public.enquiries;
create policy "Public enquiry submission"
  on public.enquiries for insert
  to anon, authenticated
  with check (
    char_length(trim(name)) between 2 and 100
    and char_length(trim(email)) between 5 and 255
    and char_length(trim(message)) between 5 and 3000
    and consent = true
  );

-- Community Lead (editor) CANNOT read enquiries. Only Founder (admin) can inspect and manage enquiries.
drop policy if exists "Admins read enquiries" on public.enquiries;
create policy "Admins read enquiries"
  on public.enquiries for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins update enquiries" on public.enquiries;
create policy "Admins update enquiries"
  on public.enquiries for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins delete enquiries" on public.enquiries;
create policy "Admins delete enquiries"
  on public.enquiries for delete
  to authenticated
  using (public.is_admin());

-- 10. STORAGE BUCKETS CONFIGURATION
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('roa-reels', 'roa-reels', false, 524288000, array['video/mp4','video/webm','video/quicktime']),
  ('roa-gallery', 'roa-gallery', true, 20971520, array['image/jpeg','image/png','image/webp','image/avif']),
  ('roa-thumbnails', 'roa-thumbnails', true, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 11. STORAGE ACCESS POLICIES (STORAGE.OBJECTS)

-- 11.1 REELS STORAGE (PRIVATE BUCKET WITH EXACT OBJECT-PATH MATCHING)
drop policy if exists "Staff read all reel objects" on storage.objects;
create policy "Staff read all reel objects"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'roa-reels' and public.can_manage_content());

-- Exact object-path matching: zero LIKE pattern matching
drop policy if exists "Public read published reel objects" on storage.objects;
create policy "Public read published reel objects"
  on storage.objects for select
  to anon, authenticated
  using (
    bucket_id = 'roa-reels'
    and exists (
      select 1 from public.reels
      where reels.is_published = true
        and (
          reels.video_path = storage.objects.name
          or reels.poster_path = storage.objects.name
        )
    )
  );

drop policy if exists "Staff upload reel objects" on storage.objects;
create policy "Staff upload reel objects"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'roa-reels' and public.can_manage_content());

drop policy if exists "Staff update reel objects" on storage.objects;
create policy "Staff update reel objects"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'roa-reels' and public.can_manage_content())
  with check (bucket_id = 'roa-reels' and public.can_manage_content());

drop policy if exists "Staff delete reel objects" on storage.objects;
create policy "Staff delete reel objects"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'roa-reels' and public.can_manage_content());

-- 11.2 GALLERY & THUMBNAILS STORAGE (PUBLIC CDN-ACCELERATED)
drop policy if exists "Public gallery thumbnails select" on storage.objects;
create policy "Public gallery thumbnails select"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id in ('roa-gallery', 'roa-thumbnails'));

drop policy if exists "Staff upload gallery objects" on storage.objects;
create policy "Staff upload gallery objects"
  on storage.objects for insert
  to authenticated
  with check (bucket_id in ('roa-gallery', 'roa-thumbnails') and public.can_manage_content());

drop policy if exists "Staff update gallery objects" on storage.objects;
create policy "Staff update gallery objects"
  on storage.objects for update
  to authenticated
  using (bucket_id in ('roa-gallery', 'roa-thumbnails') and public.can_manage_content())
  with check (bucket_id in ('roa-gallery', 'roa-thumbnails') and public.can_manage_content());

drop policy if exists "Staff delete gallery objects" on storage.objects;
create policy "Staff delete gallery objects"
  on storage.objects for delete
  to authenticated
  using (bucket_id in ('roa-gallery', 'roa-thumbnails') and public.can_manage_content());

-- ==============================================================================
-- END OF MIGRATION
-- ==============================================================================
