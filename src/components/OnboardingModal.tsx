'use client';

import React, { useState } from 'react';
import { StorageService } from '@/lib/storage';
import { UserProfile } from '@/types';
import { playSound } from '@/lib/sound';
import {
  Sparkles,
  User,
  Clock,
  Heart,
  CheckSquare,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Check,
  Cloud,
  WifiOff,
} from 'lucide-react';

const FOCUS_OPTIONS = [
  'Personal Discipline',
  'Relationship Leadership',
  'Nutritional Consistency',
  'Household Accountability',
];

const DEFAULT_CHORES = [
  'Morning Sink Clear & Dry',
  'Kitchen Counter Sanitized',
  'Desk & Workspace Reset',
  'Evening Sink Zero',
];

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (profile: UserProfile) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
}) => {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [name, setName] = useState('');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isOfflineOnly, setIsOfflineOnly] = useState(false);

  // Step 2
  const [morningReset, setMorningReset] = useState('08:00');
  const [breakfast, setBreakfast] = useState('08:30');
  const [lunch, setLunch] = useState('13:00');
  const [eveningReset, setEveningReset] = useState('18:30');
  const [dayClosure, setDayClosure] = useState('22:30');

  // Step 3
  const [partnerName, setPartnerName] = useState('Partner');
  const [momName, setMomName] = useState('Mom');
  const [dateIntervalDays, setDateIntervalDays] = useState(14);
  const [gestureIntervalDays, setGestureIntervalDays] = useState(14);
  const [momCheckinIntervalDays, setMomCheckinIntervalDays] = useState(3);

  // Step 4
  const [chores, setChores] = useState<string[]>(DEFAULT_CHORES);
  const [newChore, setNewChore] = useState('');

  if (!isOpen) return null;

  const toggleFocus = (area: string) => {
    playSound('click', true);
    setFocusAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const validateStep = (): boolean => {
    setError(null);
    if (step === 1) {
      if (!name.trim()) {
        setError('Call-sign / Name is required.');
        playSound('error', true);
        return false;
      }
      if (focusAreas.length === 0) {
        setError('Select at least one Primary Focus Target.');
        playSound('error', true);
        return false;
      }
      if (!isOfflineOnly && (!email.trim() || !password.trim())) {
        setError('Enter email & password, or enable Local-Only mode.');
        playSound('error', true);
        return false;
      }
    }
    if (step === 4 && chores.length === 0) {
      setError('Add at least one micro-chore.');
      playSound('error', true);
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    playSound('click', true);
    setStep((s) => Math.min(4, s + 1));
  };

  const handleBack = () => {
    playSound('click', true);
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  const handleAddChore = () => {
    if (!newChore.trim()) return;
    playSound('click', true);
    setChores((prev) => [...prev, newChore.trim()]);
    setNewChore('');
  };

  const handleRemoveChore = (idx: number) => {
    playSound('click', true);
    setChores((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleEditChore = (idx: number, value: string) => {
    setChores((prev) => prev.map((c, i) => (i === idx ? value : c)));
  };

  const handleFinish = () => {
    if (!validateStep()) return;

    const profile: UserProfile = {
      name: name.trim(),
      email: email.trim() || undefined,
      focusAreas,
      isOfflineOnly,
      partnerName: partnerName.trim() || 'Partner',
      partnerCadenceDays: Math.max(1, dateIntervalDays),
      motherName: momName.trim() || 'Mom',
      motherCadenceDays: Math.max(1, momCheckinIntervalDays),
      anchors: {
        morningReset,
        breakfast,
        lunch,
        eveningReset,
        dayClosure,
      },
      cadences: {
        partnerName: partnerName.trim() || 'Partner',
        momName: momName.trim() || 'Mom',
        dateIntervalDays: Math.max(1, dateIntervalDays),
        gestureIntervalDays: Math.max(1, gestureIntervalDays),
        momCheckinIntervalDays: Math.max(1, momCheckinIntervalDays),
      },
      chores,
      createdAt: new Date().toISOString(),
      onboarded: true,
      onboardingCompleted: true,
      onboardedAt: new Date().toISOString(),
    };

    StorageService.saveOnboardingProfile(profile);
    playSound('execute', true);
    onComplete(profile);
  };

  const inputClass =
    'w-full bg-[#191919] border border-[#373737] text-white focus:border-[#337EA9] rounded px-3 py-2 text-xs outline-none transition-colors placeholder-[#5a5a5a]';
  const labelClass =
    'block text-[10px] uppercase font-semibold text-[#838383] mb-1 tracking-wider';

  const steps = [
    { id: 1, label: 'Identity', icon: User },
    { id: 2, label: 'Anchors', icon: Clock },
    { id: 3, label: 'Cadence', icon: Heart },
    { id: 4, label: 'Chores', icon: CheckSquare },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#191919]/80 backdrop-blur-md">
      <div className="bg-[#252525] border border-[#373737] rounded-lg p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-2 pb-4 border-b border-[#373737]">
          <span className="p-1.5 rounded bg-[#191919] text-[#337EA9]">
            <Sparkles className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-white">
              Baseline Setup
            </h2>
            <p className="text-[10px] text-[#838383] font-mono">
              Step {step} of 4 — {steps[step - 1].label}
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-1.5 mt-4 mb-5">
          {steps.map((s) => {
            const Icon = s.icon;
            const active = s.id === step;
            const done = s.id < step;
            return (
              <div key={s.id} className="flex-1 flex items-center gap-1.5">
                <div
                  className={`flex items-center justify-center w-6 h-6 rounded-full border text-[10px] font-semibold transition-colors ${
                    active
                      ? 'bg-[#337EA9] border-[#337EA9] text-white'
                      : done
                      ? 'bg-[#2B593F] border-[#2B593F] text-white'
                      : 'bg-[#191919] border-[#373737] text-[#838383]'
                  }`}
                >
                  {done ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                </div>
                {s.id < 4 && (
                  <div
                    className={`flex-1 h-px ${
                      done ? 'bg-[#2B593F]' : 'bg-[#373737]'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Call-sign / Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex"
                className={inputClass}
                autoFocus
              />
            </div>

            <div>
              <label className={labelClass}>Primary Focus Targets</label>
              <div className="grid grid-cols-2 gap-2">
                {FOCUS_OPTIONS.map((opt) => {
                  const selected = focusAreas.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleFocus(opt)}
                      className={`p-2 rounded border text-left text-[11px] transition-colors ${
                        selected
                          ? 'bg-[#1e2f26] border-[#2B593F] text-[#7ec9a3] font-semibold'
                          : 'bg-[#191919] border-[#373737] text-[#838383] hover:text-white'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3 rounded bg-[#191919] border border-[#373737] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isOfflineOnly ? (
                    <WifiOff className="w-3.5 h-3.5 text-[#D9730D]" />
                  ) : (
                    <Cloud className="w-3.5 h-3.5 text-[#337EA9]" />
                  )}
                  <span className="text-[11px] font-semibold text-white">
                    {isOfflineOnly ? 'Local-Only (Offline Mode)' : 'Cloud Sync (Supabase)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', true);
                    setIsOfflineOnly((v) => !v);
                  }}
                  className={`relative w-9 h-5 rounded-full transition-colors ${
                    isOfflineOnly ? 'bg-[#D9730D]' : 'bg-[#337EA9]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                      isOfflineOnly ? 'left-0.5' : 'left-[18px]'
                    }`}
                  />
                </button>
              </div>

              {!isOfflineOnly && (
                <div className="space-y-2 pt-1">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className={inputClass}
                  />
                  <p className="text-[10px] text-[#838383]">
                    Credentials are used for Supabase auth. You can also sign in with Google later.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-3">
            <p className="text-[11px] text-[#838383]">
              Set exact target times for your daily anchors. These drive the Execution Hub timeline.
            </p>
            {[
              { label: 'Morning Reset', value: morningReset, set: setMorningReset },
              { label: 'Breakfast Block', value: breakfast, set: setBreakfast },
              { label: 'Lunch Block', value: lunch, set: setLunch },
              { label: 'Evening Reset & Dinner', value: eveningReset, set: setEveningReset },
              { label: 'Day Closure & Kitchen Reset', value: dayClosure, set: setDayClosure },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3">
                <label className="text-[11px] text-white flex-1">{row.label}</label>
                <input
                  type="time"
                  value={row.value}
                  onChange={(e) => row.set(e.target.value)}
                  className="bg-[#191919] border border-[#373737] text-white focus:border-[#337EA9] rounded px-3 py-1.5 text-xs outline-none font-mono"
                />
              </div>
            ))}
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Partner Name</label>
                <input
                  type="text"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Mother / Family</label>
                <input
                  type="text"
                  value={momName}
                  onChange={(e) => setMomName(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className={labelClass}>Date Plan (days)</label>
                <input
                  type="number"
                  min={1}
                  value={dateIntervalDays}
                  onChange={(e) => setDateIntervalDays(Number(e.target.value) || 1)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Gesture (days)</label>
                <input
                  type="number"
                  min={1}
                  value={gestureIntervalDays}
                  onChange={(e) => setGestureIntervalDays(Number(e.target.value) || 1)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Family (days)</label>
                <input
                  type="number"
                  min={1}
                  value={momCheckinIntervalDays}
                  onChange={(e) => setMomCheckinIntervalDays(Number(e.target.value) || 1)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <div className="space-y-3">
            <p className="text-[11px] text-[#838383]">
              Non-negotiable daily micro-chores. Edit, add, or remove as needed.
            </p>

            <div className="space-y-2">
              {chores.map((chore, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={chore}
                    onChange={(e) => handleEditChore(idx, e.target.value)}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveChore(idx)}
                    className="p-2 text-[#838383] hover:text-[#EB5757] transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newChore}
                onChange={(e) => setNewChore(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChore();
                  }
                }}
                placeholder="Add a new micro-chore..."
                className={inputClass}
              />
              <button
                type="button"
                onClick={handleAddChore}
                className="p-2 bg-[#191919] border border-[#373737] rounded text-[#337EA9] hover:border-[#337EA9] transition-colors"
                title="Add"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-2.5 rounded bg-[#2b1f13] border border-[#6b4119] text-[11px] text-[#D9730D]">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-[#373737] flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1}
            className={`flex items-center gap-1 px-3 py-2 rounded text-xs font-medium transition-colors ${
              step === 1
                ? 'text-[#4D4D4D] cursor-not-allowed'
                : 'text-[#838383] hover:text-white'
            }`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1 bg-[#337EA9] hover:bg-[#2B6B90] text-white font-medium py-2 px-4 rounded transition-colors text-xs"
            >
              Continue
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="flex items-center gap-1 bg-[#337EA9] hover:bg-[#2B6B90] text-white font-medium py-2 px-4 rounded transition-colors text-xs"
            >
              <Check className="w-3.5 h-3.5" />
              Complete Setup
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
