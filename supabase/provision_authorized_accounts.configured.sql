-- ==============================================================================
-- READERS OF AURANGABAD — AUTHORIZED STAFF PROVISIONING SCRIPT
-- File: supabase/provision_authorized_accounts.sql
-- Revision: 6.0 (Immutable UUID Identity Pinning & Two-Factor Verification)
-- Date: 2026-11-15
-- Purpose: Atomic server-side role and designation assignment for authorized staff.
--
-- SECURITY & IDENTITY ARCHITECTURE (F-03 REMEDIATION):
-- Role promotion MUST NOT rely on email-only identity matching. An attacker could
-- exploit open signups, temporary email claims, or unconfirmed states.
--
-- This script enforces a strict two-factor identity proof:
-- 1. Immutable Primary Key: Verified Auth User UUID from Supabase Authentication.
-- 2. Email Verification: Confirmed email matching the approved operator email.
-- 3. Account Status: Account must be explicitly confirmed (email_confirmed_at /
--    confirmed_at) or invited (invited_at) by an administrator.
-- 4. Active Status: Account must not be suspended (banned_until is null or past).
--
-- FAIL-CLOSED TEMPLATE INSTRUCTIONS:
-- 1. Project Owner navigates to Supabase Dashboard > Authentication > Users.
-- 2. Locate the verified accounts for Founder and Community Lead.
-- 3. Copy each account's exact User UID (UUID).
-- 4. Replace the NULL values in v_founder_auth_uuid and v_lead_auth_uuid below.
-- 5. If left as NULL, the script immediately aborts with zero changes.
-- 6. Execute strictly in Supabase Dashboard SQL Editor (postgres superuser).
-- ==============================================================================

do $$
declare
  -- ============================================================================
  -- OPERATOR-CONTROLLED IDENTITY MAPPING (MUST BE CONFIGURED BEFORE RUNNING)
  -- ============================================================================
  -- REQUIRED: Paste verified Auth User UUIDs from Dashboard > Authentication > Users
  v_founder_auth_uuid uuid := '9e28ecce-497a-478a-92dc-bdcedc60cdad';
  v_founder_fallback_name text := 'Rafe Farooqui';

  v_lead_auth_uuid uuid := '5b8c399a-7875-418b-88c9-56ec8bae6def';
  v_lead_fallback_name text := 'Arib Ahmad';

  -- Internal state variables
  v_founder_auth_record record;
  v_lead_auth_record record;
  v_founder_profile record;
  v_lead_profile record;
  v_jwt_role text := public.get_jwt_role();
begin
  -- 1. Trust boundary guard: Ensure this script executes in direct DB admin context
  if v_jwt_role is not null then
    raise exception 'SECURITY VIOLATION: Provisioning script cannot be executed through PostgREST client context (detected JWT role: %). Must be executed in Supabase SQL Editor.', v_jwt_role;
  end if;

  if session_user not in ('postgres', 'supabase_admin') then
    raise exception 'SECURITY VIOLATION: Provisioning script must be executed by trusted database administrator (current session_user: %).', session_user;
  end if;

  -- 2. Fail-closed configuration check: verified UUIDs must be supplied
  if v_founder_auth_uuid is null or v_lead_auth_uuid is null then
    raise exception 'FAIL-CLOSED: Unconfigured operator identity mapping. Before executing this script in the Supabase SQL Editor, the project owner MUST privately supply the verified Auth User UUIDs for both Founder and Community Lead from Authentication > Users.'
      using errcode = '22023';
  end if;

  -- 3. Query auth.users by immutable UUID primary key
  select
    u.id,
    u.email,
    u.raw_user_meta_data,
    u.email_confirmed_at,
    u.confirmed_at,
    u.invited_at,
    u.banned_until
  into v_founder_auth_record
  from auth.users u
  where u.id = v_founder_auth_uuid;

  select
    u.id,
    u.email,
    u.raw_user_meta_data,
    u.email_confirmed_at,
    u.confirmed_at,
    u.invited_at,
    u.banned_until
  into v_lead_auth_record
  from auth.users u
  where u.id = v_lead_auth_uuid;

  -- 4. Fail-safe validation: Accounts must exist
  if v_founder_auth_record.id is null and v_lead_auth_record.id is null then
    raise exception 'ATOMIC PROVISIONING ABORTED: Neither Founder UUID (%) nor Community Lead UUID (%) exists in auth.users. Transaction rolled back with 0 changes.', v_founder_auth_uuid, v_lead_auth_uuid;
  end if;

  if v_founder_auth_record.id is null then
    raise exception 'ATOMIC PROVISIONING ABORTED: Founder account with UUID % does not exist in auth.users. Please invite/create this account first. Transaction rolled back with 0 changes.', v_founder_auth_uuid;
  end if;

  if v_lead_auth_record.id is null then
    raise exception 'ATOMIC PROVISIONING ABORTED: Community Lead account with UUID % does not exist in auth.users. Please invite/create this account first. Transaction rolled back with 0 changes.', v_lead_auth_uuid;
  end if;

  -- 5. Two-factor identity proof: UUID must match expected operator email
  if lower(trim(v_founder_auth_record.email)) is distinct from lower(trim(v_founder_expected_email)) then
    raise exception 'IDENTITY MISMATCH: Founder UUID (%) belongs to an unexpected email address. Provisioning aborted with 0 changes.', v_founder_auth_uuid;
  end if;

  if lower(trim(v_lead_auth_record.email)) is distinct from lower(trim(v_lead_expected_email)) then
    raise exception 'IDENTITY MISMATCH: Community Lead UUID (%) belongs to an unexpected email address. Provisioning aborted with 0 changes.', v_lead_auth_uuid;
  end if;

  -- 6. Account confirmation/invitation status check
  if v_founder_auth_record.email_confirmed_at is null
     and v_founder_auth_record.confirmed_at is null
     and v_founder_auth_record.invited_at is null then
    raise exception 'UNVERIFIED ACCOUNT: Founder account (UUID %) is unconfirmed and has not been invited. Confirm the account before provisioning.', v_founder_auth_uuid;
  end if;

  if v_lead_auth_record.email_confirmed_at is null
     and v_lead_auth_record.confirmed_at is null
     and v_lead_auth_record.invited_at is null then
    raise exception 'UNVERIFIED ACCOUNT: Community Lead account (UUID %) is unconfirmed and has not been invited. Confirm the account before provisioning.', v_lead_auth_uuid;
  end if;

  -- 7. Account active status check (not banned)
  if v_founder_auth_record.banned_until is not null and v_founder_auth_record.banned_until > now() then
    raise exception 'SUSPENDED ACCOUNT: Founder account (UUID %) is currently banned/suspended.', v_founder_auth_uuid;
  end if;

  if v_lead_auth_record.banned_until is not null and v_lead_auth_record.banned_until > now() then
    raise exception 'SUSPENDED ACCOUNT: Community Lead account (UUID %) is currently banned/suspended.', v_lead_auth_uuid;
  end if;

  -- 8. Atomic upsert Founder profile
  -- Email is sourced strictly from auth.users (the authoritative store).
  -- The ON CONFLICT clause deliberately omits email to prevent competing authority.
  insert into public.profiles (id, email, full_name, designation, role)
  values (
    v_founder_auth_uuid,
    v_founder_auth_record.email,
    coalesce(nullif(trim(v_founder_auth_record.raw_user_meta_data ->> 'full_name'), ''), v_founder_fallback_name),
    'Founder',
    'admin'::public.admin_role
  )
  on conflict (id) do update set
    role = 'admin'::public.admin_role,
    designation = 'Founder',
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    updated_at = now();

  -- 9. Atomic upsert Community Lead profile
  insert into public.profiles (id, email, full_name, designation, role)
  values (
    v_lead_auth_uuid,
    v_lead_auth_record.email,
    coalesce(nullif(trim(v_lead_auth_record.raw_user_meta_data ->> 'full_name'), ''), v_lead_fallback_name),
    'Community Lead',
    'editor'::public.admin_role
  )
  on conflict (id) do update set
    role = 'editor'::public.admin_role,
    designation = 'Community Lead',
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    updated_at = now();

  -- 10. Strict post-provisioning verification
  select id, email, designation, role into v_founder_profile
  from public.profiles
  where id = v_founder_auth_uuid;

  select id, email, designation, role into v_lead_profile
  from public.profiles
  where id = v_lead_auth_uuid;

  if v_founder_profile.role is distinct from 'admin' or v_founder_profile.designation is distinct from 'Founder' then
    raise exception 'POST-PROVISIONING VERIFICATION FAILED: Founder profile was not correctly updated to admin / Founder. Transaction aborted.';
  end if;

  if v_lead_profile.role is distinct from 'editor' or v_lead_profile.designation is distinct from 'Community Lead' then
    raise exception 'POST-PROVISIONING VERIFICATION FAILED: Community Lead profile was not correctly updated to editor / Community Lead. Transaction aborted.';
  end if;

  raise notice '============================================================';
  raise notice 'SUCCESS: BOTH ACCOUNTS PROVISIONED AND VERIFIED ATOMICALLY';
  raise notice 'Founder UUID: % -> role: admin, designation: Founder', v_founder_auth_uuid;
  raise notice 'Community Lead UUID: % -> role: editor, designation: Community Lead', v_lead_auth_uuid;
  raise notice '============================================================';
end $$;

-- 11. AUDIT & VERIFICATION QUERY (CONFIRMS DATABASE STATE WITH MASKED PII)
select
  p.id as profile_uuid,
  substr(p.email, 1, 2) || '***@' || split_part(p.email, '@', 2) as masked_email,
  p.full_name,
  p.designation,
  p.role,
  case when u.email_confirmed_at is not null then true else false end as is_email_confirmed,
  u.last_sign_in_at,
  p.created_at,
  p.updated_at
from public.profiles p
left join auth.users u on u.id = p.id
where p.role in ('admin', 'editor')
order by p.role asc;
