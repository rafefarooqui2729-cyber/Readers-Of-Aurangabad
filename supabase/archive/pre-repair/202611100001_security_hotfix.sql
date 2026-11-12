-- =============================================================================
-- READERS OF AURANGABAD — SECURITY HOTFIX / CORRECTIVE MIGRATION
-- Migration: 202611100001_security_hotfix.sql
-- Date: 2026-11-10
-- Purpose: Correct legacy schema drift and enforce fail-closed profile update rules
--          without rewriting historical migration history.
-- =============================================================================

begin;

-- Ensure legacy deployments have the required meetup slug column.
alter table public.meetups add column if not exists slug text;

-- Normalize invalid or missing slugs deterministically without deleting data.
with source_rows as (
  select
    id,
    title,
    lower(regexp_replace(trim(coalesce(nullif(slug, ''), title)), '[^a-z0-9]+', '-', 'g')) as base_slug,
    row_number() over (
      partition by lower(regexp_replace(trim(coalesce(nullif(slug, ''), title)), '[^a-z0-9]+', '-', 'g'))
      order by id
    ) as seq_num
  from public.meetups
  where slug is null
     or trim(slug) = ''
     or slug !~* '^[a-z0-9]+(?:-[a-z0-9]+)*$'
),
normalized as (
  select
    id,
    case
      when base_slug = '' then 'meetup-' || left(id::text, 8)
      when seq_num = 1 then base_slug
      else base_slug || '-' || left(id::text, 8)
    end as resolved_slug
  from source_rows
)
update public.meetups m
set slug = n.resolved_slug
from normalized n
where m.id = n.id;

-- Disambiguate any remaining duplicates on the same slug deterministically.
with ranked as (
  select
    id,
    slug,
    row_number() over (partition by slug order by id) as seq_num
  from public.meetups
  where slug is not null
)
update public.meetups m
set slug = m.slug || '-' || left(m.id::text, 8)
from ranked r
where m.id = r.id
  and r.seq_num > 1
  and m.slug = r.slug;

-- Ensure every row has a valid slug before enforcing the constraint.
do $$
begin
  if exists (
    select 1
    from public.meetups
    where slug is null
       or trim(slug) = ''
       or slug !~* '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ) then
    raise exception 'Slug repair failed: invalid or empty meetup slug values remain after normalization.';
  end if;
end $$;

-- Enforce the constraint only after all data is valid and unique.
alter table public.meetups alter column slug set not null;
create unique index if not exists meetups_slug_idx on public.meetups (slug);

-- Rebuild the profile protection function to enforce strict admin-only mutation rules.
create or replace function public.protect_profile_roles()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_jwt_role text := public.get_jwt_role();
  v_caller uuid := auth.uid();
  v_is_direct_admin_session boolean;
begin
  if old.id is distinct from new.id then
    raise exception 'Tamper protection: Profile ID is immutable.' using errcode = '42501';
  end if;

  if (old.role is distinct from new.role or old.designation is distinct from new.designation or old.email is distinct from new.email) then
    if v_jwt_role is not null then
      if v_jwt_role = 'anon' or v_jwt_role = 'untrusted_client' or v_caller is null then
        raise exception 'Privilege escalation rejected: Anonymous or untrusted clients cannot modify privileged profile fields.' using errcode = '42501';
      end if;

      if not public.is_admin() then
        raise exception 'Privilege escalation rejected: Only administrators can modify roles or designations.' using errcode = '42501';
      end if;

      if old.email is distinct from new.email then
        raise exception 'Tamper protection: Email must be updated through Supabase Auth verification.' using errcode = '42501';
      end if;
    else
      v_is_direct_admin_session := session_user in ('postgres', 'supabase_admin');

      if not v_is_direct_admin_session then
        raise exception 'Privilege escalation rejected: Privileged fields cannot be modified in an unverified database session.' using errcode = '42501';
      end if;
    end if;
  end if;

  new.created_at = old.created_at;
  new.updated_at = now();

  return new;
end;
$$;

revoke execute on function public.protect_profile_roles() from public, anon, authenticated;

commit;
