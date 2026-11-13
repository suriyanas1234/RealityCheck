# Graph Report - RealityCheck  (2026-11-13)

## Corpus Check
- 47 files · ~39,157 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .ico 1, .css 1)

## Summary
- 332 nodes · 965 edges · 17 communities (15 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1e608b56`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- db.ts
- package.json
- storage.ts
- StorageService
- useAuth.ts
- supabase.ts
- compilerOptions
- manifest.json
- RealityCheck // Forge (Disciplined Execution & Habit Alignment Engine)
- AGENTS.md
- playSound
- react
- sw.js
- getTodayString
- meals/page.tsx
- lucide-react
- app/page.tsx

## God Nodes (most connected - your core abstractions)
1. `StorageService` - 46 edges
2. `playSound()` - 37 edges
3. `react` - 28 edges
4. `useCloudSync()` - 24 edges
5. `lucide-react` - 23 edges
6. `getTodayString()` - 21 edges
7. `createCustomSupabaseClient()` - 20 edges
8. `TodayExecutionHub()` - 16 edges
9. `TopHeader()` - 16 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `⚡ Offline-First Architecture & Cloud Sync` --references--> `useCloudSync()`  [INFERRED]
  README.md → src/hooks/useCloudSync.ts
- `DailyRhythm()` --calls--> `playSound()`  [EXTRACTED]
  src/components/DailyRhythm.tsx → src/lib/sound.ts
- `NightlyAuditProps` --references--> `NightlyAuditRecord`  [EXTRACTED]
  src/components/NightlyAudit.tsx → src/types/index.ts
- `InitiativeHub()` --calls--> `getDayDifference()`  [EXTRACTED]
  src/app/initiative/page.tsx → src/lib/date-utils.ts
- `InitiativeHub()` --calls--> `getTodayString()`  [EXTRACTED]
  src/app/initiative/page.tsx → src/lib/date-utils.ts

## Import Cycles
- None detected.

## Communities (17 total, 2 thin omitted)

### Community 0 - "db.ts"
Cohesion: 0.10
Nodes (22): dexie-react-hooks@^4.4.0, dexie-react-hooks, GROCERY_CATEGORIES, PRIORITY_LABELS, QUICK_STAPLES, ViewTab, QUICK_ADD, WORKOUT_SPLITS (+14 more)

### Community 1 - "package.json"
Cohesion: 0.06
Nodes (39): eslintConfig, dependencies, clsx@^2.1.1, dexie@^4.4.6, lucide-react@^1.57.0, next@16.4.1, react@19.3.0, react-dom@19.3.0 (+31 more)

### Community 2 - "storage.ts"
Cohesion: 0.15
Nodes (20): SignupOnboardingPage(), DailyRhythm(), DailyRhythmProps, OnboardingDialogProps, DEFAULT_CHORES, FOCUS_OPTIONS, OnboardingModalProps, SettingsModalProps (+12 more)

### Community 3 - "StorageService"
Cohesion: 0.19
Nodes (8): OnboardingDialog(), SettingsModal(), upsertLocalUserProfile(), StorageService, MealLog, NightlyAuditRecord, PrerequisitesPayload, ProactiveGestureLog

### Community 4 - "useAuth.ts"
Cohesion: 0.10
Nodes (21): nextConfig, next, @supabase/supabase-js, contentType, size, contentType, size, metadata (+13 more)

### Community 5 - "supabase.ts"
Cohesion: 0.13
Nodes (40): resolveCredentials(), useCloudSync(), getUnsyncedRecords(), markRecordsSynced(), createCustomSupabaseClient(), fetchChoresSince(), fetchCloudProfile(), fetchDailyAuditsSince() (+32 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 7 - "manifest.json"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 8 - "RealityCheck // Forge (Disciplined Execution & Habit Alignment Engine)"
Cohesion: 0.20
Nodes (9): 1. Today / Execution Hub (`/`), 2. Meals / Meal Engine Hub (`/meals`), 3. Relationships & Initiative Engine (`/initiative`), 4. Audit & Consistency Vault (`/vault`), 🚀 Deployment to Vercel, 🖤 Design System: Notion Dark Mode Aesthetic, ⚡ Offline-First Architecture & Cloud Sync, RealityCheck // Forge (Disciplined Execution & Habit Alignment Engine) (+1 more)

### Community 10 - "playSound"
Cohesion: 0.24
Nodes (11): LoginPage(), HouseholdChecklist(), HouseholdChecklistProps, RelationshipTracker(), RelationshipTrackerProps, getDayDifference(), getAudioContext(), isSoundEnabledInSettings() (+3 more)

### Community 11 - "react"
Cohesion: 0.23
Nodes (10): react, NotificationPermissionBanner(), NotificationScheduler(), canNotify(), isBrowser(), NotificationPermissionState, useNotifications(), firedRef (+2 more)

### Community 13 - "getTodayString"
Cohesion: 0.40
Nodes (8): VaultHub(), NightlyAudit(), NightlyAuditProps, formatFriendlyDate(), getPastNDays(), getTodayString(), DbAudit, importDatabaseBackup()

### Community 14 - "meals/page.tsx"
Cohesion: 0.33
Nodes (9): MealsEngineHub(), formatTimeShort(), decimalHourTo24Str(), DEFAULT_STAPLE_PROFILES, evaluateMealWindow(), getMealScheduleWindows(), MEAL_SCHEDULE_WINDOWS, seedDatabaseIfEmpty() (+1 more)

### Community 15 - "lucide-react"
Cohesion: 0.21
Nodes (10): lucide-react, ActionCategory, CATEGORY_LABELS, InitiativeHub(), RecipientTab, TasksHub(), FrictionKillerModal(), FrictionKillerModalProps (+2 more)

### Community 17 - "app/page.tsx"
Cohesion: 0.29
Nodes (11): SCHEDULE_ANCHORS, TodayExecutionHub(), HeaderHUD(), HeaderHUDProps, OnboardingModal(), PushupEngine(), formatMinutesCountdown(), formatTime24String() (+3 more)

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `StorageService` connect `StorageService` to `storage.ts`, `useAuth.ts`, `supabase.ts`, `react`, `getTodayString`, `meals/page.tsx`, `lucide-react`, `app/page.tsx`?**
  _High betweenness centrality (0.113) - this node is a cross-community bridge._
- **Should `db.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10461538461538461 - nodes in this community are weakly interconnected._
- **Why does `react` connect `react` to `db.ts`, `package.json`, `storage.ts`, `useAuth.ts`, `supabase.ts`, `playSound`, `getTodayString`, `meals/page.tsx`, `lucide-react`, `app/page.tsx`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06463414634146342 - nodes in this community are weakly interconnected._
- **Why does `next` connect `useAuth.ts` to `package.json`, `storage.ts`, `playSound`, `meals/page.tsx`, `lucide-react`, `app/page.tsx`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Should `storage.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1452991452991453 - nodes in this community are weakly interconnected._
- **Should `useAuth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1028225806451613 - nodes in this community are weakly interconnected._