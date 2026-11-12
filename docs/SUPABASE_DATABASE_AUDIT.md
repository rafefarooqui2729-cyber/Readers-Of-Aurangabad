# READERS OF AURANGABAD — COMPREHENSIVE SUPABASE DATABASE AUDIT
**Document Reference:** `docs/SUPABASE_DATABASE_AUDIT.md`
**Date:** November 9, 2026
**Auditor:** Principal Software Architect & PostgreSQL Security Engineer
**Project Reference:** `rtjulebzjiwbnizqwxjn`
**Status:** COMPLETE — DATABASE EMPTY; RECOVERY MIGRATION REQUIRED

---

## 1. Executive Summary

A comprehensive architectural and security audit of the **Readers of Aurangabad** codebase and live Supabase database environment (`rtjulebzjiwbnizqwxjn`) was executed.

### Critical Discovery:
Direct HTTP REST and Storage API probes against `https://rtjulebzjiwbnizqwxjn.supabase.co` revealed that:
1. **Zero application tables exist in the live database.** All 8 expected tables (`public.profiles`, `public.meetups`, `public.registrations`, `public.gallery_images`, `public.reels`, `public.announcements`, `public.articles`, `public.enquiries`) returned HTTP `404 Not Found` with PostgREST error code `PGRST205: "Could not find the table in the schema cache"`.
2. **Zero custom storage buckets exist.** Requests to `roa-reels`, `roa-gallery`, and `roa-thumbnails` failed with `400 Bad Request`.
3. **The `supabase_migrations` schema is absent.** Neither previous Revision 3.3 (`202611080001_admin_portal.sql`) nor incremental Revision 4.0 (`202611090001_revision_4_0_hardening.sql`) was ever successfully executed against the database.
4. **Public signups are currently OPEN.** The Supabase Auth settings endpoint confirmed `disable_signup: false`. In a production administrative system, public self-registration must be disabled (invite-only) to prevent arbitrary users from attempting privilege escalation.

---

## 2. Live Database Inventory & Discovery Results

Every candidate table and storage resource was tested using authenticated probes with the project publishable key:

| Object / Endpoint | Target Resource | Live HTTP Status | Live Response Payload | Analysis & Verdict |
| :--- | :--- | :--- | :--- | :--- |
| `/rest/v1/profiles` | `public.profiles` | `404 Not Found` | `{"code":"PGRST205","message":"Could not find the table 'public.profiles' in the schema cache"}` | **MISSING** — Table never created |
| `/rest/v1/meetups` | `public.meetups` | `404 Not Found` | `{"code":"PGRST205","message":"Could not find the table 'public.meetups' in the schema cache"}` | **MISSING** — Table never created |
| `/rest/v1/registrations` | `public.registrations` | `404 Not Found` | `{"code":"PGRST205","message":"Could not find the table 'public.registrations' in the schema cache"}` | **MISSING** — Table never created |
| `/rest/v1/gallery_images` | `public.gallery_images` | `404 Not Found` | `{"code":"PGRST205","message":"Could not find the table 'public.gallery_images' in the schema cache"}` | **MISSING** — Table never created |
| `/rest/v1/reels` | `public.reels` | `404 Not Found` | `{"code":"PGRST205","message":"Could not find the table 'public.reels' in the schema cache"}` | **MISSING** — Table never created |
| `/rest/v1/announcements` | `public.announcements` | `404 Not Found` | `{"code":"PGRST205","message":"Could not find the table 'public.announcements' in the schema cache"}` | **MISSING** — Table never created |
| `/rest/v1/articles` | `public.articles` | `404 Not Found` | `{"code":"PGRST205","message":"Could not find the table 'public.articles' in the schema cache"}` | **MISSING** — Table never created |
| `/rest/v1/enquiries` | `public.enquiries` | `404 Not Found` | `{"code":"PGRST205","message":"Could not find the table 'public.enquiries' in the schema cache"}` | **MISSING** — Table never created |
| `/storage/v1/bucket/roa-reels` | `roa-reels` bucket | `400 Bad Request` | Bucket not found | **MISSING** — Bucket never created |
| `/storage/v1/bucket/roa-gallery` | `roa-gallery` bucket | `400 Bad Request` | Bucket not found | **MISSING** — Bucket never created |
| `/storage/v1/bucket/roa-thumbnails` | `roa-thumbnails` bucket | `400 Bad Request` | Bucket not found | **MISSING** — Bucket never created |
| `/auth/v1/settings` | Auth Service | `200 OK` | `{"disable_signup":false,"mailer_autoconfirm":false,"external":{"email":true}}` | **ACTIVE** — Signups open; email provider active |

---

## 3. Existing Codebase Audit

### 3.1 Technology Stack
- **Frontend Framework:** React 19.3.1 with Vite 8.3.5, TypeScript 7.0.2.
- **Styling & Design System:** Tailwind CSS v4.3.4 (`@tailwindcss/vite`), custom glassmorphism utilities, Lucide React icons (`lucide-react` 1.68.0), Framer Motion (`framer-motion` 14.9.1).
- **Client SDK:** `@supabase/supabase-js` 2.119.0 configured in [`src/lib/supabase.ts`](file:///d:/projects/Readers%20of%20Aurangabad/readers-of-aurangabad/src/lib/supabase.ts).

### 3.2 Existing Database Dependencies & Frontend State Architecture
- **Authentication Flow:** [`src/context/AppContext.tsx`](file:///d:/projects/Readers%20of%20Aurangabad/readers-of-aurangabad/src/context/AppContext.tsx) listens to `supabase.auth.getSession()` and `supabase.auth.onAuthStateChange()`. It queries `public.profiles` for `role` (`admin` or `editor`).
- **Enquiries Submission:** In `AppContext.tsx` (`addEnquiry`), submissions from `ContactPage.tsx` and `GetInvolvedPage.tsx` attempt to insert directly into `public.enquiries`. Because the table was missing, enquiries silently failed or threw runtime errors.
- **Client-Side Fallbacks:** Because database tables were absent, the application fell back to `localStorage` (`roa_meetups_v4`, `roa_articles_v4`, `roa_stories_v4`, `roa_gallery_v4`, `roa_enquiries_v4`, `roa_reels_v1`) seeded from [`src/data/initialData.ts`](file:///d:/projects/Readers%20of%20Aurangabad/readers-of-aurangabad/src/data/initialData.ts).
- **Admin Dashboard:** [`src/pages/AdminDashboard.tsx`](file:///d:/projects/Readers%20of%20Aurangabad/readers-of-aurangabad/src/pages/AdminDashboard.tsx) allows admins/editors to log in and manage meetups, articles, reels, Instagram items, and enquiries, but operations modified local React state and `localStorage` rather than persisting to Supabase.

---

## 4. Security Vulnerabilities Discovered

### 4.1 Missing Database Tables & Broken Public Submissions
- Public contact forms (`ContactPage`) and volunteer/donation forms (`GetInvolvedPage`) call `supabase.from('enquiries').insert(...)`. Without `public.enquiries`, all submissions fail with HTTP 404.
- Meetup registrations were only pointing to external Google Forms (`registrationUrl`) because the `public.registrations` table was missing.

### 4.2 Migration Fragmentation & Broken Incremental Upgrade
- `supabase/migrations/` contained:
  - `202611080001_admin_portal.sql` (Revision 3.3: initial schema).
  - `202611090001_revision_4_0_hardening.sql` (Revision 4.0: incremental patch).
- **Critical Risk:** Revision 4.0 was structured as an incremental upgrade assuming Revision 3.3 had already created all tables. Executing Revision 4.0 alone fails with `relation "public.profiles" does not exist`. Executing Revision 3.3 alone omits concurrency-safe capacity row locking and advanced email trigger checks.

### 4.3 Supabase Auth Public Signup Active
- The live auth settings confirmed `disable_signup: false`. Any visitor could sign up via Supabase Auth. While RLS prevents self-promotion, open signups allow malicious users to establish authenticated identities on the project.

### 4.4 Unchecked Concurrency in Event Registrations
- In previous drafts, meetup capacity was checked via a simple count query without row-level locking (`SELECT ... FOR UPDATE`). If 10 attendees register simultaneously for the last seat, all 10 could pass the count check, resulting in oversold gatherings.

---

## 5. Required Architectural Corrections

1. **Consolidated Baseline Schema Migration (Revision 5.0):**
   Combine all table declarations, constraints, indexes, enums, triggers, and the latest security hardenings into **one single, idempotent, atomic baseline schema file**.
2. **Concurrency-Safe Meetup Capacity Locking:**
   Enforce transactional row-locking in `guard_registration_insert`:
   ```sql
   SELECT m.is_published, m.registration_status, m.capacity
   FROM public.meetups m
   WHERE m.id = new.meetup_id
   FOR UPDATE;
   ```
3. **Privilege & Function Hardening:**
   - Revoke `CREATE` on schema `public` from `PUBLIC, anon, authenticated`.
   - Revoke all table privileges, then grant minimal required privileges.
   - Revoke `EXECUTE` on all internal and trigger routines.
4. **Storage Bucket Provisioning:**
   Idempotently create `roa-reels` (private), `roa-gallery` (public), and `roa-thumbnails` (public) with strict MIME type and size constraints.
5. **Frontend Database Synchronization:**
   Update `AppContext.tsx` and `AdminDashboard.tsx` to query and mutate Supabase tables directly, with graceful fallbacks to initial data when offline.
6. **Live Step-by-Step Deployment Guide:**
   Provide unambiguous instructions for executing the baseline migration in the Supabase Dashboard SQL Editor, provisioning the Founder and Community Lead accounts, and running verification tests.
