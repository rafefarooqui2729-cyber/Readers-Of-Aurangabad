-- ==============================================================================
-- READERS OF AURANGABAD — AUTHORIZED STAFF PROVISIONING SCRIPT
-- File: supabase/provision_authorized_accounts.sql
-- Revision: 5.2 (Configurable Identities, Discrepancy Audit & Fail-Safe Verification)
-- Date: 2026-11-10
-- Purpose: Atomic server-side role and designation assignment for authorized staff.
--
-- IDENTITY AUDIT & CONFIGURATION NOTE:
-- Previous drafts referenced Founder full name 'Abdul Rafe Farooqui', while the
-- authorized email address is 'imadwahedfarooqui@gmail.com'.
-- To prevent silent identity alteration or unintended overrides, staff identities
-- are declared as configurable variables below. Confirm these values before execution.
--
-- AUTHORIZED ACCOUNTS CONFIGURATION:
-- 1. Founder:
--    - Target Email: imadwahedfarooqui@gmail.com
--    - System Role: admin (Full administrative control)
--    - Designation: Founder
--
-- 2. Community Lead:
--    - Target Email: aribahmad673@gmail.com
--    - System Role: editor (Content curation only)
--    - Designation: Community Lead
--
-- EXECUTION REQUIREMENTS:
-- 1. In Supabase Dashboard, navigate to Authentication > Users.
-- 2. Invite BOTH accounts before running this script:
--    - Account 1: imadwahedfarooqui@gmail.com (Founder)
--    - Account 2: aribahmad673@gmail.com (Community Lead)
-- 3. Run this script strictly in the Supabase Dashboard SQL Editor (executing under postgres superuser).
-- 4. If EITHER account is missing from auth.users, the script will immediately throw an
--    exception and ROLL BACK the entire transaction. Zero accounts will be partially provisioned.
-- 5. Execution guard: This script refuses to run if invoked through an unverified client context.
-- ==============================================================================

do $$
declare
  -- ============================================================================
  -- CONFIGURABLE STAFF IDENTITIES (AUDIT & CONFIRM BEFORE RUNNING)
  -- ============================================================================
  v_founder_email text := 'imadwahedfarooqui@gmail.com';
  -- Flagging identity: If the Founder's preferred display name is 'Imad Wahed Farooqui',
  -- or 'Abdul Rafe Farooqui', set it explicitly here. The script defaults to any
  -- full_name provided during Auth signup/invite, falling back to this variable.
  v_founder_fallback_name text := 'Imad Wahed Farooqui';

  v_lead_email text := 'aribahmad673@gmail.com';
  v_lead_fallback_name text := 'Arib Ahmad';

  -- Internal state variables
  v_founder_auth_id uuid;
  v_founder_auth_meta jsonb;
  v_lead_auth_id uuid;
  v_lead_auth_meta jsonb;
  v_founder_profile record;
  v_lead_profile record;
  v_jwt_role text := public.get_jwt_role();
begin
  -- 1. Trust boundary guard: Ensure this script is executing in direct database administration context
  if v_jwt_role is not null then
    raise exception 'SECURITY VIOLATION: Provisioning script cannot be executed through PostgREST client context (detected JWT role: %). Must be executed in Supabase SQL Editor.', v_jwt_role;
  end if;

  if session_user not in ('postgres', 'supabase_admin') then
    raise exception 'SECURITY VIOLATION: Provisioning script must be executed by trusted database administrator (current session_user: %).', session_user;
  end if;

  -- 2. Query auth.users for Founder
  select id, raw_user_meta_data into v_founder_auth_id, v_founder_auth_meta
  from auth.users
  where lower(trim(email)) = lower(trim(v_founder_email));

  -- 3. Query auth.users for Community Lead
  select id, raw_user_meta_data into v_lead_auth_id, v_lead_auth_meta
  from auth.users
  where lower(trim(email)) = lower(trim(v_lead_email));

  -- 4. Fail-safe atomic validation: BOTH accounts MUST exist
  if v_founder_auth_id is null and v_lead_auth_id is null then
    raise exception 'ATOMIC PROVISIONING ABORTED: Neither Founder (%) nor Community Lead (%) exists in auth.users. Please invite both accounts under Authentication > Users before running this script. Transaction rolled back with 0 changes.', v_founder_email, v_lead_email;
  end if;

  if v_founder_auth_id is null then
    raise exception 'ATOMIC PROVISIONING ABORTED: Founder account (%) is missing from auth.users. Please invite this account under Authentication > Users first. Transaction rolled back with 0 changes.', v_founder_email;
  end if;

  if v_lead_auth_id is null then
    raise exception 'ATOMIC PROVISIONING ABORTED: Community Lead account (%) is missing from auth.users. Please invite this account under Authentication > Users first. Transaction rolled back with 0 changes.', v_lead_email;
  end if;

  -- 5. Atomic upsert Founder profile
  insert into public.profiles (id, email, full_name, designation, role)
  values (
    v_founder_auth_id,
    lower(trim(v_founder_email)),
    coalesce(nullif(trim(v_founder_auth_meta ->> 'full_name'), ''), v_founder_fallback_name),
    'Founder',
    'admin'::public.admin_role
  )
  on conflict (id) do update set
    email = excluded.email,
    role = 'admin'::public.admin_role,
    designation = 'Founder',
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    updated_at = now();

  -- 6. Atomic upsert Community Lead profile
  insert into public.profiles (id, email, full_name, designation, role)
  values (
    v_lead_auth_id,
    lower(trim(v_lead_email)),
    coalesce(nullif(trim(v_lead_auth_meta ->> 'full_name'), ''), v_lead_fallback_name),
    'Community Lead',
    'editor'::public.admin_role
  )
  on conflict (id) do update set
    email = excluded.email,
    role = 'editor'::public.admin_role,
    designation = 'Community Lead',
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    updated_at = now();

  -- 7. Strict post-provisioning verification
  select id, email, designation, role into v_founder_profile
  from public.profiles
  where id = v_founder_auth_id;

  select id, email, designation, role into v_lead_profile
  from public.profiles
  where id = v_lead_auth_id;

  if v_founder_profile.role is distinct from 'admin' or v_founder_profile.designation is distinct from 'Founder' then
    raise exception 'POST-PROVISIONING VERIFICATION FAILED: Founder profile was not correctly updated to admin / Founder. Transaction aborted.';
  end if;

  if v_lead_profile.role is distinct from 'editor' or v_lead_profile.designation is distinct from 'Community Lead' then
    raise exception 'POST-PROVISIONING VERIFICATION FAILED: Community Lead profile was not correctly updated to editor / Community Lead. Transaction aborted.';
  end if;

  raise notice '============================================================';
  raise notice 'SUCCESS: BOTH ACCOUNTS PROVISIONED AND VERIFIED ATOMICALLY';
  raise notice 'Founder: imadwahedfarooqui@gmail.com -> role: admin, designation: Founder';
  raise notice 'Community Lead: aribahmad673@gmail.com -> role: editor, designation: Community Lead';
  raise notice '============================================================';
end $$;

-- 8. AUDIT & VERIFICATION QUERY (CONFIRMS DATABASE STATE)
select
  p.id as profile_uuid,
  p.email,
  p.full_name,
  p.designation,
  p.role,
  u.email_confirmed_at,
  u.last_sign_in_at,
  p.created_at,
  p.updated_at
from public.profiles p
left join auth.users u on u.id = p.id
where lower(trim(p.email)) in ('imadwahedfarooqui@gmail.com', 'aribahmad673@gmail.com')
order by p.role asc;
