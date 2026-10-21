'use client';

import { useEffect, useState, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  getAuthClient,
  signInWithGoogle as doSignIn,
  signOut as doSignOut,
  DEFAULT_CREDENTIAL_USER,
} from '@/lib/auth';
import { StorageService } from '@/lib/storage';

export interface UseAuthResult {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const client = getAuthClient();
    setConfigured(true);

    if (!client) {
      // Local Google credential fallback
      const localAuth = localStorage.getItem('reality_check_auth_user');
      if (localAuth) {
        try {
          setUser(JSON.parse(localAuth));
        } catch {
          setUser(DEFAULT_CREDENTIAL_USER as unknown as User);
        }
      } else {
        setUser(DEFAULT_CREDENTIAL_USER as unknown as User);
        localStorage.setItem('reality_check_auth_user', JSON.stringify(DEFAULT_CREDENTIAL_USER));
      }
      setLoading(false);
      return;
    }

    let active = true;

    client.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session?.user) {
        setUser(data.session.user);
      } else {
        const localAuth = localStorage.getItem('reality_check_auth_user');
        if (localAuth) {
          try {
            setUser(JSON.parse(localAuth));
          } catch {
            setUser(DEFAULT_CREDENTIAL_USER as unknown as User);
          }
        } else {
          setUser(DEFAULT_CREDENTIAL_USER as unknown as User);
        }
      }
      setLoading(false);
    });

    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        const profile = StorageService.getUserProfile();
        if (session.user.email) {
          StorageService.saveUserProfile({
            ...profile,
            email: session.user.email,
            name:
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              profile.name ||
              'Suriya',
          });
        }
      } else {
        setUser(null);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    return doSignIn();
  }, []);

  const signOut = useCallback(async () => {
    await doSignOut();
    setUser(null);
  }, []);

  return { user, loading, configured, signInWithGoogle, signOut };
}
