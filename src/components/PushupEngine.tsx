'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, DbPushupLog, DbGymSession } from '@/lib/db';
import { getTodayString } from '@/lib/date-utils';
import { playSound } from '@/lib/sound';
import { Dumbbell, Check, Plus, Minus } from 'lucide-react';

const DEFAULT_TARGET = 100;
const QUICK_ADD = [10, 20, 25];

export const PushupEngine: React.FC = () => {
  const [today, setToday] = useState('');
  const [customReps, setCustomReps] = useState<string>('');

  useEffect(() => {
    setToday(getTodayString());
  }, []);

  const pushupLog = useLiveQuery(() => (today ? db.pushup_logs.get(today) : undefined), [today]);
  const gymSession = useLiveQuery(() => (today ? db.gym_sessions.get(today) : undefined), [today]);

  const target = pushupLog?.targetCount ?? DEFAULT_TARGET;
  const completed = pushupLog?.completedCount ?? 0;
  const pct = Math.min(100, Math.round((completed / target) * 100));

  const ensurePushupLog = useCallback(async (): Promise<DbPushupLog> => {
    const existing = await db.pushup_logs.get(today);
    if (existing) return existing;
    const now = new Date().toISOString();
    const record: DbPushupLog = {
      id: today,
      date: today,
      targetCount: DEFAULT_TARGET,
      completedCount: 0,
      sets: [],
      loggedAt: now,
      updatedAt: now,
    };
    await db.pushup_logs.put(record);
    return record;
  }, [today]);

  const addReps = async (reps: number) => {
    if (reps <= 0) return;
    playSound('execute', true);
    const log = await ensurePushupLog();
    const now = new Date().toISOString();
    await db.pushup_logs.update(log.id, {
      completedCount: log.completedCount + reps,
      sets: [...log.sets, { reps, timestamp: now }],
      updatedAt: now,
    });
  };

  const removeReps = async (reps: number) => {
    playSound('click', true);
    const log = await ensurePushupLog();
    const next = Math.max(0, log.completedCount - reps);
    await db.pushup_logs.update(log.id, {
      completedCount: next,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(customReps, 10);
    if (isNaN(n) || n <= 0) return;
    setCustomReps('');
    await addReps(n);
  };

  const toggleGym = async () => {
    playSound('execute', true);
    const now = new Date().toISOString();
    const existing = await db.gym_sessions.get(today);
    const next: DbGymSession = existing
      ? {
          ...existing,
          completed: !existing.completed,
          updatedAt: now,
        }
      : {
          id: today,
          date: today,
          workoutType: 'General',
          completed: true,
          loggedAt: now,
          updatedAt: now,
        };
    await db.gym_sessions.put(next);
  };

  const gymDone = !!gymSession?.completed;

  // Progress bar blocks (10 segments)
  const filled = Math.round((pct / 100) * 10);

  return (
    <div className="notion-panel p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm select-none">💪</span>
          <h3 className="text-xs uppercase tracking-wider text-[#838383] font-semibold">
            Daily Pushups &amp; Gym
          </h3>
        </div>
        <span className="text-[11px] font-mono text-[#838383]">
          {completed} / {target}
        </span>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono mb-1.5">
          <span className="text-[#E3E3E3]">[{'█'.repeat(filled)}{'░'.repeat(10 - filled)}]</span>
          <span className="text-[#838383]">{pct}%</span>
        </div>
      </div>

      {/* Quick-Add Rep Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {QUICK_ADD.map((r) => (
          <button
            key={r}
            onClick={() => addReps(r)}
            className="px-3 py-1.5 rounded border border-[#373737] bg-[#202020] hover:bg-[#2A2A2A] text-xs font-medium text-[#E3E3E3] flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#446B5E]" />
            +{r}
          </button>
        ))}

        <form onSubmit={handleCustom} className="flex items-center gap-1.5">
          <input
            type="number"
            value={customReps}
            onChange={(e) => setCustomReps(e.target.value)}
            placeholder="Custom"
            min={1}
            className="w-20 bg-[#202020] border border-[#373737] rounded px-2 py-1.5 text-xs text-[#E3E3E3] placeholder-[#838383] focus:outline-none focus:border-[#337EA9]"
          />
          <button
            type="submit"
            className="px-2.5 py-1.5 rounded border border-[#373737] bg-[#202020] hover:bg-[#2A2A2A] text-xs text-[#E3E3E3]"
          >
            Add
          </button>
        </form>

        <button
          onClick={() => removeReps(10)}
          className="px-2 py-1.5 rounded border border-[#373737] text-[#838383] hover:text-[#E3E3E3]"
          title="Remove 10"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Gym Attendance Toggle */}
      <button
        onClick={toggleGym}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded border text-xs font-medium transition-colors ${
          gymDone
            ? 'bg-[#1e2f26] border-[#2B593F] text-[#446B5E]'
            : 'bg-[#202020] border-[#373737] text-[#838383] hover:text-[#E3E3E3]'
        }`}
      >
        <span className="flex items-center gap-2">
          <Dumbbell className="w-4 h-4" />
          {gymDone ? 'Gym Executed' : 'Gym Session — Pending'}
        </span>
        <span
          className={`w-5 h-5 rounded border flex items-center justify-center ${
            gymDone ? 'bg-[#2B593F] border-[#446B5E]' : 'border-[#4D4D4D]'
          }`}
        >
          {gymDone && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
        </span>
      </button>
    </div>
  );
};
