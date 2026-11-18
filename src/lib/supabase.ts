import { createClient } from '@supabase/supabase-js';
import { checkSupabaseEnv } from './envGuard.ts';

export const readEnvValue = (value: string | undefined) => (typeof value === 'string' ? value.trim() : '');

const detectDevRuntime = (runtimeEnv?: Record<string, unknown>): boolean => {
  const rawDev = runtimeEnv ? runtimeEnv.DEV : undefined;
  if (rawDev !== undefined) return rawDev === true || rawDev === 'true';

  const runtimeImportMeta = (
    typeof import.meta !== 'undefined' && import.meta && typeof import.meta.env === 'object'
      ? import.meta.env
      : {}
  ) as Record<string, unknown>;

  return runtimeImportMeta.DEV === true || runtimeImportMeta.DEV === 'true';
};

export const resolveSupabaseConfig = (runtimeEnv?: Record<string, string | undefined>) => {
  const env = runtimeEnv ?? (
    typeof import.meta !== 'undefined' && import.meta && typeof import.meta.env === 'object'
      ? import.meta.env
      : {}
  );

  const configuredSupabaseUrl = readEnvValue(env.VITE_SUPABASE_URL);
  const configuredPublishableKey =
    readEnvValue(env.VITE_SUPABASE_PUBLISHABLE_KEY) ||
    readEnvValue(env.VITE_SUPABASE_ANON_KEY);

  const hasWellFormedConfig = Boolean(
    configuredSupabaseUrl &&
    configuredPublishableKey &&
    /^https?:\/\//i.test(configuredSupabaseUrl)
  );

  const isDevelopment = detectDevRuntime(runtimeEnv as Record<string, unknown> | undefined);
  const mode = env.MODE === 'staging' ? 'staging' : 'development';

  const runtimeGuard = checkSupabaseEnv({
    url: configuredSupabaseUrl,
    key: configuredPublishableKey,
    mode,
    command: 'serve',
  });

  const hasAnyConfig = Boolean(configuredSupabaseUrl || configuredPublishableKey);
  const blockedInDevelopment = isDevelopment && hasAnyConfig && !runtimeGuard.ok;

  if (blockedInDevelopment) {
    console.error(
      '[env-guard] Refusing unsafe Supabase configuration in local development. ' +
      'Reason: ' + (runtimeGuard.reason ?? 'unknown') + '. ' +
      'Run `npm run dev:staging` for the staging project.'
    );
  }

  const isConfigured = hasWellFormedConfig && !blockedInDevelopment;

  return {
    url: isConfigured ? configuredSupabaseUrl : 'https://example.supabase.co',
    key: isConfigured ? configuredPublishableKey : 'public-anon-key',
    isConfigured,
  };
};

const { url: resolvedUrl, key: resolvedKey, isConfigured } = resolveSupabaseConfig();
export const isSupabaseConfigured = isConfigured;

// Create a client even when local development hasn't configured Supabase yet so the
// app can render in a graceful offline/demo mode instead of crashing at import time.
export const supabase = createClient(resolvedUrl, resolvedKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
