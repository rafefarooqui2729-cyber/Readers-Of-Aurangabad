import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const filePath = path.join(process.cwd(), 'src', 'lib', 'supabase.ts');
const source = readFileSync(filePath, 'utf8');

test('Supabase bootstrap fails safely when env vars are missing or invalid', () => {
  assert.match(source, /readEnvValue/);
  assert.match(source, /resolveSupabaseConfig/);
  assert.match(source, /isSupabaseConfigured/);
  assert.match(source, /https:\/\/example\.supabase\.co/);
  assert.match(source, /public-anon-key/);
  assert.match(source, /\^https\?:\\\/\\\//i);
  assert.match(source, /createClient\(resolvedUrl, resolvedKey/);
});

test('App context guards protected operations when Supabase is not configured', () => {
  const appContextSource = readFileSync(path.join(process.cwd(), 'src', 'context', 'AppContext.tsx'), 'utf8');
  assert.match(appContextSource, /if \(!isSupabaseConfigured\)/);
  assert.match(appContextSource, /setDbLoading\(false\);\s*setIsDbConnected\(false\);/s);
  assert.match(appContextSource, /Supabase is not configured for this deployment\./);
});

test('resolveSupabaseConfig rejects empty and malformed configuration values', async () => {
  const moduleUrl = pathToFileURL(path.join(process.cwd(), 'src', 'lib', 'supabase.ts')).href;
  const mod = await import(moduleUrl);

  assert.deepEqual(mod.resolveSupabaseConfig({}), {
    url: 'https://example.supabase.co',
    key: 'public-anon-key',
    isConfigured: false,
  });

  assert.deepEqual(mod.resolveSupabaseConfig({ VITE_SUPABASE_URL: '   ', VITE_SUPABASE_PUBLISHABLE_KEY: '   ' }), {
    url: 'https://example.supabase.co',
    key: 'public-anon-key',
    isConfigured: false,
  });

  assert.deepEqual(mod.resolveSupabaseConfig({ VITE_SUPABASE_URL: 'not-a-url', VITE_SUPABASE_PUBLISHABLE_KEY: 'abc' }), {
    url: 'https://example.supabase.co',
    key: 'public-anon-key',
    isConfigured: false,
  });

  assert.deepEqual(mod.resolveSupabaseConfig({ VITE_SUPABASE_URL: 'ftp://example.com', VITE_SUPABASE_PUBLISHABLE_KEY: 'abc' }), {
    url: 'https://example.supabase.co',
    key: 'public-anon-key',
    isConfigured: false,
  });

  assert.deepEqual(mod.resolveSupabaseConfig({ VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'abc123' }), {
    url: 'https://example.supabase.co',
    key: 'abc123',
    isConfigured: true,
  });
});
