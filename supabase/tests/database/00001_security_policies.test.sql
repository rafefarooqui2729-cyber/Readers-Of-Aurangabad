-- ==============================================================================
-- READERS OF AURANGABAD — pgTAP DATABASE SECURITY TEST SUITE
-- File: supabase/tests/database/00001_security_policies.test.sql
-- Revision: 5.2 (Exact Assertion Plan, Auth FK Seeding & Comprehensive Coverage)
-- Date: 2026-11-10
-- Purpose: Formal database test suite for Supabase CLI pgTAP automated testing.
--          Tests anonymous, normal user, editor (Community Lead), and admin (Founder)
--          contexts using transaction-isolated role switching and SQLSTATE assertions.
--
-- RUN WITH:
--   supabase test db --workdir .
-- ==============================================================================

begin;

-- Define planned test count (must match exactly 36 test assertions)
select plan(36);

-- --------------------------------------------------------------------------
-- 0. SEED TEST FIXTURES (RUN AS SUPERUSER / TABLE OWNER)
-- --------------------------------------------------------------------------
-- Deterministic UUIDs:
-- Founder:         '11111111-1111-4111-a111-111111111111'
-- Lead:            '22222222-2222-4222-a222-222222222222'
-- User:            '33333333-3333-4333-a333-333333333333'
-- Open Meetup:     '44444444-4444-4444-a444-444444444444'
-- Closed Meetup:   '55555555-5555-4555-a555-555555555555'
-- Draft Meetup:    '66666666-6666-4666-a666-666666666666'
-- Capacity Meetup: '66666666-6666-4666-a666-666666666667'
-- Pub Reel:        '77777777-7777-4777-a777-777777777777'
-- Draft Reel:      '88888888-8888-4888-a888-888888888888'
-- Registration:    '99999999-9999-4999-a999-999999999999'
-- Enquiry:         'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'

-- 0.1 Seed auth.users first to satisfy profiles foreign key constraint
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-4111-a111-111111111111', 'founder_pgtap@roa.local', '{"full_name": "Founder pgTAP"}'::jsonb),
  ('22222222-2222-4222-a222-222222222222', 'lead_pgtap@roa.local', '{"full_name": "Lead pgTAP"}'::jsonb),
  ('33333333-3333-4333-a333-333333333333', 'user_pgtap@roa.local', '{"full_name": "User pgTAP"}'::jsonb)
on conflict (id) do nothing;

-- 0.2 Upsert profiles with explicit staff roles & designations
insert into public.profiles (id, email, full_name, designation, role) values
  ('11111111-1111-4111-a111-111111111111', 'founder_pgtap@roa.local', 'Founder pgTAP', 'Founder', 'admin'),
  ('22222222-2222-4222-a222-222222222222', 'lead_pgtap@roa.local', 'Lead pgTAP', 'Community Lead', 'editor'),
  ('33333333-3333-4333-a333-333333333333', 'user_pgtap@roa.local', 'User pgTAP', null, null)
on conflict (id) do update set
  role = excluded.role,
  designation = excluded.designation,
  full_name = excluded.full_name;

-- 0.3 Seed meetups
insert into public.meetups (id, title, slug, starts_at, venue, registration_status, capacity, is_published) values
  ('44444444-4444-4444-a444-444444444444', 'pgTAP Open Meetup', 'pgtap-open-meetup', now() + interval '7 days', 'Venue A', 'open', 50, true),
  ('55555555-5555-4555-a555-555555555555', 'pgTAP Closed Meetup', 'pgtap-closed-meetup', now() + interval '14 days', 'Venue B', 'closed', 50, true),
  ('66666666-6666-4666-a666-666666666666', 'pgTAP Draft Meetup', 'pgtap-draft-meetup', now() + interval '21 days', 'Venue C', 'announced', 50, false),
  ('66666666-6666-4666-a666-666666666667', 'pgTAP Single Cap', 'pgtap-single-cap', now() + interval '5 days', 'Venue D', 'open', 1, true);

-- 0.4 Seed registration
insert into public.registrations (id, meetup_id, name, email, phone, consent, status) values
  ('99999999-9999-4999-a999-999999999999', '44444444-4444-4444-a444-444444444444', 'Attendee pgTAP', 'att@roa.local', '9876543210', true, 'new');

-- 0.5 Seed enquiry
insert into public.enquiries (id, type, name, email, message, consent, status) values
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', 'contact', 'Enquirer pgTAP', 'enq@roa.local', 'Message pgTAP', true, 'new');

-- 0.6 Seed reels
insert into public.reels (id, title, video_path, poster_path, is_published) values
  ('77777777-7777-4777-a777-777777777777', 'pgTAP Pub Reel', 'reels/pgtap_pub.mp4', 'reels/pgtap_pub.webp', true),
  ('88888888-8888-4888-a888-888888888888', 'pgTAP Draft Reel', 'reels/pgtap_draft.mp4', 'reels/pgtap_draft.webp', false);

-- 0.7 Seed storage objects
insert into storage.objects (id, bucket_id, name, owner) values
  (gen_random_uuid(), 'roa-reels', 'reels/pgtap_pub.mp4', '11111111-1111-4111-a111-111111111111'),
  (gen_random_uuid(), 'roa-reels', 'reels/pgtap_pub.webp', '11111111-1111-4111-a111-111111111111'),
  (gen_random_uuid(), 'roa-reels', 'reels/pgtap_draft.mp4', '11111111-1111-4111-a111-111111111111'),
  (gen_random_uuid(), 'roa-reels', 'reels/pgtap_draft.webp', '11111111-1111-4111-a111-111111111111');

-- --------------------------------------------------------------------------
-- 1. ANONYMOUS VISITOR TESTS (TESTS 1 - 12)
-- --------------------------------------------------------------------------
set local role anon;
select set_config('role', 'anon', true);
select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select set_config('request.jwt.claim.sub', '', true);

-- Test 1: Anon cannot SELECT registrations (denied by table privilege grant with 42501)
select throws_ok(
  'select * from public.registrations',
  '42501',
  NULL,
  'Test 1: Anon cannot read registrations (table grant denies with 42501)'
);

-- Test 2: Anon cannot SELECT enquiries (denied by table privilege grant with 42501)
select throws_ok(
  'select * from public.enquiries',
  '42501',
  NULL,
  'Test 2: Anon cannot read enquiries (table grant denies with 42501)'
);

-- Test 3: Anon sees only published meetups among seeded fixtures (open and closed; draft is hidden)
select results_eq(
  'select count(*)::integer from public.meetups where id in (''44444444-4444-4444-a444-444444444444'', ''55555555-5555-4555-a555-555555555555'', ''66666666-6666-4666-a666-666666666666'')',
  'select 2::integer',
  'Test 3: Anon sees only published meetups'
);

-- Test 4: Anon registration on open published meetup succeeds
select lives_ok(
  $$insert into public.registrations (id, meetup_id, name, email, phone, consent)
    values ('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb', '44444444-4444-4444-a444-444444444444', 'Anon Reg', 'anon_new@test.com', '9876543210', true)$$,
  'Test 4: Anon can register for open published meetup'
);

-- Test 5: Anon registration cleanses status column to "new" even if client attempts to pass "resolved"
reset role;
select results_eq(
  'select status::text from public.registrations where id = ''bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb''',
  'select ''new''::text',
  'Test 5: Anon registration status is sanitized to "new"'
);
set local role anon;
select set_config('role', 'anon', true);

-- Test 6: Anon registration on closed meetup is rejected with SQLSTATE 42501
select throws_ok(
  $$insert into public.registrations (id, meetup_id, name, email, phone, consent)
    values (gen_random_uuid(), '55555555-5555-4555-a555-555555555555', 'Anon Reg', 'blocked@test.com', '9876543210', true)$$,
  '42501',
  NULL,
  'Test 6: Anon cannot register for closed meetup (RLS denies with 42501)'
);

-- Test 7: Anon registration on draft meetup is rejected with SQLSTATE 42501
select throws_ok(
  $$insert into public.registrations (id, meetup_id, name, email, phone, consent)
    values (gen_random_uuid(), '66666666-6666-4666-a666-666666666666', 'Anon Reg', 'draft_blocked@test.com', '9876543210', true)$$,
  '42501',
  NULL,
  'Test 7: Anon cannot register for draft meetup (RLS denies with 42501)'
);

-- Test 8: Duplicate registration email on same meetup is rejected with SQLSTATE 23505 (unique_violation)
select throws_ok(
  $$insert into public.registrations (id, meetup_id, name, email, phone, consent)
    values (gen_random_uuid(), '44444444-4444-4444-a444-444444444444', 'Duplicate Attendee', 'att@roa.local', '9876543210', true)$$,
  '23505',
  NULL,
  'Test 8: Duplicate registration email on same meetup throws 23505'
);

-- Test 9: Capacity limit enforcement: 1st registration fills slot, 2nd throws 23514 (check_violation)
select lives_ok(
  $$insert into public.registrations (id, meetup_id, name, email, phone, consent)
    values (gen_random_uuid(), '66666666-6666-4666-a666-666666666667', 'Slot Winner', 'slot1@test.com', '9876543210', true)$$,
  'Test 9a: Single capacity meetup accepts first registration'
);
select throws_ok(
  $$insert into public.registrations (id, meetup_id, name, email, phone, consent)
    values (gen_random_uuid(), '66666666-6666-4666-a666-666666666667', 'Slot Starved', 'slot2@test.com', '9876543210', true)$$,
  '23514',
  NULL,
  'Test 9: Capacity limit enforcement rejects second registration with 23514'
);

-- Test 10: Anon direct insert into meetups is rejected with SQLSTATE 42501
select throws_ok(
  $$insert into public.meetups (title, slug, starts_at, venue) values ('Hacked', 'hacked', now(), 'Venue')$$,
  '42501',
  NULL,
  'Test 10: Anon cannot insert meetups (denied with 42501)'
);

-- Test 11: Anon sees only published reels among seeded fixtures
select results_eq(
  'select count(*)::integer from public.reels where id in (''77777777-7777-4777-a777-777777777777'', ''88888888-8888-4888-a888-888888888888'')',
  'select 1::integer',
  'Test 11: Anon sees only published reels'
);

-- Test 12: Anon sees only published reel storage objects (video + poster; draft is hidden)
select results_eq(
  'select count(*)::integer from storage.objects where bucket_id = ''roa-reels'' and name in (''reels/pgtap_pub.mp4'', ''reels/pgtap_pub.webp'', ''reels/pgtap_draft.mp4'', ''reels/pgtap_draft.webp'')',
  'select 2::integer',
  'Test 12: Anon sees only published reel storage objects'
);

-- --------------------------------------------------------------------------
-- 2. NORMAL AUTHENTICATED USER TESTS (TESTS 13 - 20)
-- --------------------------------------------------------------------------
reset role;
set local role authenticated;
select set_config('role', 'authenticated', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '33333333-3333-4333-a333-333333333333', true);
select set_config('request.jwt.claims', '{"role":"authenticated", "sub":"33333333-3333-4333-a333-333333333333"}', true);

-- Test 13: Normal user can read own profile
select results_eq(
  'select count(*)::integer from public.profiles where id = ''33333333-3333-4333-a333-333333333333''',
  'select 1::integer',
  'Test 13: Normal user can read own profile'
);

-- Test 14: Normal user cannot read other profiles
select is_empty(
  'select * from public.profiles where id in (''11111111-1111-4111-a111-111111111111'', ''22222222-2222-4222-a222-222222222222'')',
  'Test 14: Normal user cannot read other profiles'
);

-- Test 15: Normal user can update own full_name
select lives_ok(
  $$update public.profiles set full_name = 'Updated User' where id = '33333333-3333-4333-a333-333333333333'$$,
  'Test 15: Normal user can update own full_name'
);

-- Test 16: Normal user cannot self-promote to admin (42501)
select throws_ok(
  $$update public.profiles set role = 'admin' where id = '33333333-3333-4333-a333-333333333333'$$,
  '42501',
  NULL,
  'Test 16: Normal user cannot self-promote to admin (denied with 42501)'
);

-- Test 17: Normal user cannot alter designation (42501)
select throws_ok(
  $$update public.profiles set designation = 'Founder' where id = '33333333-3333-4333-a333-333333333333'$$,
  '42501',
  NULL,
  'Test 17: Normal user cannot alter designation (denied with 42501)'
);

-- Test 18: Normal user cannot alter immutable profile ID (42501)
select throws_ok(
  $$update public.profiles set id = gen_random_uuid() where id = '33333333-3333-4333-a333-333333333333'$$,
  '42501',
  NULL,
  'Test 18: Normal user cannot alter immutable profile ID (denied with 42501)'
);

-- Test 19: Normal user cannot read registrations
select is_empty(
  'select * from public.registrations where id = ''99999999-9999-4999-a999-999999999999''',
  'Test 19: Normal user cannot read registrations'
);

-- Test 20: Normal user cannot read enquiries
select is_empty(
  'select * from public.enquiries where id = ''aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa''',
  'Test 20: Normal user cannot read enquiries'
);

-- --------------------------------------------------------------------------
-- 3. COMMUNITY LEAD (EDITOR) TESTS (TESTS 21 - 29)
-- --------------------------------------------------------------------------
reset role;
set local role authenticated;
select set_config('role', 'authenticated', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '22222222-2222-4222-a222-222222222222', true);
select set_config('request.jwt.claims', '{"role":"authenticated", "sub":"22222222-2222-4222-a222-222222222222"}', true);

-- Test 21: Community Lead cannot read attendee registrations
select is_empty(
  'select * from public.registrations where id = ''99999999-9999-4999-a999-999999999999''',
  'Test 21: Community Lead cannot read attendee registrations'
);

-- Test 22: Community Lead cannot read contact enquiries
select is_empty(
  'select * from public.enquiries where id = ''aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa''',
  'Test 22: Community Lead cannot read contact enquiries'
);

-- Test 23: Community Lead sees all meetups including drafts among seeded fixtures
select results_eq(
  'select count(*)::integer from public.meetups where id in (''44444444-4444-4444-a444-444444444444'', ''55555555-5555-4555-a555-555555555555'', ''66666666-6666-4666-a666-666666666666'')',
  'select 3::integer',
  'Test 23: Community Lead sees all meetups including drafts'
);

-- Test 24: Community Lead can update meetup content
select lives_ok(
  $$update public.meetups set venue = 'Lead Venue' where id = '66666666-6666-4666-a666-666666666666'$$,
  'Test 24: Community Lead can update meetup content'
);

-- Test 25: Community Lead sees all reels including drafts among seeded fixtures
select results_eq(
  'select count(*)::integer from public.reels where id in (''77777777-7777-4777-a777-777777777777'', ''88888888-8888-4888-a888-888888888888'')',
  'select 2::integer',
  'Test 25: Community Lead sees all reels including drafts'
);

-- Test 26: Community Lead sees all reel storage objects among seeded fixtures
select results_eq(
  'select count(*)::integer from storage.objects where bucket_id = ''roa-reels'' and name in (''reels/pgtap_pub.mp4'', ''reels/pgtap_pub.webp'', ''reels/pgtap_draft.mp4'', ''reels/pgtap_draft.webp'')',
  'select 4::integer',
  'Test 26: Community Lead sees all reel storage objects'
);

-- Test 27: Community Lead cannot self-promote to admin (42501)
select throws_ok(
  $$update public.profiles set role = 'admin' where id = '22222222-2222-4222-a222-222222222222'$$,
  '42501',
  NULL,
  'Test 27: Community Lead cannot self-promote to admin (denied with 42501)'
);

-- Test 28: Community Lead cannot alter designation (protect_profile_roles denies with 42501)
select throws_ok(
  $$update public.profiles set designation = 'New Title' where id = '22222222-2222-4222-a222-222222222222'$$,
  '42501',
  NULL,
  'Test 28: Community Lead cannot alter designation (denied with 42501)'
);

-- Test 29: Registration meetup_id cannot be reassigned (guard_registration_update denies with 42501)
reset role;
set local role authenticated;
select set_config('role', 'authenticated', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '11111111-1111-4111-a111-111111111111', true);
select set_config('request.jwt.claims', '{"role":"authenticated", "sub":"11111111-1111-4111-a111-111111111111"}', true);
select throws_ok(
  $$update public.registrations set meetup_id = '55555555-5555-4555-a555-555555555555' where id = '99999999-9999-4999-a999-999999999999'$$,
  '42501',
  NULL,
  'Test 29: Registration meetup_id cannot be reassigned (denied with 42501)'
);

-- --------------------------------------------------------------------------
-- 4. FOUNDER (ADMIN) FULL ADMINISTRATIVE TESTS (TESTS 30 - 35)
-- --------------------------------------------------------------------------
-- Test 30: Founder can read attendee registrations
select isnt_empty(
  'select * from public.registrations where id = ''99999999-9999-4999-a999-999999999999''',
  'Test 30: Founder can read attendee registrations'
);

-- Test 31: Founder can read contact enquiries
select isnt_empty(
  'select * from public.enquiries where id = ''aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa''',
  'Test 31: Founder can read contact enquiries'
);

-- Test 32: Founder can update registration status
select lives_ok(
  $$update public.registrations set status = 'contacted' where id = '99999999-9999-4999-a999-999999999999'$$,
  'Test 32: Founder can update registration status'
);

-- Test 33: Founder can update enquiry status
select lives_ok(
  $$update public.enquiries set status = 'resolved' where id = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'$$,
  'Test 33: Founder can update enquiry status'
);

-- Test 34: Founder can update staff designations
select lives_ok(
  $$update public.profiles set designation = 'Senior Lead' where id = '22222222-2222-4222-a222-222222222222'$$,
  'Test 34: Founder can update staff designation'
);

-- Test 35: Founder can promote user to editor
select lives_ok(
  $$update public.profiles set role = 'editor' where id = '33333333-3333-4333-a333-333333333333'$$,
  'Test 35: Founder can promote user to editor'
);

-- --------------------------------------------------------------------------
-- 5. TEARDOWN
-- --------------------------------------------------------------------------
reset role;
select * from finish();
rollback;
