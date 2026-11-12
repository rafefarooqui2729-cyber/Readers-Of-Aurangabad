-- ==============================================================================
-- READERS OF AURANGABAD — BEHAVIORAL SECURITY & RLS VERIFICATION TEST SUITE
-- File: supabase/tests/verify_security_policies.sql
-- Revision: 5.2 (Table Grants Assertions, Foreign Key Resolution & Concurrency Tests)
-- Date: 2026-11-10
-- Purpose: Complete behavioral test harness for Row-Level Security, table-level grants,
--          dual-format JWT role resolution, anti-tamper triggers, and role separation between
--          Founder (admin), Community Lead (editor), normal users, and anonymous visitors.
--
-- SAFETY & ISOLATION:
-- This entire script executes inside a transaction that terminates with ROLLBACK.
-- No test data, temporary rows, or mock credentials will EVER be committed to disk.
-- ==============================================================================

begin;

-- Ensure required roles exist in local/isolated test runner if not already defined
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated;
  end if;
end $$;

-- Ensure schema usage
grant usage on schema public to anon, authenticated;

do $$
declare
  -- Deterministic UUIDs for testing
  v_founder_id uuid := '11111111-1111-4111-a111-111111111111'::uuid;
  v_lead_id    uuid := '22222222-2222-4222-a222-222222222222'::uuid;
  v_user_id    uuid := '33333333-3333-4333-a333-333333333333'::uuid;

  v_open_meetup_id     uuid := gen_random_uuid();
  v_closed_meetup_id   uuid := gen_random_uuid();
  v_draft_meetup_id    uuid := gen_random_uuid();
  v_capacity_meetup_id uuid := gen_random_uuid();

  v_pub_reel_id   uuid := gen_random_uuid();
  v_draft_reel_id uuid := gen_random_uuid();

  v_reg_id     uuid := gen_random_uuid();
  v_enquiry_id uuid := gen_random_uuid();

  v_count integer;
  v_sqlstate text;
  v_errmsg text;
  v_test_record record;
begin
  raise notice '============================================================';
  raise notice 'STARTING BEHAVIORAL RLS & PERMISSIONS AUDIT (REV 5.2)';
  raise notice '============================================================';

  -- --------------------------------------------------------------------------
  -- STEP 0: SEED TEMPORARY TEST FIXTURES (AS TABLE OWNER / POSTGRES)
  -- --------------------------------------------------------------------------
  -- 0.1 Seed auth.users first to satisfy foreign key references from public.profiles
  insert into auth.users (id, email, raw_user_meta_data) values
    (v_founder_id, 'founder_test@roa.local', '{"full_name": "Test Founder"}'::jsonb),
    (v_lead_id, 'lead_test@roa.local', '{"full_name": "Test Lead"}'::jsonb),
    (v_user_id, 'user_test@roa.local', '{"full_name": "Test User"}'::jsonb)
  on conflict (id) do nothing;

  -- 0.2 Upsert profiles with explicit staff roles & designations
  insert into public.profiles (id, email, full_name, designation, role) values
    (v_founder_id, 'founder_test@roa.local', 'Test Founder', 'Founder', 'admin'),
    (v_lead_id, 'lead_test@roa.local', 'Test Lead', 'Community Lead', 'editor'),
    (v_user_id, 'user_test@roa.local', 'Test User', null, null)
  on conflict (id) do update set
    role = excluded.role,
    designation = excluded.designation,
    full_name = excluded.full_name;

  -- 0.3 Mock Meetups (Open, Closed, Draft, and Single-Capacity)
  insert into public.meetups (id, title, slug, starts_at, venue, registration_status, capacity, is_published) values
    (v_open_meetup_id, 'Open Gathering', 'open-gathering-' || substr(v_open_meetup_id::text, 1, 6), now() + interval '7 days', 'Heritage Garden', 'open', 50, true),
    (v_closed_meetup_id, 'Closed Gathering', 'closed-gathering-' || substr(v_closed_meetup_id::text, 1, 6), now() + interval '14 days', 'City Hall', 'closed', 50, true),
    (v_draft_meetup_id, 'Draft Gathering', 'draft-gathering-' || substr(v_draft_meetup_id::text, 1, 6), now() + interval '21 days', 'Private Library', 'announced', 50, false),
    (v_capacity_meetup_id, 'Single Capacity Gathering', 'single-cap-' || substr(v_capacity_meetup_id::text, 1, 6), now() + interval '5 days', 'Courtyard', 'open', 1, true);

  -- 0.4 Mock Registrations on Open Meetup
  insert into public.registrations (id, meetup_id, name, email, phone, consent, status) values
    (v_reg_id, v_open_meetup_id, 'Attendee One', 'attendee1@roa.local', '9876543210', true, 'new');

  -- 0.5 Mock Enquiries
  insert into public.enquiries (id, type, name, email, message, consent, status) values
    (v_enquiry_id, 'contact', 'Enquirer One', 'enquirer1@roa.local', 'General inquiry message.', true, 'new');

  -- 0.6 Mock Reels
  insert into public.reels (id, title, video_path, poster_path, is_published) values
    (v_pub_reel_id, 'Published Reel', 'reels/pub_video.mp4', 'reels/pub_poster.webp', true),
    (v_draft_reel_id, 'Draft Reel', 'reels/draft_video.mp4', 'reels/draft_poster.webp', false);

  -- 0.7 Mock Storage Objects in roa-reels (exact object path matching)
  insert into storage.objects (id, bucket_id, name, owner) values
    (gen_random_uuid(), 'roa-reels', 'reels/pub_video.mp4', v_founder_id),
    (gen_random_uuid(), 'roa-reels', 'reels/pub_poster.webp', v_founder_id),
    (gen_random_uuid(), 'roa-reels', 'reels/draft_video.mp4', v_founder_id),
    (gen_random_uuid(), 'roa-reels', 'reels/draft_poster.webp', v_founder_id);

  raise notice '[PASS] Step 0: Test fixtures seeded successfully (auth.users foreign keys resolved).';

  -- --------------------------------------------------------------------------
  -- STEP 1: TEST DUAL-FORMAT JWT DETECTION HELPER
  -- --------------------------------------------------------------------------
  -- 1.1 Legacy GUC setting: request.jwt.claim.role
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('request.jwt.claims', '', true);
  if public.get_jwt_role() <> 'authenticated' then
    raise exception '[FAIL] get_jwt_role failed on legacy claim setting! Got %', public.get_jwt_role();
  end if;

  -- 1.2 Modern JSONB claims setting: request.jwt.claims ->> 'role'
  perform set_config('request.jwt.claim.role', '', true);
  perform set_config('request.jwt.claims', '{"role": "editor_user", "sub": "test"}', true);
  if public.get_jwt_role() <> 'editor_user' then
    raise exception '[FAIL] get_jwt_role failed on modern JSONB claims setting! Got %', public.get_jwt_role();
  end if;

  -- 1.3 Malformed JSONB handling (fail-closed to untrusted_client)
  perform set_config('request.jwt.claim.role', '', true);
  perform set_config('request.jwt.claims', '{malformed_json_without_closing', true);
  if public.get_jwt_role() <> 'untrusted_client' then
    raise exception '[FAIL] get_jwt_role did not return untrusted_client on malformed JSON! Got %', public.get_jwt_role();
  end if;

  -- 1.4 Direct database session (no claims set) returns NULL
  perform set_config('request.jwt.claim.role', '', true);
  perform set_config('request.jwt.claims', '', true);
  perform set_config('role', 'postgres', true);
  if public.get_jwt_role() is not null then
    raise exception '[FAIL] get_jwt_role did not return NULL in direct database session! Got %', public.get_jwt_role();
  end if;

  raise notice '[PASS] Step 1: Dual-format JWT role detection helper verified.';

  -- --------------------------------------------------------------------------
  -- STEP 2: ANONYMOUS VISITOR BEHAVIORAL TESTS (MODERN JWT FORMAT)
  -- --------------------------------------------------------------------------
  execute 'set local role anon';
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claim.role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role": "anon"}', true);
  perform set_config('request.jwt.claim.sub', '', true);

  -- 2.1 Assert anonymous CANNOT SELECT from registrations (table grant denied with SQLSTATE 42501)
  v_sqlstate := null;
  v_errmsg := null;
  begin
    perform count(*) from public.registrations;
  exception when others then
    get stacked diagnostics v_sqlstate = RETURNED_SQLSTATE, v_errmsg = MESSAGE_TEXT;
  end;
  if v_sqlstate is null then
    raise exception '[FAIL] Anonymous was permitted to SELECT from registrations! Table grant must deny with 42501.';
  elsif v_sqlstate <> '42501' then
    raise exception '[FAIL] Anonymous SELECT registrations failed with unexpected SQLSTATE % (expected 42501). Message: %', v_sqlstate, v_errmsg;
  end if;

  -- 2.2 Assert anonymous CANNOT SELECT from enquiries (table grant denied with SQLSTATE 42501)
  v_sqlstate := null;
  v_errmsg := null;
  begin
    perform count(*) from public.enquiries;
  exception when others then
    get stacked diagnostics v_sqlstate = RETURNED_SQLSTATE, v_errmsg = MESSAGE_TEXT;
  end;
  if v_sqlstate is null then
    raise exception '[FAIL] Anonymous was permitted to SELECT from enquiries! Table grant must deny with 42501.';
  elsif v_sqlstate <> '42501' then
    raise exception '[FAIL] Anonymous SELECT enquiries failed with unexpected SQLSTATE % (expected 42501). Message: %', v_sqlstate, v_errmsg;
  end if;

  -- 2.3 Assert anonymous sees ONLY published meetups among seeded fixtures (open and closed; draft is hidden)
  select count(*) into v_count
  from public.meetups
  where id in (v_open_meetup_id, v_closed_meetup_id, v_draft_meetup_id);
  if v_count <> 2 then
    raise exception '[FAIL] Anonymous saw % meetups among seeded fixtures instead of exactly 2 published meetups!', v_count;
  end if;

  -- 2.4 Assert anonymous registration on OPEN published meetup SUCCEEDS
  v_sqlstate := null;
  v_errmsg := null;
  begin
    insert into public.registrations (id, meetup_id, name, email, phone, consent)
    values (gen_random_uuid(), v_open_meetup_id, 'Valid Attendee', 'attendee_new@roa.local', '9123456789', true);
  exception when others then
    get stacked diagnostics v_sqlstate = RETURNED_SQLSTATE, v_errmsg = MESSAGE_TEXT;
  end;
  if v_sqlstate is not null then
    raise exception '[FAIL] Valid public registration was unexpectedly rejected! SQLSTATE: %, Message: %', v_sqlstate, v_errmsg;
  end if;

  -- 2.5 Assert anonymous cannot assign administrative status or details on INSERT (tamper guard)
  declare
    v_tamper_reg_id uuid := gen_random_uuid();
  begin
    insert into public.registrations (id, meetup_id, name, email, phone, consent, status, details)
    values (v_tamper_reg_id, v_open_meetup_id, 'Tamper Attendee', 'tamper@roa.local', '9123456789', true, 'resolved', '{"vip": true}'::jsonb);

    -- Temporarily switch to postgres to verify sanitized columns
    execute 'reset role';
    select status, details into v_test_record from public.registrations where id = v_tamper_reg_id;
    if v_test_record.status <> 'new' or v_test_record.details <> '{}'::jsonb then
      raise exception '[FAIL] guard_registration_insert failed to sanitize administrative columns on public registration! status: %, details: %', v_test_record.status, v_test_record.details;
    end if;
    execute 'set local role anon';
    perform set_config('role', 'anon', true);
  end;

  -- 2.6 Assert anonymous registration on CLOSED meetup is REJECTED with SQLSTATE 42501
  v_sqlstate := null;
  v_errmsg := null;
  begin
    insert into public.registrations (id, meetup_id, name, email, phone, consent)
    values (gen_random_uuid(), v_closed_meetup_id, 'Blocked Attendee', 'blocked@roa.local', '9123456789', true);
  exception when others then
    get stacked diagnostics v_sqlstate = RETURNED_SQLSTATE, v_errmsg = MESSAGE_TEXT;
  end;
  if v_sqlstate is null then
    raise exception '[FAIL] Registration on closed meetup was permitted! RLS must deny.';
  elsif v_sqlstate <> '42501' then
    raise exception '[FAIL] Registration on closed meetup failed with unexpected SQLSTATE % (expected 42501). Message: %', v_sqlstate, v_errmsg;
  end if;

  -- 2.7 Assert anonymous registration on UNPUBLISHED/DRAFT meetup is REJECTED with SQLSTATE 42501
  v_sqlstate := null;
  v_errmsg := null;
  begin
    insert into public.registrations (id, meetup_id, name, email, phone, consent)
    values (gen_random_uuid(), v_draft_meetup_id, 'Draft Attendee', 'draft@roa.local', '9123456789', true);
  exception when others then
    get stacked diagnostics v_sqlstate = RETURNED_SQLSTATE, v_errmsg = MESSAGE_TEXT;
  end;
  if v_sqlstate is null then
    raise exception '[FAIL] Registration on draft meetup was permitted! RLS must deny.';
  elsif v_sqlstate <> '42501' then
    raise exception '[FAIL] Registration on draft meetup failed with unexpected SQLSTATE % (expected 42501). Message: %', v_sqlstate, v_errmsg;
  end if;

  -- 2.8 Assert DUPLICATE registration email on same meetup is REJECTED with SQLSTATE 23505 (unique violation)
  v_sqlstate := null;
  v_errmsg := null;
  begin
    insert into public.registrations (id, meetup_id, name, email, phone, consent)
    values (gen_random_uuid(), v_open_meetup_id, 'Duplicate Attendee', 'attendee_new@roa.local', '9123456789', true);
  exception when others then
    get stacked diagnostics v_sqlstate = RETURNED_SQLSTATE, v_errmsg = MESSAGE_TEXT;
  end;
  if v_sqlstate is null then
    raise exception '[FAIL] Duplicate registration was permitted! uq_registrations_meetup_email must reject.';
  elsif v_sqlstate <> '23505' then
    raise exception '[FAIL] Duplicate registration failed with unexpected SQLSTATE % (expected 23505). Message: %', v_sqlstate, v_errmsg;
  end if;

  -- 2.9 Assert meetup capacity limit is strictly enforced (capacity = 1)
  -- 2.9.1 First registration on single-capacity meetup SUCCEEDS
  v_sqlstate := null;
  v_errmsg := null;
  begin
    insert into public.registrations (id, meetup_id, name, email, phone, consent)
    values (gen_random_uuid(), v_capacity_meetup_id, 'Slot Winner', 'slot_winner@roa.local', '9123456789', true);
  exception when others then
    get stacked diagnostics v_sqlstate = RETURNED_SQLSTATE, v_errmsg = MESSAGE_TEXT;
  end;
  if v_sqlstate is not null then
    raise exception '[FAIL] First registration on single-capacity meetup failed! SQLSTATE: %, Message: %', v_sqlstate, v_errmsg;
  end if;

  -- 2.9.2 Second registration on single-capacity meetup is REJECTED with SQLSTATE 23514 (check_violation: capacity reached)
  v_sqlstate := null;
  v_errmsg := null;
  begin
    insert into public.registrations (id, meetup_id, name, email, phone, consent)
    values (gen_random_uuid(), v_capacity_meetup_id, 'Slot Starved', 'slot_starved@roa.local', '9123456789', true);
  exception when others then
    get stacked diagnostics v_sqlstate = RETURNED_SQLSTATE, v_errmsg = MESSAGE_TEXT;
  end;
  if v_sqlstate is null then
    raise exception '[FAIL] Second registration on single-capacity meetup was permitted! Capacity guard failed.';
  elsif v_sqlstate <> '23514' then
    raise exception '[FAIL] Capacity overflow failed with unexpected SQLSTATE % (expected 23514). Message: %', v_sqlstate, v_errmsg;
  end if;

  -- 2.10 Assert anonymous direct INSERT to meetups is REJECTED with SQLSTATE 42501
  v_sqlstate := null;
  v_errmsg := null;
  begin
    insert into public.meetups (title, slug, starts_at, venue)
    values ('Hacked Meetup', 'hacked-meetup', now() + interval '1 day', 'Nowhere');
  exception when others then
    get stacked diagnostics v_sqlstate = RETURNED_SQLSTATE, v_errmsg = MESSAGE_TEXT;
  end;
  if v_sqlstate is null then
    raise exception '[FAIL] Anonymous inserted a meetup! Table grant / RLS must deny.';
  elsif v_sqlstate <> '42501' then
    raise exception '[FAIL] Meetup insertion failed with unexpected SQLSTATE % (expected 42501). Message: %', v_sqlstate, v_errmsg;
  end if;

  -- 2.11 Assert anonymous sees ONLY published reels among seeded fixtures
  select count(*) into v_count
  from public.reels
  where id in (v_pub_reel_id, v_draft_reel_id);
  if v_count <> 1 then
    raise exception '[FAIL] Anonymous saw % reels among seeded fixtures instead of exactly 1 published reel!', v_count;
  end if;

  -- 2.12 Assert anonymous sees ONLY storage objects of published reels (video + poster; draft is hidden)
  select count(*) into v_count
  from storage.objects
  where bucket_id = 'roa-reels'
    and name in ('reels/pub_video.mp4', 'reels/pub_poster.webp', 'reels/draft_video.mp4', 'reels/draft_poster.webp');
  if v_count <> 2 then
    raise exception '[FAIL] Storage policy leaked draft reel objects! Visible objects: % (expected exactly 2)', v_count;
  end if;

  raise notice '[PASS] Step 2: Anonymous visitor behavioral assertions verified (SQLSTATE 42501, 23505, 23514 asserted).';

  -- --------------------------------------------------------------------------
  -- STEP 3: NORMAL AUTHENTICATED USER BEHAVIORAL TESTS
  -- --------------------------------------------------------------------------
  execute 'reset role';
  execute 'set local role authenticated';
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_user_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_user_id, 'role', 'authenticated')::text, true);

  -- 3.1 Normal user can read own profile
  select count(*) into v_count from public.profiles where id = v_user_id;
  if v_count <> 1 then
    raise exception '[FAIL] Normal user could not read own profile!';
  end if;

  -- 3.2 Normal user CANNOT read other users profiles
  select count(*) into v_count from public.profiles where id in (v_founder_id, v_lead_id);
  if v_count <> 0 then
    raise exception '[FAIL] Normal user read other profiles (% records)! Expected 0.', v_count;
  end if;

  -- 3.3 Normal user can update own full_name
  update public.profiles set full_name = 'Renamed Normal User' where id = v_user_id;
  get diagnostics v_count = row_count;
  if v_count <> 1 then
    raise exception '[FAIL] Normal user failed to update own full_name!';
  end if;

  -- 3.4 Normal user CANNOT self-promote role to admin (fails with SQLSTATE 42501)
  v_sqlstate := null;
  v_errmsg := null;
  begin
    update public.profiles set role = 'admin' where id = v_user_id;
  exception when others then
    get stacked diagnostics v_sqlstate = RETURNED_SQLSTATE, v_errmsg = MESSAGE_TEXT;
  end;
  if v_sqlstate is null then
    raise exception '[FAIL] Normal user self-promoted to admin! Must be rejected.';
  elsif v_sqlstate <> '42501' then
    raise exception '[FAIL] Role escalation failed with unexpected SQLSTATE % (expected 42501). Message: %', v_sqlstate, v_errmsg;
  end if;

  -- 3.5 Normal user CANNOT alter designation (fails with SQLSTATE 42501)
  v_sqlstate := null;
  v_errmsg := null;
  begin
    update public.profiles set designation = 'Founder' where id = v_user_id;
  exception when others then
    get stacked diagnostics v_sqlstate = RETURNED_SQLSTATE, v_errmsg = MESSAGE_TEXT;
  end;
  if v_sqlstate is null then
    raise exception '[FAIL] Normal user altered designation! Must be rejected.';
  elsif v_sqlstate <> '42501' then
    raise exception '[FAIL] Designation mutation failed with unexpected SQLSTATE % (expected 42501). Message: %', v_sqlstate, v_errmsg;
  end if;

  -- 3.6 Normal user CANNOT alter immutable profile ID (fails with SQLSTATE 42501)
  v_sqlstate := null;
  v_errmsg := null;
  begin
    update public.profiles set id = gen_random_uuid() where id = v_user_id;
  exception when others then
    get stacked diagnostics v_sqlstate = RETURNED_SQLSTATE, v_errmsg = MESSAGE_TEXT;
  end;
  if v_sqlstate is null then
    raise exception '[FAIL] Normal user modified immutable profile ID! Must be rejected.';
  elsif v_sqlstate <> '42501' then
    raise exception '[FAIL] ID mutation failed with unexpected SQLSTATE % (expected 42501). Message: %', v_sqlstate, v_errmsg;
  end if;

  -- 3.7 Normal user CANNOT read registrations (RLS filters out records)
  select count(*) into v_count from public.registrations where id = v_reg_id;
  if v_count <> 0 then
    raise exception '[FAIL] Normal authenticated user read registration record! Expected 0.';
  end if;

  -- 3.8 Normal user CANNOT read enquiries (RLS filters out records)
  select count(*) into v_count from public.enquiries where id = v_enquiry_id;
  if v_count <> 0 then
    raise exception '[FAIL] Normal authenticated user read enquiry record! Expected 0.';
  end if;

  raise notice '[PASS] Step 3: Normal authenticated user behavioral assertions verified (SQLSTATE 42501 asserted).';

  -- --------------------------------------------------------------------------
  -- STEP 4: COMMUNITY LEAD (EDITOR) BEHAVIORAL TESTS (LEGACY JWT FORMAT)
  -- --------------------------------------------------------------------------
  execute 'reset role';
  execute 'set local role authenticated';
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_lead_id::text, true);
  perform set_config('request.jwt.claims', '', true);

  -- 4.1 Assert Community Lead CANNOT read attendee registrations (returns 0)
  select count(*) into v_count from public.registrations where id = v_reg_id;
  if v_count <> 0 then
    raise exception '[FAIL] Community Lead (editor) read registration record! Must be strictly denied (0).';
  end if;

  -- 4.2 Assert Community Lead CANNOT update attendee registrations (affects 0)
  update public.registrations set status = 'contacted' where id = v_reg_id;
  get diagnostics v_count = row_count;
  if v_count <> 0 then
    raise exception '[FAIL] Community Lead updated % registrations! Must affect 0.', v_count;
  end if;

  -- 4.3 Assert Community Lead CANNOT delete attendee registrations (affects 0)
  delete from public.registrations where id = v_reg_id;
  get diagnostics v_count = row_count;
  if v_count <> 0 then
    raise exception '[FAIL] Community Lead deleted % registrations! Must affect 0.', v_count;
  end if;

  -- 4.4 Assert Community Lead CANNOT read contact enquiries (returns 0)
  select count(*) into v_count from public.enquiries where id = v_enquiry_id;
  if v_count <> 0 then
    raise exception '[FAIL] Community Lead read enquiry record! Must be strictly denied (0).';
  end if;

  -- 4.5 Assert Community Lead CANNOT update contact enquiries (affects 0)
  update public.enquiries set status = 'contacted' where id = v_enquiry_id;
  get diagnostics v_count = row_count;
  if v_count <> 0 then
    raise exception '[FAIL] Community Lead updated % enquiries! Must affect 0.', v_count;
  end if;

  -- 4.6 Assert Community Lead CAN read ALL meetups among seeded fixtures (including unpublished drafts)
  select count(*) into v_count
  from public.meetups
  where id in (v_open_meetup_id, v_closed_meetup_id, v_draft_meetup_id);
  if v_count <> 3 then
    raise exception '[FAIL] Community Lead saw % meetups among seeded fixtures instead of all 3!', v_count;
  end if;

  -- 4.7 Assert Community Lead CAN update meetup content
  update public.meetups set venue = 'Lead Updated Venue' where id = v_draft_meetup_id;
  get diagnostics v_count = row_count;
  if v_count <> 1 then
    raise exception '[FAIL] Community Lead failed to update permitted meetup content!';
  end if;

  -- 4.8 Assert Community Lead CAN read ALL reels among seeded fixtures (including drafts)
  select count(*) into v_count
  from public.reels
  where id in (v_pub_reel_id, v_draft_reel_id);
  if v_count <> 2 then
    raise exception '[FAIL] Community Lead saw % reels among seeded fixtures instead of all 2!', v_count;
  end if;

  -- 4.9 Assert Community Lead CAN read ALL reel storage objects among seeded fixtures
  select count(*) into v_count
  from storage.objects
  where bucket_id = 'roa-reels'
    and name in ('reels/pub_video.mp4', 'reels/pub_poster.webp', 'reels/draft_video.mp4', 'reels/draft_poster.webp');
  if v_count <> 4 then
    raise exception '[FAIL] Community Lead saw % reel storage objects instead of all 4!', v_count;
  end if;

  -- 4.10 Assert Community Lead CANNOT self-promote to admin (fails with SQLSTATE 42501)
  v_sqlstate := null;
  v_errmsg := null;
  begin
    update public.profiles set role = 'admin' where id = v_lead_id;
  exception when others then
    get stacked diagnostics v_sqlstate = RETURNED_SQLSTATE, v_errmsg = MESSAGE_TEXT;
  end;
  if v_sqlstate is null then
    raise exception '[FAIL] Community Lead self-promoted to admin! Must be rejected.';
  elsif v_sqlstate <> '42501' then
    raise exception '[FAIL] Self-promotion failed with unexpected SQLSTATE % (expected 42501). Message: %', v_sqlstate, v_errmsg;
  end if;

  -- 4.11 Assert Community Lead CANNOT modify another user profile (RLS blocks, 0 rows updated)
  update public.profiles set designation = 'New Title' where id = v_user_id;
  if found then
    raise exception '[FAIL] Community Lead updated another user profile! RLS violation.';
  end if;

  -- 4.11b Assert Community Lead CANNOT modify own designation (denied with 42501 by protect_profile_roles)
  v_sqlstate := null;
  v_errmsg := null;
  begin
    update public.profiles set designation = 'New Title' where id = v_lead_id;
  exception when others then
    get stacked diagnostics v_sqlstate = RETURNED_SQLSTATE, v_errmsg = MESSAGE_TEXT;
  end;
  if v_sqlstate is null then
    raise exception '[FAIL] Community Lead altered designation! Must be rejected.';
  elsif v_sqlstate <> '42501' then
    raise exception '[FAIL] Designation modification failed with unexpected SQLSTATE % (expected 42501). Message: %', v_sqlstate, v_errmsg;
  end if;

  -- 4.12 Assert registration meetup_id CANNOT be reassigned (guard_registration_update denies with 42501)
  v_sqlstate := null;
  v_errmsg := null;
  begin
    -- Temporarily as founder so RLS passes, to verify trigger guard
    execute 'reset role';
    execute 'set local role authenticated';
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claim.role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', v_founder_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_founder_id, 'role', 'authenticated')::text, true);

    update public.registrations set meetup_id = v_closed_meetup_id where id = v_reg_id;
  exception when others then
    get stacked diagnostics v_sqlstate = RETURNED_SQLSTATE, v_errmsg = MESSAGE_TEXT;
  end;
  if v_sqlstate is null then
    raise exception '[FAIL] Registration meetup_id was reassigned! guard_registration_update must deny.';
  elsif v_sqlstate <> '42501' then
    raise exception '[FAIL] Meetup reassignment failed with unexpected SQLSTATE % (expected 42501). Message: %', v_sqlstate, v_errmsg;
  end if;

  raise notice '[PASS] Step 4: Community Lead (editor) behavioral assertions verified (SQLSTATE 42501 asserted).';

  -- --------------------------------------------------------------------------
  -- STEP 5: FOUNDER (ADMIN) FULL ADMINISTRATIVE ACCESS TESTS (MODERN JWT FORMAT)
  -- --------------------------------------------------------------------------
  execute 'reset role';
  execute 'set local role authenticated';
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_founder_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_founder_id, 'role', 'authenticated')::text, true);

  -- 5.1 Assert Founder CAN read attendee registrations
  select count(*) into v_count from public.registrations where id = v_reg_id;
  if v_count <> 1 then
    raise exception '[FAIL] Founder was unable to read registration record!';
  end if;

  -- 5.2 Assert Founder CAN update registration status
  update public.registrations set status = 'contacted' where id = v_reg_id;
  get diagnostics v_count = row_count;
  if v_count <> 1 then
    raise exception '[FAIL] Founder failed to update registration status!';
  end if;

  -- 5.3 Assert Founder CAN delete registration
  delete from public.registrations where id = v_reg_id;
  get diagnostics v_count = row_count;
  if v_count <> 1 then
    raise exception '[FAIL] Founder failed to delete registration!';
  end if;

  -- 5.4 Assert Founder CAN read contact enquiries
  select count(*) into v_count from public.enquiries where id = v_enquiry_id;
  if v_count <> 1 then
    raise exception '[FAIL] Founder was unable to read enquiry record!';
  end if;

  -- 5.5 Assert Founder CAN update enquiry status
  update public.enquiries set status = 'resolved' where id = v_enquiry_id;
  get diagnostics v_count = row_count;
  if v_count <> 1 then
    raise exception '[FAIL] Founder failed to update enquiry status!';
  end if;

  -- 5.6 Assert Founder CAN update staff designations
  update public.profiles set designation = 'Senior Community Lead' where id = v_lead_id;
  get diagnostics v_count = row_count;
  if v_count <> 1 then
    raise exception '[FAIL] Founder failed to update staff designation!';
  end if;

  -- 5.7 Assert Founder CAN update staff roles
  update public.profiles set role = 'editor' where id = v_user_id;
  get diagnostics v_count = row_count;
  if v_count <> 1 then
    raise exception '[FAIL] Founder failed to promote user to editor!';
  end if;

  raise notice '[PASS] Step 5: Founder (admin) full administrative access verified.';

  -- --------------------------------------------------------------------------
  -- STEP 6: DIRECT SQL EDITOR TRUST BOUNDARY VERIFICATION
  -- --------------------------------------------------------------------------
  execute 'reset role';
  perform set_config('request.jwt.claim.role', '', true);
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('role', 'postgres', true);

  -- Verify direct trusted admin session can update role
  update public.profiles set designation = 'Founder & Lead Curator' where id = v_founder_id;
  get diagnostics v_count = row_count;
  if v_count <> 1 then
    raise exception '[FAIL] Direct SQL Editor administrator was blocked from updating profile!';
  end if;

  raise notice '[PASS] Step 6: Direct SQL Editor administration trust boundary verified.';

  raise notice '============================================================';
  raise notice 'ALL 6 BEHAVIORAL SECURITY & RLS TEST SUITES PASSED (100%% SUCCESS)';
  raise notice '============================================================';
end $$;

-- Complete safety: rollback transaction so no test records persist
rollback;
