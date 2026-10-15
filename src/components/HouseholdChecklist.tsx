'use client';

import React, { useState } from 'react';
import { ChoreItem } from '@/types';
import { playSound } from '@/lib/sound';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  Check,
  RotateCcw,
  Sun,
  Sunset,
  Moon
} from 'lucide-react';

interface HouseholdChecklistProps {
  chores: ChoreItem[];
  selectedDate: string;
  todayDate: string;
  soundEnabled: boolean;
  onToggleChore: (choreId: string) => void;
  onAddChore: (title: string, slot: 'morning' | 'midday' | 'evening') => void;
  onDeleteChore: (choreId: string) => void;
}

export const HouseholdChecklist: React.FC<HouseholdChecklistProps> = ({
  chores,
  selectedDate,
  todayDate,
  soundEnabled,
  onToggleChore,
  onAddChore,
  onDeleteChore,
}) => {
  const [activeSlotFilter, setActiveSlotFilter] = useState<'all' | 'morning' | 'midday' | 'evening'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlot, setNewSlot] = useState<'morning' | 'midday' | 'evening'>('morning');

  const isToday = selectedDate === todayDate;

  // Calculate execution stats for selected date
  const totalChores = chores.length;
  const completedChores = chores.filter((c) => c.completedDates && c.completedDates[selectedDate]);
  const completedCount = completedChores.length;
  const percentage = totalChores > 0 ? Math.round((completedCount / totalChores) * 100) : 0;

  const handleToggle = (choreId: string) => {
    playSound('execute', soundEnabled);
    onToggleChore(choreId);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    playSound('click', soundEnabled);
    onAddChore(newTitle.trim(), newSlot);
    setNewTitle('');
    setIsAdding(false);
  };

  const filteredChores =
    activeSlotFilter === 'all'
      ? chores
      : chores.filter((c) => c.slot === activeSlotFilter);

  const getSlotIcon = (slot: string) => {
    switch (slot) {
      case 'morning':
        return <Sun className="w-3.5 h-3.5 text-amber-400" />;
      case 'midday':
        return <Sunset className="w-3.5 h-3.5 text-orange-400" />;
      case 'evening':
        return <Moon className="w-3.5 h-3.5 text-indigo-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="border border-zinc-800 bg-zinc-900/40 rounded-lg p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-zinc-800 text-sky-400">
                <CheckSquare className="w-4 h-4" />
              </span>
              <h2 className="font-mono text-base font-bold tracking-tight text-zinc-100 uppercase">
                "Scan & Execute" Household Checklist
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Frictionless, recurring daily micro-chores. Zero gamification fluff—just a quiet, objective record of execution.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="font-mono text-xs text-right">
              <span className="text-zinc-500 block text-[10px] uppercase">Daily Progress</span>
              <span
                className={`font-semibold ${
                  completedCount === totalChores && totalChores > 0
                    ? 'text-emerald-400'
                    : 'text-zinc-300'
                }`}
              >
                {completedCount} / {totalChores} EXECUTED ({percentage}%)
              </span>
            </div>

            <button
              onClick={() => {
                playSound('click', soundEnabled);
                setIsAdding(!isAdding);
              }}
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded font-mono text-xs flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ADD CHORE</span>
            </button>
          </div>
        </div>

        {/* Slot Filters */}
        <div className="mt-4 flex items-center gap-2 font-mono text-xs">
          {(['all', 'morning', 'midday', 'evening'] as const).map((slot) => (
            <button
              key={slot}
              onClick={() => {
                playSound('click', soundEnabled);
                setActiveSlotFilter(slot);
              }}
              className={`px-2.5 py-1 rounded uppercase tracking-wider text-[11px] transition-colors border ${
                activeSlotFilter === slot
                  ? 'bg-zinc-800 text-zinc-100 border-zinc-700 font-semibold'
                  : 'bg-zinc-950/60 text-zinc-500 border-zinc-800/80 hover:text-zinc-300'
              }`}
            >
              {slot}
            </button>
          ))}
        </div>

        {/* Add Chore Form Drawer */}
        {isAdding && (
          <form
            onSubmit={handleAddSubmit}
            className="mt-4 p-3 rounded-lg border border-zinc-800 bg-zinc-950/80 font-mono text-xs space-y-3"
          >
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Chore title (e.g. Empty dishwasher before coffee)..."
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 text-xs"
                autoFocus
              />

              <select
                value={newSlot}
                onChange={(e) => setNewSlot(e.target.value as 'morning' | 'midday' | 'evening')}
                className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 text-xs focus:outline-none focus:border-emerald-500 uppercase"
              >
                <option value="morning">Morning</option>
                <option value="midday">Midday</option>
                <option value="evening">Evening</option>
              </select>

              <button
                type="submit"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold text-xs transition-colors"
              >
                SAVE CHORE
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded text-xs"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Checklist List */}
      <div className="space-y-2">
        {filteredChores.map((chore) => {
          const executionTimestamp = chore.completedDates?.[selectedDate];
          const isDone = !!executionTimestamp;

          return (
            <div
              key={chore.id}
              onClick={() => handleToggle(chore.id)}
              className={`group flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all font-mono text-xs ${
                isDone
                  ? 'bg-zinc-950/50 border-emerald-950/60 text-zinc-400'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* 1-Tap Checkbox */}
                <button
                  type="button"
                  className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                    isDone
                      ? 'bg-emerald-600 border-emerald-500 text-black'
                      : 'border-zinc-700 bg-zinc-950 group-hover:border-zinc-500'
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : null}
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-medium ${
                        isDone ? 'line-through text-zinc-500' : 'text-zinc-100'
                      }`}
                    >
                      {chore.title}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-zinc-500 uppercase px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800/80">
                      {getSlotIcon(chore.slot)}
                      <span>{chore.slot}</span>
                    </span>
                  </div>

                  {isDone && executionTimestamp && (
                    <p className="text-[10px] text-emerald-500/80 mt-0.5">
                      EXECUTED at{' '}
                      {new Date(executionTimestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
              </div>

              {/* Right status & Delete */}
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded uppercase font-semibold hidden sm:inline-block ${
                    isDone
                      ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/40'
                      : 'text-zinc-500 bg-zinc-950 border border-zinc-800'
                  }`}
                >
                  {isDone ? 'EXECUTED' : 'PENDING'}
                </span>

                {!chore.isDefault && (
                  <button
                    onClick={() => {
                      playSound('click', soundEnabled);
                      onDeleteChore(chore.id);
                    }}
                    className="p-1 text-zinc-600 hover:text-rose-400 rounded transition-colors"
                    title="Delete chore"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
