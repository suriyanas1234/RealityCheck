# RealityCheck // Forge (Disciplined Execution & Habit Alignment Engine)

> A high-performance, offline-first Progressive Web Application (PWA) built specifically to eliminate personal passivity, indecision, poor daily scheduling, and reactive behavior.
> Strictly styled in the **Notion Dark Mode Aesthetic** and optimized for **iPhone 17 Pro Standalone Mode** and **Vercel deployment**.

---

## 🖤 Design System: Notion Dark Mode Aesthetic

- **Background Palette:** Pure Notion Dark (`#191919`) and Off-Black (`#202020`).
- **Cards & Block Containers:** `#252525` minimalist panels with subtle 1px borders (`#373737`).
- **Typography:** Apple System / Inter (`-apple-system`). Clean headers with Notion callout boxes, divider lines, and square checkboxes (`notion-checkbox`).
- **Accent Tokens:**
  - **Muted Gray:** `#838383` (Subtitles, secondary telemetry, disabled states)
  - **Notion Soft Blue:** `#337EA9` (Active time blocks & primary actions)
  - **Notion Soft Green:** `#2B593F` / `#446B5E` (Completed habits, punctuality, locked meals)
  - **Notion Amber / Yellow:** `#D9730D` (Pending items, outlier cook warnings)
- **Mobile Viewport & Dynamic Island:** Configured with `viewport-fit: cover` and safe-area insets (`env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`) with a bottom docking tab bar matching Notion Dark (`#191919`).

---

## 🏛️ The 4 Application Hubs

### 1. Today / Execution Hub (`/`)
- **Page Header:** Notion document header with page icon `🎯` and divider line.
- **Protocol Callout Box:** Grounded operational principles for zero-deliberation execution.
- **Daily Anchor Routine:** Visual timeline tracking the 5 non-negotiable blocks:
  - `08:00 AM` — Morning Reset
  - `08:30 AM` — Breakfast Block
  - `01:00 PM` — Lunch Block
  - `06:30 PM` — Evening Reset & Dinner
  - `10:30 PM` — Day Closure & Kitchen Reset
- **Live Status Banner:** Active block telemetry and countdown to the next anchor.
- **Dual Notion Progress Bars:** Real-time punctuality meters for (1) Structured Meal Adherence and (2) Unprompted Chore Completion.
- **"Scan & Execute" Daily Checklist:** Square checkboxes for recurring micro-chores (*Morning Sink Clear & Dry*, *Kitchen Counter Sanitized*, *Desk Reset*, *Evening Sink Zero*).

### 2. Meals / Meal Engine Hub (`/meals`)
- **"Fridge Decision Killer":** 1-tap instant logging for 3 fixed staple profiles (< 5 min preparation) to eliminate meal skipping and irregular impulses (such as cooking 11 AM dosas that derail routine).
  - *Quick Plate* (3 Scrambled Eggs + Avocado + Greens)
  - *5-Min Eggs / Toast* (Greek Yogurt + Peanut Butter Sourdough Toast)
  - *Comfort Rice Bowl* (Warm Jasmine Rice + Spiced Dal + Fermented Kimchi)
- **Schedule Window Evaluation:** Logs are evaluated against scheduled anchor windows. Out-of-window meals are automatically tagged with an `⚠️ Outlier` warning flag.

### 3. Relationships & Initiative Engine (`/initiative`)
- **Proactive Ledger:** Dedicated tracking for unprompted, autonomous actions for Mother and Partner.
- **Mandatory Binary Initiative Check:**
  - When recording an action, user must answer: *"Was this requested or prompted by a text, hint, or reminder?"*
  - **If True:** Tagged as `[Reactive Maintenance]` and disqualified from proactive leadership metrics.
  - **If False:** Tagged as `[Proactive Initiative]`.
- **Automated Cadence Engines:**
  - Bi-weekly prompt: Plan a complete date (Activity + Food + Logistics) without asking partner to make decisions.
  - Bi-weekly unprompted gesture prompt (flowers, favorite snack, chore takeover).
  - 3-day Mom check-in prompt.

### 4. Audit & Consistency Vault (`/vault`)
- **Zero-Guilt Daily Audit:** 2-minute nightly check-in asking 3 objective binary sensors:
  1. *Did you adhere to the 3-meal structured schedule today?* (`YES` / `NO`)
  2. *Did you execute shared space chores without being prompted?* (`YES` / `NO`)
  3. *Did you maintain composure and avoid defensiveness/guilt-tripping?* (`YES` / `NO`)
- **30-Day Consistency Grid:** Notion-style dark block matrix tracking execution consistency without gamified noise.
- **JSON Telemetry Export:** 1-tap download of all IndexedDB records.

---

## ⚡ Offline-First Architecture & Cloud Sync

- **Local Storage Layer:** Built with **Dexie.js (IndexedDB)** for sub-10ms offline local writes.
- **Cloud Sync:** `useCloudSync` hook monitors `navigator.onLine`. When online, synchronizes with **Supabase (PostgreSQL + RLS)**.
- **PWA Standalone Configuration:**
  - `public/manifest.json` configured with `name: "Forge"`, `short_name: "Forge"`, `display: "standalone"`, `background_color: "#191919"`, `theme_color: "#191919"`.
  - Next.js dynamic metadata with `/icon` and `/apple-icon`.

---

## 🚀 Deployment to Vercel

1. Push code to GitHub / GitLab:
   ```bash
   git add .
   git commit -m "feat: complete RealityCheck PWA with Notion Dark aesthetic"
   git push origin main
   ```
2. Import project into [Vercel](https://vercel.com).
3. (Optional) Set Supabase environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy! The app builds statically and serves as an offline-first PWA immediately.
