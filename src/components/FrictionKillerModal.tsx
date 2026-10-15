'use client';

import React, { useState, useEffect } from 'react';
import { playSound } from '@/lib/sound';
import { Zap, Check, ArrowRight, Play, RefreshCw, X } from 'lucide-react';

interface FrictionKillerModalProps {
  isOpen: boolean;
  soundEnabled: boolean;
  onClose: () => void;
  onJumpToTab?: (tab: string) => void;
}

export const FrictionKillerModal: React.FC<FrictionKillerModalProps> = ({
  isOpen,
  soundEnabled,
  onClose,
  onJumpToTab,
}) => {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => {
        playSound('click', soundEnabled);
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      playSound('bell', soundEnabled);
      setCountdown(null);
    }
    return () => clearTimeout(timer);
  }, [countdown, soundEnabled]);

  if (!isOpen) return null;

  const startCountdown = () => {
    playSound('execute', soundEnabled);
    setCountdown(5);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-amber-600/50 rounded-xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative font-mono text-zinc-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-amber-500/10 text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400">
                ANTI-PASSIVITY PROTOCOL
              </h3>
              <p className="text-[10px] text-zinc-500">
                2-Minute Kinetic Reset • Eliminate Hesitation
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playSound('click', soundEnabled);
              onClose();
            }}
            className="text-zinc-500 hover:text-zinc-300 text-xs p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tactical Steps */}
        <div className="mt-4 space-y-3 text-xs">
          {/* Step 1 */}
          <div
            onClick={() => setCurrentStep(1)}
            className={`p-3 rounded-lg border transition-all cursor-pointer ${
              currentStep === 1
                ? 'bg-zinc-900 border-amber-500/60 text-zinc-100'
                : 'bg-zinc-950/60 border-zinc-800 text-zinc-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-400 text-[10px] uppercase">
                Step 01 // Kinetic Shift
              </span>
              {currentStep > 1 && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </div>
            <p className="mt-1 font-medium text-zinc-200">
              Stand up immediately. Put both feet flat on the ground.
            </p>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Break seated paralysis. Do not look at phone notifications or browser tabs.
            </p>
          </div>

          {/* Step 2 */}
          <div
            onClick={() => setCurrentStep(2)}
            className={`p-3 rounded-lg border transition-all cursor-pointer ${
              currentStep === 2
                ? 'bg-zinc-900 border-amber-500/60 text-zinc-100'
                : 'bg-zinc-950/60 border-zinc-800 text-zinc-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-400 text-[10px] uppercase">
                Step 02 // Physiological Reset
              </span>
              {currentStep > 2 && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </div>
            <p className="mt-1 font-medium text-zinc-200">
              Drink 300ml of cold water & take 3 slow nasal breaths.
            </p>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Re-oxygenates prefrontal cortex, cutting through mental fog and dopamine craving.
            </p>
          </div>

          {/* Step 3 */}
          <div
            onClick={() => setCurrentStep(3)}
            className={`p-3 rounded-lg border transition-all cursor-pointer ${
              currentStep === 3
                ? 'bg-zinc-900 border-amber-500/60 text-zinc-100'
                : 'bg-zinc-950/60 border-zinc-800 text-zinc-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-400 text-[10px] uppercase">
                Step 03 // Single Kinetic Action
              </span>
            </div>
            <p className="mt-1 font-medium text-zinc-200">
              Execute ONE micro-item now: tap staple meal, wipe counter, or call mom.
            </p>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Zero deliberation. Action precedes motivation.
            </p>
          </div>
        </div>

        {/* 5-Second Launch Engine */}
        <div className="mt-5 p-4 rounded-lg bg-zinc-900/80 border border-zinc-800 text-center">
          {countdown !== null ? (
            <div className="space-y-1">
              <span className="text-[10px] text-amber-400 uppercase tracking-widest block font-bold">
                KINETIC LAUNCH SEQUENCE
              </span>
              <div className="text-4xl font-black text-amber-400 font-mono tracking-widest animate-pulse">
                {countdown === 0 ? 'MOVE NOW' : countdown}
              </div>
              <p className="text-[11px] text-zinc-400">
                {countdown === 0
                  ? 'Protocol active. Execute without hesitation.'
                  : 'On zero, move physically immediately.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-left">
                <span className="text-[10px] text-zinc-400 uppercase block font-semibold">
                  Rule of 5 Seconds
                </span>
                <span className="text-xs text-zinc-300">
                  Cut hesitation before your brain rationalizes passivity.
                </span>
              </div>
              <button
                onClick={startCountdown}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-amber-500/10 shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>START 5s COUNTDOWN</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
          <span>Scan & Execute System</span>
          <button
            onClick={() => {
              playSound('click', soundEnabled);
              onClose();
            }}
            className="text-zinc-400 hover:text-zinc-200 underline"
          >
            Dismiss Protocol
          </button>
        </div>
      </div>
    </div>
  );
};
