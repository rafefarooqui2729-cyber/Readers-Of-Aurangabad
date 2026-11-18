import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const appContext = readFileSync(
  path.join(process.cwd(), 'src', 'context', 'AppContext.tsx'),
  'utf8'
);
const notificationSection = appContext.slice(
  appContext.indexOf('// --- MEMBER NOTIFICATIONS & AUTH ---'),
  appContext.indexOf('const markNotificationRead =')
);
const notificationEffect = notificationSection.slice(
  notificationSection.indexOf('useEffect(() => {')
);

test('notification fetch and realtime are gated by configuration and authentication, not staff role', () => {
  assert.match(notificationEffect, /if \(!isSupabaseConfigured \|\| !currentAuthUserId\)/);
  assert.doesNotMatch(notificationEffect, /\bisAdmin\b|\badminRole\b/);
  assert.match(notificationEffect, /void refreshNotifications\(\)/);
  assert.match(notificationEffect, /table: 'notifications'/);
});

test('notification realtime subscription is removed when its effect is cleaned up', () => {
  assert.match(notificationEffect, /supabase\.removeChannel\(channel\)/);
  assert.match(notificationEffect, /notificationChannelRef\.current === channel/);
});

test('admin/editor and member authentication both provide the user ID used by notifications', () => {
  const staffAuth = appContext.slice(
    appContext.indexOf('onAuthenticated: ({ userId, email, role, designation }) => {'),
    appContext.indexOf('onMemberAuthenticated:', appContext.indexOf('onAuthenticated: ({ userId, email, role, designation }) => {'))
  );
  const memberAuth = appContext.slice(
    appContext.indexOf('onMemberAuthenticated: ({ userId, email }) => {'),
    appContext.indexOf('onRoleDowngrade:', appContext.indexOf('onMemberAuthenticated: ({ userId, email }) => {'))
  );

  assert.match(staffAuth, /setCurrentAuthUserId\(userId\)/);
  assert.match(staffAuth, /setIsAdmin\(true\)/);
  assert.match(memberAuth, /setCurrentAuthUserId\(userId\)/);
  assert.match(memberAuth, /setIsAdmin\(false\)/);
  assert.match(memberAuth, /setIsMember\(true\)/);
});
