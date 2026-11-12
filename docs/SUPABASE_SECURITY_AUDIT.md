# READERS OF AURANGABAD — COMPREHENSIVE SECURITY AUDIT & THREAT MODEL
**Document Reference:** `docs/SUPABASE_SECURITY_AUDIT.md`
**Date:** November 9, 2026
**Auditor:** Principal Software Architect & PostgreSQL Security Engineer
**Project Reference:** `rtjulebzjiwbnizqwxjn`
**Status:** COMPLETE SECURITY AUDIT SPECIFICATION

---

## 1. Threat Model & Trust Boundaries

The security architecture of Readers of Aurangabad operates under a strict **Zero-Trust Client Model**:
- **Untrusted Zone:** Public web browsers, mobile visitors, API clients, and client-side JavaScript. All incoming parameters, headers, and payloads are treated as untrusted and potentially hostile.
- **Semi-Trusted Zone:** Authenticated staff members (Community Lead / Editor). They have content editing privileges on published and draft materials, but are strictly barred from accessing private member registrations, contact enquiries, or altering user roles.
- **Trusted Application Zone:** Verified System Administrator (Founder). Full administrative access to content, member PII, enquiries, and editor designations.
- **Trusted Infrastructure Zone:** PostgreSQL Database Engine & Supabase Dashboard SQL Editor executing directly as superuser `postgres`.

```
[ UNTRUSTED: Anonymous Visitors & Normal Users ]
                       │
                       ▼  (PostgREST with JWT claims)
┌─────────────────────────────────────────────────────────────┐
│ TRUST BOUNDARY: get_jwt_role() & Row-Level Security         │
│  - Table RLS enforces read/write isolation per role         │
│  - Function execution restricted via REVOKE EXECUTE         │
│  - Anti-tamper triggers intercept role/email mutations       │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼  (Internal Database Functions)
[ TRUSTED: PostgreSQL Engine & Database Administrators ]
```

---

## 2. Row-Level Security (RLS) Policy Matrix

Row-Level Security is enabled across all 8 application tables and storage objects with a **Deny-by-Default** security baseline:

| Table / Resource | Public Visitor (`anon`) | Community Lead (`editor`) | Founder (`admin`) | Policy Enforcement Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| **`public.profiles`** | ❌ Denied | Own profile only | All profiles | RLS `Profiles are readable by owner or admin` + trigger |
| **`public.profiles` (Roles)** | ❌ Denied (`42501`) | ❌ Blocked (`42501`) | Full management | Trigger `protect_profile_roles()` |
| **`public.meetups` (SELECT)** | Published only | All (drafts & published) | All (drafts & published) | RLS `Meetups are public when published` / `Staff manage` |
| **`public.meetups` (WRITE)** | ❌ Denied (`42501`) | Full management | Full management | RLS `Staff insert/update/delete meetups` |
| **`public.registrations` (SELECT)** | ❌ **DENIED** (0 rows) | ❌ **DENIED** (0 rows) | Full access | RLS `Admins read registrations` (`is_admin()`) |
| **`public.registrations` (INSERT)** | Validated open meetups | Validated open meetups | Full access | RLS `Public registration submission` + trigger |
| **`public.registrations` (UPDATE/DELETE)**| ❌ **DENIED** (0 rows) | ❌ **DENIED** (0 rows) | Full access | RLS `Admins update/delete registrations` |
| **`public.gallery_images` (SELECT)** | Published only | All | All | RLS `Gallery is public when published` |
| **`public.gallery_images` (WRITE)** | ❌ Denied (`42501`) | Full management | Full management | RLS `Staff insert/update/delete gallery` |
| **`public.reels` (SELECT)** | Published only | All (drafts & published) | All (drafts & published) | RLS `Reels are public when published` |
| **`public.reels` (WRITE)** | ❌ Denied (`42501`) | Full management | Full management | RLS `Staff insert/update/delete reels` |
| **`public.announcements` (SELECT)** | Active & published | All | All | RLS `Announcements are public when published` |
| **`public.announcements` (WRITE)** | ❌ Denied (`42501`) | Full management | Full management | RLS `Staff insert/update/delete announcements` |
| **`public.articles` (SELECT)** | Published only | All (drafts & published) | All (drafts & published) | RLS `Articles are public when published` |
| **`public.articles` (WRITE)** | ❌ Denied (`42501`) | Full management | Full management | RLS `Staff insert/update/delete articles` |
| **`public.enquiries` (SELECT)** | ❌ **DENIED** (0 rows) | ❌ **DENIED** (0 rows) | Full access | RLS `Admins read enquiries` (`is_admin()`) |
| **`public.enquiries` (INSERT)** | Validated contact form | Validated contact form | Full access | RLS `Public enquiry submission` + trigger |
| **`public.enquiries` (UPDATE/DELETE)**| ❌ **DENIED** (0 rows) | ❌ **DENIED** (0 rows) | Full access | RLS `Admins update/delete enquiries` |
| **Storage `roa-gallery`** | Public read CDN | Staff full upload & edit | Staff full upload & edit | Storage RLS policies |
| **Storage `roa-thumbnails`** | Public read CDN | Staff full upload & edit | Staff full upload & edit | Storage RLS policies |
| **Storage `roa-reels`** | Published reels only | All objects | All objects | Storage RLS with exact path equality |

---

## 3. Defense Against Privilege Escalation Vectors

### 3.1 Dual-Format JWT Role Detection (`get_jwt_role`)
Supabase PostgREST gateways supply client JWT claims via transaction-local GUCs:
- Legacy format: `request.jwt.claim.role`
- Modern format: `request.jwt.claims ->> 'role'`
- PostgREST session role fallback: `current_setting('role', true)`

The function [`public.get_jwt_role()`](file:///d:/projects/Readers%20of%20Aurangabad/readers-of-aurangabad/supabase/migrations/202611080001_admin_portal.sql#L230) inspects both formats and handles malformed JSON claims by returning `'untrusted_client'`. A `NULL` return value indicates an interactive database superuser session (`postgres`), strictly separating client API requests from database administration.

### 3.2 Tamper-Proof Profile Trigger (`protect_profile_roles`)
The `protect_profile_roles` trigger enforces:
1. **Identifier Immutability:** `old.id IS DISTINCT FROM new.id` raises SQLSTATE `42501`.
2. **Staff Privilege Protection:** `old.role IS DISTINCT FROM new.role` or `old.designation IS DISTINCT FROM new.designation` is rejected with SQLSTATE `42501` unless `public.is_admin()` evaluates to `TRUE`.
3. **Direct Email Tampering Blocked:** Profile email changes through the client API are rejected. Email synchronization is permitted **only** via Supabase Auth's email verification pipeline (`pg_trigger_depth() > 1`).

---

## 4. Concurrency & Public Abuse Defenses

### 4.1 Concurrency-Safe Meetup Capacity Enforcement
`guard_registration_insert` locks the target meetup row (`FOR UPDATE`) in an isolated transaction before calculating registration count against capacity. This completely eliminates race conditions where multiple requests could exceed the seat limit.

### 4.2 Sanitization & Injection Prevention
- All user-provided text inputs are trimmed (`trim(new.name)`, `lower(trim(new.email))`).
- Format constraints reject malformed emails, invalid phone numbers, or negative numbers.
- Unprivileged visitors cannot set `status` (forced to `'new'`), `created_at` (forced to `now()`), or inject administrative metadata into `details` (forced to `'{}'::jsonb`).

---

## 5. Storage Security & Object Protection

1. **Private Video Bucket (`roa-reels`):**
   Videos in `roa-reels` cannot be accessed via public CDN URLs. Access is mediated by PostgreSQL storage policies requiring exact path equality against published reels in `public.reels`.
2. **Strict MIME & Size Enforcement:**
   - Videos: Maximum 500 MB; restricted to `video/mp4`, `video/webm`, `video/quicktime`.
   - Photos: Maximum 20 MB; restricted to `image/webp`, `image/jpeg`, `image/png`.
   - Overwrite protection: Unique storage path naming prevents accidental collision.
