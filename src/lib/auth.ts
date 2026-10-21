import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StorageService } from './storage';

export const DEFAULT_CREDENTIAL_USER = {
  id: 'user-suriya-thittani',
  email: 'suriya.thittani@gmail.com',
  user_metadata: {
    full_name: 'Suriya',
    name: 'Suriya',
    email: 'suriya.thittani@gmail.com',
  },
  app_metadata: { provider: 'google' },
};

let cachedClient: SupabaseClient | null = null;
let cachedKey = '';

function resolveConfig(): { url: string; anonKey: string } | null {
  const settings = StorageService.getSettings();
  const config = settings.supabaseConfig;
  const url = (config?.enabled && config?.url ? config.url : process.env.NEXT_PUBLIC_SUPABASE_URL)?.trim();
  const anonKey = (config?.enabled && config?.anonKey ? config.anonKey : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim();
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function getAuthClient(): SupabaseClient | null {
  const cfg = resolveConfig();
  if (!cfg) return null;
  const key = `${cfg.url}::${cfg.anonKey}`;
  if (cachedClient && cachedKey === key) return cachedClient;
  try {
    cachedClient = createClient(cfg.url, cfg.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    cachedKey = key;
    return cachedClient;
  } catch (e) {
    console.error('Invalid Supabase auth configuration:', e);
    return null;
  }
}

export async function signInWithGoogle(): Promise<{ error?: string }> {
  const client = getAuthClient();
  if (!client) {
    // Local Google credential fallback
    if (typeof window !== 'undefined') {
      localStorage.setItem('reality_check_auth_user', JSON.stringify(DEFAULT_CREDENTIAL_USER));
      window.location.href = '/';
    }
    return {};
  }
  const redirectTo =
    typeof window !== 'undefined' ? `${window.location.origin}/` : undefined;
  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
  if (error) return { error: error.message };
  return {};
}

export async function signOut(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('reality_check_auth_user');
  }
  const client = getAuthClient();
  if (!client) return;
  await client.auth.signOut();
}

export async function getCurrentUser() {
  const client = getAuthClient();
  if (client) {
    const { data } = await client.auth.getUser();
    if (data.user) return data.user;
  }
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('reality_check_auth_user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // ignore
      }
    }
  }
  return DEFAULT_CREDENTIAL_USER;
}
