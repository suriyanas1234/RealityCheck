import Dexie, { Table } from 'dexie';
import { getTodayString } from './date-utils';

export interface DbMeal {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: 'breakfast' | 'lunch' | 'dinner';
  stapleId?: string;
  mealName: string;
  loggedAt: string; // ISO
  isOutlier: boolean;
  outlierReason?: string;
  updatedAt: string; // ISO timestamp of last local mutation
  syncedAt?: string; // ISO timestamp when pushed to cloud
}

export interface DbChore {
  id: string;
  title: string;
  slot: 'morning' | 'midday' | 'evening';
  isDefault: boolean;
  completedDates: Record<string, string>; // date -> ISO timestamp
  updatedAt: string; // ISO timestamp of last local mutation
  syncedAt?: string; // ISO timestamp when pushed to cloud
}

export interface DbGesture {
  id: string;
  date: string;
  timestamp: string;
  recipient: 'partner' | 'mother' | 'custom';
  recipientName: string;
  action: string;
  actionType?: 'date_plan' | 'gesture' | 'chore_takeover' | 'day_update_text';
  details?: string;
  scheduledDate?: string; // YYYY-MM-DD for date plans
  wasPrompted: boolean;
  isProactive: boolean; // false if wasPrompted is true
  updatedAt: string; // ISO timestamp of last local mutation
  syncedAt?: string; // ISO timestamp when pushed to cloud
}

export interface DbAudit {
  id: string;
  date: string; // Primary key YYYY-MM-DD
  adheredMeals: boolean;
  completedChores: boolean;
  maintainedComposure: boolean;
  observation?: string;
  completedAt: string;
  updatedAt: string; // ISO timestamp of last local mutation
  syncedAt?: string; // ISO timestamp when pushed to cloud
}

export interface DbUserProfile {
  id: string; // 'default_profile' or auth uid
  data: Record<string, unknown>; // serialized UserProfile
  updatedAt: string; // ISO timestamp of last local mutation
  syncedAt?: string; // ISO timestamp when pushed to cloud
}

export interface DbCadence {
  id: string;
  title: string;
  recipient: string;
  cadenceDays: number;
  lastCompletedDate?: string;
  instructions: string;
}

export interface PushupSet {
  reps: number;
  timestamp: string; // ISO
}

export interface DbPushupLog {
  id: string; // date YYYY-MM-DD (one log per day)
  date: string; // YYYY-MM-DD
  targetCount: number; // default 100
  completedCount: number;
  sets: PushupSet[];
  loggedAt: string; // ISO
  updatedAt: string;
  syncedAt?: string;
}

export interface DbGymSession {
  id: string; // date YYYY-MM-DD (one session per day)
  date: string; // YYYY-MM-DD
  workoutType: string; // "Push" | "Pull" | "Legs" | custom
  completed: boolean;
  loggedAt: string; // ISO
  updatedAt: string;
  syncedAt?: string;
}

export type TaskPriority = 'high_focus' | 'quick_win' | 'errand';

export interface DbTask {
  id: string;
  title: string;
  priority: TaskPriority;
  completed: boolean;
  completedAt?: string; // ISO when completed
  createdAt: string; // ISO
  updatedAt: string;
}

export type GroceryCategory =
  | 'produce'
  | 'protein_dairy'
  | 'pantry'
  | 'personal_care';

export interface DbGroceryItem {
  id: string;
  name: string;
  category: GroceryCategory;
  checked: boolean;
  createdAt: string;
  updatedAt: string;
}

export class RealityCheckDatabase extends Dexie {
  meals!: Table<DbMeal, string>;
  chores!: Table<DbChore, string>;
  gestures!: Table<DbGesture, string>;
  audits!: Table<DbAudit, string>;
  cadences!: Table<DbCadence, string>;
  user_profile!: Table<DbUserProfile, string>;
  pushup_logs!: Table<DbPushupLog, string>;
  gym_sessions!: Table<DbGymSession, string>;
  tasks!: Table<DbTask, string>;
  groceries!: Table<DbGroceryItem, string>;

  constructor() {
    super('RealityCheck_PWA_v2');
    this.version(1).stores({
      meals: 'id, date, mealType, loggedAt, isOutlier',
      chores: 'id, slot, isDefault',
      gestures: 'id, date, recipient, timestamp, isProactive, wasPrompted',
      audits: 'id, date, completedAt',
      cadences: 'id, recipient',
    });
    this.version(2).stores({
      meals: 'id, date, mealType, loggedAt, isOutlier, syncedAt',
      chores: 'id, slot, isDefault, syncedAt',
      gestures: 'id, date, recipient, timestamp, isProactive, wasPrompted, syncedAt',
      audits: 'id, date, completedAt, syncedAt',
      cadences: 'id, recipient',
    });
    this.version(3).stores({
      meals: 'id, date, mealType, loggedAt, isOutlier, updatedAt, syncedAt',
      chores: 'id, slot, isDefault, updatedAt, syncedAt',
      gestures: 'id, date, recipient, timestamp, isProactive, wasPrompted, updatedAt, syncedAt',
      audits: 'id, date, completedAt, updatedAt, syncedAt',
      cadences: 'id, recipient',
      user_profile: 'id, updatedAt, syncedAt',
    });
    this.version(4).stores({
      meals: 'id, date, mealType, loggedAt, isOutlier, updatedAt, syncedAt',
      chores: 'id, slot, isDefault, updatedAt, syncedAt',
      gestures: 'id, date, recipient, timestamp, isProactive, wasPrompted, updatedAt, syncedAt',
      audits: 'id, date, completedAt, updatedAt, syncedAt',
      cadences: 'id, recipient',
      user_profile: 'id, updatedAt, syncedAt',
      pushup_logs: 'id, date, updatedAt, syncedAt',
      gym_sessions: 'id, date, updatedAt, syncedAt',
      tasks: 'id, completed, priority, updatedAt',
      groceries: 'id, category, checked, updatedAt',
    });
  }
}

export const db = new RealityCheckDatabase();

// Default Staples
export const DEFAULT_STAPLE_PROFILES = [
  {
    id: 'staple-quick-plate',
    name: 'Quick Plate',
    description: '3 Scrambled eggs + sliced avocado + greens + olive oil',
    prepTime: '4 min',
    protein: '22g',
    slots: ['breakfast', 'lunch', 'dinner'],
  },
  {
    id: 'staple-eggs-toast',
    name: '5-Min Eggs / Toast',
    description: '2 Poached or sunny eggs on sourdough + greek yogurt cup',
    prepTime: '5 min',
    protein: '26g',
    slots: ['breakfast', 'lunch'],
  },
  {
    id: 'staple-rice-dal',
    name: 'Comfort Rice Bowl',
    description: 'Warm jasmine rice + spiced yellow lentil dal + fermented kimchi',
    prepTime: '3 min (reheat)',
    protein: '18g',
    slots: ['lunch', 'dinner'],
  },
];

// Scheduled Time Windows
export const MEAL_SCHEDULE_WINDOWS = {
  breakfast: {
    target: '08:30 AM',
    startHour: 7.5, // 7:30 AM
    endHour: 9.75, // 9:45 AM
    label: '08:00 AM – 09:30 AM',
  },
  lunch: {
    target: '01:00 PM',
    startHour: 12.5, // 12:30 PM
    endHour: 14.25, // 2:15 PM
    label: '12:30 PM – 02:00 PM',
  },
  dinner: {
    target: '06:30 PM',
    startHour: 18.0, // 6:00 PM
    endHour: 20.25, // 8:15 PM
    label: '06:00 PM – 08:00 PM',
  },
};

// Check if a timestamp is within the scheduled anchor window
export function evaluateMealWindow(
  mealType: 'breakfast' | 'lunch' | 'dinner',
  dateObj: Date = new Date()
): { isOutlier: boolean; reason?: string } {
  const window = MEAL_SCHEDULE_WINDOWS[mealType];
  const decimalHour = dateObj.getHours() + dateObj.getMinutes() / 60;

  if (decimalHour < window.startHour) {
    const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return {
      isOutlier: true,
      reason: `Premature meal at ${timeStr} (target window is ${window.label})`,
    };
  }

  if (decimalHour > window.endHour) {
    const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return {
      isOutlier: true,
      reason: `Out-of-window outlier at ${timeStr} (e.g. 11 AM irregular cooking; scheduled anchor is ${window.target})`,
    };
  }

  return { isOutlier: false };
}

// Default Chores
export const DEFAULT_CHORES_LIST: Array<Omit<DbChore, 'completedDates' | 'updatedAt' | 'syncedAt'>> = [
  {
    id: 'chore-sink-morning',
    title: 'Morning Sink Clear & Dry',
    slot: 'morning',
    isDefault: true,
  },
  {
    id: 'chore-counter-wipe',
    title: 'Kitchen Counter Sanitized & Wiped',
    slot: 'midday',
    isDefault: true,
  },
  {
    id: 'chore-desk-reset',
    title: 'Desk Reset (Zero Cups/Trash)',
    slot: 'midday',
    isDefault: true,
  },
  {
    id: 'chore-sink-evening',
    title: 'Evening Sink Zero (Zero Dishes Left Overnight)',
    slot: 'evening',
    isDefault: true,
  },
  {
    id: 'chore-clothes-staged',
    title: 'Tomorrow Staged (Clothes & Water Ready)',
    slot: 'evening',
    isDefault: true,
  },
  {
    id: 'chore-hair-oil',
    title: 'Hair Oil Protocol (Non-Hair Wash Days)',
    slot: 'morning',
    isDefault: true,
  },
  {
    id: 'chore-weekly-shave',
    title: 'Weekly Shave Maintenance',
    slot: 'morning',
    isDefault: true,
  },
];

// Fetch all local records that have not yet been pushed to the cloud
export async function getUnsyncedRecords() {
  if (typeof window === 'undefined') {
    return { meals: [], chores: [], gestures: [], audits: [], user_profile: [], pushup_logs: [], gym_sessions: [] };
  }

  const [meals, chores, gestures, audits, user_profile, pushup_logs, gym_sessions] = await Promise.all([
    db.meals.filter((m) => !m.syncedAt).toArray(),
    db.chores.filter((c) => !c.syncedAt).toArray(),
    db.gestures.filter((g) => !g.syncedAt).toArray(),
    db.audits.filter((a) => !a.syncedAt).toArray(),
    db.user_profile.filter((p) => !p.syncedAt).toArray(),
    db.pushup_logs.filter((p) => !p.syncedAt).toArray(),
    db.gym_sessions.filter((g) => !g.syncedAt).toArray(),
  ]);

  return { meals, chores, gestures, audits, user_profile, pushup_logs, gym_sessions };
}

// Mark a batch of local records as synced with the cloud
export async function markRecordsSynced(
  ids: {
    meals?: string[];
    chores?: string[];
    gestures?: string[];
    audits?: string[];
    user_profile?: string[];
    pushup_logs?: string[];
    gym_sessions?: string[];
  },
  syncedAt: string = new Date().toISOString()
) {
  if (typeof window === 'undefined') return;

  await db.transaction(
    'rw',
    db.meals,
    db.chores,
    db.gestures,
    db.audits,
    db.user_profile,
    async () => {
      if (ids.meals?.length) {
        await db.meals.where('id').anyOf(ids.meals).modify({ syncedAt });
      }
      if (ids.chores?.length) {
        await db.chores.where('id').anyOf(ids.chores).modify({ syncedAt });
      }
      if (ids.gestures?.length) {
        await db.gestures.where('id').anyOf(ids.gestures).modify({ syncedAt });
      }
      if (ids.audits?.length) {
        await db.audits.where('id').anyOf(ids.audits).modify({ syncedAt });
      }
      if (ids.user_profile?.length) {
        await db.user_profile.where('id').anyOf(ids.user_profile).modify({ syncedAt });
      }
    }
  );

  await db.transaction('rw', db.pushup_logs, db.gym_sessions, async () => {
    if (ids.pushup_logs?.length) {
      await db.pushup_logs.where('id').anyOf(ids.pushup_logs).modify({ syncedAt });
    }
    if (ids.gym_sessions?.length) {
      await db.gym_sessions.where('id').anyOf(ids.gym_sessions).modify({ syncedAt });
    }
  });
}

// Upsert the local user profile record (mirrors StorageService profile)
export async function upsertLocalUserProfile(
  profile: Record<string, unknown>,
  id: string = 'default_profile'
): Promise<void> {
  if (typeof window === 'undefined') return;
  const now = new Date().toISOString();
  const existing = await db.user_profile.get(id);
  await db.user_profile.put({
    id,
    data: profile,
    updatedAt: now,
    syncedAt: existing?.syncedAt,
  });
}

// Apply prerequisites into Dexie Database
export async function applyPrerequisitesToDatabase(
  choresList: Array<{ id: string; title: string; slot: 'morning' | 'midday' | 'evening'; isDefault?: boolean }>,
  partnerName: string = 'Partner',
  partnerCadenceDays: number = 14,
  motherName: string = 'Mother',
  motherCadenceDays: number = 3
) {
  if (typeof window === 'undefined') return;

  // 1. Sync chores
  for (const c of choresList) {
    const existing = await db.chores.get(c.id);
    if (!existing) {
      await db.chores.put({
        id: c.id,
        title: c.title,
        slot: c.slot,
        isDefault: c.isDefault ?? false,
        completedDates: {},
        updatedAt: new Date().toISOString(),
      });
    } else {
      await db.chores.update(c.id, {
        title: c.title,
        slot: c.slot,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  // 2. Update Cadences
  await db.cadences.put({
    id: 'cadence-date-night',
    title: `Plan Complete Date for ${partnerName} (Activity + Food + Logistics)`,
    recipient: partnerName,
    cadenceDays: partnerCadenceDays,
    lastCompletedDate: getTodayString(new Date(Date.now() - 5 * 86400000)),
    instructions: `Bi-weekly prompt: Book complete date for ${partnerName} without asking partner to make decisions or research venues.`,
  });

  await db.cadences.put({
    id: 'cadence-unprompted-gesture',
    title: `Unprompted Flower / Care Gesture for ${partnerName}`,
    recipient: partnerName,
    cadenceDays: partnerCadenceDays,
    lastCompletedDate: getTodayString(new Date(Date.now() - 6 * 86400000)),
    instructions: `Bi-weekly prompt: Deliver favorite flowers or surprise treat to ${partnerName} unprompted.`,
  });

  await db.cadences.put({
    id: 'cadence-mom-call',
    title: `Unprompted Check-in Call with ${motherName}`,
    recipient: motherName,
    cadenceDays: motherCadenceDays,
    lastCompletedDate: getTodayString(new Date(Date.now() - 2 * 86400000)),
    instructions: `Reach out to ${motherName} unprompted before any reminder is needed.`,
  });
}

// Seed initial database
export async function seedDatabaseIfEmpty() {
  if (typeof window === 'undefined') return;

  await db.transaction('rw', db.chores, db.cadences, db.audits, db.meals, db.gestures, async () => {
    const choresCount = await db.chores.count();
    if (choresCount !== 0) return;

    // Insert chores (put = idempotent, avoids ConstraintError on re-run)
    for (const chore of DEFAULT_CHORES_LIST) {
      await db.chores.put({
        ...chore,
        completedDates: {},
        updatedAt: new Date().toISOString(),
      });
    }

    // Insert Cadences
    await db.cadences.bulkPut([
      {
        id: 'cadence-date-night',
        title: 'Plan Complete Date (Activity + Food + Logistics)',
        recipient: 'Partner',
        cadenceDays: 14,
        lastCompletedDate: getTodayString(new Date(Date.now() - 5 * 86400000)),
        instructions:
          'Bi-weekly prompt: Book complete date without asking partner to make decisions or research venues.',
      },
      {
        id: 'cadence-unprompted-gesture',
        title: 'Unprompted Flower / Care Gesture',
        recipient: 'Partner',
        cadenceDays: 14,
        lastCompletedDate: getTodayString(new Date(Date.now() - 6 * 86400000)),
        instructions:
          'Bi-weekly prompt: Deliver favorite flowers or surprise treat when no conflict or request occurred.',
      },
      {
        id: 'cadence-mom-call',
        title: 'Unprompted Check-in Call',
        recipient: 'Mother',
        cadenceDays: 3,
        lastCompletedDate: getTodayString(new Date(Date.now() - 2 * 86400000)),
        instructions:
          'Reach out unprompted before she needs to send a check-in reminder.',
      },
    ]);

    // No demo history is seeded. All meals, audits, and gestures are
    // entered by the user and persisted in IndexedDB from that point on.
  });
}
