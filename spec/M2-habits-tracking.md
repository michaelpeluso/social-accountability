# Milestone 2: Goals, Habits & Tracking

**Goal:** Enable manual habit tracking, streaks, and informational dashboard (device-side calculations).
**Timeline:** 3-4 weeks
**Cost Target:** $0 (no additional services)
**Dependencies:** M1 complete (auth + privacy working)

---

## Overview

M2 is the core tracking engine. Users create goals/habits, log check-ins manually, view streaks and dashboard. ALL calculations done on-device (free compute). NO ML, NO auto-logging, NO integrations yet. SQLite is source of truth, cloud is sync replica.

---

## Technical Architecture

```
[iPhone App]
  ↓ User logs check-in
  ↓ SQLite: insert HabitCheckIn
  ↓ Logic Module: recalculate streaks (device-side)
  ↓ Dashboard: query SQLite, group by pillar (device-side)
  ↓ Sync Queue: enqueue changes
  ↓ Background: POST /habits/:id/checkins to cloud
[Backend]
  ↓ Validate auth + privacy
  ↓ Replicate to Postgres
```

**Key Principle:** Device is always ahead. Backend never sends data the device doesn't have. Conflict resolution: last-write-wins (device timestamp breaks ties).

**Reference:** spec/startup_guide.md#L110-L116 (local-first)

---

## User Stories

### 2.1 Create Goal

**Story:** As a user, I want to create a goal so that I can organize my habits under a meaningful objective.

**Acceptance Criteria:**
- [ ] "New Goal" button on goals screen
- [ ] Form fields:
  - Title (required, 1-100 chars)
  - Pillar (required, dropdown: MIND | BODY | HEART | SOUL)
  - Privacy (required, dropdown: SELF | CIRCLE | PUBLIC, defaults to user default)
- [ ] Save button creates goal locally (SQLite)
- [ ] Goal appears in goals list immediately
- [ ] Background sync to cloud (retry on failure)
- [ ] Can create goals offline (syncs when online)

**API Contract:**
```
POST /goals
Body: { title: string, pillar: Pillar, privacy: Privacy }
Response: { data: Goal }
```

**Technical Requirements:**
- UUID generated on device (for offline uniqueness)
- SQLite insert first (instant UX)
- Sync queue: POST /goals with retry (expo-sqlite)
- createdAt: ISO 8601 timestamp from device
- Validation: title required, pillar enum, privacy enum

**Privacy Notes:**
- Privacy defaults to user.defaultPrivacy (from M1)
- CIRCLE goals: visible to circles after sync
- Can change privacy later

**Security Notes:**
- Server validates userId from JWT (cannot create for others)
- Rate limit: 50 goals per user per day

**Cost:** $0

**Reference:** spec/api-contact.md#L18-L25

---

### 2.2 Create Habit

**Story:** As a user, I want to create a habit so that I can track recurring actions toward my goals.

**Acceptance Criteria:**
- [ ] "New Habit" button on habits screen or goal detail
- [ ] Form fields:
  - Title (required, 1-100 chars)
  - Goal (optional, dropdown of user's goals)
  - Parent Habit (optional, dropdown, for sub-habits - max depth 2)
  - Schedule (required):
    - Frequency: daily | weekly
    - Target count: number (e.g., "3 times")
    - Days of week: multi-select (if weekly)
  - Privacy (required, defaults to goal privacy or user default)
- [ ] Save creates habit locally, syncs in background
- [ ] Habit appears in list immediately

**Schedule Examples:**
```typescript
// Daily: meditate once per day
{ frequency: "daily", targetCount: 1 }

// Weekly: workout 3 times per week
{ frequency: "weekly", targetCount: 3 }

// Weekly on specific days: yoga Mon/Wed/Fri
{ frequency: "weekly", targetCount: 3, daysOfWeek: [1, 3, 5] }
```

**API Contract:**
```
POST /habits
Body: { 
  title: string, 
  goalId?: string, 
  parentHabitId?: string,
  schedule: HabitSchedule, 
  privacy: Privacy 
}
Response: { data: Habit }
```

**Technical Requirements:**
- SQLite schema: Habit table with schedule JSON column
- Hierarchy: max depth 2 (parent → child, no grandchildren)
- Cycle detection: prevent parent = child or circular references
- Validation: if parentHabitId, ensure it exists and depth < 2
- Schedule validation: targetCount > 0, daysOfWeek 0-6 if provided

**Privacy Notes:**
- Habit inherits goal privacy if linked
- Can override privacy per habit
- Sub-habits inherit parent privacy (cannot be more public)

**Security Notes:**
- Server validates goalId, parentHabitId belong to user
- Rate limit: 100 habits per user per day

**Cost:** $0

**Reference:** spec/data-model.md#L44-L54, spec/milestones.md#L32-L33

---

### 2.3 Log Check-In (Manual)

**Story:** As a user, I want to log that I completed a habit so that I can track my progress.

**Acceptance Criteria:**
- [ ] Habit detail screen has "Log Check-In" button
- [ ] Modal with fields:
  - Occurred At (defaults to now, can adjust timestamp)
  - Photo evidence (optional, max 5MB)
  - Note (optional, 500 chars)
- [ ] Save creates HabitCheckIn locally
- [ ] Check-in appears in history immediately
- [ ] Streak recalculated on device (see 2.4)
- [ ] Background sync to cloud

**API Contract:**
```
POST /habits/:id/checkins
Body: { occurredAt: string, evidenceRef?: string }
Response: { data: HabitCheckIn }
```

**Technical Requirements:**
- source: MANUAL (INTEGRATION for M5+ auto-logging)
- occurredAt: ISO 8601, user can backdate up to 7 days
- evidenceRef: S3/Cloudinary URL if photo uploaded
- SQLite insert, trigger streak recalculation
- Sync queue: retry on failure

**Privacy Notes:**
- Check-in inherits habit privacy
- Photo stored with UUID prefix (prevent enumeration)
- Note: max 500 chars (prevent abuse)

**Security Notes:**
- Validate habitId belongs to user
- Validate occurredAt not in future
- Rate limit: 200 check-ins per user per day

**Cost:** Free tier covers photos (Cloudinary 25GB)

**Reference:** spec/api-contact.md#L40-L48

---

### 2.4 Streak Calculation (Device-Side)

**Story:** As a user, I want to see my habit streak so that I feel motivated to continue.

**Acceptance Criteria:**
- [ ] Habit detail shows:
  - Current streak (consecutive days met)
  - Longest streak (historical best)
  - Last check-in date
  - Days since last check-in
- [ ] Streak updates immediately after check-in
- [ ] Streak calculation respects habit schedule:
  - Daily habit: must check in every day
  - Weekly habit: must hit target count each week
- [ ] Streak breaks if missed (can be recovered, see 2.5)
- [ ] Calculation runs on device (no API call)

**Calculation Logic:**
```typescript
// Daily habit: current streak
function calculateStreak(habit: Habit, checkIns: HabitCheckIn[]): number {
  let streak = 0;
  let currentDate = today();
  
  while (true) {
    const checkInExists = checkIns.some(c => 
      isSameDay(c.occurredAt, currentDate)
    );
    
    if (!checkInExists) break;
    
    streak++;
    currentDate = subtractDays(currentDate, 1);
  }
  
  return streak;
}

// Weekly habit: check if targetCount met each week
// (similar logic, grouped by week)
```

**Technical Requirements:**
- Logic module: /logic/streaks.ts
- Pure function (no side effects)
- Unit tests: various scenarios (daily, weekly, missed days)
- Cache result in SQLite (streak column on Habit table)
- Recalculate on check-in insert

**Privacy Notes:**
- Calculations never leave device
- No API call needed (free compute)

**Security Notes:**
- N/A (device-only)

**Cost:** $0 (device CPU)

**Reference:** spec/milestones.md#L34

---

### 2.5 Streak Recovery & Misses

**Story:** As a user, I want to see when I miss a habit so that I can recover and not lose motivation entirely.

**Acceptance Criteria:**
- [ ] Habit shows "missed" badge if not completed today (daily) or this week (weekly)
- [ ] Missed days highlighted in calendar view
- [ ] Recovery streak: count days since last miss
- [ ] Dashboard shows "longest recovery" (days to get back on track)
- [ ] No penalty for missing (positive framing)

**UI Examples:**
- "You missed 2 days. Log today to start rebuilding!"
- "Recovery streak: 3 days since last miss 🔥"

**Technical Requirements:**
- Misses calculated by absence (no check-in on expected day)
- Recovery streak: days since last miss (separate from main streak)
- Store in SQLite: lastMissedAt, recoveryStreak
- Device-side calculation (no API)

**Privacy Notes:**
- Miss data private (SELF only by default)
- Can share in M3 feed if user chooses

**Security Notes:**
- N/A (device-only)

**Cost:** $0

**Reference:** spec/milestones.md#L34

---

### 2.6 Dashboard - Pillar Scores

**Story:** As a user, I want to see my pillar scores so that I know which areas of life I'm focusing on.

**Acceptance Criteria:**
- [ ] Dashboard shows 4 pillar cards: MIND, BODY, HEART, SOUL
- [ ] Each pillar shows:
  - Score (0-100, calculated from check-ins)
  - Trend arrow (↑ improving, → stable, ↓ declining)
  - Active habits count for this pillar
  - This week vs last week comparison
- [ ] Tapping pillar shows detail: habits, trends, graphs
- [ ] Recalculates on every check-in (device-side)

**Score Calculation (Device-Side):**
```typescript
function calculatePillarScore(pillar: Pillar, checkIns: HabitCheckIn[]): number {
  // Get habits for this pillar
  const habits = getHabitsForPillar(pillar);
  
  // Calculate completion rate this week
  const thisWeek = checkIns.filter(c => isThisWeek(c.occurredAt));
  const expectedCount = habits.reduce((sum, h) => 
    sum + h.schedule.targetCount, 0
  );
  const actualCount = thisWeek.length;
  
  // Score: (actual / expected) * 100, capped at 100
  return Math.min(100, (actualCount / expectedCount) * 100);
}
```

**Technical Requirements:**
- Logic module: /logic/pillar-scores.ts
- Query SQLite: JOIN habits + checkIns, GROUP BY pillar
- Cache scores in state (recompute on check-in)
- Runs on device (no API call)

**Privacy Notes:**
- Scores never leave device (unless shared in M3)
- Dashboard SELF-only (no one else sees your scores)

**Security Notes:**
- N/A (device-only)

**Cost:** $0

**Reference:** spec/high_level.md#L265 (dashboard components)

---

### 2.7 Dashboard - Habit Summary

**Story:** As a user, I want to see my habit completion rate so that I know if I'm on track.

**Acceptance Criteria:**
- [ ] Dashboard shows:
  - Total habits created
  - Active habits (not archived)
  - Completion % this week
  - Top 3 best streaks
  - Top 3 most missed habits
- [ ] Tapping habit navigates to detail
- [ ] Updates immediately after check-in

**Calculation (Device-Side):**
```typescript
function calculateCompletionRate(habits: Habit[], checkIns: HabitCheckIn[]): number {
  const thisWeek = checkIns.filter(c => isThisWeek(c.occurredAt));
  const expectedCheckIns = habits.reduce((sum, h) => 
    sum + getExpectedCheckInsThisWeek(h), 0
  );
  return (thisWeek.length / expectedCheckIns) * 100;
}
```

**Technical Requirements:**
- Query SQLite locally
- No API call needed
- Cache in state, invalidate on check-in

**Privacy Notes:**
- SELF-only (dashboard private)

**Security Notes:**
- N/A (device-only)

**Cost:** $0

**Reference:** spec/high_level.md#L266

---

### 2.8 Dashboard - Trends & Patterns

**Story:** As a user, I want to see trends over time so that I understand my behavior patterns.

**Acceptance Criteria:**
- [ ] Dashboard shows graphs:
  - Check-ins per day (7-day, 30-day, 90-day views)
  - Pillar scores over time (line chart)
  - Best time of day for check-ins (heatmap: hour vs day)
  - Habit completion rate trends
- [ ] Graphs render on device (react-native-svg)
- [ ] Zooming/panning supported
- [ ] Data stays local (no cloud analytics)

**Technical Requirements:**
- Charts library: react-native-svg-charts or Victory Native
- Query SQLite: GROUP BY day, hour, pillar
- Calculate on device (aggregate queries fast enough)
- Cache results for performance

**Privacy Notes:**
- All data local (never sent to analytics service)
- User owns their patterns

**Security Notes:**
- N/A (device-only)

**Cost:** $0

**Reference:** spec/high_level.md#L268

---

### 2.9 Edit/Archive Habits & Goals

**Story:** As a user, I want to edit or archive habits so that I can adapt my goals over time.

**Acceptance Criteria:**
- [ ] Edit button on habit/goal detail
- [ ] Can change: title, schedule, privacy
- [ ] Cannot change: pillar (creates confusion), goalId (must unlink/relink)
- [ ] Archive button (soft delete)
- [ ] Archived habits:
  - Hidden from active list
  - Still visible in history
  - Cannot log new check-ins
  - Can unarchive later
- [ ] Changes sync to cloud

**API Contract:**
```
PATCH /goals/:id
Body: { title?: string, privacy?: Privacy }

PATCH /habits/:id
Body: { title?: string, schedule?: HabitSchedule, privacy?: Privacy, archivedAt?: string }
```

**Technical Requirements:**
- SQLite update, sync queue
- archivedAt: ISO timestamp or null
- Archived items filtered from main queries
- Unarchive: set archivedAt = null

**Privacy Notes:**
- Privacy changes apply immediately (affects visibility)
- Cannot make SELF → PUBLIC without confirmation

**Security Notes:**
- Validate ownership before edit
- Rate limit: 100 edits per user per day

**Cost:** $0

**Reference:** spec/data-model.md (archivedAt fields)

---

### 2.10 Habit History & Calendar View

**Story:** As a user, I want to see my check-in history so that I can review my progress visually.

**Acceptance Criteria:**
- [ ] Habit detail has "History" tab
- [ ] Calendar view:
  - Green dot: completed day
  - Gray: missed day
  - Empty: future day
- [ ] List view: all check-ins with timestamps, notes, photos
- [ ] Filter by date range (this week, this month, all time)
- [ ] Tapping check-in shows detail (note, photo)

**Technical Requirements:**
- Query SQLite: SELECT * FROM habit_checkins WHERE habitId = :id ORDER BY occurredAt DESC
- Calendar component: react-native-calendars
- Pagination: load 30 days at a time
- Photos: lazy load thumbnails

**Privacy Notes:**
- History respects habit privacy
- Photos stored securely (CDN with auth)

**Security Notes:**
- N/A (device-only query)

**Cost:** $0

---

## Validation Checklist

Before moving to M3:
- [ ] User can create goals and habits
- [ ] User can log check-ins manually
- [ ] Streaks calculate correctly on device
- [ ] Dashboard shows pillar scores, habit summary, trends
- [ ] All calculations happen on device (no API calls for compute)
- [ ] Habits sync to cloud in background
- [ ] Offline mode works (can create habits, log check-ins)
- [ ] Edit/archive habits works
- [ ] Tests pass:
  - [ ] Streak calculation (daily, weekly)
  - [ ] Pillar score calculation
  - [ ] Completion rate calculation
  - [ ] Privacy enforcement (SELF habits not visible to others)

---

## What NOT to Build in M2

❌ NO social feed (M3)
❌ NO reactions/nudges (M3)
❌ NO auto-logging/integrations (M4+)
❌ NO ML/predictions (M5+)
❌ NO suggestions engine (M5+)
❌ NO journal entries (M4, separate from check-ins)
❌ NO mood tracking (M4)
❌ NO habit reminders/notifications yet (M4)

---

## Device-Side Calculation Benefits

✅ **Free compute:** 1000 users = $0 compute cost
✅ **No latency:** instant dashboard updates
✅ **Offline-first:** works without internet
✅ **Privacy:** data never leaves device for calculations
✅ **Scalability:** each user brings their own CPU

**When to move server-side:** NEVER for M1-M3. Only if:
- Cross-user analytics needed ("what habits are trending?")
- ML models too heavy for device (M5+ consideration)
- Real-time collaboration (not in scope)

---

## Cost & Privacy Summary

**Monthly Cost (1000 users):** $0
- All calculations on device
- Cloud storage: Supabase free tier (< 500MB)
- Photos: Cloudinary free tier (< 25GB)

**Privacy Compliance:**
- ✅ All calculations on device (no cloud compute)
- ✅ User owns their patterns (no analytics tracking)
- ✅ Privacy enforcement server-side (SELF/CIRCLE/PUBLIC)
- ✅ Check-in notes: max 500 chars (prevent abuse)

---

## Dependencies

**Before M2:**
- M1 complete (auth, privacy, circles working)

**After M2:**
- M3 can start (social features on top of tracking)

---

## Reference Documents

- [spec/milestones.md](spec/milestones.md#L29-L36) - M2 definition
- [spec/data-model.md](spec/data-model.md#L37-L67) - Goal, Habit, CheckIn schema
- [spec/api-contact.md](spec/api-contact.md#L18-L48) - API contracts
- [spec/high_level.md](spec/high_level.md#L260-L289) - Dashboard details
- [spec/startup_guide.md](spec/startup_guide.md#L110-L116) - Local-first architecture
