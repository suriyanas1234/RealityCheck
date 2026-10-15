export type MealType = 'breakfast' | 'lunch' | 'dinner';

export interface StapleMeal {
  id: string;
  name: string;
  description: string;
  proteinGrams?: number;
  preparationMinutes: number;
}

export interface MealLog {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  stapleId?: string;
  customMealName?: string;
  loggedAt: string; // ISO String
  notes?: string;
}

export interface ScheduleBlock {
  id: string;
  title: string;
  time: string; // 24-hr format "08:00", "08:30", "13:00", "18:30", "22:30"
  displayTime: string; // "8:00 AM"
  category: 'wake' | 'meal' | 'work' | 'reset' | 'sleep';
  description: string;
  actionPrompt: string;
  isMealAnchor?: boolean;
  mealType?: MealType;
}

export interface ChoreItem {
  id: string;
  title: string;
  slot: 'morning' | 'midday' | 'evening';
  estimatedSeconds: number;
  completedDates: Record<string, string>; // date (YYYY-MM-DD) -> ISO timestamp of execution
  isDefault?: boolean;
}

export type RecipientType = 'girlfriend' | 'mother' | 'custom';

export interface RelationshipContact {
  id: string;
  name: string;
  relationship: RecipientType;
  cadenceDays: number; // e.g. 14 for bi-weekly, 3 for mom call
  reminderTitle: string;
  recurringDay?: string; // e.g., 'Monday' for "Plan Friday Date Night"
}

export interface ProactiveGestureLog {
  id: string;
  recipientId: string;
  recipientName: string;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO
  gestureType: string;
  details: string;
  wasPrompted: boolean; // CRITICAL: If true, rejected from unprompted metrics
  tags?: string[];
}

export interface NightlyAuditRecord {
  id: string;
  date: string; // YYYY-MM-DD
  adheredToMealSchedule: boolean;
  completedChoresUnprompted: boolean;
  maintainedComposure: boolean;
  objectiveObservation?: string;
  completedAt: string; // ISO timestamp
}

export interface AppSettings {
  soundEnabled: boolean;
  militaryTime: boolean;
  staples: Record<MealType, StapleMeal[]>;
  contacts: RelationshipContact[];
  scheduleBlocks: ScheduleBlock[];
  supabaseConfig?: {
    enabled: boolean;
    url: string;
    anonKey: string;
  };
}

export interface DayExecutionSummary {
  date: string;
  mealsCompleted: number; // 0 - 3
  choresCompleted: number;
  totalChores: number;
  auditPassed: boolean | null; // null if not logged yet, true if 3/3, false if < 3
  auditScore: number; // 0 - 3
  unpromptedGesturesCount: number;
}
