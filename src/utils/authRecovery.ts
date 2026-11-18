/**
 * Password recovery helpers.
 *
 * Pure functions shared by the recovery UI and its regression tests. They never
 * read, store, log or echo passwords or recovery tokens.
 */

export const MIN_PASSWORD_LENGTH = 8;

/** Legacy route still emitted by older reset emails. */
export const RESET_PASSWORD_HASH_ROUTE = '#/reset-password';

/** Generic request message: never discloses whether an account exists. */
export const GENERIC_RESET_REQUEST_MESSAGE =
  'If an account exists for this email, password reset instructions have been sent.';

const RECOVERY_TYPE_PATTERN = /(?:^|[#&?])type=recovery(?:&|$)/;

/**
 * Detects a password-recovery intent from the URL before supabase-js consumes it.
 * Supports both the current root redirect (`#access_token=...&type=recovery`) and
 * the legacy `#/reset-password` route.
 */
export function detectRecoveryIntent(
  hash: string | null | undefined,
  search?: string | null
): boolean {
  const normalizedHash = (hash ?? '').toLowerCase();
  const normalizedSearch = (search ?? '').toLowerCase();

  if (normalizedHash.startsWith(RESET_PASSWORD_HASH_ROUTE)) return true;
  if (RECOVERY_TYPE_PATTERN.test(normalizedHash)) return true;
  if (RECOVERY_TYPE_PATTERN.test(normalizedSearch)) return true;

  return false;
}

export interface PasswordValidationResult {
  ok: boolean;
  error?: string;
}

export function validateNewPassword(
  password: string,
  confirmation: string
): PasswordValidationResult {
  if (!password) {
    return { ok: false, error: 'Enter a new password.' };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (password !== confirmation) {
    return { ok: false, error: 'Passwords do not match.' };
  }
  return { ok: true };
}

/**
 * Maps Supabase/GoTrue error text to a small set of safe, user-facing messages.
 * Raw server text is never surfaced verbatim because it can contain internals.
 */
export function normalizeRecoveryError(message?: string | null): string {
  const normalized = (message ?? '').toLowerCase();

  if (!normalized) {
    return 'Unable to update your password right now. Please try again.';
  }

  if (
    normalized.includes('expired') ||
    normalized.includes('invalid') ||
    normalized.includes('token') ||
    normalized.includes('session') ||
    normalized.includes('jwt')
  ) {
    return 'This password reset link is invalid or has expired. Request a new link.';
  }

  if (normalized.includes('password')) {
    return 'That password could not be accepted. Choose a different password of at least 8 characters.';
  }

  return 'Unable to update your password right now. Please try again.';
}

/** Defensive check used before any recovery request is sent. */
export function isValidRecoveryEmail(email: string | null | undefined): boolean {
  if (typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
