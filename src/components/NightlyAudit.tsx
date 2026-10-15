'use client';

import React, { useState } from 'react';
import { NightlyAuditRecord } from '@/types';
import { playSound } from '@/lib/sound';
import { formatFriendlyDate, getPastNDays, getTodayString } from '@/lib/date-utils';
import {
  ClipboardCheck,
  Check,
  X,
  Calendar,
  Sparkles,
  Info,
  ShieldCheck,
  BarChart3,
  HelpCircle
} from 'lucide-react';

interface NightlyAuditProps {
  audits: NightlyAuditRecord[];
  selectedDate: string;
  todayDate: string;
  soundEnabled: boolean;
  onRecordAudit: (audit: Omit<NightlyAuditRecord, 'id' | 'completedAt'>) => void;
  onSelectDate: (date: string) => void;
}

export const NightlyAudit: React.FC<NightlyAuditProps> = ({
  audits,
  selectedDate,
  todayDate,
  soundEnabled,
  onRecordAudit,
  onSelectDate,
}) => {
  const isToday = selectedDate === todayDate;

  // Existing audit for selected date
  const selectedAudit = audits.find((a) => a.date === selectedDate);

  // Form states initialized with current audit or default
  const [mealsYes, setMealsYes] = useState<boolean | null>(
    selectedAudit ? selectedAudit.adheredToMealSchedule : null
  );
  const [choresYes, setChoresYes] = useState<boolean | null>(
    selectedAudit ? selectedAudit.completedChoresUnprompted : null
  );
  const [composureYes, setComposureYes] = useState<boolean | null>(
    selectedAudit ? selectedAudit.maintainedComposure : null
  );
  const [observation, setObservation] = useState<string>(
    selectedAudit?.objectiveObservation || ''
  );
  const [inspectionAudit, setInspectionAudit] = useState<NightlyAuditRecord | null>(null);

  // Sync state if selectedDate changes
  React.useEffect(() => {
    const existing = audits.find((a) => a.date === selectedDate);
    if (existing) {
      setMealsYes(existing.adheredToMealSchedule);
      setChoresYes(existing.completedChoresUnprompted);
      setComposureYes(existing.maintainedComposure);
      setObservation(existing.objectiveObservation || '');
    } else {
      setMealsYes(null);
      setChoresYes(null);
      setComposureYes(null);
      setObservation('');
    }
  }, [selectedDate, audits]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mealsYes === null || choresYes === null || composureYes === null) {
      playSound('error', soundEnabled);
      return;
    }

    playSound('execute', soundEnabled);
    onRecordAudit({
      date: selectedDate,
      adheredToMealSchedule: mealsYes,
      completedChoresUnprompted: choresYes,
      maintainedComposure: composureYes,
      objectiveObservation: observation.trim() || undefined,
    });
  };

  // 30-day streak matrix
  const past30Days = getPastNDays(30);

  // Stats calculation
  const totalLogged = audits.length;
  const perfectDays = audits.filter(
    (a) => a.adheredToMealSchedule && a.completedChoresUnprompted && a.maintainedComposure
  ).length;
  const composureRate =
    totalLogged > 0
      ? Math.round(
          (audits.filter((a) => a.maintainedComposure).length / totalLogged) * 100
        )
      : 0;
  const mealRate =
    totalLogged > 0
      ? Math.round(
          (audits.filter((a) => a.adheredToMealSchedule).length / totalLogged) * 100
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="border border-zinc-800 bg-zinc-900/40 rounded-lg p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-zinc-800 text-indigo-400">
                <ClipboardCheck className="w-4 h-4" />
              </span>
              <h2 className="font-mono text-base font-bold tracking-tight text-zinc-100 uppercase">
                Zero-Guilt Reflection & Audit Log
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Nightly 2-minute objective check-in. 3 binary questions. Zero guilt, raw data.
            </p>
          </div>

          <div className="font-mono text-xs flex items-center gap-4">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase block">Composure Rate</span>
              <span className="text-emerald-400 font-semibold">{composureRate}%</span>
            </div>
            <div className="h-6 w-px bg-zinc-800" />
            <div>
              <span className="text-[10px] text-zinc-500 uppercase block">Meal Adherence</span>
              <span className="text-indigo-400 font-semibold">{mealRate}%</span>
            </div>
          </div>
        </div>

        {/* Philosophy Note */}
        <div className="mt-4 p-3 rounded bg-zinc-950 border border-zinc-800/80 text-xs font-mono text-zinc-400 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px]">
            <strong className="text-zinc-200">The Zero-Guilt Standard:</strong> An audit is an objective instrument, not a moral trial. A "No" is simply an operational signal indicating where friction occurred—so you can adjust your environment tomorrow.
          </p>
        </div>

        {/* 30-Day Consistency Grid (Quiet Streak Blocks) */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3 font-mono text-xs">
            <span className="text-zinc-400 uppercase tracking-wider font-semibold text-[11px] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              30-Day Consistency Grid
            </span>
            <div className="flex items-center gap-3 text-[10px] text-zinc-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" /> 3/3 Compliant
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-600/80" /> 1-2/3 Partial
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-zinc-800" /> 0/3 Missed
              </span>
            </div>
          </div>

          {/* Grid Blocks */}
          <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-15 gap-1.5 font-mono text-xs">
            {past30Days.map((dateStr) => {
              const audit = audits.find((a) => a.date === dateStr);
              let score = 0;
              if (audit) {
                if (audit.adheredToMealSchedule) score++;
                if (audit.completedChoresUnprompted) score++;
                if (audit.maintainedComposure) score++;
              }

              const isSelected = dateStr === selectedDate;
              const isCurrentDay = dateStr === todayDate;

              let blockColor = 'bg-zinc-900 border-zinc-800 text-zinc-600 hover:border-zinc-700';
              if (audit) {
                if (score === 3) {
                  blockColor = 'bg-emerald-600/90 border-emerald-500 text-emerald-100';
                } else if (score > 0) {
                  blockColor = 'bg-amber-600/70 border-amber-500 text-amber-100';
                } else {
                  blockColor = 'bg-zinc-800 border-zinc-700 text-zinc-400';
                }
              }

              return (
                <button
                  key={dateStr}
                  onClick={() => {
                    playSound('click', soundEnabled);
                    onSelectDate(dateStr);
                    if (audit) setInspectionAudit(audit);
                  }}
                  className={`h-11 rounded p-1 flex flex-col justify-between text-left border transition-all relative ${blockColor} ${
                    isSelected ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-zinc-950 scale-105 z-10' : ''
                  }`}
                  title={`${dateStr}: ${audit ? `${score}/3 Compliant` : 'Not recorded'}`}
                >
                  <div className="flex items-center justify-between text-[9px] opacity-80 leading-none">
                    <span>{dateStr.split('-')[2]}</span>
                    {isCurrentDay && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                  </div>
                  <div className="text-[10px] font-bold leading-none">
                    {audit ? `${score}/3` : '—'}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] font-mono text-zinc-500 mt-2 text-right">
            Click any block to inspect or edit that day's objective audit
          </p>
        </div>
      </div>

      {/* The 3-Question Nightly Check-In Form */}
      <div className="border border-zinc-800 bg-zinc-950 rounded-lg p-4 sm:p-5">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
          <div>
            <h3 className="font-mono text-sm font-bold text-zinc-100 uppercase tracking-wider">
              {isToday ? 'Tonight\'s 2-Minute Audit' : `Audit Record for ${formatFriendlyDate(selectedDate)}`}
            </h3>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">
              3 binary sensors. Answer honestly without judgment.
            </p>
          </div>

          {selectedAudit && (
            <span className="font-mono text-xs text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              RECORDED
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          {/* Question 1: Meals */}
          <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                Question 01 // Routine
              </span>
              <p className="text-zinc-200 font-medium">
                Did you adhere to the 3-meal schedule? (Breakfast 8:30, Lunch 1:00, Dinner 6:30)
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  setMealsYes(true);
                }}
                className={`px-3 py-1.5 rounded border transition-all font-semibold ${
                  mealsYes === true
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                YES
              </button>
              <button
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  setMealsYes(false);
                }}
                className={`px-3 py-1.5 rounded border transition-all font-semibold ${
                  mealsYes === false
                    ? 'bg-zinc-700 border-zinc-600 text-white'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                NO
              </button>
            </div>
          </div>

          {/* Question 2: Chores Unprompted */}
          <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                Question 02 // Initiative
              </span>
              <p className="text-zinc-200 font-medium">
                Did you complete chores without being prompted or reminded?
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  setChoresYes(true);
                }}
                className={`px-3 py-1.5 rounded border transition-all font-semibold ${
                  choresYes === true
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                YES
              </button>
              <button
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  setChoresYes(false);
                }}
                className={`px-3 py-1.5 rounded border transition-all font-semibold ${
                  choresYes === false
                    ? 'bg-zinc-700 border-zinc-600 text-white'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                NO
              </button>
            </div>
          </div>

          {/* Question 3: Composure & Defensiveness */}
          <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                Question 03 // Emotional Discipline
              </span>
              <p className="text-zinc-200 font-medium">
                Did you maintain composure and avoid defensiveness today?
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  setComposureYes(true);
                }}
                className={`px-3 py-1.5 rounded border transition-all font-semibold ${
                  composureYes === true
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                YES
              </button>
              <button
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  setComposureYes(false);
                }}
                className={`px-3 py-1.5 rounded border transition-all font-semibold ${
                  composureYes === false
                    ? 'bg-zinc-700 border-zinc-600 text-white'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                NO
              </button>
            </div>
          </div>

          {/* Optional Objective Observation */}
          <div>
            <label className="block text-zinc-400 uppercase text-[10px] mb-1 font-semibold">
              Objective Observation / Friction Point (Optional)
            </label>
            <input
              type="text"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="e.g., Felt defensive when questioned about dinner time. Paused 5 seconds before responding."
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 text-xs"
            />
          </div>

          {/* Save Button */}
          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-zinc-500">
              {mealsYes !== null && choresYes !== null && composureYes !== null
                ? 'All sensors answered. Ready to commit.'
                : 'Please answer all 3 questions to commit log.'}
            </span>

            <button
              type="submit"
              disabled={mealsYes === null || choresYes === null || composureYes === null}
              className={`px-4 py-2 rounded font-semibold text-xs transition-all ${
                mealsYes !== null && choresYes !== null && composureYes !== null
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-600 cursor-not-allowed'
              }`}
            >
              COMMIT AUDIT LOG
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
