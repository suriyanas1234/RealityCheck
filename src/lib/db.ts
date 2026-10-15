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
}

export interface DbChore {
  id: string;
  title: string;
  slot: 'morning' | 'midday' | 'evening';
  isDefault: boolean;
  completedDates: Record<string, string>; // date -> ISO timestamp
}

export interface DbGesture {
  id: string;
  date: string;
  timestamp: string;
  recipient: 'partner' | 'mother' | 'custom';
  recipientName: string;
  action: string;
  details?: string;
  wasPrompted: boolean;
  isProactive: boolean; // false if wasPrompted is true
}

export interface DbAudit {
  id: string;
  date: string; // Primary key YYYY-MM-DD
  adheredMeals: boolean;
  completedChores: boolean;
  maintainedComposure: boolean;
  observation?: string;
  completedAt: string;
}

export interface DbCadence {
  id: string;
  title: string;
  recipient: string;
  cadenceDays: number;
  lastCompletedDate?: string;
  instructions: string;
}

export class RealityCheckDatabase extends Dexie {
  meals!: Table<DbMeal, string>;
  chores!: Table<DbChore, string>;
  gestures!: Table<DbGesture, string>;
  audits!: Table<DbAudit, string>;
  cadences!: Table<DbCadence, string>;

  constructor() {
    super('RealityCheck_PWA_v2');
    this.version(1).stores({
      meals: 'id, date, mealType, loggedAt, isOutlier',
      chores: 'id, slot, isDefault',
      gestures: 'id, date, recipient, timestamp, isProactive, wasPrompted',
      audits: 'id, date, completedAt',
      cadences: 'id, recipient',
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
export const DEFAULT_CHORES_LIST: Array<Omit<DbChore, 'completedDates'>> = [
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
];

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
      });
    } else {
      await db.chores.update(c.id, {
        title: c.title,
        slot: c.slot,
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

  const choresCount = await db.chores.count();
  if (choresCount === 0) {
    const today = getTodayString();

    // Insert chores
    for (const chore of DEFAULT_CHORES_LIST) {
      await db.chores.add({
        ...chore,
        completedDates: {},
      });
    }

    // Insert Cadences
    await db.cadences.bulkAdd([
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

    // Seed 25 days of realistic historical audit records for the 30-day consistency vault
    const todayObj = new Date();
    for (let i = 26; i >= 1; i--) {
      const d = new Date(todayObj);
      d.setDate(d.getDate() - i);
      const dateStr = getTodayString(d);

      const mealsAdhered = i !== 14 && i !== 21;
      const choresDone = i !== 8;
      const composure = i !== 17 && i !== 4;

      await db.audits.put({
        id: dateStr,
        date: dateStr,
        adheredMeals: mealsAdhered,
        completedChores: choresDone,
        maintainedComposure: composure,
        observation: !composure
          ? 'Work stress triggered defensiveness. Paused 10 seconds before replying.'
          : undefined,
        completedAt: new Date(d.setHours(22, 35, 0, 0)).toISOString(),
      });

      // Seed past meals
      await db.meals.put({
        id: `meal-bf-${dateStr}`,
        date: dateStr,
        mealType: 'breakfast',
        mealName: 'Quick Plate',
        loggedAt: new Date(d.setHours(8, 32, 0, 0)).toISOString(),
        isOutlier: false,
      });

      await db.meals.put({
        id: `meal-lu-${dateStr}`,
        date: dateStr,
        mealType: 'lunch',
        mealName: '5-Min Eggs / Toast',
        loggedAt: new Date(d.setHours(13, 8, 0, 0)).toISOString(),
        isOutlier: false,
      });

      await db.meals.put({
        id: `meal-di-${dateStr}`,
        date: dateStr,
        mealType: 'dinner',
        mealName: 'Comfort Rice Bowl',
        loggedAt: new Date(d.setHours(18, 45, 0, 0)).toISOString(),
        isOutlier: false,
      });
    }

    // Seed past verified gestures
    await db.gestures.bulkAdd([
      {
        id: 'g-seed-1',
        date: getTodayString(new Date(Date.now() - 5 * 86400000)),
        timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
        recipient: 'partner',
        recipientName: 'Partner',
        action: 'Planned Friday Date Night',
        details: 'Selected venue, booked table at 7:30 PM, sent calendar invite without prompting.',
        wasPrompted: false,
        isProactive: true,
      },
      {
        id: 'g-seed-2',
        date: getTodayString(new Date(Date.now() - 6 * 86400000)),
        timestamp: new Date(Date.now() - 6 * 86400000).toISOString(),
        recipient: 'partner',
        recipientName: 'Partner',
        action: 'Fresh Lilies & Matcha Treat',
        details: 'Delivered to her work desk during afternoon break unprompted.',
        wasPrompted: false,
        isProactive: true,
      },
      {
        id: 'g-seed-3',
        date: getTodayString(new Date(Date.now() - 2 * 86400000)),
        timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
        recipient: 'mother',
        recipientName: 'Mother',
        action: 'Unprompted 20-Min Call',
        details: 'Asked about her week and listened without multitasking.',
        wasPrompted: false,
        isProactive: true,
      },
    ]);
  }
}
