-- =============================================================================
-- READERS OF AURANGABAD — DESTRUCTIVE TEARDOWN / REVERT SCRIPT
-- Migration: 202611090001_readers_of_aurangabad_production_schema_rollback.sql
-- Revision: 5.2 (Destructive Teardown Audit, Backup Prerequisites & Storage Protocol)
-- Date: 2026-11-10
--
-- CRITICAL SAFETY & OPERATIONAL NOTICE:
-- 1. THIS IS A DESTRUCTIVE TEARDOWN SCRIPT, NOT A SAFE DATA-PRESERVING ROLLBACK.
--    Executing this file will PERMANENTLY DROP all 8 application tables, custom enums,
--    triggers, and security functions, irreversibly destroying all table data.
--
-- 2. MANDATORY BACKUP REQUIREMENT:
--    Before executing this script on any live database, a complete snapshot or backup
--    MUST be created via:
--      - Supabase Dashboard: Database > Backups > Create Backup / Export
--      - Or CLI / pg_dump: pg_dump -h <host> -U postgres -d postgres > backup_prior_to_teardown.sql
--
-- 3. STORAGE BUCKET & BINARY OBJECT INTEGRITY:
--    This script drops custom RLS policies on storage.objects.
--    To prevent accidental and permanent loss of binary media files, THIS SCRIPT DOES NOT
--    DELETE the storage buckets ('roa-reels', 'roa-gallery', 'roa-thumbnails') or the
--    underlying video and image files stored within them.
--    If bucket teardown is explicitly intended, binary objects and buckets must be
--    manually removed via the Supabase Dashboard under Storage > Buckets.
--
-- 4. ACCIDENTAL-EXECUTION GUARD:
--    To prevent catastrophic accidental execution in the SQL Editor, this script will
--    REFUSE TO EXECUTE unless the session setting is explicitly confirmed first:
--      SET readers_of_aurangabad.confirm_rollback = 'CONFIRMED';
-- =============================================================================

-- MANDATORY ACCIDENTAL-EXECUTION SAFETY GUARD:
do $$
begin
  if current_setting('readers_of_aurangabad.confirm_rollback', true) is distinct from 'CONFIRMED' then
    raise exception 'ROLLBACK GUARD: Destructive schema teardown aborted. This operation permanently destroys application tables. To execute, run: SET readers_of_aurangabad.confirm_rollback = ''CONFIRMED''; before running this script.';
  end if;
end $$;

begin;

-- 1. DROP STORAGE ACCESS POLICIES
drop policy if exists "Staff read all reel objects" on storage.objects;
drop policy if exists "Public read published reel objects" on storage.objects;
drop policy if exists "Staff upload reel objects" on storage.objects;
drop policy if exists "Staff update reel objects" on storage.objects;
drop policy if exists "Staff delete reel objects" on storage.objects;

drop policy if exists "Public gallery thumbnails select" on storage.objects;
drop policy if exists "Staff upload gallery objects" on storage.objects;
drop policy if exists "Staff update gallery objects" on storage.objects;
drop policy if exists "Staff delete gallery objects" on storage.objects;

-- 2. DROP ROW LEVEL SECURITY POLICIES
drop policy if exists "Profiles are readable by owner or admin" on public.profiles;
drop policy if exists "Profiles update by owner or admin" on public.profiles;

drop policy if exists "Meetups are public when published" on public.meetups;
drop policy if exists "Staff insert meetups" on public.meetups;
drop policy if exists "Staff update meetups" on public.meetups;
drop policy if exists "Staff delete meetups" on public.meetups;

drop policy if exists "Public registration submission" on public.registrations;
drop policy if exists "Admins read registrations" on public.registrations;
drop policy if exists "Admins update registrations" on public.registrations;
drop policy if exists "Admins delete registrations" on public.registrations;

drop policy if exists "Gallery is public when published" on public.gallery_images;
drop policy if exists "Staff insert gallery" on public.gallery_images;
drop policy if exists "Staff update gallery" on public.gallery_images;
drop policy if exists "Staff delete gallery" on public.gallery_images;

drop policy if exists "Reels are public when published" on public.reels;
drop policy if exists "Staff insert reels" on public.reels;
drop policy if exists "Staff update reels" on public.reels;
drop policy if exists "Staff delete reels" on public.reels;

drop policy if exists "Announcements are public when published and active" on public.announcements;
drop policy if exists "Staff insert announcements" on public.announcements;
drop policy if exists "Staff update announcements" on public.announcements;
drop policy if exists "Staff delete announcements" on public.announcements;

drop policy if exists "Articles are public when published" on public.articles;
drop policy if exists "Staff insert articles" on public.articles;
drop policy if exists "Staff update articles" on public.articles;
drop policy if exists "Staff delete articles" on public.articles;

drop policy if exists "Public enquiry submission" on public.enquiries;
drop policy if exists "Admins read enquiries" on public.enquiries;
drop policy if exists "Admins update enquiries" on public.enquiries;
drop policy if exists "Admins delete enquiries" on public.enquiries;

-- 3. DROP TRIGGERS
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_updated on auth.users;
drop trigger if exists trg_protect_profile_roles on public.profiles;
drop trigger if exists trg_guard_registration_insert on public.registrations;
drop trigger if exists trg_guard_registration_update on public.registrations;
drop trigger if exists trg_guard_enquiry_insert on public.enquiries;
drop trigger if exists trg_touch_meetups on public.meetups;
drop trigger if exists trg_touch_gallery on public.gallery_images;
drop trigger if exists trg_touch_reels on public.reels;
drop trigger if exists trg_touch_announcements on public.announcements;
drop trigger if exists trg_touch_articles on public.articles;

-- 4. DROP FUNCTIONS
drop function if exists public.get_jwt_role();
drop function if exists public.is_admin();
drop function if exists public.is_editor();
drop function if exists public.can_manage_content();
drop function if exists public.protect_profile_roles();
drop function if exists public.handle_new_auth_user();
drop function if exists public.handle_auth_user_updated();
drop function if exists public.guard_registration_insert();
drop function if exists public.guard_registration_update();
drop function if exists public.guard_enquiry_insert();
drop function if exists public.touch_updated_at();

-- 5. DROP APPLICATION TABLES
drop table if exists public.enquiries cascade;
drop table if exists public.articles cascade;
drop table if exists public.announcements cascade;
drop table if exists public.reels cascade;
drop table if exists public.gallery_images cascade;
drop table if exists public.registrations cascade;
drop table if exists public.meetups cascade;
drop table if exists public.profiles cascade;

-- 6. DROP CUSTOM ENUMS
drop type if exists public.enquiry_type cascade;
drop type if exists public.activity_status cascade;
drop type if exists public.registration_status cascade;
drop type if exists public.admin_role cascade;

commit;
