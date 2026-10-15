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

export interface UserProfile {
  id?: string;
  name: string;
  email?: string;
  focusAreas: string[];
  isOfflineOnly: boolean;
  partnerName: string;
  partnerCadenceDays: number;
  partnerReminderNotes?: string;
  motherName: string;
  motherCadenceDays: number;
  motherReminderNotes?: string;
  anchors: {
    morningReset: string;
    breakfast: string;
    lunch: string;
    eveningReset: string;
    dayClosure: string;
  };
  cadences: {
    partnerName: string;
    momName: string;
    dateIntervalDays: number;
    gestureIntervalDays: number;
    momCheckinIntervalDays: number;
  };
  chores: string[];
  createdAt: string;
  onboarded: boolean;
  onboardingCompleted: boolean;
  onboardedAt?: string;
}

export interface PrerequisitesPayload {
  profile: UserProfile;
  schedule: ScheduleBlock[];
  staples: Record<MealType, StapleMeal[]>;
  chores: ChoreItem[];
  contacts: RelationshipContact[];
  militaryTime?: boolean;
  soundEnabled?: boolean;
  supabaseConfig?: {
    enabled: boolean;
    url: string;
    anonKey: string;
  };
}

export interface AppSettings {
  soundEnabled: boolean;
  militaryTime: boolean;
  staples: Record<MealType, StapleMeal[]>;
  contacts: RelationshipContact[];
  scheduleBlocks: ScheduleBlock[];
  userProfile?: UserProfile;
  supabaseConfig?: {
    enabled: boolean;
    url: string;
    anonKey: string;
  };
}

export type ExecutionLogType = 'meal' | 'chore' | 'initiative' | 'audit';

export interface CloudProfile {
  id: string;
  schedule: Record<string, string>;
  meal_staples: Record<string, string>;
  targets: {
    relationships: string[];
    dailyChores: string[];
  };
  is_onboarded: boolean;
  updated_at?: string;
}

export interface ExecutionLogPayload {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  type: ExecutionLogType;
  title: string;
  is_unprompted: boolean;
  is_outlier: boolean;
  completed_at: string; // ISO
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

// ============================================================
// Cloud Sync Engine Types
// ============================================================

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'local_only' | 'error';

export interface SyncResult {
  pushed: number;
  pulled: number;
  error?: string;
}

export interface UserProfileRecord {
  id: string; // 'default_profile' or auth uid
  user_id?: string;
  data: UserProfile;
  updated_at: string; // ISO
  syncedAt?: string; // ISO
}

export interface InitiativeLedgerEntry {
  id: string;
  user_id?: string;
  recipient: 'partner' | 'mother' | 'custom';
  recipient_name: string;
  action_type: 'date_plan' | 'gesture' | 'chore_takeover' | 'day_update_text';
  description: string;
  details?: string;
  scheduled_date?: string; // YYYY-MM-DD
  is_reactive: boolean; // true = prompted/reactive, false = proactive
  created_at: string; // ISO
  updated_at: string; // ISO
  syncedAt?: string; // ISO
}

export interface DailyAuditRecordCloud {
  id: string;
  user_id?: string;
  date: string; // YYYY-MM-DD
  meals_adhered: boolean;
  chores_executed: boolean;
  composure_maintained: boolean;
  observation?: string;
  created_at: string; // ISO
  updated_at: string; // ISO
  syncedAt?: string; // ISO
}

export interface MealRecordCloud {
  id: string;
  user_id?: string;
  date: string; // YYYY-MM-DD
  meal_type: MealType;
  staple_id?: string;
  custom_meal_name?: string;
  scheduled_window?: string;
  is_outlier: boolean;
  outlier_reason?: string;
  logged_at: string; // ISO
  updated_at: string; // ISO
  syncedAt?: string; // ISO
}

export interface PushupLogRecord {
  id: string;
  user_id?: string;
  date: string; // YYYY-MM-DD
  target_count: number;
  completed_count: number;
  sets: { reps: number; timestamp: string }[];
  logged_at: string; // ISO
  updated_at: string; // ISO
  syncedAt?: string; // ISO
}

export interface GymSessionRecord {
  id: string;
  user_id?: string;
  date: string; // YYYY-MM-DD
  workout_type: string;
  completed: boolean;
  logged_at: string; // ISO
  updated_at: string; // ISO
  syncedAt?: string; // ISO
}

