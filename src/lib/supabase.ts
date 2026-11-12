import { createClient } from '@supabase/supabase-js';

export const readEnvValue = (value: string | undefined) => (typeof value === 'string' ? value.trim() : '');

export const resolveSupabaseConfig = (runtimeEnv?: Record<string, string | undefined>) => {
  const env = runtimeEnv ?? (
    typeof import.meta !== 'undefined' && import.meta && typeof import.meta.env === 'object'
      ? import.meta.env
      : {}
  );

  const configuredSupabaseUrl = readEnvValue(env.VITE_SUPABASE_URL);
  const configuredPublishableKey = readEnvValue(env.VITE_SUPABASE_PUBLISHABLE_KEY);
  const isConfigured = Boolean(
    configuredSupabaseUrl &&
    configuredPublishableKey &&
    /^https?:\/\//i.test(configuredSupabaseUrl)
  );

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
