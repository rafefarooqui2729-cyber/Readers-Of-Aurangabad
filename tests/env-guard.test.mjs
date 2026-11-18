import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const guardUrl = pathToFileURL(path.join(root, 'src', 'lib', 'envGuard.ts')).href;
const supabaseUrl = pathToFileURL(path.join(root, 'src', 'lib', 'supabase.ts')).href;

const guard = await import(guardUrl);
const supabaseModule = await import(supabaseUrl);

const STAGING_URL = 'https://dszihsmsbhthuezzpafq.supabase.co';
const PRODUCTION_URL = 'https://rtjulebzjiwbnizqwxjn.supabase.co';
const KEY = 'test-publishable-key';

test('parseSupabaseProjectRef resolves hosted refs and ignores local or unknown hosts', () => {
  assert.equal(guard.parseSupabaseProjectRef(STAGING_URL), guard.STAGING_SUPABASE_PROJECT_REF);
  assert.equal(guard.parseSupabaseProjectRef(PRODUCTION_URL), guard.PRODUCTION_SUPABASE_PROJECT_REF);
  assert.equal(guard.parseSupabaseProjectRef('http://127.0.0.1:54321'), null);
  assert.equal(guard.parseSupabaseProjectRef('http://localhost:54321'), null);
  assert.equal(guard.isLocalSupabaseUrl('http://localhost:54321'), true);
  assert.equal(guard.isLocalSupabaseUrl('http://127.0.0.1:54321'), true);
  assert.equal(guard.isLocalSupabaseUrl('https://example.com'), false);
  assert.equal(guard.parseSupabaseProjectRef('https://example.supabase.co'), null);
  assert.equal(guard.parseSupabaseProjectRef('not-a-url'), null);
  assert.equal(guard.parseSupabaseProjectRef(''), null);
  assert.equal(guard.parseSupabaseProjectRef(undefined), null);
});

test('guard fails closed when configuration is missing or malformed', () => {
  assert.equal(guard.checkSupabaseEnv({ url: '', key: KEY, mode: 'development', command: 'serve' }).reason, 'missing-url');
  assert.equal(guard.checkSupabaseEnv({ url: 'not-a-url', key: KEY, mode: 'development', command: 'serve' }).reason, 'malformed-url');
  assert.equal(guard.checkSupabaseEnv({ url: STAGING_URL, key: '', mode: 'development', command: 'serve' }).reason, 'missing-key');
});

test('guard rejects the production project for every local command or mode', () => {
  assert.equal(
    guard.checkSupabaseEnv({ url: PRODUCTION_URL, key: KEY, mode: 'development', command: 'serve' }).reason,
    'production-project-ref'
  );
  assert.equal(
    guard.checkSupabaseEnv({ url: PRODUCTION_URL, key: KEY, mode: 'staging', command: 'serve' }).reason,
    'production-project-ref'
  );
  assert.equal(
    guard.checkSupabaseEnv({ url: PRODUCTION_URL, key: KEY, mode: 'production', command: 'serve' }).reason,
    'production-project-ref'
  );
});

test('staging mode only accepts the staging project ref', () => {
  assert.equal(guard.checkSupabaseEnv({ url: STAGING_URL, key: KEY, mode: 'staging', command: 'serve' }).ok, true);
  assert.equal(
    guard.checkSupabaseEnv({ url: 'https://abcdefghijklmnopqrst.supabase.co', key: KEY, mode: 'staging', command: 'serve' }).reason,
    'staging-mode-wrong-project'
  );
  assert.equal(
    guard.checkSupabaseEnv({ url: 'https://example.supabase.co', key: KEY, mode: 'staging', command: 'serve' }).reason,
    'staging-mode-unrecognized-project'
  );
});

test('ordinary development only accepts staging or a local Supabase stack', () => {
  assert.equal(guard.checkSupabaseEnv({ url: STAGING_URL, key: KEY, mode: 'development', command: 'serve' }).ok, true);
  assert.equal(guard.checkSupabaseEnv({ url: 'http://127.0.0.1:54321', key: KEY, mode: 'development', command: 'serve' }).ok, true);
  assert.equal(
    guard.checkSupabaseEnv({ url: 'https://abcdefghijklmnopqrst.supabase.co', key: KEY, mode: 'development', command: 'serve' }).reason,
    'non-staging-hosted-project'
  );
  assert.equal(
    guard.checkSupabaseEnv({ url: 'https://example.com', key: KEY, mode: 'development', command: 'serve' }).reason,
    'non-staging-hosted-project'
  );
  assert.equal(
    guard.checkSupabaseEnv({ url: 'https://example.supabase.co', key: KEY, mode: 'development', command: 'serve' }).reason,
    'non-staging-hosted-project'
  );
});

test('production builds keep their intended deployment configuration', () => {
  assert.equal(guard.checkSupabaseEnv({ url: PRODUCTION_URL, key: KEY, mode: 'production', command: 'build' }).ok, true);
});

test('guard error text never contains the URL or key', () => {
  const message = guard.describeEnvGuardFailure('production-project-ref', 'development');
  assert.match(message, /Refusing to start/);
  assert.ok(!message.includes(PRODUCTION_URL));
  assert.ok(!message.includes(KEY));
});

test('runtime client refuses production credentials during development', () => {
  const blocked = supabaseModule.resolveSupabaseConfig({
    VITE_SUPABASE_URL: PRODUCTION_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: KEY,
    DEV: 'true',
  });
  assert.deepEqual(blocked, {
    url: 'https://example.supabase.co',
    key: 'public-anon-key',
    isConfigured: false,
  });

  const staging = supabaseModule.resolveSupabaseConfig({
    VITE_SUPABASE_URL: STAGING_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: KEY,
    DEV: 'true',
  });
  assert.equal(staging.isConfigured, true);
  assert.equal(staging.url, STAGING_URL);

  const legacyAnonKey = supabaseModule.resolveSupabaseConfig({
    VITE_SUPABASE_URL: STAGING_URL,
    VITE_SUPABASE_ANON_KEY: KEY,
    DEV: 'true',
  });
  assert.equal(legacyAnonKey.isConfigured, true);
  assert.equal(legacyAnonKey.key, KEY);

  const unknownRemote = supabaseModule.resolveSupabaseConfig({
    VITE_SUPABASE_URL: 'https://example.com',
    VITE_SUPABASE_PUBLISHABLE_KEY: KEY,
    DEV: 'true',
  });
  assert.equal(unknownRemote.isConfigured, false);

  const unknownSupabase = supabaseModule.resolveSupabaseConfig({
    VITE_SUPABASE_URL: 'https://abcdefghijklmnopqrst.supabase.co',
    VITE_SUPABASE_PUBLISHABLE_KEY: KEY,
    DEV: 'true',
  });
  assert.equal(unknownSupabase.isConfigured, false);

  const localRuntime = supabaseModule.resolveSupabaseConfig({
    VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
    VITE_SUPABASE_PUBLISHABLE_KEY: KEY,
    DEV: 'true',
  });
  assert.equal(localRuntime.isConfigured, true);

  const stagingModeWrongProject = supabaseModule.resolveSupabaseConfig({
    VITE_SUPABASE_URL: 'https://example.com',
    VITE_SUPABASE_PUBLISHABLE_KEY: KEY,
    MODE: 'staging',
    DEV: 'true',
  });
  assert.equal(stagingModeWrongProject.isConfigured, false);

  const productionRuntime = supabaseModule.resolveSupabaseConfig({
    VITE_SUPABASE_URL: PRODUCTION_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: KEY,
    DEV: 'false',
  });
  assert.equal(productionRuntime.isConfigured, true);
});

test('project scripts and Vite config enforce the guard', () => {
  const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts['dev:staging'], 'vite --mode staging');

  const viteConfig = readFileSync(path.join(root, 'vite.config.ts'), 'utf8');
  assert.match(viteConfig, /checkSupabaseEnv/);
  assert.match(viteConfig, /describeEnvGuardFailure/);
  assert.match(viteConfig, /port:\s*5173/);
});
