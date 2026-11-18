# SECURITY REVIEW & ARCHITECTURAL CORRECTION REPORT
## Readers of Aurangabad — Supabase Database, Storage & Role-Based Access Control
**Document Reference:** `reports/admin-security-review.md`  
**Revision:** 3.3 (Runtime-Test Assertions, Explicit SQLSTATE Auditing & pgTAP Framework)  
**Date:** November 9, 2026  
**Auditor:** Senior Supabase Architect & PostgreSQL Security Engineer  
**Status:** COMPLETE — AWAITING USER APPROVAL (NO SQL EXECUTED ON LIVE ENVIRONMENT)

---

## 1. Executive Summary & Verification Classification

In accordance with strict verification and compliance guidelines, this report details the security architecture, Row-Level Security policies, anti-tamper mechanisms, table privilege audits, and dual behavioral verification test suites for the Readers of Aurangabad database.

### 1.1 Comprehensive Verification Status Matrix

| Verification Level | Scope / Target | Execution Status | Findings & Evidence |
| :--- | :--- | :--- | :--- |
| **Static Syntax & AST Validation** | All 5 SQL files ([`validate_sql.py`](file:///d:/projects/Readers%20of%20Aurangabad/readers-of-aurangabad/scripts/validate_sql.py)) | **PASSED (100%)** | 40 valid single-operation policies, 0 comma-separated clauses, 8 `SECURITY DEFINER` routines with strictly hardened `search_path = public, pg_temp;`, balanced `$$` blocks. |
| **Local Disposable DB Execution** | Disposable Docker / CLI container | **UNPERFORMED (Toolchain Limitation)** | Supabase CLI and Docker engine are not installed on this local Windows host. Testing ready for deployment when container runner is provisioned. |
| **Behavioral RLS Verification Suite** | [`verify_security_policies.sql`](file:///d:/projects/Readers%20of%20Aurangabad/readers-of-aurangabad/supabase/tests/verify_security_policies.sql) | **AUTHORED & PREPARED** | Full transactional test script using `SET LOCAL ROLE` + dual JWT simulation (`request.jwt.claim.role` and `request.jwt.claims`). Captures `RETURNED_SQLSTATE` via `GET STACKED DIAGNOSTICS` and asserts exact `42501`. |
| **Formal pgTAP Automated Suite** | [`00001_security_policies.test.sql`](file:///d:/projects/Readers%20of%20Aurangabad/readers-of-aurangabad/supabase/tests/database/00001_security_policies.test.sql) | **AUTHORED & PREPARED** | 35 planned pgTAP assertions for `supabase test db`, using `throws_ok(..., '42501', ...)` and `lives_ok()`. |
| **Live Remote Execution** | Supabase Project `rtjulebzjiwbnizqwxjn` | **UNEXECUTED (Safety Constraint)** | Per strict instructions, **zero SQL statements have been run against the live project** and **zero auth accounts have been created**. Awaiting user authorization. |

---

## 2. In-Depth Resolution of Critical Security Vectors

### 2.1 Dual-Format JWT Role Detection & Trust Boundary
* **The Problem:** In Supabase, PostgREST injects client JWT claims into transaction-local settings. Depending on gateway versions, it sets either legacy individual GUCs (`request.jwt.claim.role`) or modern JSONB strings (`request.jwt.claims ->> 'role'`). Checking only one format risks misidentifying an authenticated client as a direct administrative session if that specific GUC is absent.
* **The Solution in Revision 3.3:**
  Implemented [`public.get_jwt_role()`](file:///d:/projects/Readers%20of%20Aurangabad/readers-of-aurangabad/supabase/migrations/202611080001_admin_portal.sql#L230-L265):
  - Checks legacy GUC `request.jwt.claim.role`.
  - Checks modern JSONB claims `request.jwt.claims ->> 'role'`.
  - Checks session role fallback `current_setting('role', true) in ('anon', 'authenticated')`.
  - Handles malformed JSON safely in an exception block returning `'untrusted_client'`.
  - Returns `NULL` strictly when no JWT claims or PostgREST roles exist (indicating a direct database engine session).
* **Trust Boundary Enforcement:**
  In [`protect_profile_roles()`](file:///d:/projects/Readers%20of%20Aurangabad/readers-of-aurangabad/supabase/migrations/202611080001_admin_portal.sql#L315-L370):
  - **Client Requests (`v_jwt_role IS NOT NULL`):**
    If `v_jwt_role` is `'anon'`, `'untrusted_client'`, or caller `auth.uid()` is `NULL`: **Fails closed with SQLSTATE `42501`**.
    If caller attempts to alter `role`, `designation`, or `email`: Allowed **strictly** if `public.is_admin()` returns `TRUE`.
  - **Database Engine Sessions (`v_jwt_role IS NULL`):**
    The trigger inspects `session_user IN ('postgres', 'supabase_admin')`. If false: **Fails closed with SQLSTATE `42501`**.
    Direct SQL Editor updates by the project administrator running as `postgres` are permitted for initial provisioning.

### 2.2 Privilege Audit & Function Security Hardening
* **Table Privilege Audit:**
  All default table permissions granted to `public`, `anon`, and `authenticated` were revoked via `REVOKE ALL ON TABLE public.<table_name> FROM anon, authenticated;`.
  Explicit least-privilege `GRANT` statements were established:
  - `TRUNCATE`, `REFERENCES`, and `TRIGGER` permissions are permanently revoked for client roles.
  - Client access is strictly governed through Row-Level Security policies.
* **Function Privilege Audit:**
  `REVOKE EXECUTE` was explicitly added for all internal and trigger routines:
  - `public.get_jwt_role()`: `REVOKE EXECUTE ... FROM public, anon, authenticated;`
  - `public.protect_profile_roles()`: `REVOKE EXECUTE ... FROM public, anon, authenticated;`
  - `public.handle_new_auth_user()`: `REVOKE EXECUTE ... FROM public, anon, authenticated;`
  - `public.handle_auth_user_updated()`: `REVOKE EXECUTE ... FROM public, anon, authenticated;`
  - `public.touch_updated_at()`: `REVOKE EXECUTE ... FROM public, anon, authenticated;`
  Only safe, read-only authorization helpers (`is_admin()`, `is_editor()`, `can_manage_content()`) have `GRANT EXECUTE` to `authenticated, anon`.

### 2.3 Strict Expected-Failure Assertions with SQLSTATE `42501`
* **The Problem:** In security tests, using generic `WHEN OTHERS` without error inspection can mask unrelated errors (such as missing columns, syntax typos, or constraint violations) as "security passes".
* **The Solution in Revision 3.3:**
  In [`supabase/tests/verify_security_policies.sql`](file:///d:/projects/Readers%20of%20Aurangabad/readers-of-aurangabad/supabase/tests/verify_security_policies.sql), all expected denial test blocks capture diagnostics:
  ```sql
  v_sqlstate := null;
  v_errmsg := null;
  begin
    -- Operation expected to be denied by RLS or trigger
    update public.profiles set role = 'admin' where id = v_user_id;
  exception when others then
    get stacked diagnostics
      v_sqlstate = RETURNED_SQLSTATE,
      v_errmsg = MESSAGE_TEXT;
  end;

  if v_sqlstate is null then
    raise exception '[FAIL] Operation was permitted! Must be blocked.';
  elsif v_sqlstate <> '42501' then
    raise exception '[FAIL] Failed with unexpected SQLSTATE % (expected 42501). Message: %', v_sqlstate, v_errmsg;
  end if;
  ```
  Any unexpected exception (e.g. `23502` null violation, `42703` column not found) immediately halts the test suite and flags a test failure.

### 2.4 Exact Reel Object-Path Matching
* The condition `LIKE '%' || reels.video_path` was permanently eliminated.
* Replaced with exact equality:
  ```sql
  create policy "Public read published reel objects"
    on storage.objects for select to anon, authenticated
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
  ```
* Delivery behavior:
  - Private bucket `roa-reels` prevents unauthorized browsing of draft video files.
  - Public can stream published reels via HTTP Range requests (`HTTP 206 Partial Content`).
  - Draft reels remain strictly inaccessible (`404 / 403`).

### 2.5 Atomic & Fail-Safe Staff Provisioning
* In [`supabase/provision_authorized_accounts.sql`](file:///d:/projects/Readers%20of%20Aurangabad/readers-of-aurangabad/supabase/provision_authorized_accounts.sql):
  - Enforces `session_user IN ('postgres', 'supabase_admin')` and `get_jwt_role() IS NULL`.
  - Queries `auth.users` for both `imadwahedfarooqui@gmail.com` and `aribahmad673@gmail.com`.
  - If **either** account is missing, it raises an exception and rolls back the transaction. Zero partial provisioning can occur.
  - Atomically upserts Founder (`admin`, `Founder`) and Community Lead (`editor`, `Community Lead`).
  - Verifies the resulting rows and aborts if any attribute was not applied.

---

## 3. Granular Role-Based Permissions Matrix

| Resource / Action | Public / Anonymous | Authenticated (No Role) | Community Lead (`editor`) | Founder (`admin`) |
| :--- | :--- | :--- | :--- | :--- |
| **`public.profiles` (SELECT)** | ❌ Denied | Own profile only (`id = auth.uid()`) | Own profile only | All profiles |
| **`public.profiles` (UPDATE `full_name`)** | ❌ Denied | Own profile only | Own profile only | All profiles |
| **`public.profiles` (UPDATE `role` / `designation`)** | ❌ Denied (42501) | ❌ Blocked by Trigger (42501) | ❌ Blocked by Trigger (42501) | Full management |
| **`public.meetups` (SELECT)** | Published only | Published only | All (drafts & published) | All (drafts & published) |
| **`public.meetups` (MANAGE)** | ❌ Denied (42501) | ❌ Denied (42501) | Full access | Full access |
| **`public.registrations` (SELECT / EXPORT)** | ❌ Denied (0 rows) | ❌ Denied (0 rows) | ❌ **DENIED** (0 rows - Admin-only) | Full access + CSV export |
| **`public.registrations` (INSERT)** | Validated open meetups | Validated open meetups | Validated open meetups | Full access |
| **`public.registrations` (UPDATE / DELETE)** | ❌ Denied (0 rows) | ❌ Denied (0 rows) | ❌ **DENIED** (0 rows - Admin-only) | Full access |
| **`public.gallery_images` (SELECT)** | Published only | Published only | All | All |
| **`public.gallery_images` (MANAGE)** | ❌ Denied (42501) | ❌ Denied (42501) | Full access | Full access |
| **`public.reels` (SELECT)** | Published only | Published only | All | All |
| **`public.reels` (MANAGE)** | ❌ Denied (42501) | ❌ Denied (42501) | Full access | Full access |
| **`public.announcements` (SELECT)** | Active & published | Active & published | All | All |
| **`public.announcements` (MANAGE)** | ❌ Denied (42501) | ❌ Denied (42501) | Full access | Full access |
| **`public.articles` (SELECT)** | Published only | Published only | All | All |
| **`public.articles` (MANAGE)** | ❌ Denied (42501) | ❌ Denied (42501) | Full access | Full access |
| **`public.enquiries` (SELECT)** | ❌ Denied (0 rows) | ❌ Denied (0 rows) | ❌ **DENIED** (0 rows - Admin-only) | Full access |
| **`public.enquiries` (INSERT)** | Validated contact form | Validated contact form | Validated contact form | Full access |
| **`public.enquiries` (UPDATE / DELETE)** | ❌ Denied (0 rows) | ❌ Denied (0 rows) | ❌ **DENIED** (0 rows - Admin-only) | Full access |
| **Storage `roa-gallery` (READ)** | Public read | Public read | Public read | Public read |
| **Storage `roa-gallery` (WRITE)** | ❌ Denied | ❌ Denied | Upload / Update / Delete | Upload / Update / Delete |
| **Storage `roa-thumbnails` (READ)** | Public read | Public read | Public read | Public read |
| **Storage `roa-thumbnails` (WRITE)** | ❌ Denied | ❌ Denied | Upload / Update / Delete | Upload / Update / Delete |
| **Storage `roa-reels` (READ)** | Published media only | Published media only | All objects | All objects |
| **Storage `roa-reels` (WRITE)** | ❌ Denied | ❌ Denied | Upload / Update / Delete | Upload / Update / Delete |

---

## 4. Operational Checklist & Step-by-Step Procedure

When you are ready to deploy to Supabase project `rtjulebzjiwbnizqwxjn`:

### Step 1: Lock Public Signups
1. Go to **Supabase Dashboard > Authentication > Providers > Email**.
2. Toggle **Enable Signups** to **OFF** (Invite-only mode).

### Step 2: Apply Main Schema Migration
1. Open the Supabase **SQL Editor**.
2. Run [`supabase/migrations/202611080001_admin_portal.sql`](file:///d:/projects/Readers%20of%20Aurangabad/readers-of-aurangabad/supabase/migrations/202611080001_admin_portal.sql).
3. Confirm that all 8 tables, 3 buckets, functions, and 40 RLS policies compile cleanly.

### Step 3: Invite Team Accounts (Zero Password Exposure)
1. Go to **Authentication > Users** in Supabase Dashboard.
2. Click **Invite user**:
   - `imadwahedfarooqui@gmail.com`
   - `aribahmad673@gmail.com`
3. Each recipient receives an official email invite containing a secure token to establish their private password.

### Step 4: Execute Atomic Provisioning Script
1. In the Supabase **SQL Editor**, run [`supabase/provision_authorized_accounts.sql`](file:///d:/projects/Readers%20of%20Aurangabad/readers-of-aurangabad/supabase/provision_authorized_accounts.sql).
2. The script automatically verifies both accounts, sets their system roles and designations, and validates that zero accounts are left unprovisioned.

### Step 5: Run Behavioral Verification Test Suite
1. In the Supabase **SQL Editor**, run [`supabase/tests/verify_security_policies.sql`](file:///d:/projects/Readers%20of%20Aurangabad/readers-of-aurangabad/supabase/tests/verify_security_policies.sql).
2. The script executes simulated `anon`, `normal user`, `editor`, and `admin` transactions under both legacy and modern JWT claims, asserting:
   - Anonymous visitor cannot read registrations or enquiries.
   - Anonymous visitor cannot register for closed meetups (asserts SQLSTATE `42501`).
   - Community Lead cannot read, update, or delete registrations.
   - Community Lead cannot self-promote to admin (asserts SQLSTATE `42501`).
   - Founder has full administrative access.
   - Self-contained `ROLLBACK` guarantees zero test data remains in the database.
3. If running via Supabase CLI with local Docker: run `supabase test db` to execute the automated pgTAP suite ([`00001_security_policies.test.sql`](file:///d:/projects/Readers%20of%20Aurangabad/readers-of-aurangabad/supabase/tests/database/00001_security_policies.test.sql)).

---

## 5. Remaining Risks & Untested Operational Items

1. **Live Remote Execution Pending:**
   - The behavioral test suite has been prepared with full PostgreSQL transactional isolation, but has not yet been executed against the live Supabase project. Verification will be confirmed upon deployment.
2. **Local Toolchain State:**
   - Supabase CLI and Docker are not installed on this local Windows host; local containerized pgTAP runtime execution was not performed locally. The test files are completely self-contained and ready for execution.
3. **SMTP Rate Limits:**
   - Default shared Supabase SMTP allows 30 emails/hour. For production use, configure a custom SMTP provider (Resend, SendGrid, AWS SES) under **Authentication > SMTP Settings** to guarantee invite delivery.
4. **Storage CORS Settings:**
   - For web video players performing HTTP Range requests across origins, verify that Supabase Storage bucket CORS allows `GET`, `HEAD` with `Range` and `Content-Range` headers enabled.
