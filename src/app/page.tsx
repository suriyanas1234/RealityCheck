'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, DbMeal, DbChore, seedDatabaseIfEmpty } from '@/lib/db';
import { getTodayString, getCurrentAndNextBlock, formatMinutesCountdown } from '@/lib/date-utils';
import { TopHeader } from '@/components/TopHeader';
import { playSound } from '@/lib/sound';
import {
  Clock,
  Check,
  ChevronRight,
  Plus,
  Utensils,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const SCHEDULE_ANCHORS = [
  { id: 'anchor-wake', title: 'Morning Reset', time: '08:00', displayTime: '8:00 AM', slot: 'wake' },
  { id: 'anchor-bf', title: 'Breakfast Block', time: '08:30', displayTime: '8:30 AM', slot: 'meal', mealType: 'breakfast' as const },
  { id: 'anchor-lunch', title: 'Lunch Block', time: '13:00', displayTime: '1:00 PM', slot: 'meal', mealType: 'lunch' as const },
  { id: 'anchor-dinner', title: 'Evening Reset & Dinner', time: '18:30', displayTime: '6:30 PM', slot: 'meal', mealType: 'dinner' as const },
  { id: 'anchor-winddown', title: 'Day Closure & Kitchen Reset', time: '22:30', displayTime: '10:30 PM', slot: 'reset' },
];

export default function TodayExecutionHub() {
  const [mounted, setMounted] = useState(false);
  const [todayDate, setTodayDate] = useState('');
  const [newChoreTitle, setNewChoreTitle] = useState('');
  const [isAddingChore, setIsAddingChore] = useState(false);

  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [dateDisplay, setDateDisplay] = useState<string>('');

  useEffect(() => {
    seedDatabaseIfEmpty();
    const d = new Date();
    setTodayDate(getTodayString(d));
    setCurrentTime(d);
    setDateDisplay(
      d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    );
    setMounted(true);

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Live queries from Dexie IndexedDB
  const todayMeals = useLiveQuery(
    () => (todayDate ? db.meals.where('date').equals(todayDate).toArray() : []),
    [todayDate]
  );

  const chores = useLiveQuery(() => db.chores.toArray(), []);

  // Anchor calculation
  const now = currentTime || new Date(0);
  const scheduleBlocksFormatted = SCHEDULE_ANCHORS.map((a) => ({
    id: a.id,
    title: a.title,
    time: a.time,
    displayTime: a.displayTime,
    category: (a.slot === 'meal' ? 'meal' : 'wake') as 'meal' | 'wake' | 'work' | 'reset' | 'sleep',
    description: '',
    actionPrompt: '',
  }));
  const { currentBlock, nextBlock, minutesToNext } = getCurrentAndNextBlock(scheduleBlocksFormatted, now);

  // Meal punctuality calculation
  const breakfastDone = todayMeals?.some((m) => m.mealType === 'breakfast');
  const lunchDone = todayMeals?.some((m) => m.mealType === 'lunch');
  const dinnerDone = todayMeals?.some((m) => m.mealType === 'dinner');
  const mealsLoggedCount = [breakfastDone, lunchDone, dinnerDone].filter(Boolean).length;
  const mealsPunctuality = Math.round((mealsLoggedCount / 3) * 100);

  // Chore completion calculation
  const totalChores = chores?.length || 0;
  const completedChoresCount = chores?.filter((c) => c.completedDates?.[todayDate]).length || 0;
  const choresCompletion = totalChores > 0 ? Math.round((completedChoresCount / totalChores) * 100) : 0;

  const handleToggleChore = async (chore: DbChore) => {
    playSound('execute', true);
    const updated = { ...chore.completedDates };
    if (updated[todayDate]) {
      delete updated[todayDate];
    } else {
      updated[todayDate] = new Date().toISOString();
    }
    await db.chores.update(chore.id, { completedDates: updated });
  };

  const handleAddChore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChoreTitle.trim()) return;
    playSound('click', true);
    await db.chores.add({
      id: `chore-${Date.now()}`,
      title: newChoreTitle.trim(),
      slot: 'midday',
      isDefault: false,
      completedDates: {},
    });
    setNewChoreTitle('');
    setIsAddingChore(false);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#191919] text-[#838383] flex items-center justify-center text-xs">
        <span>Loading Execution Hub...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#191919] text-[#E3E3E3]">
      <TopHeader pageTitle="Execution Hub" icon="🎯" />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        
        {/* Notion Page Header */}
        <div>
          <div className="text-4xl mb-2 select-none">🎯</div>
          <h1 className="text-2xl font-bold tracking-tight text-[#E3E3E3]">
            Today / Execution Hub
          </h1>
          <p className="text-xs text-[#838383] mt-1 font-mono">
            {dateDisplay}
          </p>
          <div className="h-px bg-[#373737] w-full mt-4" />
        </div>

        {/* Notion Callout Box */}
        <div className="notion-callout">
          <span className="text-base select-none">⚡</span>
          <div className="text-xs leading-relaxed text-[#CCCCCC]">
            <span className="font-semibold text-[#E3E3E3] block mb-0.5">
              Protocol Rule: Scan &amp; Execute
            </span>
            Eliminate passivity and hesitation. Do not negotiate with the clock or wait to be prompted. Scan the active anchor below and execute immediately.
          </div>
        </div>

        {/* Live Status Banner (Notion Soft Blue Accent) */}
        <div className="notion-panel p-4 border-l-4 border-l-[#337EA9]">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#337EA9] font-semibold">
              Current Anchor Status
            </span>
            <span className="font-mono text-[#838383] text-[11px]">
              Next in {formatMinutesCountdown(minutesToNext)}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#E3E3E3]">
                {currentBlock.title} ({currentBlock.displayTime})
              </h2>
              <p className="text-xs text-[#838383] mt-0.5">
                Target: {nextBlock.title} at {nextBlock.displayTime}
              </p>
            </div>

            <Link
              href="/meals"
              className="text-xs text-[#337EA9] hover:underline flex items-center gap-1 font-medium"
            >
              <span>Meal Engine</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Dual Progress Meters (Notion Style Progress Bars) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Meter 1: Meals */}
          <div className="notion-panel p-3.5">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-[#838383] font-medium flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-[#337EA9]" />
                Meal Punctuality
              </span>
              <span className="font-mono text-[11px] text-[#E3E3E3] font-semibold">
                {mealsLoggedCount}/3 ({mealsPunctuality}%)
              </span>
            </div>
            <div className="w-full bg-[#202020] h-2 rounded-full overflow-hidden border border-[#373737]">
              <div
                className="bg-[#2B593F] h-full transition-all duration-300"
                style={{ width: `${mealsPunctuality}%` }}
              />
            </div>
            <span className="text-[10px] text-[#838383] block mt-1.5 font-mono">
              Breakfast: {breakfastDone ? '✓' : '—'} • Lunch: {lunchDone ? '✓' : '—'} • Dinner: {dinnerDone ? '✓' : '—'}
            </span>
          </div>

          {/* Meter 2: Chores */}
          <div className="notion-panel p-3.5">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-[#838383] font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2B593F]" />
                Chore Completion
              </span>
              <span className="font-mono text-[11px] text-[#E3E3E3] font-semibold">
                {completedChoresCount}/{totalChores} ({choresCompletion}%)
              </span>
            </div>
            <div className="w-full bg-[#202020] h-2 rounded-full overflow-hidden border border-[#373737]">
              <div
                className="bg-[#337EA9] h-full transition-all duration-300"
                style={{ width: `${choresCompletion}%` }}
              />
            </div>
            <span className="text-[10px] text-[#838383] block mt-1.5 font-mono">
              Unprompted shared-space execution
            </span>
          </div>
        </div>

        {/* Daily Anchor Timeline */}
        <div className="notion-panel p-4">
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#373737]">
            <h3 className="text-xs uppercase tracking-wider text-[#838383] font-semibold">
              Daily Anchor Routine
            </h3>
            <span className="text-[11px] font-mono text-[#838383]">5 Fixed Blocks</span>
          </div>

          <div className="space-y-2">
            {SCHEDULE_ANCHORS.map((anchor) => {
              const isMeal = anchor.slot === 'meal';
              let isDone = false;
              if (anchor.mealType === 'breakfast') isDone = !!breakfastDone;
              if (anchor.mealType === 'lunch') isDone = !!lunchDone;
              if (anchor.mealType === 'dinner') isDone = !!dinnerDone;

              return (
                <div
                  key={anchor.id}
                  className={`flex items-center justify-between p-2.5 rounded text-xs transition-colors ${
                    isDone
                      ? 'bg-[#202020] text-[#838383]'
                      : 'bg-[#252525] hover:bg-[#2A2A2A] text-[#E3E3E3]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[#191919] border border-[#373737] text-[#838383]">
                      {anchor.displayTime}
                    </span>
                    <span className={`font-medium ${isDone ? 'line-through' : ''}`}>
                      {anchor.title}
                    </span>
                  </div>

                  <div>
                    {isDone ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#446B5E] font-medium">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        Locked
                      </span>
                    ) : isMeal ? (
                      <Link
                        href="/meals"
                        className="text-[11px] text-[#337EA9] hover:underline flex items-center gap-0.5 font-medium"
                      >
                        Execute &rarr;
                      </Link>
                    ) : (
                      <span className="text-[11px] text-[#838383]">Anchor</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* "Scan & Execute" Daily Checklist (Notion Checkboxes) */}
        <div className="notion-panel p-4">
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#373737]">
            <div className="flex items-center gap-2">
              <span className="text-sm select-none">☑️</span>
              <h3 className="text-xs uppercase tracking-wider text-[#838383] font-semibold">
                "Scan &amp; Execute" Micro-Chores
              </h3>
            </div>
            
            <button
              onClick={() => setIsAddingChore(!isAddingChore)}
              className="text-xs text-[#337EA9] hover:text-[#5294bf] flex items-center gap-1 font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          {/* Add Inline Chore */}
          {isAddingChore && (
            <form onSubmit={handleAddChore} className="mb-3 flex items-center gap-2">
              <input
                type="text"
                value={newChoreTitle}
                onChange={(e) => setNewChoreTitle(e.target.value)}
                placeholder="New recurring micro-chore..."
                className="flex-1 bg-[#202020] border border-[#373737] rounded px-3 py-1.5 text-xs text-[#E3E3E3] placeholder-[#838383] focus:outline-none focus:border-[#337EA9]"
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#337EA9] hover:bg-[#286a91] text-white rounded text-xs font-medium"
              >
                Save
              </button>
            </form>
          )}

          {/* Chore Checkboxes */}
          <div className="space-y-2">
            {chores?.map((chore) => {
              const isDone = !!chore.completedDates?.[todayDate];
              return (
                <div
                  key={chore.id}
                  onClick={() => handleToggleChore(chore)}
                  className="flex items-center gap-3 p-2 rounded hover:bg-[#202020] cursor-pointer transition-colors text-xs"
                >
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => {}} // handled by parent onClick
                    className="notion-checkbox shrink-0"
                  />
                  <span
                    className={`flex-1 ${
                      isDone ? 'line-through text-[#838383]' : 'text-[#E3E3E3]'
                    }`}
                  >
                    {chore.title}
                  </span>
                  <span className="text-[10px] text-[#838383] uppercase px-1.5 py-0.5 rounded bg-[#202020] border border-[#373737]">
                    {chore.slot}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Route Teaser to Vault */}
        <div className="notion-panel p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#E3E3E3] block">
              Nightly Audit &amp; 30-Day Vault
            </span>
            <span className="text-[11px] text-[#838383]">
              3 binary questions. Zero guilt, pure execution telemetry.
            </span>
          </div>

          <Link
            href="/vault"
            className="px-3 py-1.5 bg-[#202020] hover:bg-[#2A2A2A] border border-[#373737] rounded text-xs font-medium text-[#E3E3E3] flex items-center gap-1.5 transition-colors"
          >
            <span>Open Vault</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#838383]" />
          </Link>
        </div>

      </main>
    </div>
  );
}
