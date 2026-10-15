'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const PUBLIC_ROUTES = ['/login'];

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, configured } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!configured) return; // Supabase not set up — allow offline/local-only use
    const isPublic = PUBLIC_ROUTES.some((r) => pathname?.startsWith(r));
    if (!user && !isPublic) {
      router.replace('/login');
    }
  }, [user, loading, configured, pathname, router]);

  return <>{children}</>;
};
