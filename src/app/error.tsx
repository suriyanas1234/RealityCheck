'use client';

import React, { useEffect } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled app error caught by boundary:', error);
  }, [error]);

  const handleClearCacheAndReload = async () => {
    try {
      if (typeof window !== 'undefined' && 'caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
    } catch (e) {
      console.warn('Cache clearing error:', e);
    }
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#191919] text-[#E3E3E3] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-full bg-[#D9730D]/10 border border-[#D9730D]/30 flex items-center justify-center mb-4 text-[#D9730D]">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h2 className="text-lg font-bold text-[#E3E3E3] mb-1">Temporary Execution Interruption</h2>
      <p className="text-xs text-[#838383] max-w-sm mb-6 font-mono">
        {error?.message || 'A client-side initialization issue occurred.'}
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-[#337EA9] hover:bg-[#286a91] text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Try Again
        </button>

        <button
          onClick={handleClearCacheAndReload}
          className="px-4 py-2 bg-[#202020] hover:bg-[#2a2a2a] border border-[#373737] text-[#838383] hover:text-[#E3E3E3] rounded text-xs font-medium transition-colors"
        >
          Reset Cache &amp; Reload
        </button>
      </div>
    </div>
  );
}
