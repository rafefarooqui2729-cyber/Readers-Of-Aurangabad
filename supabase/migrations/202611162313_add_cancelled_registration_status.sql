-- =============================================================================
-- READERS OF AURANGABAD — ADD CANCELLED MEETUP REGISTRATION STATUS
-- Migration: 202611162313_add_cancelled_registration_status.sql
-- Purpose:
--   Extend the native public.registration_status enum so meetups can be
--   explicitly cancelled. This must run after the baseline schema migration
--   and before the member notifications migration.
--
-- Notes:
--   - The new enum value is intentionally not used in this migration.
--     PostgreSQL requires ALTER TYPE ... ADD VALUE to commit before the new
--     label can be referenced by constraints, functions or DML.
--   - IF NOT EXISTS keeps this migration safe if the label was added manually.
-- =============================================================================

ALTER TYPE public.registration_status
ADD VALUE IF NOT EXISTS 'cancelled';
