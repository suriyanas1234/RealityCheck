'use client';

import React, { useState } from 'react';
import { MealLog, MealType, ScheduleBlock, StapleMeal } from '@/types';
import { playSound } from '@/lib/sound';
import {
  Utensils,
  CheckCircle2,
  Clock,
  ChevronRight,
  Flame,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Check
} from 'lucide-react';

interface DailyRhythmProps {
  scheduleBlocks: ScheduleBlock[];
  staples: Record<MealType, StapleMeal[]>;
  mealLogs: MealLog[];
  selectedDate: string;
  todayDate: string;
  soundEnabled: boolean;
  onLogMeal: (mealType: MealType, stapleId?: string, customName?: string) => void;
  onRemoveMeal: (mealId: string) => void;
}

export const DailyRhythm: React.FC<DailyRhythmProps> = ({
  scheduleBlocks,
  staples,
  mealLogs,
  selectedDate,
  todayDate,
  soundEnabled,
  onLogMeal,
  onRemoveMeal,
}) => {
  const [customInputMealType, setCustomInputMealType] = useState<MealType | null>(null);
  const [customMealText, setCustomMealText] = useState('');

  const isToday = selectedDate === todayDate;

  // Find logs for selected date
  const dayMeals = mealLogs.filter((m) => m.date === selectedDate);
  const breakfastLog = dayMeals.find((m) => m.mealType === 'breakfast');
  const lunchLog = dayMeals.find((m) => m.mealType === 'lunch');
  const dinnerLog = dayMeals.find((m) => m.mealType === 'dinner');

  const mealsCompletedCount = [breakfastLog, lunchLog, dinnerLog].filter(Boolean).length;

  const handleStapleClick = (mealType: MealType, staple: StapleMeal) => {
    playSound('execute', soundEnabled);
    onLogMeal(mealType, staple.id, staple.name);
  };

  const handleCustomSubmit = (mealType: MealType) => {
    if (!customMealText.trim()) return;
    playSound('execute', soundEnabled);
    onLogMeal(mealType, undefined, customMealText.trim());
    setCustomMealText('');
    setCustomInputMealType(null);
  };

  const renderMealSlot = (
    title: string,
    time: string,
    mealType: MealType,
    log?: MealLog
  ) => {
    const mealStaples = staples[mealType] || [];
    const isLogged = !!log;

    return (
      <div
        className={`border rounded-lg p-4 transition-all ${
          isLogged
            ? 'bg-zinc-900/40 border-emerald-900/50 text-zinc-300'
            : 'bg-zinc-900/80 border-zinc-800 text-zinc-100 hover:border-zinc-700'
        }`}
      >
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400">
              {time}
            </span>
            <h4 className="font-mono text-sm font-semibold tracking-wide uppercase text-zinc-200">
              {title}
            </h4>
          </div>

          <div>
            {isLogged ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded">
                <Check className="w-3.5 h-3.5" />
                EXECUTED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-amber-400/90 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded">
                <Clock className="w-3 h-3" />
                PENDING
              </span>
            )}
          </div>
        </div>

        {/* If Already Logged */}
        {isLogged ? (
          <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs font-mono">
            <div>
              <p className="text-zinc-100 font-medium">
                {log.customMealName || 'Staple Plate'}
              </p>
              <p className="text-[11px] text-zinc-500">
                Logged at{' '}
                {new Date(log.loggedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <button
              onClick={() => {
                playSound('click', soundEnabled);
                onRemoveMeal(log.id);
              }}
              className="text-zinc-500 hover:text-rose-400 text-[11px] flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-zinc-800"
              title="Clear entry to change meal"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>
        ) : (
          /* "Fridge Decision Killer" 1-Tap Selectors */
          <div className="mt-3">
            <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <span>Fridge Decision Killer: 1-Tap Execution</span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {mealStaples.slice(0, 3).map((staple, idx) => (
                <button
                  key={staple.id}
                  onClick={() => handleStapleClick(mealType, staple)}
                  className="group relative text-left p-2.5 rounded border border-zinc-800 bg-zinc-950/80 hover:bg-emerald-950/20 hover:border-emerald-700/60 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono font-medium text-zinc-200 group-hover:text-emerald-300">
                      <span>
                        [{idx + 1}] {staple.name}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-normal">
                        ~{staple.preparationMinutes}m
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-tight">
                      {staple.description}
                    </p>
                  </div>

                  <div className="mt-2 pt-1 border-t border-zinc-900 flex items-center justify-between text-[10px] font-mono text-zinc-500 group-hover:text-emerald-400">
                    <span>{staple.proteinGrams ? `${staple.proteinGrams}g pro` : 'Effortless'}</span>
                    <span className="text-zinc-600 group-hover:text-emerald-400 flex items-center">
                      EXECUTE &rarr;
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Custom fallback */}
            <div className="mt-2 flex items-center justify-between text-xs font-mono">
              {customInputMealType === mealType ? (
                <div className="flex items-center gap-2 w-full mt-1">
                  <input
                    type="text"
                    value={customMealText}
                    onChange={(e) => setCustomMealText(e.target.value)}
                    placeholder="Enter custom meal..."
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCustomSubmit(mealType);
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => handleCustomSubmit(mealType)}
                    className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded border border-zinc-700 font-mono"
                  >
                    Log
                  </button>
                  <button
                    onClick={() => {
                      setCustomInputMealType(null);
                      setCustomMealText('');
                    }}
                    className="text-zinc-500 hover:text-zinc-300 text-xs px-1"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCustomInputMealType(mealType)}
                  className="text-[11px] text-zinc-500 hover:text-zinc-300 underline"
                >
                  + Custom meal / eating out
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="border border-zinc-800 bg-zinc-900/40 rounded-lg p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-zinc-800 text-emerald-400">
                <Utensils className="w-4 h-4" />
              </span>
              <h2 className="font-mono text-base font-bold tracking-tight text-zinc-100 uppercase">
                Daily Rhythm & Meal Anchors
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Fixed Schedule Engine • Zero-negotiation meal anchors to eliminate decision fatigue
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="font-mono text-xs text-right">
              <span className="text-zinc-500 block text-[10px] uppercase">Compliance Today</span>
              <span
                className={`font-semibold ${
                  mealsCompletedCount === 3
                    ? 'text-emerald-400'
                    : mealsCompletedCount > 0
                    ? 'text-amber-400'
                    : 'text-zinc-400'
                }`}
              >
                {mealsCompletedCount} / 3 MEALS LOCKED
              </span>
            </div>
          </div>
        </div>

        {/* Schedule Timeline Grid (Wake -> Breakfast -> Lunch -> Dinner -> Wind-Down) */}
        <div className="mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs">
            {scheduleBlocks.map((block) => {
              const isMeal = !!block.isMealAnchor;
              let isDone = false;
              if (block.mealType === 'breakfast') isDone = !!breakfastLog;
              if (block.mealType === 'lunch') isDone = !!lunchLog;
              if (block.mealType === 'dinner') isDone = !!dinnerLog;

              return (
                <div
                  key={block.id}
                  className={`p-2.5 rounded border ${
                    isDone
                      ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                      : isMeal
                      ? 'bg-zinc-950/60 border-zinc-800 text-zinc-300'
                      : 'bg-zinc-950/40 border-zinc-800/60 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                    <span>{block.displayTime}</span>
                    {isDone && <Check className="w-3 h-3 text-emerald-400" />}
                  </div>
                  <div className="font-semibold text-xs tracking-tight truncate">
                    {block.title.replace(' ANCHOR', '')}
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1 line-clamp-1">
                    {block.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* The Fridge Decision Killer Meal Modules */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-xs tracking-wider text-zinc-400 uppercase font-semibold flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            Fridge Decision Killer — 3 Anchor Slots
          </h3>
          <span className="text-[11px] font-mono text-zinc-500">
            Never hesitate. Tap. Eat. Execute.
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3.5">
          {renderMealSlot('08:30 AM — Breakfast Anchor', '08:30', 'breakfast', breakfastLog)}
          {renderMealSlot('01:00 PM — Lunch Anchor', '13:00', 'lunch', lunchLog)}
          {renderMealSlot('06:30 PM — Dinner Anchor', '18:30', 'dinner', dinnerLog)}
        </div>
      </div>
    </div>
  );
};
