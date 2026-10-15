'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCloudSync } from '@/hooks/useCloudSync';
import { StorageService } from '@/lib/storage';
import { Zap, Cloud, CloudOff, RefreshCw, Check, SlidersHorizontal, User } from 'lucide-react';
import { FrictionKillerModal } from './FrictionKillerModal';

interface TopHeaderProps {
  pageTitle?: string;
  icon?: string;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ pageTitle = 'Execution Hub', icon = '🎯' }) => {
  const { isOnline, syncStatus, triggerSync } = useCloudSync();
  const [timeStr, setTimeStr] = useState<string>('');
  const [isFrictionOpen, setIsFrictionOpen] = useState(false);
  const [operatorName, setOperatorName] = useState<string>('');
  const [isOnboarded, setIsOnboarded] = useState<boolean>(true);

  useEffect(() => {
    const profile = StorageService.getUserProfile();
    setOperatorName(profile.name || 'Operator');
    setIsOnboarded(StorageService.isOnboarded());

    const updateTime = () => {
      setTimeStr(
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className="border-b border-[#373737] bg-[#191919] sticky top-0 z-40 px-4 py-2.5">
        <div className="max-w-2xl mx-auto flex items-center justify-between text-xs">
          {/* Breadcrumb / Title */}
          <div className="flex items-center gap-2">
            <span className="text-base select-none">{icon}</span>
            <div className="flex items-center gap-1.5 font-medium text-[#E3E3E3]">
              <span className="text-[#838383]">RealityCheck</span>
              <span className="text-[#4D4D4D]">/</span>
              <span>{pageTitle}</span>
            </div>
          </div>

          {/* Right Status Group */}
          <div className="flex items-center gap-2.5">
            {/* Live Clock */}
            <span className="font-mono text-[#838383] text-[11px] hidden sm:inline">
              {timeStr}
            </span>

            {/* Operator name chip linking to prerequisites */}
            {operatorName && (
              <Link
                href="/signup"
                className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-[#202020] border border-[#373737] text-[#838383] hover:text-[#E3E3E3] hover:border-[#4D4D4D] transition-colors"
                title="Edit Prerequisite Configuration"
              >
                <User className="w-2.5 h-2.5" />
                <span className="font-medium">{operatorName}</span>
                {!isOnboarded && (
                  <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-[#D9730D] shrink-0" title="Setup incomplete" />
                )}
              </Link>
            )}

            {/* Offline-First / Cloud Sync Status */}
            <button
              onClick={() => triggerSync()}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] bg-[#202020] border border-[#373737] text-[#838383] hover:text-[#E3E3E3] transition-colors"
              title={
                syncStatus === 'synced'
                  ? 'Synced with Supabase'
                  : syncStatus === 'offline'
                  ? 'Offline: Writes saved locally to IndexedDB'
                  : 'Dexie IndexedDB Active'
              }
            >
              {syncStatus === 'synced' ? (
                <>
                  <Check className="w-2.5 h-2.5 text-[#446B5E]" />
                  <span className="text-[#446B5E]">Synced</span>
                </>
              ) : syncStatus === 'syncing' ? (
                <>
                  <RefreshCw className="w-2.5 h-2.5 animate-spin text-[#337EA9]" />
                  <span className="text-[#337EA9]">Syncing</span>
                </>
              ) : syncStatus === 'offline' ? (
                <>
                  <CloudOff className="w-2.5 h-2.5 text-[#D9730D]" />
                  <span className="text-[#D9730D]">Offline</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#337EA9]" />
                  <span>IndexedDB</span>
                </>
              )}
            </button>

            {/* Prerequisites config shortcut */}
            <Link
              href="/signup"
              className="px-2 py-0.5 rounded text-[10px] bg-[#202020] border border-[#373737] text-[#838383] hover:text-[#E3E3E3] hover:border-[#4D4D4D] transition-colors flex items-center gap-1"
              title="Prerequisite Configuration"
            >
              <SlidersHorizontal className="w-2.5 h-2.5" />
              <span className="hidden sm:inline">Setup</span>
            </Link>

            {/* Kinetic Scan Trigger */}
            <button
              onClick={() => setIsFrictionOpen(true)}
              className="px-2 py-0.5 rounded text-[10px] bg-[#252525] hover:bg-[#2e2e2e] border border-[#373737] text-[#D9730D] flex items-center gap-1 transition-colors font-medium"
              title="2-Minute Kinetic Reset"
            >
              <Zap className="w-2.5 h-2.5 text-[#D9730D]" />
              <span>Scan</span>
            </button>
          </div>
        </div>
      </header>

      <FrictionKillerModal
        isOpen={isFrictionOpen}
        soundEnabled={true}
        onClose={() => setIsFrictionOpen(false)}
      />
    </>
  );
};
