import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const schemaPath = path.join(projectRoot, 'supabase', 'migrations', '202611090001_readers_of_aurangabad_production_schema.sql');
const provisionPath = path.join(projectRoot, 'supabase', 'provision_authorized_accounts.sql');
const configTomlPath = path.join(projectRoot, 'supabase', 'config.toml');
const galleryStoragePath = path.join(projectRoot, 'src', 'utils', 'galleryStorage.ts');
const reelStoragePath = path.join(projectRoot, 'src', 'utils', 'reelStorage.ts');

const schemaSql = fs.readFileSync(schemaPath, 'utf8');
const provisionSql = fs.readFileSync(provisionPath, 'utf8');
const configToml = fs.readFileSync(configTomlPath, 'utf8');
const galleryStorageCode = fs.readFileSync(galleryStoragePath, 'utf8');
const reelStorageCode = fs.readFileSync(reelStoragePath, 'utf8');

// =============================================================================
// F-01: BUCKET PRIVACY & STORAGE POLICY TESTS
// =============================================================================

test('F-01: roa-reels, roa-gallery, and roa-thumbnails are all configured as private buckets', () => {
  // Regex extracting each bucket declaration block from insert into storage.buckets
  const bucketInsertRegex = /insert\s+into\s+storage\.buckets\s*\([^)]+\)\s*values\s*([\s\S]+?)\s*on\s+conflict/i;
  const match = schemaSql.match(bucketInsertRegex);
  assert.ok(match, 'storage.buckets INSERT statement must exist in schema');

  const valuesBlock = match[1];

  // Inspect roa-reels bucket
  const reelsMatch = valuesBlock.match(/'roa-reels'[\s\S]*?'roa-reels'[\s\S]*?(false|true)/i);
  assert.ok(reelsMatch, 'roa-reels bucket configuration must exist');
  assert.equal(reelsMatch[1].toLowerCase(), 'false', 'roa-reels bucket must be private (public = false)');

  // Inspect roa-gallery bucket
  const galleryMatch = valuesBlock.match(/'roa-gallery'[\s\S]*?'roa-gallery'[\s\S]*?(false|true)/i);
  assert.ok(galleryMatch, 'roa-gallery bucket configuration must exist');
  assert.equal(galleryMatch[1].toLowerCase(), 'false', 'roa-gallery bucket must be private (public = false)');

  // Inspect roa-thumbnails bucket
  const thumbnailsMatch = valuesBlock.match(/'roa-thumbnails'[\s\S]*?'roa-thumbnails'[\s\S]*?(false|true)/i);
  assert.ok(thumbnailsMatch, 'roa-thumbnails bucket configuration must exist');
  assert.equal(thumbnailsMatch[1].toLowerCase(), 'false', 'roa-thumbnails bucket must be private (public = false)');

  // Ensure no bucket in the migration is configured with public = true
  const anyPublicMatch = valuesBlock.match(/'roa-(?:gallery|thumbnails|reels)'[\s\S]*?true/i);
  assert.equal(anyPublicMatch, null, 'No roa storage bucket may have public = true');
});

test('F-01: no unrestricted anonymous Storage SELECT policy exists in schema', () => {
  // Catch wide-open patterns like:
  // using (bucket_id in ('roa-gallery', 'roa-thumbnails')) without published checks
  const wideOpenRegex = /create\s+policy\s+"[^"]+"\s+on\s+storage\.objects\s+for\s+select\s+to\s+[^;]*?using\s*\(\s*bucket_id\s+in\s*\([^)]+\)\s*\)\s*;/gi;
  const wideOpenMatches = schemaSql.match(wideOpenRegex);
  assert.equal(wideOpenMatches, null, 'Zero unrestricted anonymous Storage SELECT policies may exist');

  // Verify the legacy flawed policy name does NOT exist
  assert.ok(
    !schemaSql.includes('Public gallery thumbnails select'),
    'Legacy open policy "Public gallery thumbnails select" must not exist in schema'
  );
});

test('F-01: Public read published reel objects policy requires published-row check and reels/ prefix', () => {
  const policyRegex = /create\s+policy\s+"Public read published reel objects"[\s\S]+?on\s+storage\.objects\s+for\s+select\s+to\s+anon,\s*authenticated[\s\S]+?using\s*\(([\s\S]+?)\);/i;
  const match = schemaSql.match(policyRegex);
  assert.ok(match, 'Policy "Public read published reel objects" must exist for select to anon, authenticated');

  const usingClause = match[1];

  // Must enforce roa-reels bucket
  assert.match(usingClause, /bucket_id\s*=\s*'roa-reels'/, 'Reel policy must restrict to roa-reels bucket');

  // Must enforce name prefix regex ^reels/
  assert.match(usingClause, /name\s*~\s*'\^reels\/'/, 'Reel policy must enforce name ~ ^reels/ prefix guard');

  // Must check public.reels published status
  assert.match(usingClause, /reels\.is_published\s*=\s*true/, 'Reel policy must require reels.is_published = true');

  // Must match against stored video_path or poster_path
  assert.match(usingClause, /reels\.video_path\s*=\s*storage\.objects\.name/, 'Reel policy must match video_path');
  assert.match(usingClause, /reels\.poster_path\s*=\s*storage\.objects\.name/, 'Reel policy must match poster_path');
});

test('F-01: Public read published gallery objects policy requires published-row check for images and thumbnails', () => {
  const policyRegex = /create\s+policy\s+"Public read published gallery objects"[\s\S]+?on\s+storage\.objects\s+for\s+select\s+to\s+anon,\s*authenticated[\s\S]+?using\s*\(([\s\S]+?)\);/i;
  const match = schemaSql.match(policyRegex);
  assert.ok(match, 'Policy "Public read published gallery objects" must exist for select to anon, authenticated');

  const usingClause = match[1];

  // Must check roa-gallery bucket with published check
  assert.match(usingClause, /bucket_id\s*=\s*'roa-gallery'/);
  assert.match(usingClause, /gi\.image_path\s*=\s*storage\.objects\.name/);
  assert.match(usingClause, /gi\.is_published\s*=\s*true/);

  // Must check roa-thumbnails bucket with published check
  assert.match(usingClause, /bucket_id\s*=\s*'roa-thumbnails'/);
  assert.match(usingClause, /gi\.thumbnail_path\s*=\s*storage\.objects\.name/);
});

test('F-01: Storage upload paths in galleryStorage.ts and reelStorage.ts match policy expectations', () => {
  // galleryStorage: upload pattern must be <uuid>/<filename>.<ext>
  assert.match(galleryStorageCode, /STORAGE_PATH_PATTERN\s*=\s*\/[\s\S]+?\//, 'galleryStorage must define STORAGE_PATH_PATTERN');
  assert.match(galleryStorageCode, /imagePath\s*=\s*`\$\{userId\}\/\$\{timestamp\}_\$\{uniqueId\}\.\$\{ext\}`/);
  assert.match(galleryStorageCode, /thumbnailPath\s*=\s*`\$\{userId\}\/\$\{timestamp\}_\$\{uniqueId\}\.webp`/);

  // reelStorage: upload path must start with reels/
  assert.match(reelStorageCode, /storagePath\s*=\s*`reels\/reel-\$\{randomSuffix\}\.\$\{validation\.canonicalExtension\}`/);
  assert.match(reelStorageCode, /REELS_STORAGE_BUCKET\s*=\s*'roa-reels'/);
});

test('F-01: Every CREATE POLICY in schema has an idempotent DROP POLICY IF EXISTS', () => {
  const createPolicyRegex = /create\s+policy\s+"([^"]+)"\s+on\s+([^\s]+)/gi;
  let match;
  const policies = [];
  while ((match = createPolicyRegex.exec(schemaSql)) !== null) {
    policies.push({ name: match[1], table: match[2] });
  }

  assert.ok(policies.length >= 35, `Expected at least 35 policies, found ${policies.length}`);

  for (const p of policies) {
    const dropPattern = new RegExp(`drop\\s+policy\\s+if\\s+exists\\s+"${p.name}"\\s+on\\s+${p.table}`, 'i');
    assert.ok(dropPattern.test(schemaSql), `Policy "${p.name}" on ${p.table} must have matching DROP POLICY IF EXISTS`);
  }
});

// =============================================================================
// F-03: PRIVILEGED PROVISIONING & AUTH CONFIGURATION TESTS
// =============================================================================

test('F-03: provision_authorized_accounts.sql fails closed if operator UUIDs are not configured', () => {
  assert.match(provisionSql, /v_founder_auth_uuid\s+uuid\s*:=\s*null;/, 'Founder UUID must default to null in template');
  assert.match(provisionSql, /v_lead_auth_uuid\s+uuid\s*:=\s*null;/, 'Community Lead UUID must default to null in template');

  // Must contain fail-closed check
  assert.match(
    provisionSql,
    /if\s+v_founder_auth_uuid\s+is\s+null\s+or\s+v_lead_auth_uuid\s+is\s+null\s+then[\s\S]+?raise\s+exception\s+'FAIL-CLOSED/i,
    'Must fail closed when operator UUIDs are null'
  );
});

test('F-03: provision_authorized_accounts.sql validates accounts by UUID and enforces two-factor identity proof', () => {
  // Query auth.users by UUID, not email-only
  assert.match(provisionSql, /from\s+auth\.users\s+u\s+where\s+u\.id\s*=\s*v_founder_auth_uuid/i);
  assert.match(provisionSql, /from\s+auth\.users\s+u\s+where\s+u\.id\s*=\s*v_lead_auth_uuid/i);

  // Email mismatch check against approved operator email
  assert.match(provisionSql, /lower\(trim\(v_founder_auth_record\.email\)\)\s+is\s+distinct\s+from\s+lower\(trim\(v_founder_expected_email\)\)/i);
  assert.match(provisionSql, /lower\(trim\(v_lead_auth_record\.email\)\)\s+is\s+distinct\s+from\s+lower\(trim\(v_lead_expected_email\)\)/i);

  // Email confirmation or invitation status check
  assert.match(provisionSql, /v_founder_auth_record\.email_confirmed_at\s+is\s+null/i);
  assert.match(provisionSql, /v_founder_auth_record\.confirmed_at\s+is\s+null/i);
  assert.match(provisionSql, /v_founder_auth_record\.invited_at\s+is\s+null/i);

  // Account suspension check
  assert.match(provisionSql, /v_founder_auth_record\.banned_until\s+is\s+not\s+null/i);
});

test('F-03: supabase/config.toml enforces invite-only signup, email confirmations, and hardened password policy', () => {
  // Public signup disabled (invite-only)
  assert.match(configToml, /enable_signup\s*=\s*false/, 'enable_signup must be false in config.toml');

  // Minimum password length >= 8
  const pwLenMatch = configToml.match(/minimum_password_length\s*=\s*(\d+)/);
  assert.ok(pwLenMatch, 'minimum_password_length must be configured');
  assert.ok(parseInt(pwLenMatch[1], 10) >= 8, 'minimum_password_length must be at least 8');

  // Email confirmations enabled
  assert.match(configToml, /enable_confirmations\s*=\s*true/, 'enable_confirmations must be true in config.toml');

  // Secure password change enabled
  assert.match(configToml, /secure_password_change\s*=\s*true/, 'secure_password_change must be true in config.toml');
});
