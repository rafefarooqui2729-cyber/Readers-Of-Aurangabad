# READERS OF AURANGABAD — PRODUCTION DEPLOYMENT & RECOVERY GUIDE
**Document Reference:** `docs/SUPABASE_DEPLOYMENT_GUIDE.md`
**Date:** November 9, 2026
**Auditor:** Principal Software Architect & PostgreSQL Security Engineer
**Target Project:** `rtjulebzjiwbnizqwxjn`
**Status:** READY FOR OPERATIONAL EXECUTION

---

## 1. Pre-Deployment Checklist

Before deploying the database schema, confirm each item:
- [ ] You have access to the Supabase Dashboard for project `rtjulebzjiwbnizqwxjn`.
- [ ] You are signed in as the project administrator.
- [ ] You have verified that no production data exists in the project (verified empty during audit).
- [ ] You have access to both authorized team email accounts:
  - Founder: `imadwahedfarooqui@gmail.com`
  - Community Lead: `aribahmad673@gmail.com`

---

## 2. Step-by-Step Deployment Procedure

### STEP 1: Lock Down Authentication (Disable Public Signups)
1. Open the Supabase Dashboard: `https://supabase.com/dashboard/project/rtjulebzjiwbnizqwxjn`.
2. Navigate to **Authentication > Providers > Email**.
3. Toggle **Enable Signups** to **OFF** (Invite-only mode).
4. Click **Save Changes**.
   *Security Rationale:* Prevents arbitrary internet users from self-registering accounts on the production project.

---

### STEP 2: Execute the Production Schema Migration
1. In the Supabase Dashboard, navigate to the **SQL Editor**.
2. Click **New Query**.
3. Open [`supabase/migrations/202611090001_readers_of_aurangabad_production_schema.sql`](file:///d:/projects/Readers%20of%20Aurangabad/readers-of-aurangabad/supabase/migrations/202611090001_readers_of_aurangabad_production_schema.sql).
4. Copy the entire contents, paste into the SQL Editor, and click **Run**.
5. Ensure the SQL execution completes successfully with `Success. No rows returned`.
   *Objects Created:*
   - 4 Enums (`admin_role`, `registration_status`, `activity_status`, `enquiry_type`).
   - 8 Application Tables (`profiles`, `meetups`, `registrations`, `gallery_images`, `reels`, `announcements`, `articles`, `enquiries`).
   - 3 Storage Buckets (`roa-reels`, `roa-gallery`, `roa-thumbnails`).
   - 8 `SECURITY DEFINER` routines with fixed search paths.
   - Triggers for auth synchronization, anti-tampering, capacity locking, and timestamps.
   - All Row-Level Security policies and table privilege grants.

---

### STEP 3: Invite Team Members (Zero Password Exposure)
1. In the Supabase Dashboard, navigate to **Authentication > Users**.
2. Click **Invite user** and invite the Founder:
   - Email: `imadwahedfarooqui@gmail.com`
3. Click **Invite user** again and invite the Community Lead:
   - Email: `aribahmad673@gmail.com`
4. Both recipients will receive an official invitation email containing a secure token.
5. Each person clicks their invitation link and privately establishes their password.
   *(No passwords are ever created or handled in SQL scripts, source code, or chat).*

---

### STEP 4: Execute Atomic Staff Role Provisioning
1. In the Supabase **SQL Editor**, open a new query.
2. Open [`supabase/provision_authorized_accounts.sql`](file:///d:/projects/Readers%20of%20Aurangabad/readers-of-aurangabad/supabase/provision_authorized_accounts.sql).
3. Paste into the SQL Editor and click **Run**.
4. The script executes an atomic transaction under `postgres`:
   - It verifies that BOTH `imadwahedfarooqui@gmail.com` and `aribahmad673@gmail.com` exist in `auth.users`.
   - If either account is missing, it **aborts and rolls back immediately**.
   - It assigns `admin` / `Founder` to `imadwahedfarooqui@gmail.com`.
   - It assigns `editor` / `Community Lead` to `aribahmad673@gmail.com`.
   - It verifies the applied roles and outputs a success confirmation notice.

---

### STEP 5: Run Behavioral Verification Test Suite
1. In the Supabase **SQL Editor**, open a new query.
2. Open [`supabase/tests/verify_security_policies.sql`](file:///d:/projects/Readers%20of%20Aurangabad/readers-of-aurangabad/supabase/tests/verify_security_policies.sql).
3. Paste into the SQL Editor and click **Run**.
4. The test suite executes simulated transactions for `anon`, `authenticated`, `editor`, and `admin`:
   - It asserts that anonymous visitors cannot read registrations or enquiries.
   - It asserts that registrations on closed meetups fail with SQLSTATE `42501`.
   - It asserts that editors cannot read attendee PII or self-promote to admin.
   - It terminates with `ROLLBACK`, guaranteeing zero test data persists.
5. Confirm that all test steps pass.

---

## 3. Post-Deployment Verification Queries

Run this query in the SQL Editor to verify the deployed state:

```sql
-- 1. Verify Application Tables Exist
select table_name, is_insertable_into
from information_schema.tables
where table_schema = 'public'
order by table_name;

-- 2. Verify Storage Buckets Exist
select id, name, public, file_size_limit
from storage.buckets
where id in ('roa-reels', 'roa-gallery', 'roa-thumbnails');

-- 3. Verify Provisioned Staff Accounts
select
  p.id as profile_uuid,
  p.email,
  p.full_name,
  p.designation,
  p.role,
  u.email_confirmed_at
from public.profiles p
join auth.users u on u.id = p.id
where p.email in ('imadwahedfarooqui@gmail.com', 'aribahmad673@gmail.com')
order by p.role asc;
```

---

## 4. Rollback and Disaster Recovery

If you ever need to completely tear down or revert the deployment:
1. Open the Supabase **SQL Editor**.
2. Run [`supabase/migrations/202611090001_readers_of_aurangabad_production_schema_rollback.sql`](file:///d:/projects/Readers%20of%20Aurangabad/readers-of-aurangabad/supabase/migrations/202611090001_readers_of_aurangabad_production_schema_rollback.sql).
3. The script will safely:
   - Drop all custom storage access policies.
   - Drop all RLS policies across application tables.
   - Drop all application triggers and functions.
   - Drop all application tables (`enquiries`, `articles`, `announcements`, `reels`, `gallery_images`, `registrations`, `meetups`, `profiles`).
   - Drop all custom enums (`activity_status`, `registration_status`, `enquiry_type`, `admin_role`).
   - Preserve physical storage buckets and auth accounts to avoid data destruction.
