'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  db,
  DbMeal,
  DEFAULT_STAPLE_PROFILES,
  MEAL_SCHEDULE_WINDOWS,
  evaluateMealWindow,
  seedDatabaseIfEmpty,
} from '@/lib/db';
import { getTodayString } from '@/lib/date-utils';
import { TopHeader } from '@/components/TopHeader';
import { playSound } from '@/lib/sound';
import {
  Utensils,
  Clock,
  Check,
  AlertTriangle,
  Flame,
  Plus,
  RotateCcw,
  Info
} from 'lucide-react';

export default function MealsEngineHub() {
  const [mounted, setMounted] = useState(false);
  const [todayDate, setTodayDate] = useState('');
  const [customName, setCustomName] = useState('');
  const [activeCustomSlot, setActiveCustomSlot] = useState<'breakfast' | 'lunch' | 'dinner' | null>(null);

  useEffect(() => {
    seedDatabaseIfEmpty();
    setTodayDate(getTodayString());
    setMounted(true);
  }, []);

  const meals = useLiveQuery(
    () => (todayDate ? db.meals.where('date').equals(todayDate).toArray() : []),
    [todayDate]
  );

  const allMeals = useLiveQuery(
    () => db.meals.orderBy('loggedAt').reverse().limit(15).toArray(),
    []
  );

  const handleLogStaple = async (
    mealType: 'breakfast' | 'lunch' | 'dinner',
    staple: (typeof DEFAULT_STAPLE_PROFILES)[0]
  ) => {
    playSound('execute', true);
    const now = new Date();
    const { isOutlier, reason } = evaluateMealWindow(mealType, now);

    const newId = `meal-${Date.now()}`;
    await db.meals.put({
      id: newId,
      date: todayDate,
      mealType,
      stapleId: staple.id,
      mealName: staple.name,
      loggedAt: now.toISOString(),
      isOutlier,
      outlierReason: reason,
    });
  };

  const handleLogCustom = async (mealType: 'breakfast' | 'lunch' | 'dinner') => {
    if (!customName.trim()) return;
    playSound('execute', true);
    const now = new Date();
    const { isOutlier, reason } = evaluateMealWindow(mealType, now);

    const newId = `meal-${Date.now()}`;
    await db.meals.put({
      id: newId,
      date: todayDate,
      mealType,
      mealName: customName.trim(),
      loggedAt: now.toISOString(),
      isOutlier,
      outlierReason: reason,
    });
    setCustomName('');
    setActiveCustomSlot(null);
  };

  const handleRemoveMeal = async (id: string) => {
    playSound('click', true);
    await db.meals.delete(id);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#191919] text-[#838383] flex items-center justify-center text-xs">
        <span>Loading Meal Engine...</span>
      </div>
    );
  }

  const mealSlots: Array<{
    type: 'breakfast' | 'lunch' | 'dinner';
    title: string;
    window: typeof MEAL_SCHEDULE_WINDOWS.breakfast;
  }> = [
    { type: 'breakfast', title: 'Breakfast Anchor', window: MEAL_SCHEDULE_WINDOWS.breakfast },
    { type: 'lunch', title: 'Lunch Anchor', window: MEAL_SCHEDULE_WINDOWS.lunch },
    { type: 'dinner', title: 'Dinner Anchor', window: MEAL_SCHEDULE_WINDOWS.dinner },
  ];

  return (
    <div className="min-h-screen bg-[#191919] text-[#E3E3E3]">
      <TopHeader pageTitle="Meal Engine Hub" icon="🍲" />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        
        {/* Notion Page Header */}
        <div>
          <div className="text-4xl mb-2 select-none">🍲</div>
          <h1 className="text-2xl font-bold tracking-tight text-[#E3E3E3]">
            Meals / Meal Engine Hub
          </h1>
          <p className="text-xs text-[#838383] mt-1 font-mono">
            Fixed Schedule Routine &amp; "Fridge Decision Killer"
          </p>
          <div className="h-px bg-[#373737] w-full mt-4" />
        </div>

        {/* Notion Callout Box */}
        <div className="notion-callout">
          <span className="text-base select-none">💡</span>
          <div className="text-xs leading-relaxed text-[#CCCCCC]">
            <span className="font-semibold text-[#E3E3E3] block mb-0.5">
              The "Fridge Decision Killer" Principle
            </span>
            Eliminate decision fatigue and avoid irregular cooking impulses (such as spontaneous 11 AM dosas that throw off your 1 PM lunch anchor). Tap a staple profile, consume within 10 minutes, and return to focus.
          </div>
        </div>

        {/* The 3 Staple Profiles Reference */}
        <div className="notion-panel p-4">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#373737]">
            <div className="flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-[#D9730D]" />
              <h3 className="text-xs uppercase tracking-wider text-[#838383] font-semibold">
                3 Fixed Staple Profiles
              </h3>
            </div>
            <span className="text-[10px] text-[#838383]">&lt; 5 Min Preparation</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {DEFAULT_STAPLE_PROFILES.map((staple) => (
              <div
                key={staple.id}
                className="bg-[#202020] border border-[#373737] rounded p-3 text-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between font-semibold text-[#E3E3E3] mb-1">
                    <span>{staple.name}</span>
                    <span className="text-[10px] text-[#838383] font-normal">{staple.prepTime}</span>
                  </div>
                  <p className="text-[11px] text-[#838383] leading-snug">
                    {staple.description}
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-[#2d2d2d] text-[10px] text-[#337EA9] font-mono">
                  {staple.protein} protein
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Meal Schedule Logger (Breakfast, Lunch, Dinner) */}
        <div className="space-y-4">
          <h3 className="text-xs uppercase tracking-wider text-[#838383] font-semibold">
            Today's Structured Meal Loggers
          </h3>

          {mealSlots.map(({ type, title, window }) => {
            const loggedEntry = meals?.find((m) => m.mealType === type);
            const isDone = !!loggedEntry;

            return (
              <div
                key={type}
                className={`notion-panel p-4 transition-all ${
                  isDone ? 'border-l-4 border-l-[#2B593F]' : 'border-l-4 border-l-[#373737]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#191919] border border-[#373737] text-[#838383]">
                      {window.target}
                    </span>
                    <h4 className="text-sm font-semibold text-[#E3E3E3]">{title}</h4>
                  </div>

                  <div>
                    {isDone ? (
                      <span className="inline-flex items-center gap-1 text-xs font-mono text-[#446B5E] bg-[#1e2f26] border border-[#2B593F] px-2 py-0.5 rounded">
                        <Check className="w-3.5 h-3.5" />
                        Executed
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-[#D9730D] bg-[#291f15] border border-[#523215] px-2 py-0.5 rounded">
                        Window: {window.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* If Logged: Show details and outlier flag if applicable */}
                {isDone ? (
                  <div className="mt-3 pt-3 border-t border-[#373737] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#E3E3E3]">{loggedEntry.mealName}</span>
                        {loggedEntry.isOutlier && (
                          <span className="text-[10px] font-mono text-[#D9730D] bg-[#2b1f13] border border-[#6b4119] px-1.5 py-0.2 rounded flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Unscheduled Outlier
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#838383] mt-0.5 font-mono">
                        Logged at{' '}
                        {new Date(loggedEntry.loggedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {loggedEntry.outlierReason && ` • ${loggedEntry.outlierReason}`}
                      </p>
                    </div>

                    <button
                      onClick={() => handleRemoveMeal(loggedEntry.id)}
                      className="text-[#838383] hover:text-[#EB5757] text-[11px] flex items-center gap-1 self-start sm:self-center"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset
                    </button>
                  </div>
                ) : (
                  /* If Pending: 1-Tap Staple Selectors */
                  <div className="mt-3 pt-3 border-t border-[#373737]">
                    <span className="text-[10px] font-mono uppercase text-[#838383] block mb-2">
                      1-Tap Instant Execution
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {DEFAULT_STAPLE_PROFILES.map((staple) => (
                        <button
                          key={staple.id}
                          onClick={() => handleLogStaple(type, staple)}
                          className="text-left p-2.5 rounded bg-[#202020] hover:bg-[#282828] border border-[#373737] hover:border-[#838383] transition-all"
                        >
                          <div className="text-xs font-medium text-[#E3E3E3]">
                            {staple.name}
                          </div>
                          <div className="text-[10px] text-[#838383] mt-0.5">
                            {staple.prepTime} • {staple.protein}
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Custom Meal Input */}
                    <div className="mt-2.5">
                      {activeCustomSlot === type ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            placeholder="Custom meal name..."
                            className="flex-1 bg-[#202020] border border-[#373737] rounded px-2.5 py-1 text-xs text-[#E3E3E3] placeholder-[#838383] focus:outline-none focus:border-[#337EA9]"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleLogCustom(type);
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => handleLogCustom(type)}
                            className="px-2.5 py-1 bg-[#337EA9] text-white rounded text-xs font-medium"
                          >
                            Log
                          </button>
                          <button
                            onClick={() => setActiveCustomSlot(null)}
                            className="text-xs text-[#838383] hover:text-[#E3E3E3]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setActiveCustomSlot(type)}
                          className="text-[11px] text-[#838383] hover:text-[#CCCCCC] underline"
                        >
                          + Custom meal / eating out
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Outlier & Schedule History Log */}
        <div className="notion-panel p-4">
          <h3 className="text-xs uppercase tracking-wider text-[#838383] font-semibold mb-3">
            Recent Meal History &amp; Outlier Telemetry
          </h3>

          <div className="divide-y divide-[#373737] text-xs">
            {allMeals?.map((m) => (
              <div key={m.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#E3E3E3]">{m.mealName}</span>
                    <span className="text-[10px] uppercase text-[#838383] px-1 rounded bg-[#202020] border border-[#373737]">
                      {m.mealType}
                    </span>
                    {m.isOutlier && (
                      <span className="text-[10px] text-[#D9730D] bg-[#291f15] border border-[#523215] px-1 rounded">
                        Outlier
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#838383] font-mono mt-0.5">
                    {m.date} • {new Date(m.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {m.outlierReason && ` (${m.outlierReason})`}
                  </p>
                </div>

                <button
                  onClick={() => handleRemoveMeal(m.id)}
                  className="text-[#838383] hover:text-[#EB5757] text-[10px]"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
