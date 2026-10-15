'use client';

import React, { useEffect, useState } from 'react';
import { ScheduleBlock } from '@/types';
import { formatMinutesCountdown, getCurrentAndNextBlock } from '@/lib/date-utils';
import { playSound } from '@/lib/sound';
import { useCloudSync } from '@/hooks/useCloudSync';
import {
  Clock,
  Volume2,
  VolumeX,
  Zap,
  Settings as SettingsIcon,
  Activity,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface HeaderHUDProps {
  scheduleBlocks: ScheduleBlock[];
  soundEnabled: boolean;
  militaryTime: boolean;
  onToggleSound: () => void;
  onOpenFrictionKiller: () => void;
  onOpenSettings: () => void;
  selectedDate: string;
  todayDate: string;
  onSelectDate: (date: string) => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  scheduleBlocks,
  soundEnabled,
  militaryTime,
  onToggleSound,
  onOpenFrictionKiller,
  onOpenSettings,
  selectedDate,
  todayDate,
  onSelectDate,
}) => {
  const { isOnline, syncStatus, pendingCount, lastError, triggerSync } = useCloudSync();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [showSyncError, setShowSyncError] = useState(false);

  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const now = currentTime || new Date();
  const { currentBlock, nextBlock, minutesToNext } = getCurrentAndNextBlock(scheduleBlocks, now);

  const isToday = selectedDate === todayDate;

  const timeString = now.toLocaleTimeString([], {
    hour12: !militaryTime,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
      {/* Top Banner / System Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between py-3 gap-3">
          
          {/* Logo & Operational ID */}
          <div className="flex items-center justify-between md:justify-start gap-4">
            <div className="flex items-center gap-2.5">
              <button
                onClick={async () => {
                  playSound('click', soundEnabled);
                  const result = await triggerSync();
                  if (result.error) {
                    setShowSyncError(true);
                    setTimeout(() => setShowSyncError(false), 6000);
                  }
                }}
                className="flex items-center gap-1.5 group"
                title={
                  syncStatus === 'synced'
                    ? 'Cloud synced'
                    : syncStatus === 'syncing'
                    ? 'Syncing…'
                    : syncStatus === 'offline'
                    ? 'Offline — queued locally'
                    : syncStatus === 'error'
                    ? 'Sync error — retry'
                    : 'Local-only mode'
                }
              >
                <span
                  className={`w-3 h-3 rounded-xs transition-colors ${
                    syncStatus === 'synced'
                      ? 'bg-[#446B5E]'
                      : syncStatus === 'syncing'
                      ? 'bg-[#337EA9] animate-pulse'
                      : syncStatus === 'offline' || syncStatus === 'error'
                      ? 'bg-[#D9730D]'
                      : 'bg-zinc-600'
                  }`}
                />
                {pendingCount > 0 && (
                  <span className="text-[10px] font-mono text-[#D9730D]">
                    {pendingCount}
                  </span>
                )}
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs tracking-wider text-emerald-400 font-semibold uppercase">
                    RealityCheck
                  </span>
                  <span className="text-zinc-600 font-mono text-[10px]">v1.0</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-900 border border-zinc-800 text-zinc-400">
                    SCAN & EXECUTE
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 font-mono hidden sm:block">
                  {isOnline ? 'Objective Discipline Engine • Zero-Passivity' : 'Offline — Local Queue Active'}
                </p>
              </div>
            </div>

            {/* Quick Mobile Controls */}
            <div className="flex items-center gap-1.5 md:hidden">
              <button
                onClick={() => {
                  playSound('click', soundEnabled);
                  onToggleSound();
                }}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded bg-zinc-900 text-xs"
                title="Toggle Sound"
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-600" />}
              </button>
              <button
                onClick={() => {
                  playSound('click', soundEnabled);
                  onOpenFrictionKiller();
                }}
                className="px-2 py-1 bg-amber-500/10 border border-amber-500/40 text-amber-400 hover:bg-amber-500/20 rounded font-mono text-xs flex items-center gap-1"
              >
                <Zap className="w-3 h-3" />
                <span>SCAN</span>
              </button>
            </div>
          </div>

          {/* Central Live HUD: Current Block & Next Milestone */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 bg-zinc-900/70 border border-zinc-800/80 rounded-md px-3 py-1.5 font-mono text-xs">
            {/* Live Clock */}
            <div className="flex items-center gap-1.5 text-zinc-200 font-mono font-medium">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span className="tracking-widest">{timeString}</span>
            </div>

            <div className="h-3 w-px bg-zinc-800 hidden sm:block" />

            {/* Active Anchor Block */}
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500 uppercase text-[10px] tracking-wider">Active:</span>
              <span className="text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded text-[11px]">
                {currentBlock.title} ({currentBlock.displayTime})
              </span>
            </div>

            <div className="h-3 w-px bg-zinc-800 hidden sm:block" />

            {/* Next Milestone Countdown */}
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="text-zinc-500 uppercase text-[10px] tracking-wider">Next:</span>
              <span className="text-zinc-300 font-medium">{nextBlock.title}</span>
              <span className="text-zinc-500">in</span>
              <span className="text-amber-400 font-semibold">{formatMinutesCountdown(minutesToNext)}</span>
            </div>
          </div>

          {/* Right Action Cluster */}
          <div className="hidden md:flex items-center gap-2">
            {/* 2-Minute Friction Scan */}
            <button
              onClick={() => {
                playSound('click', soundEnabled);
                onOpenFrictionKiller();
              }}
              className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 text-amber-300 rounded font-mono text-xs flex items-center gap-1.5 transition-colors"
              title="Trigger 2-Minute Anti-Passivity Scan"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>FRICTION SCAN</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={() => {
                playSound('click', soundEnabled);
                onToggleSound();
              }}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 rounded bg-zinc-900 transition-colors"
              title={soundEnabled ? 'Mute Interface Clicks' : 'Enable Tactile Audio Clicks'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-zinc-500" />
              )}
            </button>

            {/* Config & Settings */}
            <button
              onClick={() => {
                playSound('click', soundEnabled);
                onOpenSettings();
              }}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 rounded bg-zinc-900 transition-colors"
              title="Protocol Configuration & Export"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Sync Error Banner */}
        {showSyncError && lastError && (
          <div className="pb-2 flex items-center justify-between text-xs font-mono bg-zinc-900/60 border border-amber-900/40 text-amber-300 px-3 py-1.5 rounded mb-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>SYNC: {lastError}</span>
            </div>
            <button
              onClick={() => setShowSyncError(false)}
              className="underline text-zinc-300 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Date Context Indicator (If user is viewing a past date) */}
        {!isToday && (
          <div className="pb-2 flex items-center justify-between text-xs font-mono bg-zinc-900/60 border border-amber-900/40 text-amber-300 px-3 py-1.5 rounded mb-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>INSPECTING HISTORICAL LOG: <strong>{selectedDate}</strong></span>
            </div>
            <button
              onClick={() => {
                playSound('click', soundEnabled);
                onSelectDate(todayDate);
              }}
              className="underline text-zinc-300 hover:text-white"
            >
              Return to Live Execution (Today)
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
