'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, DbTask, DbGroceryItem, GroceryCategory, TaskPriority } from '@/lib/db';
import { TopHeader } from '@/components/TopHeader';
import { playSound } from '@/lib/sound';
import {
  Check,
  Plus,
  Trash2,
  ShoppingCart,
  ListChecks,
  Store,
  Eraser
} from 'lucide-react';

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  high_focus: 'High Focus',
  quick_win: 'Quick Win',
  errand: 'Errand',
};

const GROCERY_CATEGORIES: { id: GroceryCategory; label: string; emoji: string }[] = [
  { id: 'produce', label: 'Fresh Produce & Greens', emoji: '🥬' },
  { id: 'protein_dairy', label: 'Proteins & Dairy', emoji: '🥚' },
  { id: 'pantry', label: 'Grains & Pantry Staples', emoji: '🍚' },
  { id: 'personal_care', label: 'Personal Care & Household', emoji: '🧴' },
];

const QUICK_STAPLES: { name: string; category: GroceryCategory }[] = [
  { name: 'Eggs', category: 'protein_dairy' },
  { name: 'Avocado', category: 'produce' },
  { name: 'Sourdough Bread', category: 'pantry' },
  { name: 'Jasmine Rice', category: 'pantry' },
  { name: 'Greek Yogurt', category: 'protein_dairy' },
  { name: 'Kimchi', category: 'produce' },
];

type ViewTab = 'tasks' | 'groceries' | 'store';

export default function TasksHub() {
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<ViewTab>('tasks');

  // Tasks state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('high_focus');
  const [taskFilter, setTaskFilter] = useState<'active' | 'completed_today'>('active');

  // Grocery state
  const [groceryName, setGroceryName] = useState('');
  const [groceryCategory, setGroceryCategory] = useState<GroceryCategory>('produce');

  useEffect(() => {
    setMounted(true);
  }, []);

  const tasks = useLiveQuery(() => db.tasks.orderBy('createdAt').reverse().toArray(), []);
  const groceries = useLiveQuery(() => db.groceries.orderBy('createdAt').reverse().toArray(), []);

  const [todayStr, setTodayStr] = useState('');

  useEffect(() => {
    setTodayStr(new Date().toISOString().slice(0, 10));
  }, []);

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    if (taskFilter === 'active') return tasks.filter((t) => !t.completed);
    return tasks.filter((t) => t.completed && t.completedAt?.startsWith(todayStr));
  }, [tasks, taskFilter, todayStr]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    playSound('execute', true);
    const now = new Date().toISOString();
    const task: DbTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: taskTitle.trim(),
      priority: taskPriority,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };
    await db.tasks.put(task);
    setTaskTitle('');
  };

  const toggleTask = async (task: DbTask) => {
    playSound('execute', true);
    const now = new Date().toISOString();
    await db.tasks.update(task.id, {
      completed: !task.completed,
      completedAt: !task.completed ? now : undefined,
      updatedAt: now,
    });
  };

  const deleteTask = async (id: string) => {
    playSound('click', true);
    await db.tasks.delete(id);
  };

  const addGrocery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groceryName.trim()) return;
    playSound('execute', true);
    const now = new Date().toISOString();
    const item: DbGroceryItem = {
      id: `groc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: groceryName.trim(),
      category: groceryCategory,
      checked: false,
      createdAt: now,
      updatedAt: now,
    };
    await db.groceries.put(item);
    setGroceryName('');
  };

  const addQuickStaple = async (name: string, category: GroceryCategory) => {
    playSound('execute', true);
    const now = new Date().toISOString();
    await db.groceries.put({
      id: `groc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      category,
      checked: false,
      createdAt: now,
      updatedAt: now,
    });
  };

  const toggleGrocery = async (item: DbGroceryItem) => {
    playSound('click', true);
    await db.groceries.update(item.id, {
      checked: !item.checked,
      updatedAt: new Date().toISOString(),
    });
  };

  const deleteGrocery = async (id: string) => {
    playSound('click', true);
    await db.groceries.delete(id);
  };

  const clearCompletedGroceries = async () => {
    playSound('execute', true);
    const done = (groceries || []).filter((g) => g.checked);
    await Promise.all(done.map((g) => db.groceries.delete(g.id)));
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#191919] text-[#838383] flex items-center justify-center text-xs">
        <span>Loading Tasks Hub...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#191919] text-[#E3E3E3]">
      <TopHeader pageTitle="Tasks" icon="🧭" />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Page Header */}
        <div>
          <div className="text-4xl mb-2 select-none">🧭</div>
          <h1 className="text-2xl font-bold tracking-tight text-[#E3E3E3]">
            Personal Tasks &amp; Groceries
          </h1>
          <p className="text-xs text-[#838383] mt-1 font-mono">
            Individual operational errands, admin &amp; inventory.
          </p>
          <div className="h-px bg-[#373737] w-full mt-4" />
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-2">
          {(
            [
              { id: 'tasks', label: 'Tasks', icon: ListChecks },
              { id: 'groceries', label: 'Groceries', icon: ShoppingCart },
              { id: 'store', label: 'Store Mode', icon: Store },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => {
                  playSound('click', true);
                  setView(t.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-medium transition-colors ${
                  view === t.id
                    ? 'bg-[#252525] border-[#4D4D4D] text-[#E3E3E3]'
                    : 'bg-[#191919] border-[#373737] text-[#838383] hover:text-[#E3E3E3]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ============ TASKS VIEW ============ */}
        {view === 'tasks' && (
          <div className="space-y-4">
            {/* Add task */}
            <form onSubmit={addTask} className="notion-panel p-3 space-y-2">
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Add a personal task or errand..."
                className="w-full bg-[#202020] border border-[#373737] rounded px-3 py-2 text-xs text-[#E3E3E3] placeholder-[#838383] focus:outline-none focus:border-[#337EA9]"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        playSound('click', true);
                        setTaskPriority(p);
                      }}
                      className={`px-2 py-1 rounded border text-[11px] transition-colors ${
                        taskPriority === p
                          ? 'bg-[#252525] border-[#4D4D4D] text-[#E3E3E3]'
                          : 'bg-[#191919] border-[#373737] text-[#838383]'
                      }`}
                    >
                      {PRIORITY_LABELS[p]}
                    </button>
                  ))}
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#337EA9] hover:bg-[#286a91] text-white rounded text-xs font-medium flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
            </form>

            {/* Filter */}
            <div className="flex items-center gap-2 text-xs">
              {(['active', 'completed_today'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    playSound('click', true);
                    setTaskFilter(f);
                  }}
                  className={`px-2.5 py-1 rounded border transition-colors ${
                    taskFilter === f
                      ? 'bg-[#252525] border-[#4D4D4D] text-[#E3E3E3]'
                      : 'bg-[#191919] border-[#373737] text-[#838383]'
                  }`}
                >
                  {f === 'active' ? 'Active Tasks' : 'Completed Today'}
                </button>
              ))}
            </div>

            {/* Task list */}
            <div className="space-y-2">
              {filteredTasks.length === 0 ? (
                <div className="notion-callout">
                  <span className="text-base select-none">🧹</span>
                  <div className="text-xs text-[#CCCCCC]">
                    No {taskFilter === 'active' ? 'active' : 'completed'} tasks yet.
                    Add one above to start clearing your backlog.
                  </div>
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-2.5 rounded bg-[#202020] border border-[#373737] text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task)}
                      className="notion-checkbox shrink-0"
                    />
                    <span
                      className={`flex-1 ${
                        task.completed ? 'line-through text-[#838383]' : 'text-[#E3E3E3]'
                      }`}
                    >
                      {task.title}
                    </span>
                    <span className="text-[10px] text-[#838383] uppercase px-1.5 py-0.5 rounded bg-[#191919] border border-[#373737]">
                      {PRIORITY_LABELS[task.priority]}
                    </span>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-[#838383] hover:text-[#D9730D]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ============ GROCERIES VIEW ============ */}
        {view === 'groceries' && (
          <div className="space-y-4">
            {/* Quick staples */}
            <div className="notion-panel p-3">
              <span className="text-[10px] uppercase text-[#838383] font-semibold block mb-2">
                Quick Staples
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_STAPLES.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => addQuickStaple(s.name, s.category)}
                    className="px-2.5 py-1 rounded border border-[#373737] bg-[#191919] hover:bg-[#252525] text-[11px] text-[#E3E3E3] transition-colors"
                  >
                    + {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Add grocery */}
            <form onSubmit={addGrocery} className="notion-panel p-3 flex items-center gap-2">
              <input
                type="text"
                value={groceryName}
                onChange={(e) => setGroceryName(e.target.value)}
                placeholder="Add grocery item..."
                className="flex-1 bg-[#202020] border border-[#373737] rounded px-3 py-2 text-xs text-[#E3E3E3] placeholder-[#838383] focus:outline-none focus:border-[#337EA9]"
              />
              <select
                value={groceryCategory}
                onChange={(e) => setGroceryCategory(e.target.value as GroceryCategory)}
                className="bg-[#202020] border border-[#373737] rounded px-2 py-2 text-xs text-[#E3E3E3] focus:outline-none"
              >
                {GROCERY_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="px-3 py-2 bg-[#337EA9] hover:bg-[#286a91] text-white rounded text-xs font-medium"
              >
                Add
              </button>
            </form>

            {/* Categorized view */}
            <div className="space-y-4">
              {GROCERY_CATEGORIES.map((cat) => {
                const items = (groceries || []).filter((g) => g.category === cat.id);
                if (items.length === 0) return null;
                return (
                  <details key={cat.id} open className="notion-panel p-3">
                    <summary className="cursor-pointer text-xs font-semibold text-[#E3E3E3] flex items-center gap-2 select-none">
                      <span>{cat.emoji}</span>
                      <span>{cat.label}</span>
                      <span className="text-[#838383] font-normal">({items.length})</span>
                    </summary>
                    <div className="mt-2 space-y-1.5">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 text-xs py-1"
                        >
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => toggleGrocery(item)}
                            className="notion-checkbox shrink-0"
                          />
                          <span
                            className={`flex-1 ${
                              item.checked ? 'line-through text-[#838383]' : 'text-[#E3E3E3]'
                            }`}
                          >
                            {item.name}
                          </span>
                          <button
                            onClick={() => deleteGrocery(item.id)}
                            className="text-[#838383] hover:text-[#D9730D]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </details>
                );
              })}

              {(groceries || []).length === 0 && (
                <div className="notion-callout">
                  <span className="text-base select-none">🛒</span>
                  <div className="text-xs text-[#CCCCCC]">
                    Grocery list is empty. Use quick staples or add items above.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============ STORE MODE ============ */}
        {view === 'store' && (
          <div className="space-y-4">
            <div className="notion-panel p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <Store className="w-4 h-4 text-[#337EA9]" />
                <span className="font-semibold text-[#E3E3E3]">Store Mode</span>
              </div>
              <button
                onClick={clearCompletedGroceries}
                className="px-2.5 py-1 rounded border border-[#373737] bg-[#202020] hover:bg-[#2A2A2A] text-xs text-[#E3E3E3] flex items-center gap-1"
              >
                <Eraser className="w-3.5 h-3.5" />
                Clear Completed
              </button>
            </div>

            <div className="space-y-1.5">
              {(groceries || []).map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleGrocery(item)}
                  className={`w-full flex items-center gap-3 p-3 rounded border text-left transition-colors ${
                    item.checked
                      ? 'bg-[#1e2f26] border-[#2B593F] text-[#838383]'
                      : 'bg-[#202020] border-[#373737] text-[#E3E3E3] hover:bg-[#252525]'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                      item.checked ? 'bg-[#2B593F] border-[#446B5E]' : 'border-[#4D4D4D]'
                    }`}
                  >
                    {item.checked && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </span>
                  <span
                    className={`flex-1 text-sm ${
                      item.checked ? 'line-through' : 'font-medium'
                    }`}
                  >
                    {item.name}
                  </span>
                  <span className="text-[10px] text-[#838383]">
                    {
                      GROCERY_CATEGORIES.find((c) => c.id === item.category)?.emoji
                    }
                  </span>
                </button>
              ))}

              {(groceries || []).length === 0 && (
                <div className="notion-callout">
                  <span className="text-base select-none">🛒</span>
                  <div className="text-xs text-[#CCCCCC]">
                    Nothing to shop for. Add items in the Groceries tab first.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
