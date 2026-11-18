/**
 * Supabase environment safety guard.
 *
 * Pure, dependency-free helpers shared by the Vite configuration (build/dev
 * startup) and the browser client bootstrap. The guard never prints the
 * Supabase URL or key: only a reason code and a remediation hint.
 */

/** Production project — must never be contacted by a local development server. */
export const PRODUCTION_SUPABASE_PROJECT_REF = 'rtjulebzjiwbnizqwxjn';

/** Staging project — the only hosted project a staging-mode session may target. */
export const STAGING_SUPABASE_PROJECT_REF = 'dszihsmsbhthuezzpafq';

const LOCAL_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '[::1]',
]);

const SUPABASE_HOST_PATTERN = /^([a-z0-9]{20})\.supabase\.(?:co|in)$/;

export type EnvGuardCommand = 'serve' | 'build';

export interface SupabaseEnvInput {
  /** Value of VITE_SUPABASE_URL. */
  url?: string | null;
  /** Value of VITE_SUPABASE_PUBLISHABLE_KEY (or legacy anon key). */
  key?: string | null;
  /** Vite mode, e.g. "development", "staging", "production". */
  mode?: string | null;
  /** Vite command. */
  command?: EnvGuardCommand;
}

export interface EnvGuardResult {
  ok: boolean;
  /** Machine-readable reason code. Safe to log; contains no credentials. */
  reason?: string;
}

/**
 * Extracts the Supabase project ref from a hosted project URL.
 * Returns null for local stack URLs, malformed URLs and non-Supabase hosts.
 */
export const parseSupabaseProjectRef = (
  rawUrl: string | null | undefined,
): string | null => {
  if (typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  let hostname: string;
  try {
    hostname = new URL(trimmed).hostname.toLowerCase();
  } catch {
    return null;
  }

  if (LOCAL_HOSTNAMES.has(hostname)) return null;

  const match = hostname.match(SUPABASE_HOST_PATTERN);
  return match ? match[1] : null;
};

/** Returns true only for explicitly recognized local Supabase hosts. */
export const isLocalSupabaseUrl = (rawUrl: string | null | undefined): boolean => {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) return false;

  try {
    const parsed = new URL(rawUrl.trim());
    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      LOCAL_HOSTNAMES.has(parsed.hostname.toLowerCase())
    );
  } catch {
    return false;
  }
};

export const isProductionSupabaseUrl = (rawUrl: string | null | undefined): boolean =>
  parseSupabaseProjectRef(rawUrl) === PRODUCTION_SUPABASE_PROJECT_REF;

export const isStagingSupabaseUrl = (rawUrl: string | null | undefined): boolean =>
  parseSupabaseProjectRef(rawUrl) === STAGING_SUPABASE_PROJECT_REF;

/**
 * Validates the Supabase environment for a Vite command/mode.
 *
 * Rules:
 * - A URL and a public key are always required.
 * - Production builds (command "build", mode "production") keep whatever
 *   deployment configuration the hosting environment already provides.
 * - Every other command/mode is a local surface and must fail closed:
 *   - the production project ref is always rejected;
 *   - staging mode must resolve to the staging project ref;
 *   - ordinary dev mode may only target staging or a local Supabase stack.
 */
export const checkSupabaseEnv = (input: SupabaseEnvInput): EnvGuardResult => {
  const url = (input.url ?? '').trim();
  const key = (input.key ?? '').trim();
  const mode = (input.mode ?? '').trim().toLowerCase();
  const command: EnvGuardCommand = input.command === 'build' ? 'build' : 'serve';

  if (!url) return { ok: false, reason: 'missing-url' };
  if (!/^https?:\/\//i.test(url)) return { ok: false, reason: 'malformed-url' };
  if (!key) return { ok: false, reason: 'missing-key' };

  // Deployment builds keep their own intended configuration.
  if (command === 'build' && mode === 'production') return { ok: true };

  const ref = parseSupabaseProjectRef(url);

  if (ref === PRODUCTION_SUPABASE_PROJECT_REF) {
    return { ok: false, reason: 'production-project-ref' };
  }

  if (mode === 'staging') {
    if (ref === STAGING_SUPABASE_PROJECT_REF) return { ok: true };
    return {
      ok: false,
      reason: ref ? 'staging-mode-wrong-project' : 'staging-mode-unrecognized-project',
    };
  }

  // Ordinary local development: staging or a local Supabase stack only.
  if (ref === STAGING_SUPABASE_PROJECT_REF || isLocalSupabaseUrl(url)) return { ok: true };

  return { ok: false, reason: 'non-staging-hosted-project' };
};

/**
 * Builds an actionable error message for a failed guard check.
 * Deliberately excludes the URL and key values.
 */
export const describeEnvGuardFailure = (reason: string, mode?: string | null): string => {
  const modeLabel = (mode ?? '').trim() || 'development';

  const detail: Record<string, string> = {
    'missing-url': 'VITE_SUPABASE_URL is not set.',
    'malformed-url': 'VITE_SUPABASE_URL must be an absolute http(s) URL.',
    'missing-key': 'VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY is not set.',
    'production-project-ref':
      'The production Supabase project is not allowed in local development or preview.',
    'staging-mode-wrong-project':
      'Staging mode must target the staging Supabase project.',
    'staging-mode-unrecognized-project':
      'Staging mode could not recognise a Supabase project ref in the configured URL.',
    'non-staging-hosted-project':
      'Ordinary local development may only target the staging project or a local Supabase stack.',
  };

  return [
    `[env-guard] Refusing to start: ${detail[reason] ?? 'unsafe Supabase configuration.'}`,
    `Vite mode: ${modeLabel}`,
    'Use `npm run dev:staging` for the staging project.',
    'Required variables: VITE_SUPABASE_URL and either VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY.',
    'Credential values are intentionally not printed.',
  ].join('\n');
};
