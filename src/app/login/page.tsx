'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { playSound } from '@/lib/sound';
import { LogIn, UserCheck, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [loading, user, router]);

  const handleGoogle = async () => {
    playSound('click', true);
    setError(null);
    setSubmitting(true);
    const result = await signInWithGoogle();
    if (result.error) {
      setError(result.error);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#191919] text-[#E3E3E3] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2 select-none">🎯</div>
          <h1 className="text-xl font-bold tracking-tight">RealityCheck</h1>
          <p className="text-xs text-[#838383] mt-1 font-mono">
            Objective Discipline Engine
          </p>
        </div>

        <div className="notion-panel p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-[#E3E3E3]">Operator Access</h2>
            <p className="text-[11px] text-[#838383] mt-1">
              Sign in with your Google account to automatically secure and synchronize your execution telemetry.
            </p>
          </div>

          <div className="p-3 rounded bg-[#202020] border border-[#373737] text-left text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#E3E3E3]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#337EA9]" />
              <span>Configured Operator Account</span>
            </div>
            <p className="font-mono text-[11px] text-[#337EA9]">suriya.thittani@gmail.com</p>
            <p className="text-[10px] text-[#838383]">
              Cloud saves &amp; cross-device sync are automatically bound to your Google account. No manual database setup required.
            </p>
          </div>

          {error && (
            <div className="p-2.5 rounded bg-[#2b1f13] border border-[#6b4119] text-[11px] text-[#D9730D]">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogle}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded bg-[#337EA9] hover:bg-[#286a91] text-white text-xs font-medium transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span>{submitting ? 'Authenticating…' : 'Continue with Google'}</span>
          </button>

          <button
            onClick={() => {
              playSound('click', true);
              router.replace('/');
            }}
            className="w-full text-[11px] text-[#838383] hover:text-[#CCCCCC] underline flex items-center justify-center gap-1"
          >
            <UserCheck className="w-3 h-3" />
            <span>Continue as Suriya (Offline / Local)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
