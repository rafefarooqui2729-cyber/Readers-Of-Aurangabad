# Supabase Setup & Architecture Guide
## Readers of Aurangabad — Administrative Portal & Database
**Revision:** 3.3 (Runtime-Test Assertions, Explicit SQLSTATE Auditing & pgTAP Framework)

### 1. Authorized Team Accounts & Roles

The system designates two distinct authorized administrative tiers:

| Account | Email | Designation | System Role | Permissions Summary |
| :--- | :--- | :--- | :--- | :--- |
| **Founder** | `imadwahedfarooqui@gmail.com` | `Founder` | `admin` | Full administrative access: content, attendee registrations (PII), contact enquiries (PII), user/role management, and storage. |
| **Community Lead** | `aribahmad673@gmail.com` | `Community Lead` | `editor` | Content management: meetups, reels, gallery, announcements, articles. **Strictly denied access to attendee registrations, enquiries, or role assignment.** |

---

### 2. Administrator Provisioning Guide (Zero Password Exposure)

Public registration will **never** grant an administrative or editor role. In accordance with zero-trust security standards:

#### Step 1: Set Supabase Auth to Invite-Only
1. In the Supabase Dashboard (`rtjulebzjiwbnizqwxjn`), navigate to **Authentication > Providers > Email**.
2. Set **Enable Signups** to **OFF** (Invite-only mode).
   *Reason:* Prevents arbitrary visitors from creating accounts on the project.

#### Step 2: Apply the Schema Migration
1. Open the **SQL Editor** in the Supabase Dashboard.
2. Paste and run `supabase/migrations/202611080001_admin_portal.sql`.
3. Confirm that all 8 tables, 3 storage buckets, functions, and 40 security policies compile cleanly.

#### Step 3: Invite Team Members (Private Password Setup)
1. Go to **Authentication > Users**.
2. Click **Invite user**:
   - Invite 1: `imadwahedfarooqui@gmail.com`
   - Invite 2: `aribahmad673@gmail.com`
3. Supabase Auth emails an official invitation token to each recipient.
4. Each person clicks their private link and establishes their own password privately.
   *(No passwords exist in SQL, source code, or configuration files).*

#### Step 4: Server-Side Role & Designation Assignment (Atomic)
1. In the Supabase **SQL Editor**, open and run:
   `supabase/provision_authorized_accounts.sql`
2. This script executes under the trusted `postgres` superuser context as an all-or-nothing transaction. If either account is missing, it rolls back immediately.
3. Successfully assigns:
   - `imadwahedfarooqui@gmail.com` -> `role = 'admin'`, `designation = 'Founder'`.
   - `aribahmad673@gmail.com` -> `role = 'editor'`, `designation = 'Community Lead'`.

#### Step 5: Post-Deployment Behavioral Verification
Choose either option based on your environment:

* **Option A: Supabase Dashboard SQL Editor (Standalone Test Script)**
  1. Open the SQL Editor in Supabase Dashboard.
  2. Run `supabase/tests/verify_security_policies.sql`.
  3. Executes behavioral tests across simulated `anon`, `normal user`, `editor`, and `admin` sessions.
  4. Explicitly asserts SQLSTATE `42501` on denied actions (closed meetup registration, unauthorized role mutation, PII access).
  5. Terminates with `ROLLBACK` so zero mock records persist.

* **Option B: Supabase CLI with pgTAP (`supabase test db`)**
  1. If running with a local Supabase CLI installation and Docker:
     `supabase test db`
  2. Executes `supabase/tests/database/00001_security_policies.test.sql` containing 35 planned pgTAP assertions.

---

### 3. Database Schema Overview

| Table | Primary Key | Access Summary | PII Protection |
| :--- | :--- | :--- | :--- |
| `public.profiles` | `id` (references `auth.users`) | Users read own profile; Admins read all and manage roles. Protected by `protect_profile_roles()` trigger. | Protected |
| `public.meetups` | `id` (uuid) | Public reads published; Staff (admins + editors) manage. | Non-PII |
| `public.registrations` | `id` (uuid) | Public inserts on open meetups; **Admin-only** reads and management. Community Lead (`editor`) is strictly denied. | **Strict PII** |
| `public.gallery_images` | `id` (uuid) | Public reads published; Staff (admins + editors) manage. | Non-PII |
| `public.reels` | `id` (uuid) | Public reads published; Staff (admins + editors) manage. | Non-PII |
| `public.announcements`| `id` (uuid) | Public reads published within date window; Staff manage. | Non-PII |
| `public.articles` | `id` (uuid) | Public reads published; Staff (admins + editors) manage. | Non-PII |
| `public.enquiries` | `id` (uuid) | Public inserts contact requests; **Admin-only** reads and management. Community Lead (`editor`) is strictly denied. | **Strict PII** |

---

### 4. Storage Architecture & Reel Delivery

The migration configures 3 distinct buckets in `storage.buckets`:

1. **`roa-gallery` (Public, 20MB limit):** Original community photographs. Direct CDN delivery (`/storage/v1/object/public/roa-gallery/...`). Upload and modification restricted to Staff.
2. **`roa-thumbnails` (Public, 10MB limit):** Optimized thumbnails. Direct CDN delivery. Upload and modification restricted to Staff.
3. **`roa-reels` (Private, 500MB limit):** High-definition community video reels (`mp4`, `webm`, `quicktime`).
   - Private bucket prevents unauthorized mass scraping or hotlinking of draft media.
   - Storage RLS policy `Public read published reel objects` selectively permits public streaming of media matching published records in `public.reels` using **exact path matching**.
   - Supports HTML5 video Range requests (`HTTP 206 Partial Content`) for fluid playback and timeline scrubbing.
   - Unpublished video assets remain strictly invisible to anonymous visitors.

---

### 5. Manual Setup & Pre-Flight Checklist

Before deploying the database schema:
- [ ] Confirm project ID in Supabase dashboard matches `rtjulebzjiwbnizqwxjn`.
- [ ] Ensure **Enable Signups** is disabled in Authentication settings.
- [ ] Review `supabase/migrations/202611080001_admin_portal.sql` against project policies.
- [ ] Review `supabase/provision_authorized_accounts.sql` for server-side role assignment.
- [ ] Review `supabase/tests/verify_security_policies.sql` for post-deployment verification.
- [ ] Review `supabase/tests/database/00001_security_policies.test.sql` for pgTAP test coverage.
- [ ] Review rollback instructions in `supabase/migrations/202611080001_admin_portal_rollback.sql`.
- [ ] Verify that no service-role secrets exist in `.env` or client code.
- [ ] Execute migration script only after obtaining explicit user confirmation.
