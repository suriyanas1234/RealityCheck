'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { playSound } from '@/lib/sound';
import { LogIn, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, configured, signInWithGoogle } = useAuth();
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
            <h2 className="text-sm font-semibold text-[#E3E3E3]">Sign in</h2>
            <p className="text-[11px] text-[#838383] mt-1">
              Sign in to sync your execution telemetry across devices. You can also
              continue without an account — your data stays on this device.
            </p>
          </div>

          {!configured && (
            <div className="p-2.5 rounded bg-[#291f15] border border-[#523215] text-[11px] text-[#D9730D] flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                Supabase is not configured. Add your project URL and anon key in
                Settings to enable Google sign-in.
              </span>
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded bg-[#2b1f13] border border-[#6b4119] text-[11px] text-[#D9730D]">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogle}
            disabled={!configured || submitting}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded border text-xs font-medium transition-colors ${
              configured && !submitting
                ? 'bg-[#202020] hover:bg-[#282828] border-[#373737] text-[#E3E3E3]'
                : 'bg-[#202020] border-[#373737] text-[#838383] cursor-not-allowed'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{submitting ? 'Redirecting…' : 'Continue with Google'}</span>
          </button>

          <button
            onClick={() => {
              playSound('click', true);
              router.replace('/');
            }}
            className="w-full text-[11px] text-[#838383] hover:text-[#CCCCCC] underline"
          >
            Continue without an account
          </button>
        </div>
      </div>
    </div>
  );
}
