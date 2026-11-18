-- Staging-only validation script for member notifications implementation.
-- DO NOT run in production. Review and execute manually in a staging environment only.
-- This script contains READ-ONLY checks plus clearly marked transactional test blocks.
-- Transactional blocks use BEGIN/ROLLBACK so no persistent data changes should remain
-- IF you run them as written. Still, execute only in staging with approval.
--
-- Execution notes:
--   - Requires psql for executable SQL assertion blocks (uses \gset and :variable substitution).
--   - Not claimed to be SQL Editor compatible when psql meta-commands/variables are used.
--   - Do not connect to or modify production data.
--
-- Check categories used in this script:
--   - [READ-ONLY INSPECTION]        : SQL queries that inspect schema/policies/grants/triggers/publication state.
--   - [EXECUTABLE SQL ASSERTION]    : SQL statements in transactional blocks that exercise behavior and expose
--                                     result sets/counts/values for verification (psql-friendly).
--   - [AUTH/API/JWT REQUIRED]       : Checks that require authenticated PostgREST/API clients or real JWT context
--                                     (auth.uid()/RLS behavior cannot be fully validated as plain superuser SQL).
--   - [MANUAL REALTIME VERIFICATION]: Runtime subscription/payload checks performed manually in staging.
--
-- Publication notification behavior (approved):
-- - Fresh notification on every unpublished -> published transition (including republish).
-- - Publication dedupe keys are versioned per publication cycle:
--     meetup:%s:published:%s
--     announcement:%s:published:%s
-- - Repeated edits while already published must not generate additional publication notifications.
-- - Duplicate execution for the same publication event must not create duplicates.

-- ============================================================
-- 1) [READ-ONLY INSPECTION] Function execute privileges
-- Expected for all three target SECURITY DEFINER functions:
--   - PUBLIC EXECUTE revoked (identified via ACL grantee OID 0 using aclexplode(proacl))
--   - anon EXECUTE revoked
--   - authenticated EXECUTE revoked
-- service_role is reported separately for visibility.
-- ============================================================
with target_functions as (
  select p.oid, n.nspname as schema_name, p.proname as function_name,
         pg_get_function_identity_arguments(p.oid) as args,
         p.proacl
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and (
      (p.proname = 'create_notification_broadcast' and pg_get_function_identity_arguments(p.oid) = 'text, text, text, uuid, uuid, text, text')
      or (p.proname = 'bump_meetup_publication_version' and pg_get_function_identity_arguments(p.oid) = '')
      or (p.proname = 'bump_announcement_publication_version' and pg_get_function_identity_arguments(p.oid) = '')
    )
),
acl as (
  select tf.oid, x.grantee, x.privilege_type
  from target_functions tf
  left join lateral aclexplode(tf.proacl) as x(grantor, grantee, privilege_type, is_grantable) on true
)
select
  tf.schema_name,
  tf.function_name,
  tf.args,
  coalesce(bool_or(a.grantee = 0 and a.privilege_type = 'EXECUTE'), false) as public_execute_via_acl_oid0,
  has_function_privilege('anon', tf.oid, 'EXECUTE') as anon_execute,
  has_function_privilege('authenticated', tf.oid, 'EXECUTE') as authenticated_execute,
  has_function_privilege('service_role', tf.oid, 'EXECUTE') as service_role_execute
from target_functions tf
left join acl a on a.oid = tf.oid
group by tf.schema_name, tf.function_name, tf.args, tf.oid
order by tf.function_name, tf.args;
-- Expect 3 rows and public_execute_via_acl_oid0/anon_execute/authenticated_execute = false for each.

-- ACL detail (optional inspection, catalog-accurate)
with target_functions as (
  select p.oid, n.nspname as schema_name, p.proname as function_name,
         pg_get_function_identity_arguments(p.oid) as args,
         p.proacl
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and (
      (p.proname = 'create_notification_broadcast' and pg_get_function_identity_arguments(p.oid) = 'text, text, text, uuid, uuid, text, text')
      or (p.proname = 'bump_meetup_publication_version' and pg_get_function_identity_arguments(p.oid) = '')
      or (p.proname = 'bump_announcement_publication_version' and pg_get_function_identity_arguments(p.oid) = '')
    )
)
select
  tf.schema_name,
  tf.function_name,
  tf.args,
  tf.proacl,
  x.grantee as grantee_oid,
  case when x.grantee = 0 then 'PUBLIC' else coalesce(r.rolname, x.grantee::text) end as grantee_name,
  x.privilege_type,
  x.is_grantable
from target_functions tf
left join lateral aclexplode(tf.proacl) as x(grantor, grantee, privilege_type, is_grantable) on true
left join pg_roles r on r.oid = x.grantee
order by tf.function_name, tf.args, grantee_name, x.privilege_type;

-- ============================================================
-- 2) [READ-ONLY INSPECTION] Table/RLS/policy/grant/trigger/realtime configuration
-- ============================================================
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('notifications', 'notification_receipts');

select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('notifications', 'notification_receipts')
order by tablename, policyname;

select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('notifications', 'notification_receipts')
order by table_name, grantee, privilege_type;

-- Triggers present (expect bump BEFORE and notify AFTER triggers on meetups/announcements)
select event_object_table, trigger_name, action_timing, event_manipulation, action_statement
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table in ('meetups', 'announcements')
order by event_object_table, trigger_name, event_manipulation;

-- Realtime publication membership (run if publication exists)
select pubname, schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and schemaname = 'public'
  and tablename = 'notifications';

-- ============================================================
-- 3) [AUTH/API/JWT REQUIRED] RLS behavior tests (STAGING ONLY)
-- Replace placeholder UUIDs/emails with real staging identities before running.
-- These checks require authenticated PostgREST/API clients or real JWT context for accurate auth.uid()/RLS validation.
-- ============================================================

-- [AUTH/API/JWT REQUIRED] Helper: SQL-editor JWT/role simulation may differ from PostgREST behavior.
-- Prefer API-level verification with real staging JWTs for anon/member/editor/admin.

-- [AUTH/API/JWT REQUIRED] 3a) anon should NOT be able to read notifications/receipts and NOT mutate them
-- Run via PostgREST/API as anon in staging.

-- [AUTH/API/JWT REQUIRED] 3b) authenticated member/editor/admin read notifications (broadcasts)
-- Run as authenticated JWTs in staging:
--   member -> SELECT notifications: allowed
--   editor -> SELECT notifications: allowed
--   admin  -> SELECT notifications: allowed
-- All non-staff/member roles must NOT be able to INSERT/UPDATE/DELETE notifications directly (RLS/policy enforced).

-- [AUTH/API/JWT REQUIRED] 3c) receipts isolation: Member A cannot read/modify Member B receipts
-- Requires distinct authenticated member JWTs.
-- Example API checks in staging:
--   As Member A: select own receipts only; insert own receipt (notification_id, member_id=A).
--   As Member A: attempt select/update/delete receipt where member_id = Member B -> denied / 0 rows.
--   As Member B: cannot see or mutate Member A receipt.

-- ============================================================
-- 4) [EXECUTABLE SQL ASSERTION] Trigger/version/notification behavior (STAGING ONLY)
-- Uses disposable test rows inside a transaction and ends with ROLLBACK (no persistent test data).
-- psql-friendly: uses \gset and :variable substitution for returned IDs/values.
-- Meetup fixtures include required columns/constraints per base schema (including unique valid slug).
-- Announcement fixtures use only existing columns and do not insert NULL into published_at.
-- ============================================================

begin;

-- Baseline snapshot (inspection)
create temp table _notif_before on commit drop as
select id, type, dedupe_key, meetup_id, announcement_id, created_at
from public.notifications;

-- 4a) Meetup draft insert -> publication_version = 0, no publication notification
insert into public.meetups (
  slug, title, edition, description, starts_at, time_label, venue, address,
  is_published, is_completed, registration_status
) values (
  'staging-validation-draft-meetup',
  'Staging Draft Meetup',
  'STAGING-DRAFT-EDITION',
  'Disposable draft meetup row',
  now() + interval '9 days',
  '4:00 PM - 6:00 PM',
  'Draft Venue',
  'Draft Address',
  false,
  false,
  'open'
) returning id as staging_draft_meetup_id \gset

select publication_version as draft_meetup_publication_version
from public.meetups
where id = :'staging_draft_meetup_id'::uuid;
-- Expect: 0

select count(*) as draft_meetup_notifications
from public.notifications
where meetup_id = :'staging_draft_meetup_id'::uuid;
-- Expect: 0

-- 4b) Meetup first publication (INSERT published=true) -> publication_version = 1, exactly one meetup_published
insert into public.meetups (
  slug, title, edition, description, starts_at, time_label, venue, address,
  is_published, is_completed, registration_status
) values (
  'staging-validation-published-meetup',
  'Staging Test Meetup',
  'STAGING-TEST-EDITION',
  'Disposable validation row',
  now() + interval '7 days',
  '4:00 PM - 6:00 PM',
  'Test Venue',
  'Test Address',
  true,
  false,
  'open'
) returning id as staging_meetup_id \gset

select publication_version as published_meetup_initial_publication_version
from public.meetups
where id = :'staging_meetup_id'::uuid;
-- Expect: 1

select type, dedupe_key, meetup_id, count(*) as cnt
from public.notifications
where meetup_id = :'staging_meetup_id'::uuid
  and type = 'meetup_published'
group by type, dedupe_key, meetup_id;
-- Expect: 1 row, versioned dedupe key for publication cycle 1

-- 4c) Unrelated published-meetup edits (schedule/venue/description/cancellation state changes as applicable)
-- must NOT increment publication_version. Schedule/venue/cancel notifications may be emitted by existing behavior.
update public.meetups
set starts_at = now() + interval '8 days',
    time_label = '5:00 PM - 7:00 PM'
where id = :'staging_meetup_id'::uuid;

select publication_version as meetup_publication_version_after_schedule_edit
from public.meetups
where id = :'staging_meetup_id'::uuid;
-- Expect: 1

select count(*) as meetup_schedule_notifications
from public.notifications
where meetup_id = :'staging_meetup_id'::uuid
  and type = 'meetup_schedule_updated';
-- Expect: 1 (existing schedule-change behavior)

update public.meetups
set venue = 'New Test Venue',
    address = 'New Test Address'
where id = :'staging_meetup_id'::uuid;

select publication_version as meetup_publication_version_after_venue_edit
from public.meetups
where id = :'staging_meetup_id'::uuid;
-- Expect: 1

select count(*) as meetup_venue_notifications
from public.notifications
where meetup_id = :'staging_meetup_id'::uuid
  and type = 'meetup_venue_updated';
-- Expect: 1 (existing venue-change behavior)

update public.meetups
set registration_status = 'cancelled'
where id = :'staging_meetup_id'::uuid;

select publication_version as meetup_publication_version_after_cancel
from public.meetups
where id = :'staging_meetup_id'::uuid;
-- Expect: 1

select count(*) as meetup_cancelled_notifications
from public.notifications
where meetup_id = :'staging_meetup_id'::uuid
  and type = 'meetup_cancelled';
-- Expect: 1 (existing cancellation behavior)

update public.meetups
set description = 'Disposable validation row (edited while published, version must stay 1)'
where id = :'staging_meetup_id'::uuid;

select publication_version as meetup_publication_version_after_published_description_edit
from public.meetups
where id = :'staging_meetup_id'::uuid;
-- Expect: 1

-- 4d) Unpublish preserves publication_version; republish increments to 2 and creates exactly one additional publication notification
update public.meetups
set is_published = false
where id = :'staging_meetup_id'::uuid;

select publication_version as meetup_publication_version_after_unpublish
from public.meetups
where id = :'staging_meetup_id'::uuid;
-- Expect: 1

update public.meetups
set is_published = true
where id = :'staging_meetup_id'::uuid;

select publication_version as meetup_publication_version_after_republish
from public.meetups
where id = :'staging_meetup_id'::uuid;
-- Expect: 2

select type, dedupe_key, count(*) as cnt
from public.notifications
where meetup_id = :'staging_meetup_id'::uuid
  and type = 'meetup_published'
group by type, dedupe_key
order by dedupe_key;
-- Expect: 2 meetup_published rows total with different versioned dedupe keys (cycle 1 and cycle 2)

-- 4e) Repeated edits while still published preserve current version and do not create duplicate publication notifications
update public.meetups
set description = 'Disposable validation row (edited while republished, version must stay 2)'
where id = :'staging_meetup_id'::uuid;

select publication_version as meetup_publication_version_after_republished_edit
from public.meetups
where id = :'staging_meetup_id'::uuid;
-- Expect: 2

select count(*) as meetup_published_notifications_after_republished_edit
from public.notifications
where meetup_id = :'staging_meetup_id'::uuid
  and type = 'meetup_published';
-- Expect: 2

-- 4f) Draft-only meetup changes must not increment publication_version or create publication notification
update public.meetups
set title = 'Staging Draft Meetup (edited while draft)',
    description = 'Draft-only edit, version must stay 0'
where id = :'staging_draft_meetup_id'::uuid;

select publication_version as draft_meetup_publication_version_after_edit
from public.meetups
where id = :'staging_draft_meetup_id'::uuid;
-- Expect: 0

select count(*) as draft_meetup_notifications_after_edit
from public.notifications
where meetup_id = :'staging_draft_meetup_id'::uuid;
-- Expect: 0

-- 4g) Announcement draft insert -> publication_version = 0, no publication notification
-- Uses only existing announcement columns: title, content, action_url, is_published, published_at, expires_at.
-- published_at is NOT NULL in schema; draft row keeps default/non-null timestamp.
insert into public.announcements (
  title, content, action_url, is_published
) values (
  'Staging Announcement',
  'Disposable staging announcement content',
  '/',
  false
) returning id as staging_announcement_id \gset

select publication_version as draft_announcement_publication_version
from public.announcements
where id = :'staging_announcement_id'::uuid;
-- Expect: 0

select count(*) as draft_announcement_notifications
from public.notifications
where announcement_id = :'staging_announcement_id'::uuid;
-- Expect: 0

-- 4h) Announcement first publication -> publication_version = 1, exactly one publication notification
update public.announcements
set is_published = true
where id = :'staging_announcement_id'::uuid;

select publication_version as announcement_publication_version_after_first_publish
from public.announcements
where id = :'staging_announcement_id'::uuid;
-- Expect: 1

select type, dedupe_key, announcement_id, count(*) as cnt
from public.notifications
where announcement_id = :'staging_announcement_id'::uuid
group by type, dedupe_key, announcement_id
order by dedupe_key;
-- Expect: 1 row (announcement_published, versioned dedupe key for cycle 1)

-- 4i) Announcement unpublish preserves version; republish increments to 2 and creates one additional publication notification
update public.announcements
set is_published = false
where id = :'staging_announcement_id'::uuid;

select publication_version as announcement_publication_version_after_unpublish
from public.announcements
where id = :'staging_announcement_id'::uuid;
-- Expect: 1

update public.announcements
set is_published = true
where id = :'staging_announcement_id'::uuid;

select publication_version as announcement_publication_version_after_republish
from public.announcements
where id = :'staging_announcement_id'::uuid;
-- Expect: 2

select type, dedupe_key, count(*) as cnt
from public.notifications
where announcement_id = :'staging_announcement_id'::uuid
group by type, dedupe_key
order by dedupe_key;
-- Expect: 2 publication notifications total with different versioned dedupe keys (cycle 1 and cycle 2)

-- 4j) Repeated edits while announcement remains published preserve version and do not create duplicate publication notifications
update public.announcements
set content = 'Disposable staging announcement content (edited while published, version must stay 2)'
where id = :'staging_announcement_id'::uuid;

select publication_version as announcement_publication_version_after_published_edit
from public.announcements
where id = :'staging_announcement_id'::uuid;
-- Expect: 2

select count(*) as announcement_publication_notifications_after_edit
from public.notifications
where announcement_id = :'staging_announcement_id'::uuid;
-- Expect: 2

-- 4k) "Important" announcement should create community_update_published (existing behavior)
-- Trigger classifies as important when title or content contains "important" (case-insensitive).
insert into public.announcements (
  title, content, action_url, is_published
) values (
  'Important staging update',
  'Disposable important update content',
  '/',
  true
) returning id as staging_important_announcement_id \gset

select publication_version as important_announcement_publication_version
from public.announcements
where id = :'staging_important_announcement_id'::uuid;
-- Expect: 1

select type, dedupe_key, count(*) as cnt
from public.notifications
where announcement_id = :'staging_important_announcement_id'::uuid
group by type, dedupe_key;
-- Expect: 1 row, type = community_update_published with versioned publish dedupe key

-- 4l) [EXECUTABLE SQL ASSERTION] Duplicate prevention for same publication event (actual dedupe key)
-- Capture an actual versioned publication dedupe key generated above (meetup republish cycle 2)
select dedupe_key as staging_meetup_pub_cycle2_dedupe_key
from public.notifications
where meetup_id = :'staging_meetup_id'::uuid
  and type = 'meetup_published'
order by created_at desc
limit 1 \gset

select count(*) as meetup_pub_cycle2_notifications_before_duplicate_attempt
from public.notifications
where dedupe_key = :'staging_meetup_pub_cycle2_dedupe_key';
-- Expect: 1

insert into public.notifications (
  type, title, message, meetup_id, announcement_id, action_url, dedupe_key
)
values (
  'meetup_published',
  'Duplicate attempt',
  'Attempted duplicate broadcast for same publication event',
  :'staging_meetup_id'::uuid,
  null,
  '/gatherings',
  :'staging_meetup_pub_cycle2_dedupe_key'
)
on conflict (dedupe_key) do nothing;

select count(*) as meetup_pub_cycle2_notifications_after_duplicate_attempt
from public.notifications
where dedupe_key = :'staging_meetup_pub_cycle2_dedupe_key';
-- Expect: 1 (no duplicate row created)

-- Global sanity: no duplicate dedupe_key rows in current disposable transaction state
select dedupe_key, count(*) as cnt
from public.notifications
where dedupe_key is not null
group by dedupe_key
having count(*) > 1;
-- Expect: 0 rows

rollback;

-- ============================================================
-- 5) [EXECUTABLE SQL ASSERTION / INSPECTION] Duplicate prevention note
-- ============================================================
-- Executable duplicate-prevention assertions using actual dedupe keys are included in section 4l
-- BEFORE `rollback;` (disposable transaction, no persistent test data).
-- To re-run independently, execute section 4 in a new disposable transaction and keep assertions before rollback.

-- ============================================================
-- 6) [MANUAL REALTIME VERIFICATION] Realtime payload/privacy (STAGING ONLY)
-- ============================================================
-- [MANUAL REALTIME VERIFICATION, AUTH/API/JWT REQUIRED]
-- 1. Subscribe authenticated member client to postgres_changes INSERT on public.notifications.
-- 2. Trigger a qualifying meetup/announcement publish/change/cancel in staging.
-- 3. Confirm realtime event payload contains only public.notifications columns/broadcast data.
-- 4. Confirm no notification_receipts rows, no member_id/read_at, and no private member data
--    are included in the realtime payload.
-- 5. Confirm receipt inserts/updates by Member A are not delivered as notifications broadcast payloads
--    to other members (receipts table is not in realtime publication by migration).

-- End of staging-only validation script. Disposable test data in section 4 is rolled back by `rollback;` above.