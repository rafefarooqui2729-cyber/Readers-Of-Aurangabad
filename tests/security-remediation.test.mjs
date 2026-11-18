import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { encodeCsvCell, generateCsvContent } from '../src/utils/csvUtils.ts';
import {
  clearInFlightLogout,
  evaluateAuthStateChange,
  canApplySensitiveRefresh,
  evaluateProfileResolution,
  shouldPerformSignOut,
  buildBackupExport,
  AuthMutationQueue,
  AuthCoordinator,
} from '../src/utils/authSecurity.ts';

const readSource = (relativePath) => readFileSync(path.join(process.cwd(), relativePath), 'utf8');
const appContextSource = readSource('src/context/AppContext.tsx');
const adminDashboardSource = readSource('src/pages/AdminDashboard.tsx');

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function createMockSupabase(initialUser = null) {
  let currentUser = initialUser;
  const calls = {
    signIn: [],
    signOut: [],
    getSession: [],
    profileQueries: [],
  };

  const client = {
    auth: {
      signInWithPassword: async ({ email, password }) => {
        calls.signIn.push({ email, password });
        if (client._signInHandler) {
          return client._signInHandler({ email, password });
        }
        currentUser = { id: `uid-${email}`, email };
        return { data: { user: currentUser, session: { user: currentUser } }, error: null };
      },
      signOut: async () => {
        calls.signOut.push({});
        if (client._signOutHandler) {
          return client._signOutHandler();
        }
        currentUser = null;
        return { error: null };
      },
      getSession: async () => {
        calls.getSession.push({});
        if (client._getSessionHandler) {
          return client._getSessionHandler();
        }
        return { data: { session: currentUser ? { user: currentUser } : null }, error: null };
      },
    },
    from: (table) => ({
      select: (_cols) => ({
        eq: (col, val) => ({
          maybeSingle: async () => {
            calls.profileQueries.push({ table, col, val });
            if (client._profileHandler) {
              return client._profileHandler({ table, col, val });
            }
            return {
              data: { role: 'admin', designation: 'Staff Administrator', full_name: 'Staff User' },
              error: null,
            };
          },
        }),
      }),
    }),
    _calls: calls,
    _getCurrentUser: () => currentUser,
    _setCurrentUser: (u) => { currentUser = u; },
    _signInHandler: null,
    _signOutHandler: null,
    _getSessionHandler: null,
    _profileHandler: null,
  };

  return client;
}

// ============================================================================
// DATA PROTECTION & EXPORT SECURITY TESTS
// ============================================================================

test('sensitive personal data is not persisted to browser localStorage', () => {
  // Verify useEffect hooks no longer persist enquiries, registrations, or staff profiles
  assert.doesNotMatch(appContextSource, /localStorage\.setItem\('roa_enquiries_v4'/);
  assert.doesNotMatch(appContextSource, /localStorage\.setItem\('roa_registrations_v1'/);
  assert.doesNotMatch(appContextSource, /localStorage\.setItem\('roa_staff_profiles_v1'/);

  // Initial state must be empty arrays to prevent leaking unauthenticated data
  assert.match(appContextSource, /const \[enquiries, setEnquiries\] = useState<Enquiry\[\]>\(\[\]\);/);
  assert.match(appContextSource, /const \[registrations, setRegistrations\] = useState<Registration\[\]>\(\[\]\);/);
  assert.match(appContextSource, /const \[staffProfiles, setStaffProfiles\] = useState<StaffProfile\[\]>\(\[\]\);/);
});

test('valid roa-009 community image paths are not treated as legacy URLs', () => {
  const sanitizerMatch = appContextSource.match(
    /const hasLegacyUrls = \(items: any\): boolean => \{([\s\S]*?)\n  \};/
  );

  assert.ok(sanitizerMatch, 'hasLegacyUrls sanitizer must exist');

  const sanitizerBody = sanitizerMatch[1];

  // Genuine local community imagery must not invalidate cached content.
  assert.doesNotMatch(sanitizerBody, /roa-009/);

  // Existing legacy stock-image checks must remain intact.
  assert.match(sanitizerBody, /str\.includes\('unsplash\.com'\)/);
  assert.match(sanitizerBody, /str\.includes\('photo-15'\)/);
});
test('editor accounts cannot retain or access administrative-only data', () => {
  // refreshData clears them when role is not admin
  assert.match(appContextSource, /setRegistrations\(\[\]\);\s*setEnquiries\(\[\]\);\s*setStaffProfiles\(\[\]\);/);
});

test('localStorage.clear is never called and legacy records are preserved safely', () => {
  // Destructive broad storage clear must never be called
  assert.doesNotMatch(appContextSource, /localStorage\.clear\(\)/);
  // Content keys are reset selectively
  assert.match(appContextSource, /const contentKeysToReset\s*=\s*\[/);
  assert.match(appContextSource, /for\s*\(const key of contentKeysToReset\)\s*\{\s*localStorage\.removeItem\(key\);/);
});

test('backup export enforces admin-only access for personal data and content-only for editors', () => {
  // exportDataJson authorization check inside the function
  assert.match(appContextSource, /if\s*\(!isAdmin\s*\|\|\s*!adminRole\)\s*\{/);
  assert.match(appContextSource, /Access denied: You must be an authenticated administrator or editor to export data\./);

  // Separation between full administrative backup and content backup
  assert.match(appContextSource, /const isFullAdmin\s*=\s*adminRole\s*===\s*'admin';/);
  assert.match(appContextSource, /exportType:\s*isFullAdmin \? 'full_administrative' : 'public_content'/);
  assert.match(appContextSource, /isFullAdmin\s*\?\s*\{\s*\.\.\.baseData,\s*enquiries,\s*registrations,\s*\}\s*:\s*baseData/);
  assert.match(appContextSource, /readers-of-aurangabad-full-backup-/);
  assert.match(appContextSource, /readers-of-aurangabad-content-backup-/);

  // Instagram credential sanitization must be preserved
  assert.match(appContextSource, /instagramConfig:\s*sanitizeInstagramConfig\(instagramConfig\)/);

  // AdminDashboard UI must guard CSV export of registrations
  assert.match(adminDashboardSource, /if\s*\(adminRole\s*!==\s*'admin'\)\s*\{\s*alert\('Access restricted: Only administrators can export attendee registrations\.'\);\s*return;\s*\}/);
});

test('public registration and enquiry forms validate inputs and do not leak records to public memory', () => {
  // Registration validation
  assert.match(appContextSource, /trimmedName\.length\s*<\s*2\s*\|\|\s*trimmedName\.length\s*>\s*100/);
  assert.match(appContextSource, /emailRegex/);
  assert.match(appContextSource, /trimmedPhone\s*&&\s*trimmedPhone\.length\s*>\s*30/);
  assert.match(appContextSource, /trimmedMessage\s*&&\s*trimmedMessage\.length\s*>\s*1000/);

  // Enquiry validation
  assert.match(appContextSource, /trimmedMessage\.length\s*<\s*5\s*\|\|\s*trimmedMessage\.length\s*>\s*2000/);
  assert.match(appContextSource, /validTypes:\s*EnquiryType\[\]\s*=\s*\['volunteer',\s*'book_donation',\s*'collaboration',\s*'contact'\]/);

  // In-memory state only updated if adminRole === 'admin'
  assert.match(appContextSource, /if\s*\(adminRole\s*===\s*'admin'\)\s*\{\s*setRegistrations\(prev => \[\s*\{\s*\.\.\.newReg,\s*id:\s*data\.id\s*\},\s*\.\.\.prev,\s*\]\);\s*\}/);
  assert.match(appContextSource, /if\s*\(adminRole\s*===\s*'admin'\)\s*\{\s*const newEnquiry:\s*Enquiry\s*=/);
});

// ============================================================================
// PRODUCTION LIFECYCLE & CONCURRENCY BEHAVIORAL TESTS (10 REQUIRED SCENARIOS)
// Exercising the exact AuthCoordinator orchestration functions used by AppContext
// ============================================================================

test('production lifecycle 1: Login followed by logout while login is pending (last-intent logout wins, session is cleared)', async () => {
  const coordinator = new AuthCoordinator();
  const mockSupabase = createMockSupabase();
  const loginDeferred = createDeferred();

  let hostState = { loading: false, user: null, reset: false };
  const callbacks = {
    onLoading: (l) => { hostState.loading = l; },
    onResetState: () => { hostState.reset = true; hostState.user = null; },
    onAuthenticated: (u) => { hostState.user = u; },
  };

  // Hold signInWithPassword on deferred promise
  mockSupabase._signInHandler = () => loginDeferred.promise;

  // 1. User initiates login
  const loginPromise = coordinator.login('admin@roa.org', 'pwd', mockSupabase, callbacks);

  // 2. User immediately initiates logout while login is pending
  const logoutPromise = coordinator.logout(mockSupabase, callbacks);

  // 3. Login network request completes
  loginDeferred.resolve({
    data: { user: { id: 'admin-1', email: 'admin@roa.org' } },
    error: null,
  });

  const [loginRes, logoutRes] = await Promise.all([loginPromise, logoutPromise]);

  // Assertions:
  // Login must be recognized as superseded
  assert.equal(loginRes.ok, false);
  assert.match(loginRes.error, /superseded/);

  // Logout must succeed as last intent
  assert.equal(logoutRes.ok, true);

  // Coordinator state must be cleared
  assert.equal(coordinator.getCurrentUserId(), null);
  assert.equal(coordinator.getCurrentRole(), null);
  assert.equal(hostState.user, null, 'Host must remain unauthenticated after last-intent logout');
});

test('production lifecycle 2: Logout followed by login while logout is pending (last-intent login wins, session established)', async () => {
  const coordinator = new AuthCoordinator();
  const mockSupabase = createMockSupabase({ id: 'old-admin', email: 'old@roa.org' });
  const logoutDeferred = createDeferred();

  let hostState = { user: { userId: 'old-admin', role: 'admin' } };
  const callbacks = {
    onResetState: () => { hostState.user = null; },
    onAuthenticated: (u) => { hostState.user = u; },
  };

  // Hold signOut on deferred promise
  mockSupabase._signOutHandler = () => logoutDeferred.promise;

  // 1. Logout initiated
  const logoutPromise = coordinator.logout(mockSupabase, callbacks);

  // 2. Login initiated while logout is pending
  const loginPromise = coordinator.login('new-admin@roa.org', 'pwd', mockSupabase, callbacks);

  // 3. Logout network finishes
  logoutDeferred.resolve({ error: null });

  const [logoutRes, loginRes] = await Promise.all([logoutPromise, loginPromise]);

  // Assertions:
  // Logout is marked superseded by subsequent login
  assert.equal(logoutRes.ok, false);
  assert.match(logoutRes.error, /superseded/);

  // Login wins
  assert.equal(loginRes.ok, true);
  assert.equal(coordinator.getCurrentUserId(), 'uid-new-admin@roa.org');
  assert.equal(coordinator.getCurrentRole(), 'admin');
  assert.equal(hostState.user?.userId, 'uid-new-admin@roa.org');
});

test('production lifecycle 3: Two overlapping login attempts (Login 1 then Login 2; Login 2 wins)', async () => {
  const coordinator = new AuthCoordinator();
  const mockSupabase = createMockSupabase();
  const login1Deferred = createDeferred();
  const login2Deferred = createDeferred();

  let hostState = { user: null };
  const callbacks1 = {
    onAuthenticated: (u) => { hostState.user = u; },
  };
  const callbacks2 = {
    onAuthenticated: (u) => { hostState.user = u; },
  };

  mockSupabase._signInHandler = ({ email }) =>
    email === 'user1@roa.org' ? login1Deferred.promise : login2Deferred.promise;

  // Start Login 1 then Login 2
  const p1 = coordinator.login('user1@roa.org', 'pwd1', mockSupabase, callbacks1);
  const p2 = coordinator.login('user2@roa.org', 'pwd2', mockSupabase, callbacks2);

  // Login 1 finishes
  login1Deferred.resolve({
    data: { user: { id: 'user-1', email: 'user1@roa.org' } },
    error: null,
  });

  // Login 2 finishes
  login2Deferred.resolve({
    data: { user: { id: 'user-2', email: 'user2@roa.org' } },
    error: null,
  });

  // Simulate Supabase establishing Login 2 as the active session.
mockSupabase._setCurrentUser({
  id: 'user-2',
  email: 'user2@roa.org',
});

  const [r1, r2] = await Promise.all([p1, p2]);

  assert.equal(r1.ok, false, 'Login 1 must be marked superseded');
  assert.equal(r2.ok, true, 'Login 2 must succeed');
  assert.equal(coordinator.getCurrentUserId(), 'user-2');
  assert.equal(hostState.user?.userId, 'user-2', 'Host state must belong to Login 2');
});

test('production lifecycle 4: Account A switching to Account B with deferred refresh isolation', async () => {
  const coordinator = new AuthCoordinator();
  const mockSupabase = createMockSupabase();

  let sensitiveData = [];
  let refreshSeq = 1;

  const callbacks = {
    onAccountSwitch: (_prev, _next) => {
      refreshSeq++;
      sensitiveData = []; // State cleared immediately on switch
    },
    onAuthenticated: () => { },
  };

  // User A logs in first
  await coordinator.login('admin-a@roa.org', 'pwd', mockSupabase, callbacks);
  sensitiveData = [{ id: 'reg-a', name: 'User A Data' }];

  // User A starts refresh
  const initiatingUserId = coordinator.getCurrentUserId();
  const currentSeqAtStart = refreshSeq;

  // User B signs in
  mockSupabase._setCurrentUser({ id: 'admin-b', email: 'admin-b@roa.org' });
  await coordinator.login('admin-b@roa.org', 'pwd', mockSupabase, callbacks);

  // Delayed refresh from User A returns
  const canApplyA = canApplySensitiveRefresh({
    refreshSeq: currentSeqAtStart,
    currentRefreshSeq: refreshSeq,
    currentRole: coordinator.getCurrentRole(),
    adminRole: coordinator.getCurrentRole(),
    initiatingUserId,
    currentUserId: coordinator.getCurrentUserId(),
  });

  assert.equal(canApplyA, false, 'User A refresh must be rejected after account switch');
  assert.deepEqual(sensitiveData, [], 'User B must not see User A sensitive data');
  assert.equal(coordinator.getCurrentUserId(), 'uid-admin-b@roa.org');
});

test('production lifecycle 5: Stale profile resolution arriving after logout finishes', async () => {
  const coordinator = new AuthCoordinator();
  const mockSupabase = createMockSupabase({ id: 'user-1', email: 'user1@roa.org' });
  const profileDeferred = createDeferred();

  let hostState = { user: null };
  const callbacks = {
    onAuthenticated: (u) => { hostState.user = u; },
    onResetState: () => { hostState.user = null; },
  };

  mockSupabase._profileHandler = () => profileDeferred.promise;

  // 1. Session resolution begins with delayed profile query
  const resolvePromise = coordinator.resolveSession(
    { user: { id: 'user-1', email: 'user1@roa.org' } },
    undefined,
    mockSupabase,
    callbacks
  );

  // 2. User logs out while profile query is still pending
  await coordinator.logout(mockSupabase, callbacks);

  // 3. Stale profile query resolves late
  profileDeferred.resolve({
    data: { role: 'admin', designation: 'Admin', full_name: 'Admin' },
    error: null,
  });
  await resolvePromise;

  // Stale profile resolution must NOT revive session
  assert.equal(coordinator.getCurrentUserId(), null);
  assert.equal(coordinator.getCurrentRole(), null);
  assert.equal(hostState.user, null, 'Stale profile lookup must not revive session');
});

test('production lifecycle 6: Admin role revoked during active session revalidation', async () => {
  const coordinator = new AuthCoordinator();
  const mockSupabase = createMockSupabase({ id: 'admin-revoked', email: 'revoked@roa.org' });

  let hostState = { resetCalled: false };
  const callbacks = {
    onResetState: () => { hostState.resetCalled = true; },
  };

  // Revalidation returns role: null (revoked)
  mockSupabase._profileHandler = () => Promise.resolve({
    data: { role: null, designation: null, full_name: 'Revoked' },
    error: null,
  });

  await coordinator.resolveSession(
    { user: { id: 'admin-revoked', email: 'revoked@roa.org' } },
    undefined,
    mockSupabase,
    callbacks
  );

  assert.equal(coordinator.getCurrentUserId(), null);
  assert.equal(coordinator.getCurrentRole(), null);
  assert.equal(hostState.resetCalled, true);
  assert.equal(mockSupabase._calls.signOut.length, 1, 'Supabase signOut must be called on confirmed revocation');
});

test('production lifecycle 7: Editor role revoked during active session revalidation', async () => {
  const coordinator = new AuthCoordinator();
  const mockSupabase = createMockSupabase({ id: 'editor-revoked', email: 'editor@roa.org' });

  let hostState = { resetCalled: false };
  const callbacks = {
    onResetState: () => { hostState.resetCalled = true; },
  };

  mockSupabase._profileHandler = () => Promise.resolve({
    data: { role: null, designation: null, full_name: 'Revoked Editor' },
    error: null,
  });

  await coordinator.resolveSession(
    { user: { id: 'editor-revoked', email: 'editor@roa.org' } },
    undefined,
    mockSupabase,
    callbacks
  );

  assert.equal(coordinator.getCurrentUserId(), null);
  assert.equal(coordinator.getCurrentRole(), null);
  assert.equal(hostState.resetCalled, true);
  assert.equal(mockSupabase._calls.signOut.length, 1, 'Supabase signOut must be called on editor revocation');
});

test('production lifecycle 8: Temporary profile query network error fails closed in UI without signing out valid Supabase session', async () => {
  const coordinator = new AuthCoordinator();
  const mockSupabase = createMockSupabase({ id: 'admin-temp-err', email: 'admin@roa.org' });

  let hostState = { resetCalled: false };
  const callbacks = {
    onResetState: () => { hostState.resetCalled = true; },
  };

  // Profile lookup fails with transient network error
  mockSupabase._profileHandler = () => Promise.resolve({
    data: null,
    error: { message: 'Network timeout (504 Gateway)' },
  });

  await coordinator.resolveSession(
    { user: { id: 'admin-temp-err', email: 'admin@roa.org' } },
    undefined,
    mockSupabase,
    callbacks
  );

  // Must fail closed in application UI
  assert.equal(hostState.resetCalled, true, 'UI state must fail closed on uncertainty');
  assert.equal(coordinator.getCurrentRole(), null);

  // Must NOT destroy the valid Supabase session
  assert.equal(mockSupabase._calls.signOut.length, 0, 'Supabase signOut must NOT be called on temporary network error');
});

test('production lifecycle 9: Missing current session user ID during sign-out validation returns false', () => {
  // When targetUserId exists, a missing or mismatched session user ID must not authorize sign-out
  const canSignOutNull = shouldPerformSignOut({
    currentSeq: 1,
    latestAuthSeq: 1,
    targetUserId: 'admin-target',
    currentSessionUserId: null,
  });
  assert.equal(canSignOutNull, false, 'Null session user ID must not authorize sign-out');

  const canSignOutUndefined = shouldPerformSignOut({
    currentSeq: 1,
    latestAuthSeq: 1,
    targetUserId: 'admin-target',
    currentSessionUserId: undefined,
  });
  assert.equal(canSignOutUndefined, false, 'Undefined session user ID must not authorize sign-out');

  const canSignOutMismatch = shouldPerformSignOut({
    currentSeq: 1,
    latestAuthSeq: 1,
    targetUserId: 'admin-target',
    currentSessionUserId: 'other-user',
  });
  assert.equal(canSignOutMismatch, false, 'Mismatched session user ID must not authorize sign-out');

  const canSignOutMatch = shouldPerformSignOut({
    currentSeq: 1,
    latestAuthSeq: 1,
    targetUserId: 'admin-target',
    currentSessionUserId: 'admin-target',
  });
  assert.equal(canSignOutMatch, true, 'Matching session user ID authorizes sign-out');
});

test('production lifecycle 10: Admin-to-editor role downgrade classification and state clearing', async () => {
  const coordinator = new AuthCoordinator();
  const mockSupabase = createMockSupabase();

  let downgraded = false;
  let sensitiveData = [{ id: 'reg-1' }];
  const callbacks = {
    onRoleDowngrade: () => {
      downgraded = true;
      sensitiveData = [];
    },
    onAuthenticated: () => { },
  };

  // 1. Admin login
  mockSupabase._profileHandler = () => Promise.resolve({
    data: { role: 'admin', designation: 'Admin' },
    error: null,
  });
  await coordinator.login('user@roa.org', 'pwd', mockSupabase, callbacks);
  assert.equal(coordinator.getCurrentRole(), 'admin');

  // 2. Profile changes to editor
  mockSupabase._profileHandler = () => Promise.resolve({
    data: { role: 'editor', designation: 'Content Editor' },
    error: null,
  });
  await coordinator.resolveSession(
    { user: { id: 'uid-user@roa.org', email: 'user@roa.org' } },
    undefined,
    mockSupabase,
    callbacks
  );

  assert.equal(coordinator.getCurrentRole(), 'editor');
  assert.equal(downgraded, true, 'Downgrade callback must fire when previous role was admin');
  assert.deepEqual(sensitiveData, [], 'Sensitive administrative data must be cleared on downgrade');

  // 3. Existing editor revalidating is not a downgrade
  downgraded = false;
  await coordinator.resolveSession(
    { user: { id: 'uid-user@roa.org', email: 'user@roa.org' } },
    undefined,
    mockSupabase,
    callbacks
  );
  assert.equal(downgraded, false, 'Existing editor revalidation must not fire downgrade');
});

test('production lifecycle: signOutForRevocation clears state and invokes centralized sign-out', async () => {
  const coordinator = new AuthCoordinator();
  const mockSupabase = createMockSupabase({ id: 'revoked-user', email: 'revoked@roa.org' });

  let resetCalled = false;
  const callbacks = {
    onResetState: () => { resetCalled = true; },
  };

  const result = await coordinator.signOutForRevocation('revoked-user', mockSupabase, callbacks);

  assert.equal(result, true);
  assert.equal(resetCalled, true);
  assert.equal(coordinator.getCurrentUserId(), null);
  assert.equal(mockSupabase._calls.signOut.length, 1);
});

test('production lifecycle: revocation reports failure when Supabase sign-out returns an error', async () => {
  const coordinator = new AuthCoordinator();
  const mockSupabase = createMockSupabase({
    id: 'revoked-user',
    email: 'revoked@roa.org',
  });

  mockSupabase._signOutHandler = () =>
    Promise.resolve({ error: { message: 'Network offline' } });

  let loadingStates = [];
  let resetCalled = false;

  const result = await coordinator.signOutForRevocation(
    'revoked-user',
    mockSupabase,
    {
      onResetState: () => { resetCalled = true; },
      onLoading: (value) => { loadingStates.push(value); },
    }
  );

  assert.equal(result, false);
  assert.equal(resetCalled, true);
  assert.deepEqual(loadingStates, [true, false]);
  assert.equal(mockSupabase._calls.signOut.length, 1);
});

test('production lifecycle: revocation does not sign out when session verification returns an error', async () => {
  const coordinator = new AuthCoordinator();
  const mockSupabase = createMockSupabase({
    id: 'revoked-user',
    email: 'revoked@roa.org',
  });

  mockSupabase._getSessionHandler = () =>
    Promise.resolve({
      data: { session: null },
      error: { message: 'Unable to verify session' },
    });

  let loadingStates = [];

  const result = await coordinator.signOutForRevocation(
    'revoked-user',
    mockSupabase,
    {
      onLoading: (value) => { loadingStates.push(value); },
    }
  );

  assert.equal(result, false);
  assert.equal(mockSupabase._calls.signOut.length, 0);
  assert.deepEqual(loadingStates, [true, false]);
});

test('production lifecycle: revocation handles thrown session errors and always ends loading state', async () => {
  const coordinator = new AuthCoordinator();
  const mockSupabase = createMockSupabase({
    id: 'revoked-user',
    email: 'revoked@roa.org',
  });

  mockSupabase._getSessionHandler = () => {
    throw new Error('Session lookup crashed');
  };

  let loadingStates = [];

  const result = await coordinator.signOutForRevocation(
    'revoked-user',
    mockSupabase,
    {
      onLoading: (value) => { loadingStates.push(value); },
    }
  );

  assert.equal(result, false);
  assert.equal(mockSupabase._calls.signOut.length, 0);
  assert.deepEqual(loadingStates, [true, false]);
});
test('production lifecycle: logout failure does not falsely clear authenticated state if sign-out fails', async () => {
  const coordinator = new AuthCoordinator();
  const mockSupabase = createMockSupabase({ id: 'active-user', email: 'active@roa.org' });

  mockSupabase._signOutHandler = () => Promise.resolve({ error: { message: 'Network offline' } });

  let resetCalled = false;
  const callbacks = {
    onResetState: () => { resetCalled = true; },
  };

  const res = await coordinator.logout(mockSupabase, callbacks);

  assert.equal(res.ok, false);
  assert.match(res.error, /Sign-out failed/);
  assert.equal(resetCalled, false, 'State must NOT be reset if sign-out failed');
});

test('production helper: deferred auth resolution preserves correct event ordering', () => {
  // Initial session event
  const event1 = evaluateAuthStateChange({
    event: 'INITIAL_SESSION',
    hasUser: true,
    inFlightLogoutSeq: null,
    inFlightLoginSeq: null,
    currentUserId: null,
    eventUserId: 'user-1',
    isAlreadyVerified: false,
  });
  assert.equal(event1.action, 'DEFER_RESOLUTION');

  // Token refresh for already verified active user
  const event2 = evaluateAuthStateChange({
    event: 'TOKEN_REFRESHED',
    hasUser: true,
    inFlightLogoutSeq: null,
    inFlightLoginSeq: null,
    currentUserId: 'user-1',
    eventUserId: 'user-1',
    isAlreadyVerified: true,
  });
  assert.equal(event2.action, 'UPDATE_EMAIL_ONLY', 'Token refresh for verified user only updates email');

  // User switch to user-2
  const event3 = evaluateAuthStateChange({
    event: 'SIGNED_IN',
    hasUser: true,
    inFlightLogoutSeq: null,
    inFlightLoginSeq: null,
    currentUserId: 'user-1',
    eventUserId: 'user-2',
    isAlreadyVerified: true,
  });
  assert.equal(event3.action, 'DEFER_RESOLUTION', 'User switch triggers deferred profile resolution');

  // SIGNED_OUT event
  const event4 = evaluateAuthStateChange({
    event: 'SIGNED_OUT',
    hasUser: false,
    inFlightLogoutSeq: null,
    inFlightLoginSeq: null,
    currentUserId: 'user-2',
    eventUserId: null,
    isAlreadyVerified: true,
  });
  assert.equal(event4.action, 'RESET_STATE');

  // Verify AppContext uses queueMicrotask to defer resolution
  assert.match(appContextSource, /queueMicrotask\(\(\)\s*=>\s*\{/);
});

test('production helper: existing admin and editor export behavior remains intact', () => {
  const dummyBaseData = {
    meetups: [{ id: 'm1', title: 'Meetup 1' }],
    articles: [{ id: 'a1', title: 'Article 1' }],
    stories: [],
    gallery: [],
    announcements: [],
    reels: [],
    instagramMedia: [],
    instagramConfig: { connected: false, username: 'readersofaurangabad' },
  };

  const sensitive = {
    registrations: [{ id: 'r1', name: 'Private Attendee', email: 'attendee@secret.com' }],
    enquiries: [{ id: 'e1', name: 'Private Enquiry', message: 'Secret Message' }],
  };

  // 1. Unauthenticated request is denied
  const unauth = buildBackupExport({
    isAdmin: false,
    adminRole: null,
    activeRoleRef: null,
    activeUserId: null,
    baseData: dummyBaseData,
    sensitiveData: sensitive,
  });
  assert.equal(unauth.ok, false);
  assert.match(unauth.error, /Access denied/);

  // 2. Editor export produces content-only backup without registrations or enquiries
  const editor = buildBackupExport({
    isAdmin: true,
    adminRole: 'editor',
    activeRoleRef: 'editor',
    activeUserId: 'editor-1',
    baseData: dummyBaseData,
    sensitiveData: sensitive,
  });
  assert.equal(editor.ok, true);
  assert.equal(editor.exportPayload.exportType, 'public_content');
  assert.equal(editor.exportPayload.registrations, undefined, 'Editor export must never include attendee registrations');
  assert.equal(editor.exportPayload.enquiries, undefined, 'Editor export must never include enquiries');
  assert.match(editor.filename, /readers-of-aurangabad-content-backup-/);

  // 3. Admin export produces full administrative backup with PII
  const admin = buildBackupExport({
    isAdmin: true,
    adminRole: 'admin',
    activeRoleRef: 'admin',
    activeUserId: 'admin-1',
    baseData: dummyBaseData,
    sensitiveData: sensitive,
  });
  assert.equal(admin.ok, true);
  assert.equal(admin.exportPayload.exportType, 'full_administrative');
  assert.equal(admin.exportPayload.registrations.length, 1);
  assert.equal(admin.exportPayload.enquiries.length, 1);
  assert.match(admin.filename, /readers-of-aurangabad-full-backup-/);

  // 4. Desynchronized role fails closed
  const desync = buildBackupExport({
    isAdmin: true,
    adminRole: 'admin',
    activeRoleRef: 'editor',
    activeUserId: 'admin-1',
    baseData: dummyBaseData,
    sensitiveData: sensitive,
  });
  assert.equal(desync.ok, false);

  // 5. Documentation verifies client-side role/state synchronization checks, not live authentication
  const authSecuritySource = readSource('src/utils/authSecurity.ts');
  assert.match(authSecuritySource, /client-side role and state synchronization checks/);
  assert.match(authSecuritySource, /does not perform independent live-session authentication/i);
});

test('behavioral: encodeCsvCell neutralizes formula injection triggers (CWE-1236)', () => {
  // Classic formula injection triggers
  assert.equal(encodeCsvCell('=cmd|\' /C calc\'!A0'), '"\'=cmd|\' /C calc\'!A0"');
  assert.equal(encodeCsvCell('+12345'), '"\'+12345"');
  assert.equal(encodeCsvCell('-12345'), '"\'-12345"');
  assert.equal(encodeCsvCell('@SUM(A1:B10)'), '"\'@SUM(A1:B10)"');

  // Trigger preceded by whitespace or control characters
  assert.equal(encodeCsvCell('   =SUM(1,2)'), '"\'   =SUM(1,2)"');
  assert.equal(encodeCsvCell('\t+cmd'), '"\'\t+cmd"');
  assert.equal(encodeCsvCell('\r-execute'), '"\'\r-execute"');
  assert.equal(encodeCsvCell('\n@payload'), '"\'\n@payload"');

  // Normal safe strings are NOT formula-prefixed
  assert.equal(encodeCsvCell('Regular attendee name'), '"Regular attendee name"');
  assert.equal(encodeCsvCell('readers@example.com'), '"readers@example.com"');
  assert.equal(encodeCsvCell('9876543210'), '"9876543210"');
});

test('behavioral: encodeCsvCell handles quotes, commas, newlines, and nulls properly', () => {
  assert.equal(encodeCsvCell(null), '""');
  assert.equal(encodeCsvCell(undefined), '""');
  assert.equal(encodeCsvCell(''), '""');
  assert.equal(encodeCsvCell('Line 1\r\nLine 2'), '"Line 1\r\nLine 2"');
  assert.equal(encodeCsvCell('Hello "World"'), '"Hello ""World"""');
  assert.equal(encodeCsvCell('Address: Plot 4, Station Road'), '"Address: Plot 4, Station Road"');
  assert.equal(encodeCsvCell(42), '"42"');
  assert.equal(encodeCsvCell(true), '"true"');
});

test('behavioral: generateCsvContent produces valid RFC-4180 CSV with CRLF delimiters', () => {
  const headers = ['Name', 'Formula', 'Note'];
  const rows = [
    ['Alice', '=1+1', 'First attendee'],
    ['Bob "The Reader"', '+100', 'Second, with comma']
  ];
  const output = generateCsvContent(headers, rows);
  const expected = '"Name","Formula","Note"\r\n"Alice","\'=1+1","First attendee"\r\n"Bob ""The Reader""","\'+100","Second, with comma"';
  assert.equal(output, expected);
});



test('AuthMutationQueue serializes operations in enqueue order', async () => {
  const queue = new AuthMutationQueue();
  const firstGate = createDeferred();
  const firstStarted = createDeferred();
  const events = [];

  const first = queue.enqueue(async () => {
    events.push('first:start');
    firstStarted.resolve();

    await firstGate.promise;

    events.push('first:end');
    return 'first-result';
  });

  const second = queue.enqueue(async () => {
    events.push('second');
    return 'second-result';
  });

  // Wait until the first operation has actually started.
  await firstStarted.promise;

  assert.deepEqual(events, ['first:start']);

  firstGate.resolve();

  const results = await Promise.all([first, second]);

  assert.deepEqual(events, ['first:start', 'first:end', 'second']);
  assert.deepEqual(results, ['first-result', 'second-result']);
});


test('AuthMutationQueue continues processing after an operation rejects', async () => {
  const queue = new AuthMutationQueue();

  const failedOperation = queue.enqueue(async () => {
    throw new Error('Simulated authentication failure');
  });

  const nextOperation = queue.enqueue(async () => 'next-operation-completed');

  await assert.rejects(failedOperation, {
    message: 'Simulated authentication failure',
  });

  assert.equal(await nextOperation, 'next-operation-completed');
});

test('evaluateProfileResolution discards stale authentication results', () => {
  const result = evaluateProfileResolution({
    currentSeq: 2,
    latestAuthSeq: 3,
    profileError: null,
    profile: { role: 'admin' },
    resolvingUserId: 'user-1',
  });

  assert.equal(result.canApply, false);
  assert.equal(result.failClosed, false);
  assert.equal(result.shouldSignOut, false);
  assert.equal(result.role, null);
});

test('evaluateProfileResolution preserves the session on temporary profile errors', () => {
  const result = evaluateProfileResolution({
    currentSeq: 1,
    latestAuthSeq: 1,
    profileError: new Error('Temporary network failure'),
    profile: null,
    resolvingUserId: 'user-1',
    previousVerifiedUserId: 'user-1',
    previousRole: 'admin',
  });

  assert.equal(result.canApply, true);
  assert.equal(result.failClosed, true);
  assert.equal(result.shouldSignOut, false);
  assert.equal(result.role, null);
  assert.equal(result.error, 'Temporary profile verification error');
});

test('evaluateProfileResolution signs out when a staff profile is confirmed missing', () => {
  const result = evaluateProfileResolution({
    currentSeq: 1,
    latestAuthSeq: 1,
    profileError: null,
    profile: null,
    resolvingUserId: 'user-1',
  });

  assert.equal(result.canApply, true);
  assert.equal(result.failClosed, true);
  assert.equal(result.shouldSignOut, true);
  assert.equal(result.role, null);
  assert.equal(result.error, 'No staff profile found for this account');
});

test('evaluateProfileResolution detects an admin-to-editor role downgrade', () => {
  const result = evaluateProfileResolution({
    currentSeq: 1,
    latestAuthSeq: 1,
    profileError: null,
    profile: { role: 'editor' },
    resolvingUserId: 'user-1',
    previousVerifiedUserId: 'user-1',
    previousRole: 'admin',
  });

  assert.equal(result.canApply, true);
  assert.equal(result.failClosed, false);
  assert.equal(result.shouldSignOut, false);
  assert.equal(result.role, 'editor');
  assert.equal(result.isRoleDowngrade, true);
});

test('clearInFlightLogout clears only the matching sequence', () => {
  assert.equal(clearInFlightLogout(5, 5), null);
  assert.equal(clearInFlightLogout(5, 6), 5);
  assert.equal(clearInFlightLogout(null, 5), null);
});

test('evaluateProfileResolution rejects a missing live session identity', () => {
  const result = evaluateProfileResolution({
    currentSeq: 1,
    latestAuthSeq: 1,
    profileError: null,
    profile: { role: 'admin' },
    resolvingUserId: 'user-1',
    currentLiveUserId: null,
  });

  assert.equal(result.canApply, false);
  assert.equal(result.shouldSignOut, false);
  assert.equal(result.role, null);
});

test('evaluateProfileResolution rejects a mismatched live session identity', () => {
  const result = evaluateProfileResolution({
    currentSeq: 1,
    latestAuthSeq: 1,
    profileError: null,
    profile: { role: 'admin' },
    resolvingUserId: 'user-1',
    currentLiveUserId: 'other-user',
  });

  assert.equal(result.canApply, false);
  assert.equal(result.shouldSignOut, false);
  assert.equal(result.role, null);
});


test('login rejects a missing active session without authenticating or signing out', async () => {
  const coordinator = new AuthCoordinator();
  const mockSupabase = createMockSupabase();

  let authenticated = false;
  let reset = false;

  mockSupabase._getSessionHandler = () => ({
    data: { session: null },
    error: null,
  });

  const result = await coordinator.login(
    'admin@roa.org',
    'password',
    mockSupabase,
    {
      onAuthenticated: () => { authenticated = true; },
      onResetState: () => { reset = true; },
    }
  );

  assert.equal(result.ok, false);
  assert.equal(authenticated, false);
  assert.equal(reset, true);
  assert.equal(coordinator.getCurrentUserId(), null);
  assert.equal(coordinator.getCurrentRole(), null);
  assert.equal(mockSupabase._calls.signOut.length, 0);
});

test('login rejects a getSession error without authenticating or signing out', async () => {
  const coordinator = new AuthCoordinator();
  const mockSupabase = createMockSupabase();

  let authenticated = false;
  let reset = false;

  mockSupabase._getSessionHandler = () => ({
    data: { session: null },
    error: { message: 'Session verification failed' },
  });

  const result = await coordinator.login(
    'admin@roa.org',
    'password',
    mockSupabase,
    {
      onAuthenticated: () => { authenticated = true; },
      onResetState: () => { reset = true; },
    }
  );

  assert.equal(result.ok, false);
  assert.equal(authenticated, false);
  assert.equal(reset, true);
  assert.equal(coordinator.getCurrentUserId(), null);
  assert.equal(coordinator.getCurrentRole(), null);
  assert.equal(mockSupabase._calls.signOut.length, 0);
});

test('resolveSession resets state when final live-session verification returns no session', async () => {
  const coordinator = new AuthCoordinator();
  const mockSupabase = createMockSupabase({
    id: 'user-1',
    email: 'admin@roa.org',
  });

  let authenticated = false;
  let reset = false;

  mockSupabase._getSessionHandler = () => ({
    data: { session: null },
    error: null,
  });

  await coordinator.resolveSession(
    { user: { id: 'user-1', email: 'admin@roa.org' } },
    undefined,
    mockSupabase,
    {
      onAuthenticated: () => { authenticated = true; },
      onResetState: () => { reset = true; },
    }
  );

  assert.equal(authenticated, false);
  assert.equal(reset, true);
  assert.equal(coordinator.getCurrentUserId(), null);
  assert.equal(coordinator.getCurrentRole(), null);
  assert.equal(mockSupabase._calls.signOut.length, 0);
});

test('resolveSession resets state when final live-session verification returns an error', async () => {
  const coordinator = new AuthCoordinator();
  const mockSupabase = createMockSupabase({
    id: 'user-1',
    email: 'admin@roa.org',
  });

  let authenticated = false;
  let reset = false;

  mockSupabase._getSessionHandler = () => ({
    data: { session: null },
    error: { message: 'Session verification failed' },
  });

  await coordinator.resolveSession(
    { user: { id: 'user-1', email: 'admin@roa.org' } },
    undefined,
    mockSupabase,
    {
      onAuthenticated: () => { authenticated = true; },
      onResetState: () => { reset = true; },
    }
  );

  assert.equal(authenticated, false);
  assert.equal(reset, true);
  assert.equal(coordinator.getCurrentUserId(), null);
  assert.equal(coordinator.getCurrentRole(), null);
  assert.equal(mockSupabase._calls.signOut.length, 0);
});


test('resolveSession preserves the newer authenticated account when a stale session event arrives', async () => {
  const coordinator = new AuthCoordinator();
  const mockSupabase = createMockSupabase();

  const loginResult = await coordinator.login(
    'user-b@roa.org',
    'password',
    mockSupabase,
    {}
  );

  assert.equal(loginResult.ok, true);
  assert.equal(coordinator.getCurrentUserId(), 'uid-user-b@roa.org');
  assert.equal(coordinator.getCurrentRole(), 'admin');

  let accountSwitchCalled = false;
  let authenticated = false;

  mockSupabase._getSessionHandler = () => ({
    data: {
      session: {
        user: {
          id: 'uid-user-b@roa.org',
          email: 'user-b@roa.org',
        },
      },
    },
    error: null,
  });

  await coordinator.resolveSession(
    {
      user: {
        id: 'user-a',
        email: 'user-a@roa.org',
      },
    },
    undefined,
    mockSupabase,
    {
      onAccountSwitch: () => { accountSwitchCalled = true; },
      onAuthenticated: () => { authenticated = true; },
    }
  );

  assert.equal(coordinator.getCurrentUserId(), 'uid-user-b@roa.org');
  assert.equal(coordinator.getCurrentRole(), 'admin');
  assert.equal(accountSwitchCalled, false);
  assert.equal(authenticated, false);
  assert.equal(mockSupabase._calls.signOut.length, 0);
});
