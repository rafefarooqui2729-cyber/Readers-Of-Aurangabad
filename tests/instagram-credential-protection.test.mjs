import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const readSource = (relativePath) => readFileSync(path.join(process.cwd(), relativePath), 'utf8');
const contextSource = readSource('src/context/AppContext.tsx');
const librarySource = readSource('src/components/InstagramMediaLibrary.tsx');
const serviceSource = readSource('src/services/instagramService.ts');
const typesSource = readSource('src/types/index.ts');

test('legacy Instagram config is whitelisted and never restores connected state', () => {
  assert.match(contextSource, /sanitizeInstagramConfig\(JSON\.parse\(saved\)\)/);
  assert.match(contextSource, /connected: false,/);
  assert.match(contextSource, /username: typeof candidate\.username === 'string'/);
  assert.match(contextSource, /accountType: accountTypes\.includes/);
  assert.doesNotMatch(typesSource, /accessToken\??:|tokenExpiry\??:/);
});

test('Instagram config updates, persistence, and JSON export pass through sanitizer', () => {
  assert.match(contextSource, /setInstagramConfig\(prev => sanitizeInstagramConfig\(\{ \.\.\.prev, \.\.\.cfg \}\)\)/);
  assert.match(contextSource, /localStorage\.setItem\('roa_ig_config', JSON\.stringify\(sanitizeInstagramConfig\(instagramConfig\)\)\)/);
  assert.match(contextSource, /instagramConfig: sanitizeInstagramConfig\(instagramConfig\)/);
});

test('browser Instagram UI loads bundled samples without accepting credentials', () => {
  assert.match(librarySource, /importInstagramMedia\(SAMPLE_INSTAGRAM_POSTS\)/);
  assert.match(librarySource, /Load Sample Media/);
  assert.match(librarySource, /Live Instagram sync requires a trusted server-side integration/);
  assert.doesNotMatch(librarySource, /accessToken|inputToken|fetchFromInstagramGraphAPI|Connect Meta Token/);
  assert.doesNotMatch(serviceSource, /fetchFromInstagramGraphAPI|graph\.facebook\.com|access_token=/);
});
