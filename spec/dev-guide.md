# **Dev Startup Guide**

## iOS-First Behavioral App (Windows + iPhone Workflow)

---

## 0. Core Principles (read once)

* **iOS-native capability > abstraction speed**
* **Mock first, integrate native later**
* **Local-first, privacy-forward**
* **Mac is a gatekeeper, not a workstation**
* **Ship approval-safe V1, expand later**

---

## 1. Locked Decisions (Do Not Revisit Early)

**Frontend**

* React Native + Expo (start managed → move to dev build/bare)
* TypeScript

**Backend (initial)**

* Mocked or minimal REST
* Cloud later (Supabase / custom)

**Storage**

* Local-first SQLite
* Explicit sync queue (outbox model)

**Testing Devices**

* iPhone (daily)
* Mac (1 full day/month only)

---

## 2. Machine Setup (Day 0)

### Windows (Primary)

Install:

* Node.js (LTS)
* Git
* VS Code
* Expo CLI

Optional:

* Android Studio (emulator only if needed)

**Do NOT use WSL for the app runtime.**

---

## 3. App Creation (Day 1)

```bash
npx create-expo-app your-app
cd your-app
npm start
```

On iPhone:

* Install **Expo Go**
* Scan QR
* Confirm hot reload works

✅ You now have a live device loop without a Mac.

---

## 4. Project Structure (Create Immediately)

```
/app            screens + navigation
/components     reusable UI
/state          app state
/storage        sqlite, models, migrations
/services       api, auth, sync
/sensors        all data sources (abstracted)
  /mock
  /ios
/logic          scoring, streaks, heuristics
/config         feature flags, env
/tests
```

**Rule:**
No feature reads system data directly.
Everything goes through `/sensors`.

---

## 5. Sensor Abstraction Pattern (Critical)

For every future data source:

* screen time
* location
* calendar
* health
* media usage

You define:

* **interface** (what data you need)
* **mock provider** (fake data, now)
* **ios provider** (native, later)

This allows:

* 100% Windows dev
* deterministic testing
* painless native swap

---

## 6. Local-First Data Layer (Week 1 Priority)

Implement SQLite tables:

* profiles
* habits / milestones
* logs
* media metadata
* sync_queue (outbox)

Rules:

* UI reads **only local DB**
* All writes enqueue sync jobs
* Remote is a replica, not the source of truth

---

## 7. Development Phases

### Phase 1 — Foundation (Weeks 1–4)

**Windows + iPhone only**

* onboarding (manual auth)
* habit creation
* logging
* streak logic
* dashboards
* offline support
* mock sensor feeds

No system permissions yet.

---

### Phase 2 — Social & Structure (Weeks 5–6)

* stories (text + image)
* reactions (predefined)
* nudges
* feed
* privacy controls

Still mock-only sensors.

---

### Phase 3 — First Native Integrations (Weeks 7–8)

**First Mac day required**

Add **one permission at a time**:

* calendar OR
* health (steps only)

Switch to **Expo Dev Build / Prebuild**.

---

### Phase 4 — High-Frictions Sources (Post-Approval)

* screen time
* background location
* deeper heuristics

These are **never V1**.

---

## 8. Daily Dev Workflow (Windows)

**Every day**

* write features against mocks
* run on iPhone via Expo Go
* airplane mode test
* kill/relaunch test

**Testing**

* unit: logic, streaks, scoring
* integration: db + sync + sensors
* no e2e automation early

---

## 9. Monthly Mac Day Playbook

### Before Mac Day

* freeze features
* write permission copy
* list validation targets

### On Mac Day (No Exploration)

1. run `expo prebuild`
2. open Xcode
3. test:

   * permissions
   * background behavior
   * native edge cases
4. fix blockers immediately
5. commit + tag release

**Rule:**
Never discover architecture problems on Mac day.

---

## 10. Expo Exit Strategy (Planned)

You leave **Expo Managed** when you add:

* screen time
* background location
* app extensions
* deep HealthKit

You move to:

* Expo Dev Build / Bare
  (Still Expo, full native power)

---

## 11. App Store Safety Rules

* V1 = manual + transparent
* one new permission per release
* explicit opt-in screens
* no surveillance language
* data export + delete always available

---

## 12. Mental Model (Print This)

> Windows builds speed
> iPhone proves UX
> Mac proves legitimacy
> Native APIs define limits
> Apple approves intent, not tech
