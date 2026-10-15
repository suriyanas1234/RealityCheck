'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, DbAudit, seedDatabaseIfEmpty } from '@/lib/db';
import { getTodayString, getPastNDays, formatFriendlyDate } from '@/lib/date-utils';
import { TopHeader } from '@/components/TopHeader';
import { playSound } from '@/lib/sound';
import {
  ShieldCheck,
  Check,
  X,
  Calendar,
  Sparkles,
  Info,
  HelpCircle,
  RotateCcw,
  Download
} from 'lucide-react';

export default function VaultHub() {
  const [mounted, setMounted] = useState(false);
  const [todayDate, setTodayDate] = useState('');
  const [selectedAuditDate, setSelectedAuditDate] = useState('');
  
  // 3 Binary Questions State
  const [mealsYes, setMealsYes] = useState<boolean | null>(null);
  const [choresYes, setChoresYes] = useState<boolean | null>(null);
  const [composureYes, setComposureYes] = useState<boolean | null>(null);
  const [observation, setObservation] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [past30Days, setPast30Days] = useState<string[]>([]);

  useEffect(() => {
    seedDatabaseIfEmpty();
    const d = new Date();
    const today = getTodayString(d);
    setTodayDate(today);
    setSelectedAuditDate(today);
    setPast30Days(getPastNDays(30));
    setMounted(true);
  }, []);

  const audits = useLiveQuery(() => db.audits.orderBy('date').reverse().toArray(), []);

  // Update form inputs when selectedAuditDate changes
  useEffect(() => {
    if (!selectedAuditDate || !audits) return;
    const existing = audits.find((a) => a.date === selectedAuditDate);
    if (existing) {
      setMealsYes(existing.adheredMeals);
      setChoresYes(existing.completedChores);
      setComposureYes(existing.maintainedComposure);
      setObservation(existing.observation || '');
      setIsSaved(true);
    } else {
      setMealsYes(null);
      setChoresYes(null);
      setComposureYes(null);
      setObservation('');
      setIsSaved(false);
    }
  }, [selectedAuditDate, audits]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mealsYes === null || choresYes === null || composureYes === null) {
      playSound('error', true);
      return;
    }

    playSound('execute', true);
    await db.audits.put({
      id: selectedAuditDate,
      date: selectedAuditDate,
      adheredMeals: mealsYes,
      completedChores: choresYes,
      maintainedComposure: composureYes,
      observation: observation.trim() || undefined,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    setIsSaved(true);
  };

  // Objective metrics calculation
  const totalLogged = audits?.length || 0;
  const perfectDaysCount = audits?.filter(
    (a) => a.adheredMeals && a.completedChores && a.maintainedComposure
  ).length || 0;
  const composureRate = totalLogged > 0
    ? Math.round(((audits?.filter((a) => a.maintainedComposure).length || 0) / totalLogged) * 100)
    : 0;
  const mealRate = totalLogged > 0
    ? Math.round(((audits?.filter((a) => a.adheredMeals).length || 0) / totalLogged) * 100)
    : 0;

  const handleExportData = async () => {
    const [allAudits, allMeals, allGestures, allChores, allProfiles] = await Promise.all([
      db.audits.toArray(),
      db.meals.toArray(),
      db.gestures.toArray(),
      db.chores.toArray(),
      db.user_profile.toArray(),
    ]);

    const backup = {
      version: '3.0',
      exportedAt: new Date().toISOString(),
      user_profile: allProfiles,
      meals: allMeals,
      initiative_ledger: allGestures,
      daily_audits: allAudits,
      chores: allChores,
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forge-telemetry-${todayDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
    playSound('execute', true);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#191919] text-[#838383] flex items-center justify-center text-xs">
        <span>Loading Consistency Vault...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#191919] text-[#E3E3E3]">
      <TopHeader pageTitle="Consistency Vault" icon="🏛️" />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        
        {/* Notion Page Header */}
        <div>
          <div className="text-4xl mb-2 select-none">🏛️</div>
          <h1 className="text-2xl font-bold tracking-tight text-[#E3E3E3]">
            Audit &amp; Consistency Vault
          </h1>
          <p className="text-xs text-[#838383] mt-1 font-mono">
            30-Day Execution Matrix • Zero-Guilt Telemetry
          </p>
          <div className="h-px bg-[#373737] w-full mt-4" />
        </div>

        {/* Notion Callout Box */}
        <div className="notion-callout">
          <span className="text-base select-none">📊</span>
          <div className="text-xs leading-relaxed text-[#CCCCCC]">
            <span className="font-semibold text-[#E3E3E3] block mb-0.5">
              The Zero-Guilt Standard
            </span>
            These 3 questions are binary sensors, not moral judgments. A "No" simply isolates an environmental friction point so you can calibrate your schedule tomorrow.
          </div>
        </div>

        {/* Objective Performance Header */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="notion-panel p-3 text-center">
            <span className="text-[10px] text-[#838383] uppercase block font-mono">3/3 Perfect Days</span>
            <span className="text-base font-bold text-[#E3E3E3]">{perfectDaysCount}</span>
          </div>
          <div className="notion-panel p-3 text-center">
            <span className="text-[10px] text-[#838383] uppercase block font-mono">Composure Rate</span>
            <span className="text-base font-bold text-[#337EA9]">{composureRate}%</span>
          </div>
          <div className="notion-panel p-3 text-center">
            <span className="text-[10px] text-[#838383] uppercase block font-mono">Meal Schedule</span>
            <span className="text-base font-bold text-[#446B5E]">{mealRate}%</span>
          </div>
        </div>

        {/* Notion-Style 30-Day Consistency Grid */}
        <div className="notion-panel p-4">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#373737]">
            <h3 className="text-xs uppercase tracking-wider text-[#838383] font-semibold">
              30-Day Consistency Matrix
            </h3>
            
            <div className="flex items-center gap-3 text-[10px] text-[#838383]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#2B593F]" /> 3/3 Solid
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#D9730D]" /> 1-2/3
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#202020] border border-[#373737]" /> Incomplete
              </span>
            </div>
          </div>

          {/* Empty State */}
          {(!audits || audits.length === 0) && (
            <div className="notion-callout mb-3">
              <span className="text-base select-none">ℹ️</span>
              <div className="text-xs leading-relaxed text-[#CCCCCC]">
                No audit history logged yet. Complete tonight&apos;s 2-minute audit to begin building your consistency matrix.
              </div>
            </div>
          )}

          {/* Grid Blocks */}
          <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5 font-mono text-xs">
            {past30Days.map((dateStr) => {
              const audit = audits?.find((a) => a.date === dateStr);
              let score = 0;
              if (audit) {
                if (audit.adheredMeals) score++;
                if (audit.completedChores) score++;
                if (audit.maintainedComposure) score++;
              }

              const isSelected = dateStr === selectedAuditDate;
              const isToday = dateStr === todayDate;

              let blockBg = 'bg-[#202020] border border-[#373737] text-[#838383]';
              if (audit) {
                if (score === 3) {
                  blockBg = 'bg-[#2B593F] border border-[#3a7554] text-[#E3E3E3]';
                } else if (score > 0) {
                  blockBg = 'bg-[#7a4816] border border-[#a86523] text-[#E3E3E3]';
                } else {
                  blockBg = 'bg-[#252525] border border-[#444] text-[#838383]';
                }
              }

              return (
                <button
                  key={dateStr}
                  onClick={() => {
                    playSound('click', true);
                    setSelectedAuditDate(dateStr);
                  }}
                  className={`h-11 rounded p-1 flex flex-col justify-between text-left transition-all ${blockBg} ${
                    isSelected ? 'ring-2 ring-[#337EA9] ring-offset-2 ring-offset-[#191919] scale-105 z-10' : ''
                  }`}
                  title={`${dateStr}: ${audit ? `${score}/3 Compliant` : 'No audit recorded'}`}
                >
                  <div className="flex items-center justify-between text-[9px] opacity-80 leading-none">
                    <span>{dateStr.split('-')[2]}</span>
                    {isToday && <span className="w-1.5 h-1.5 rounded-full bg-[#337EA9]" />}
                  </div>
                  <div className="text-[10px] font-bold leading-none">
                    {audit ? `${score}/3` : '—'}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-[#838383] mt-2 text-right">
            Tap any block to inspect or edit telemetry
          </p>
        </div>

        {/* The 3-Question Nightly Check-In Form */}
        <div className="notion-panel p-4">
          <div className="flex items-center justify-between pb-2.5 mb-4 border-b border-[#373737]">
            <div>
              <h3 className="text-sm font-semibold text-[#E3E3E3]">
                {selectedAuditDate === todayDate ? "Tonight's 2-Minute Audit" : `Audit Log for ${formatFriendlyDate(selectedAuditDate)}`}
              </h3>
              <p className="text-[11px] text-[#838383] mt-0.5">
                3 binary questions. Answer honestly with zero guilt.
              </p>
            </div>

            {isSaved && (
              <span className="text-[10px] font-mono text-[#446B5E] bg-[#1e2f26] border border-[#2B593F] px-2 py-0.5 rounded flex items-center gap-1">
                <Check className="w-3 h-3" />
                Committed
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {/* Sensor 1: Meals */}
            <div className="p-3 rounded bg-[#202020] border border-[#373737] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-mono text-[#838383] block">
                  Sensor 01 // Routine
                </span>
                <p className="text-[#E3E3E3] font-medium mt-0.5">
                  1. Did you adhere to the 3-meal structured schedule today?
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', true);
                    setMealsYes(true);
                  }}
                  className={`px-3 py-1 rounded border text-xs font-medium transition-colors ${
                    mealsYes === true
                      ? 'bg-[#2B593F] border-[#446B5E] text-white'
                      : 'bg-[#191919] border-[#373737] text-[#838383] hover:text-[#E3E3E3]'
                  }`}
                >
                  YES
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', true);
                    setMealsYes(false);
                  }}
                  className={`px-3 py-1 rounded border text-xs font-medium transition-colors ${
                    mealsYes === false
                      ? 'bg-[#373737] border-[#4D4D4D] text-white'
                      : 'bg-[#191919] border-[#373737] text-[#838383] hover:text-[#E3E3E3]'
                  }`}
                >
                  NO
                </button>
              </div>
            </div>

            {/* Sensor 2: Shared Space Chores Unprompted */}
            <div className="p-3 rounded bg-[#202020] border border-[#373737] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-mono text-[#838383] block">
                  Sensor 02 // Initiative
                </span>
                <p className="text-[#E3E3E3] font-medium mt-0.5">
                  2. Did you execute shared space chores without being prompted?
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', true);
                    setChoresYes(true);
                  }}
                  className={`px-3 py-1 rounded border text-xs font-medium transition-colors ${
                    choresYes === true
                      ? 'bg-[#2B593F] border-[#446B5E] text-white'
                      : 'bg-[#191919] border-[#373737] text-[#838383] hover:text-[#E3E3E3]'
                  }`}
                >
                  YES
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', true);
                    setChoresYes(false);
                  }}
                  className={`px-3 py-1 rounded border text-xs font-medium transition-colors ${
                    choresYes === false
                      ? 'bg-[#373737] border-[#4D4D4D] text-white'
                      : 'bg-[#191919] border-[#373737] text-[#838383] hover:text-[#E3E3E3]'
                  }`}
                >
                  NO
                </button>
              </div>
            </div>

            {/* Sensor 3: Emotional Composure & Defensiveness */}
            <div className="p-3 rounded bg-[#202020] border border-[#373737] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-mono text-[#838383] block">
                  Sensor 03 // Emotional Composure
                </span>
                <p className="text-[#E3E3E3] font-medium mt-0.5">
                  3. Did you maintain composure and avoid defensiveness/guilt-tripping?
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', true);
                    setComposureYes(true);
                  }}
                  className={`px-3 py-1 rounded border text-xs font-medium transition-colors ${
                    composureYes === true
                      ? 'bg-[#2B593F] border-[#446B5E] text-white'
                      : 'bg-[#191919] border-[#373737] text-[#838383] hover:text-[#E3E3E3]'
                  }`}
                >
                  YES
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', true);
                    setComposureYes(false);
                  }}
                  className={`px-3 py-1 rounded border text-xs font-medium transition-colors ${
                    composureYes === false
                      ? 'bg-[#373737] border-[#4D4D4D] text-white'
                      : 'bg-[#191919] border-[#373737] text-[#838383] hover:text-[#E3E3E3]'
                  }`}
                >
                  NO
                </button>
              </div>
            </div>

            {/* Objective Observation */}
            <div>
              <label className="block text-[10px] text-[#838383] uppercase font-semibold mb-1">
                Objective Observation / Trigger (Optional)
              </label>
              <input
                type="text"
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder="e.g. Felt defensiveness when asked about dish timing. Paused 10s and responded calmly."
                className="w-full bg-[#202020] border border-[#373737] rounded px-3 py-2 text-xs text-[#E3E3E3] placeholder-[#838383] focus:outline-none focus:border-[#337EA9]"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-[#838383]">
                {mealsYes !== null && choresYes !== null && composureYes !== null
                  ? 'All 3 sensors answered.'
                  : 'Answer all 3 sensors to commit.'}
              </span>

              <button
                type="submit"
                disabled={mealsYes === null || choresYes === null || composureYes === null}
                className={`px-4 py-1.5 rounded font-medium transition-colors ${
                  mealsYes !== null && choresYes !== null && composureYes !== null
                    ? 'bg-[#337EA9] hover:bg-[#286a91] text-white'
                    : 'bg-[#252525] text-[#838383] cursor-not-allowed'
                }`}
              >
                Commit to Vault
              </button>
            </div>
          </form>
        </div>

        {/* Data Backup Option */}
        <div className="notion-panel p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[#E3E3E3] block">
              Export Vault Telemetry
            </span>
            <span className="text-[11px] text-[#838383]">
              Download complete IndexedDB backup as JSON
            </span>
          </div>

          <button
            onClick={handleExportData}
            className="px-3 py-1.5 bg-[#202020] hover:bg-[#282828] border border-[#373737] rounded text-xs text-[#E3E3E3] flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#838383]" />
            <span>Download JSON</span>
          </button>
        </div>

      </main>
    </div>
  );
}
