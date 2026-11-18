import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { checkSupabaseEnv, describeEnvGuardFailure } from './src/lib/envGuard.ts'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Resolve the same files Vite will use (.env, .env.local, .env.[mode], .env.[mode].local)
  // and fail closed before a dev server can reach an unintended project.
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const guard = checkSupabaseEnv({
    url: env.VITE_SUPABASE_URL,
    key: env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY,
    mode,
    command: command === 'build' ? 'build' : 'serve',
  })

  if (!guard.ok) {
    throw new Error(describeEnvGuardFailure(guard.reason ?? 'unknown', mode))
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    // Keep the dev origin deterministic so Supabase redirect allowlists stay exact.
    server: {
      port: 5173,
      strictPort: true,
    },
  }
})
