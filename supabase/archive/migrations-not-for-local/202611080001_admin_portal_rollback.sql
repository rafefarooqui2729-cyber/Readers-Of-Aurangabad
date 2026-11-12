-- ==============================================================================
-- READERS OF AURANGABAD — ADMINISTRATIVE PORTAL MIGRATION ROLLBACK
-- File: supabase/migrations/202611080001_admin_portal_rollback.sql
-- Revision: 3.3
-- Date: 2026-11-09
-- Purpose: Safely teardown or revert the Admin Portal schema and policies if needed.
--
-- CAUTION / IRREVERSIBLE OPERATIONS:
-- 1. This script drops all application tables: enquiries, articles, announcements,
--    reels, gallery_images, registrations, meetups, profiles.
-- 2. Any data stored in these tables will be permanently deleted.
-- 3. Storage buckets (roa-*) and objects are preserved to prevent media loss;
--    only the custom storage access policies created by the migration are dropped.
-- ==============================================================================

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

-- 2. DROP TABLE ROW LEVEL SECURITY POLICIES
drop policy if exists "Profiles are readable by owner or admin" on public.profiles;
drop policy if exists "Profiles update by owner or admin" on public.profiles;
drop policy if exists "Admins can insert profiles" on public.profiles;
drop policy if exists "Admins can delete profiles" on public.profiles;

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
drop trigger if exists trg_touch_meetups on public.meetups;
drop trigger if exists trg_touch_gallery on public.gallery_images;
drop trigger if exists trg_touch_reels on public.reels;
drop trigger if exists trg_touch_announcements on public.announcements;
drop trigger if exists trg_touch_articles on public.articles;

-- 4. DROP FUNCTIONS
drop function if exists public.get_jwt_role();
drop function if exists public.handle_new_auth_user();
drop function if exists public.handle_auth_user_updated();
drop function if exists public.handle_new_admin_user();
drop function if exists public.protect_profile_roles();
drop function if exists public.claim_initial_admin();
drop function if exists public.can_manage_content();
drop function if exists public.is_editor();
drop function if exists public.is_admin();
drop function if exists public.is_admin_or_service();
drop function if exists public.touch_updated_at();

-- 5. DROP APPLICATION TABLES (CASCADE TO DROP CONSTRAINTS AND INDEXES)
drop table if exists public.enquiries cascade;
drop table if exists public.articles cascade;
drop table if exists public.announcements cascade;
drop table if exists public.reels cascade;
drop table if exists public.gallery_images cascade;
drop table if exists public.registrations cascade;
drop table if exists public.meetups cascade;
drop table if exists public.profiles cascade;

-- 6. DROP CUSTOM ENUM TYPES
drop type if exists public.activity_status cascade;
drop type if exists public.registration_status cascade;
drop type if exists public.admin_role cascade;

-- ==============================================================================
-- END OF ROLLBACK
-- ==============================================================================
