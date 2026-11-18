import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const recovery = await import(pathToFileURL(path.join(root, 'src', 'utils', 'authRecovery.ts')).href);

const read = (...segments) => readFileSync(path.join(root, ...segments), 'utf8');
const appContext = read('src', 'context', 'AppContext.tsx');
const appSource = read('src', 'App.tsx');
const resetPage = read('src', 'pages', 'ResetPasswordPage.tsx');
const signInModal = read('src', 'components', 'MemberSignInModal.tsx');
const navbar = read('src', 'components', 'Navbar.tsx');

test('detectRecoveryIntent recognises current and legacy recovery links', () => {
  assert.equal(recovery.detectRecoveryIntent('#access_token=abc&refresh_token=def&type=recovery', ''), true);
  assert.equal(recovery.detectRecoveryIntent('#/reset-password', ''), true);
  assert.equal(recovery.detectRecoveryIntent('#/reset-password#access_token=abc&type=recovery', ''), true);
  assert.equal(recovery.detectRecoveryIntent('', '?type=recovery&code=abc'), true);
  assert.equal(recovery.detectRecoveryIntent('#/reset-password', '?error=access_denied'), true);
  assert.equal(recovery.detectRecoveryIntent('#journal', ''), false);
  assert.equal(recovery.detectRecoveryIntent('', ''), false);
  assert.equal(recovery.detectRecoveryIntent(undefined, undefined), false);
});

test('validateNewPassword enforces length and confirmation without echoing values', () => {
  assert.deepEqual(recovery.validateNewPassword('', ''), { ok: false, error: 'Enter a new password.' });
  assert.equal(recovery.validateNewPassword('short', 'short').ok, false);
  assert.equal(recovery.validateNewPassword('long-enough-1', 'different-pass').error, 'Passwords do not match.');
  assert.deepEqual(recovery.validateNewPassword('long-enough-1', 'long-enough-1'), { ok: true });
  assert.equal(recovery.MIN_PASSWORD_LENGTH, 8);
});

test('normalizeRecoveryError maps provider errors to safe messages', () => {
  assert.match(recovery.normalizeRecoveryError('Token has expired or is invalid'), /invalid or has expired/);
  assert.match(recovery.normalizeRecoveryError('JWT expired'), /invalid or has expired/);
  assert.match(recovery.normalizeRecoveryError('New password should be different from the old password'), /could not be accepted/);
  assert.match(recovery.normalizeRecoveryError(''), /Unable to update your password/);
  assert.match(recovery.normalizeRecoveryError('unexpected internal detail'), /Unable to update your password/);
  assert.ok(!recovery.normalizeRecoveryError('unexpected internal detail').includes('internal detail'));
});

test('isValidRecoveryEmail rejects malformed addresses', () => {
  assert.equal(recovery.isValidRecoveryEmail('staging.admin@example.test'), true);
  assert.equal(recovery.isValidRecoveryEmail('  staging.member1@example.test  '), true);
  assert.equal(recovery.isValidRecoveryEmail('not-an-email'), false);
  assert.equal(recovery.isValidRecoveryEmail(''), false);
  assert.equal(recovery.isValidRecoveryEmail(null), false);
});

test('recovery flow is wired end to end', () => {
  assert.match(appContext, /PASSWORD_RECOVERY/);
  assert.match(appContext, /updateUser\(\{ password: newPassword \}\)/);
  assert.match(appContext, /resetPasswordForEmail/);
  assert.match(appContext, /isPasswordRecovery/);
  assert.match(appContext, /completePasswordRecovery/);
  assert.ok(!appContext.includes('#/reset-password'), 'reset redirect must use the app root');
  assert.match(appSource, /ResetPasswordPage/);
  assert.match(appSource, /isPasswordRecovery \?/);
});

test('reset page validates input and clears credentials after success', () => {
  assert.match(resetPage, /validateNewPassword/);
  assert.match(resetPage, /setPassword\(''\)/);
  assert.match(resetPage, /setConfirmation\(''\)/);
  assert.match(resetPage, /autoComplete="new-password"/);
  assert.match(resetPage, /type=\{showPassword \? 'text' : 'password'\}/);
  assert.ok(!resetPage.includes('console.'), 'reset page must not log form values');
  assert.ok(!resetPage.includes('localStorage'));
});

test('public magic-link sign-in cannot create accounts', () => {
  assert.match(appContext, /shouldCreateUser: false/);
  assert.match(appContext, /signups\?\\s\+not\\s\+allowed/);
});

test('members can request a reset link from the sign-in modal', () => {
  assert.match(signInModal, /onForgotPassword/);
  assert.match(signInModal, /Forgot password\?/);
  assert.match(navbar, /onForgotPassword=\{requestPasswordReset\}/);
});
