import Dexie, { Table } from 'dexie';
import { getTodayString, formatTime24String, formatTimeShort } from './date-utils';

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
    this.version(5).stores({
      meals: 'id, date, mealType, loggedAt, isOutlier, updatedAt, syncedAt',
      chores: 'id, slot, isDefault, updatedAt, syncedAt',
      gestures: 'id, date, recipient, timestamp, actionType, isProactive, wasPrompted, updatedAt, syncedAt',
      audits: 'id, date, completedAt, updatedAt, syncedAt',
      cadences: 'id, recipient',
      user_profile: 'id, updatedAt, syncedAt',
      pushup_logs: 'id, date, updatedAt, syncedAt',
      gym_sessions: 'id, date, updatedAt, syncedAt',
      tasks: 'id, completed, priority, updatedAt',
      groceries: 'id, category, checked, updatedAt',
    });
    this.version(6).stores({
      tasks: 'id, completed, priority, createdAt, updatedAt',
      groceries: 'id, category, checked, createdAt, updatedAt',
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

function decimalHourTo24Str(dec: number): string {
  const clamped = Math.max(0, Math.min(23.98, dec));
  const h = Math.floor(clamped);
  const m = Math.round((clamped - h) * 60);
  const finalH = m === 60 ? Math.min(23, h + 1) : h;
  const finalM = m === 60 ? 0 : m;
  return `${String(finalH).padStart(2, '0')}:${String(finalM).padStart(2, '0')}`;
}

export function getMealScheduleWindows(): typeof MEAL_SCHEDULE_WINDOWS {
  if (typeof window === 'undefined') return MEAL_SCHEDULE_WINDOWS;
  try {
    const raw = localStorage.getItem('reality_check_settings_v1');
    if (!raw) return MEAL_SCHEDULE_WINDOWS;
    const settings = JSON.parse(raw);
    const military = Boolean(settings.militaryTime);
    const blocks: Array<{ id?: string; time?: string; mealType?: string }> =
      settings.scheduleBlocks || [];
    const anchors = settings.userProfile?.anchors;

    const resolveMealTime = (
      mealType: 'breakfast' | 'lunch' | 'dinner',
      fallback24: string
    ): string => {
      const block = blocks.find(
        (b) =>
          b.mealType === mealType ||
          b.id === `block-${mealType}` ||
          b.id === `anchor-${mealType}`
      );
      if (block?.time && block.time.includes(':')) return block.time;
      if (mealType === 'breakfast' && anchors?.breakfast) return anchors.breakfast;
      if (mealType === 'lunch' && anchors?.lunch) return anchors.lunch;
      if (mealType === 'dinner' && anchors?.eveningReset) return anchors.eveningReset;
      return fallback24;
    };

    const buildWindow = (time24: string, preHours: number, postHours: number) => {
      const [hStr, mStr] = time24.split(':');
      const targetDec = (parseInt(hStr, 10) || 0) + (parseInt(mStr, 10) || 0) / 60;
      const startHour = Math.max(0, targetDec - preHours);
      const endHour = Math.min(23.95, targetDec + postHours);
      const labelStart = formatTime24String(decimalHourTo24Str( targetDec - 0.5 ), military);
      const labelEnd = formatTime24String(decimalHourTo24Str( targetDec + 1.0 ), military);
      return {
        target: formatTime24String(time24, military),
        startHour,
        endHour,
        label: `${labelStart} – ${labelEnd}`,
      };
    };

    return {
      breakfast: buildWindow(resolveMealTime('breakfast', '08:30'), 1.0, 1.25),
      lunch: buildWindow(resolveMealTime('lunch', '13:00'), 0.5, 1.25),
      dinner: buildWindow(resolveMealTime('dinner', '18:30'), 0.5, 1.75),
    };
  } catch {
    return MEAL_SCHEDULE_WINDOWS;
  }
}

// Check if a timestamp is within the scheduled anchor window
export function evaluateMealWindow(
  mealType: 'breakfast' | 'lunch' | 'dinner',
  dateObj: Date = new Date()
): { isOutlier: boolean; reason?: string } {
  const windows = getMealScheduleWindows();
  const window = windows[mealType];
  const decimalHour = dateObj.getHours() + dateObj.getMinutes() / 60;
  let military = false;
  if (typeof globalThis.window !== 'undefined') {
    try {
      const raw = localStorage.getItem('reality_check_settings_v1');
      if (raw) military = Boolean(JSON.parse(raw).militaryTime);
    } catch {
      // ignore
    }
  }
  const timeStr = formatTimeShort(dateObj, military);

  if (decimalHour < window.startHour) {
    return {
      isOutlier: true,
      reason: `Premature meal at ${timeStr} (target window is ${window.label})`,
    };
  }

  if (decimalHour > window.endHour) {
    return {
      isOutlier: true,
      reason: `Out-of-window outlier at ${timeStr} (scheduled anchor is ${window.target})`,
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
  motherCadenceDays: number = 3,
  gestureCadenceDays?: number,
  partnerNotes?: string,
  motherNotes?: string
) {
  if (typeof window === 'undefined') return;

  // 1. Sync chores (update/add configured chores and remove deleted ones)
  const incomingIds = new Set(choresList.map((c) => c.id));
  const existingAll = await db.chores.toArray();
  for (const existing of existingAll) {
    if (!incomingIds.has(existing.id)) {
      await db.chores.delete(existing.id);
    }
  }

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

  // 2. Update Cadences while preserving existing lastCompletedDate
  const [existingDateNight, existingGesture, existingMom] = await Promise.all([
    db.cadences.get('cadence-date-night'),
    db.cadences.get('cadence-unprompted-gesture'),
    db.cadences.get('cadence-mom-call'),
  ]);

  await db.cadences.put({
    id: 'cadence-date-night',
    title: `Plan Complete Date for ${partnerName} (Activity + Food + Logistics)`,
    recipient: partnerName,
    cadenceDays: partnerCadenceDays,
    lastCompletedDate: existingDateNight?.lastCompletedDate,
    instructions:
      partnerNotes ||
      `Bi-weekly prompt: Book complete date for ${partnerName} without asking partner to make decisions or research venues.`,
  });

  await db.cadences.put({
    id: 'cadence-unprompted-gesture',
    title: `Unprompted Flower / Care Gesture for ${partnerName}`,
    recipient: partnerName,
    cadenceDays: gestureCadenceDays || partnerCadenceDays,
    lastCompletedDate: existingGesture?.lastCompletedDate,
    instructions:
      partnerNotes ||
      `Bi-weekly prompt: Deliver favorite flowers or surprise treat to ${partnerName} unprompted.`,
  });

  await db.cadences.put({
    id: 'cadence-mom-call',
    title: `Unprompted Check-in Call with ${motherName}`,
    recipient: motherName,
    cadenceDays: motherCadenceDays,
    lastCompletedDate: existingMom?.lastCompletedDate,
    instructions:
      motherNotes ||
      `Reach out to ${motherName} unprompted before any reminder is needed.`,
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

    // Insert Cadences (fresh unprompted baselines)
    await db.cadences.bulkPut([
      {
        id: 'cadence-date-night',
        title: 'Plan Complete Date (Activity + Food + Logistics)',
        recipient: 'Partner',
        cadenceDays: 14,
        instructions:
          'Bi-weekly prompt: Book complete date without asking partner to make decisions or research venues.',
      },
      {
        id: 'cadence-unprompted-gesture',
        title: 'Unprompted Flower / Care Gesture',
        recipient: 'Partner',
        cadenceDays: 14,
        instructions:
          'Bi-weekly prompt: Deliver favorite flowers or surprise treat when no conflict or request occurred.',
      },
      {
        id: 'cadence-mom-call',
        title: 'Unprompted Check-in Call',
        recipient: 'Mother',
        cadenceDays: 3,
        instructions:
          'Reach out unprompted before she needs to send a check-in reminder.',
      },
    ]);

    // Purge any legacy mock records from previous runs
    await db.meals.filter((m) => m.id.startsWith('meal-bf-202') || m.id.startsWith('meal-lu-202') || m.id.startsWith('meal-di-202')).delete();
    await db.audits.filter((a) => a.id.startsWith('audit-202')).delete();
    await db.gestures.filter((g) => g.id.startsWith('gesture-seed')).delete();

    // No demo history is seeded. All meals, audits, and gestures are
    // entered by the user and persisted in IndexedDB from that point on.
  });
}


// Clear all historical data from Dexie IndexedDB
export async function clearAllHistoricalDataFromDatabase(): Promise<void> {
  if (typeof window === 'undefined') return;
  await db.transaction(
    'rw',
    [db.meals, db.gestures, db.audits, db.pushup_logs, db.gym_sessions, db.chores, db.cadences],
    async () => {
      await db.meals.clear();
      await db.gestures.clear();
      await db.audits.clear();
      await db.pushup_logs.clear();
      await db.gym_sessions.clear();
      await db.chores.toCollection().modify((chore) => {
        chore.completedDates = {};
      });
      await db.cadences.toCollection().modify((cadence) => {
        delete cadence.lastCompletedDate;
      });
    }
  );
}

// Import a complete JSON backup into Dexie IndexedDB and localStorage
export async function importDatabaseBackup(rawJson: string): Promise<{ success: boolean; count: number; error?: string }> {
  if (typeof window === 'undefined') return { success: false, count: 0, error: 'Not running in browser' };
  try {
    const data = JSON.parse(rawJson);
    if (!data || typeof data !== 'object') {
      return { success: false, count: 0, error: 'Invalid backup JSON object.' };
    }

    let importedCount = 0;

    if (Array.isArray(data.meals)) {
      await db.meals.bulkPut(data.meals);
      importedCount += data.meals.length;
    }
    if (Array.isArray(data.chores)) {
      await db.chores.bulkPut(data.chores);
      importedCount += data.chores.length;
    }
    const gesturesList = Array.isArray(data.initiative_ledger)
      ? data.initiative_ledger
      : Array.isArray(data.gestures)
      ? data.gestures
      : null;
    if (gesturesList) {
      await db.gestures.bulkPut(gesturesList);
      importedCount += gesturesList.length;
    }
    const auditsList = Array.isArray(data.daily_audits)
      ? data.daily_audits
      : Array.isArray(data.audits)
      ? data.audits
      : null;
    if (auditsList) {
      await db.audits.bulkPut(auditsList);
      importedCount += auditsList.length;
    }
    if (Array.isArray(data.cadences)) {
      await db.cadences.bulkPut(data.cadences);
      importedCount += data.cadences.length;
    }
    if (Array.isArray(data.user_profile)) {
      await db.user_profile.bulkPut(data.user_profile);
      importedCount += data.user_profile.length;
    }
    if (Array.isArray(data.pushup_logs)) {
      await db.pushup_logs.bulkPut(data.pushup_logs);
      importedCount += data.pushup_logs.length;
    }
    if (Array.isArray(data.gym_sessions)) {
      await db.gym_sessions.bulkPut(data.gym_sessions);
      importedCount += data.gym_sessions.length;
    }
    if (Array.isArray(data.tasks)) {
      await db.tasks.bulkPut(data.tasks);
      importedCount += data.tasks.length;
    }
    if (Array.isArray(data.groceries)) {
      await db.groceries.bulkPut(data.groceries);
      importedCount += data.groceries.length;
    }
    if (data.settings && typeof data.settings === 'object') {
      localStorage.setItem('reality_check_settings_v1', JSON.stringify(data.settings));
      if (data.settings.userProfile) {
        localStorage.setItem('reality_check_profile_v1', JSON.stringify(data.settings.userProfile));
      }
    }

    return { success: true, count: importedCount };
  } catch (err) {
    return {
      success: false,
      count: 0,
      error: err instanceof Error ? err.message : 'Failed to parse backup JSON',
    };
  }
}
