'use client';

import React, { useState } from 'react';
import { StorageService, DEFAULT_USER_PROFILE } from '@/lib/storage';
import { UserProfile } from '@/types';
import { playSound } from '@/lib/sound';
import { Sparkles } from 'lucide-react';

interface OnboardingDialogProps {
  isOpen: boolean;
  onComplete: (profile: UserProfile) => void;
}

export const OnboardingDialog: React.FC<OnboardingDialogProps> = ({
  isOpen,
  onComplete,
}) => {
  const [name, setName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [partnerCadenceDays, setPartnerCadenceDays] = useState(14);
  const [motherName, setMotherName] = useState('');
  const [motherCadenceDays, setMotherCadenceDays] = useState(3);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name.');
      playSound('error', true);
      return;
    }

    const profile: UserProfile = {
      ...DEFAULT_USER_PROFILE,
      name: name.trim(),
      partnerName: partnerName.trim() || 'Partner',
      partnerCadenceDays: Math.max(1, partnerCadenceDays),
      motherName: motherName.trim() || 'Mother',
      motherCadenceDays: Math.max(1, motherCadenceDays),
      onboarded: true,
      onboardingCompleted: true,
      onboardedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    StorageService.saveUserProfile(profile);
    StorageService.setOnboarded(true);
    playSound('execute', true);
    onComplete(profile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="notion-panel bg-[#202020] border border-[#373737] rounded-lg max-w-md w-full p-5 shadow-2xl">
        <div className="flex items-center gap-2 pb-3 border-b border-[#373737]">
          <span className="p-1 rounded bg-[#191919] text-[#337EA9]">
            <Sparkles className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-[#E3E3E3]">
              Welcome — Set Up Your Protocol
            </h3>
            <p className="text-[10px] text-[#838383] font-mono">
              Takes 30 seconds. You can change this later in Settings.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="block text-[10px] uppercase font-semibold text-[#838383] mb-1">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex"
              className="w-full bg-[#191919] border border-[#373737] rounded px-3 py-1.5 text-xs text-[#E3E3E3] placeholder-[#838383] focus:outline-none focus:border-[#337EA9]"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-[10px] uppercase font-semibold text-[#838383] mb-1">
                Partner Name
              </label>
              <input
                type="text"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="Partner"
                className="w-full bg-[#191919] border border-[#373737] rounded px-3 py-1.5 text-xs text-[#E3E3E3] placeholder-[#838383] focus:outline-none focus:border-[#337EA9]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-semibold text-[#838383] mb-1">
                Cadence
              </label>
              <input
                type="number"
                min={1}
                value={partnerCadenceDays}
                onChange={(e) => setPartnerCadenceDays(Number(e.target.value) || 1)}
                className="w-full bg-[#191919] border border-[#373737] rounded px-2 py-1.5 text-xs text-[#E3E3E3] focus:outline-none focus:border-[#337EA9]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-[10px] uppercase font-semibold text-[#838383] mb-1">
                Mother Name
              </label>
              <input
                type="text"
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
                placeholder="Mother"
                className="w-full bg-[#191919] border border-[#373737] rounded px-3 py-1.5 text-xs text-[#E3E3E3] placeholder-[#838383] focus:outline-none focus:border-[#337EA9]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-semibold text-[#838383] mb-1">
                Cadence
              </label>
              <input
                type="number"
                min={1}
                value={motherCadenceDays}
                onChange={(e) => setMotherCadenceDays(Number(e.target.value) || 1)}
                className="w-full bg-[#191919] border border-[#373737] rounded px-3 py-1.5 text-xs text-[#E3E3E3] focus:outline-none focus:border-[#337EA9]"
              />
            </div>
          </div>

          {error && (
            <div className="text-[11px] text-[#D9730D]">{error}</div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#337EA9] hover:bg-[#286a91] text-white rounded text-xs font-medium"
            >
              Save &amp; Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
