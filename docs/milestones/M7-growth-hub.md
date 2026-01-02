# Milestone 7: Growth Hub (Life Modules)

**Goal:** Add Growth Hub - a unified system for tracking life modules (books, workouts, nutrition, podcasts) with accountability metrics, social sharing, and API sync foundation.
**Timeline:** 4-5 weeks
**Cost Target:** $0-10 (API integration infrastructure + OAuth management)
**Dependencies:** M4 complete (identity system, analytics, close friends)

---

## Overview

M5 introduces Growth Hub, a modular tracking system that extends beyond habits to encompass complete life sectors. Users can track books they're reading, workouts with exercise PRs, meal logging, podcast listening, and more - with each module providing accountability metrics (streaks, history) and social sharing capabilities. Modules can be logged independently OR linked to habits. Built with future API automation in mind (Goodreads, Strava, Spotify, etc.).

---

## Design Principles

1. **Module-Enhanced Habits:** Modules extend habit system with rich data (book progress, exercise weights)
2. **Standalone OR Habit-Linked:** Users can log books without habits, OR create reading habit with book tracking
3. **History-First:** Each module maintains detailed history (books finished, exercise progression, body weight trends)
4. **Automation-Ready:** Database designed for future API sync (manual MVP, automated future)
5. **Privacy Per Entry:** Each log has privacy controls (share book finish publicly, keep workout private)
6. **Social-First:** Module achievements generate shareable posts ("Just finished 'Atomic Habits' ⭐⭐⭐⭐⭐")

**Reference:** Growth Hub serves as accountability hub for ALL life sectors, not just habits.

---

## Navigation Structure

```
App Tabs:
├─ Dashboard (Overview + streak summary)
├─ Habits (All habits - basic + module-linked)
├─ Growth Hub ⭐ NEW
│  ├─ Hub Landing (Module cards with at-a-glance stats)
│  │   ├─ 📚 Library (5 books finished, 7-day streak)
│  │   ├─ 💪 Training (16 workouts this month, bench PR: 185 lbs)
│  │   ├─ 🥗 Nutrition (14/21 meals logged this week)
│  │   └─ 🎧 Podcasts (8 episodes, 4.5 hours this month)
│  │
│  └─ Module Detail Pages (tap card to open)
│      ├─ Library Detail
│      │   ├─ [+ Log Book Entry]
│      │   ├─ Currently Reading (progress bars)
│      │   ├─ Finished (history with ratings)
│      │   ├─ Want to Read (wishlist)
│      │   └─ ⚙️ Settings: Link Goodreads/Audible
│      │
│      ├─ Training Detail
│      │   ├─ [+ Log Workout]
│      │   ├─ Recent Workouts (calendar view)
│      │   ├─ Exercise PRs (tap to see progression chart)
│      │   ├─ Body Weight Trend (line chart)
│      │   └─ ⚙️ Settings: Link Strava
│      │
│      └─ [Nutrition, Podcasts similar structure]
│
├─ Social (Feed, Stories, Friends)
└─ Profile
```

---

## User Stories

### 7.1 Growth Hub Landing Page

**Story:** As a user, I want to see all my life modules in one place so that I can track holistic accountability.

**Acceptance Criteria:**

- [ ] Growth Hub tab in main navigation
- [ ] Landing page shows 4 module cards (M5 MVP):
  - 📚 Library
  - 💪 Training
  - 🥗 Nutrition
  - 🎧 Podcasts
- [ ] Each card displays:
  - Module name + icon
  - Current streak (e.g., "7-day streak 🔥")
  - Key stat (books finished this year, workouts this month, etc.)
  - Last activity timestamp ("2 hours ago")
- [ ] Tap card → navigate to module detail page
- [ ] Empty state: "Start tracking your [module] to build accountability"

**Example Landing Page:**

```
┌─────────────────────────────────────┐
│  Growth Hub                    ⚙️   │
├─────────────────────────────────────┤
│  Track Your Life Sectors            │
├─────────────────────────────────────┤
│  📚 Library          🔥 7-day       │
│  5 books finished this year         │
│  Last: 2 days ago                   │
├─────────────────────────────────────┤
│  💪 Training         🔥 12-day      │
│  16 workouts this month             │
│  Bench PR: 185 lbs ↑                │
│  Last: Today, 8:30 AM               │
├─────────────────────────────────────┤
│  🥗 Nutrition        🔥 5-day       │
│  14/21 meals logged this week       │
│  Last: 3 hours ago                  │
├─────────────────────────────────────┤
│  🎧 Podcasts         ⚠️ 0-day       │
│  8 episodes this month (4.5 hrs)    │
│  Last: 9 days ago                   │
└─────────────────────────────────────┘
```

**Why:** Central hub provides at-a-glance accountability across all life sectors. Streaks gamify consistency.

**Technical Requirements:**

- Query aggregates per module type from check-in tables
- Calculate streaks using existing streak logic (reused from habits)
- Cache calculations for performance

**Privacy Notes:**

- Growth Hub landing visible to user only (SELF)
- Individual entries have privacy controls

**Cost:** $0

---

### 7.2 Library Module (Books)

**Story:** As a user, I want to track books I'm reading so that I can see my reading progress and share achievements.

**Acceptance Criteria:**

- [ ] Library detail page with 3 tabs:
  - Currently Reading
  - Finished
  - Want to Read
- [ ] "Log Book Entry" button:
  - Search existing books or add new (title, author, ISBN optional)
  - Set status: Reading/Finished/Want to Read
  - If Reading: set current progress (0-100%)
  - If Finished: add rating (1-5 stars), finish date
- [ ] Currently Reading tab:
  - Progress bars for each book (e.g., "The Hobbit - 65%")
  - Tap to update progress or mark finished
  - Shows days since last update
- [ ] Finished tab:
  - List of completed books with ratings
  - Finish date and total reading sessions
  - Tap to view history or share achievement
- [ ] Reading history detail:
  - Timeline of all check-ins (progress updates)
  - "Started Apr 15, finished May 1 (16 days)"
  - Reading pace: "Updated 8 times, avg 12.5% per session"
- [ ] Share button: generates post "Just finished '[Title]' by [Author] ⭐⭐⭐⭐⭐"
- [ ] Optional: Link habit ("Read 30 min daily") to auto-prompt book progress

**Example Flow:**

```
User taps "Log Book Entry":
  ↓
Search: "Atomic Habits"
  ↓
Select: "Atomic Habits by James Clear"
Status: Currently Reading
Progress: 45%
  ↓
Book added to Currently Reading tab

[3 days later]
User updates progress: 45% → 60%
  ↓
Check-in logged (book_check_ins table)

[2 weeks later]
User marks finished:
Progress: 100%
Rating: 5 stars
  ↓
Moved to Finished tab
  ↓
[Share Achievement]
  ↓
Post: "Just finished 'Atomic Habits' by James Clear ⭐⭐⭐⭐⭐ 📚"
```

**API Contract:**

```
POST /books
Body: { title: string, author?: string, isbn?: string, status: BookStatus }
Response: { data: Book }

POST /book-check-ins
Body: { bookId: string, progressBefore: number, progressAfter: number, pagesRead?: number }
Response: { data: BookCheckIn }

GET /books?status=FINISHED&userId=me
Response: { data: Book[], meta: { count: number } }
```

**Technical Requirements:**

- Books table: id, userId, title, author, isbn, status, currentProgress, startedAt, finishedAt, rating, coverUrl, externalId
- BookCheckIns table: id, bookId, checkInId (optional), progressBefore, progressAfter, pagesRead, occurredAt
- Future: Goodreads/Audible API adapter for auto-sync
- Cover images: fetch from Open Library API (free)

**Privacy Notes:**

- Books default to SELF
- User can share individual finishes with FRIENDS/PUBLIC
- Reading list visible based on book privacy

**Security Notes:**

- Rate limit: 100 book operations per day
- ISBN validation (10 or 13 digits)

**Cost:** $0 (Open Library API is free)

---

### 7.3 Training Module (Workouts)

**Story:** As a user, I want to log workouts and track exercise progression so that I can see strength gains over time.

**Acceptance Criteria:**

- [ ] Training detail page with 3 views:
  - Recent Workouts (last 30 days)
  - Exercise PRs (personal records)
  - Body Weight Trend
- [ ] "Log Workout" button:
  - Workout type: Strength/Cardio/Sport/Flexibility
  - Duration (minutes)
  - Add exercises:
    - Name (autocomplete from user's history + preset library)
    - Sets: weight × reps × # of sets
    - Example: "Bench Press: 185 lbs × 5 reps × 3 sets"
  - Optional: body weight (lbs/kg)
  - Notes (optional)
- [ ] Exercise library:
  - Preset exercises (Bench Press, Squats, Deadlift, etc.)
  - User's custom exercises
  - Category: Chest/Legs/Back/Shoulders/Arms/Core
  - Equipment: Barbell/Dumbbell/Machine/Bodyweight
- [ ] Exercise PR view:
  - List of exercises with max weight
  - "Bench Press: 185 lbs ↑ (NEW PR!)"
  - Tap exercise → progression chart (weight over time)
- [ ] Body weight tracking:
  - Line chart showing weight trend
  - "Current: 178 lbs (-2 lbs this month)"
- [ ] Share workout: "Crushed leg day! 💪 Squats: 225 lbs × 5 × 3"
- [ ] Optional: Link habit ("Workout 4x/week") to auto-log workouts

**Example Workout Log:**

```
Workout Type: Strength
Duration: 75 min
Occurred At: Today, 8:30 AM

Exercises:
  Bench Press:
    - Set 1: 135 lbs × 8 reps
    - Set 2: 155 lbs × 6 reps
    - Set 3: 185 lbs × 5 reps ⭐ NEW PR!

  Squats:
    - Set 1: 185 lbs × 8 reps
    - Set 2: 205 lbs × 6 reps
    - Set 3: 225 lbs × 5 reps

  Rows:
    - Set 1: 135 lbs × 8 reps
    - Set 2: 135 lbs × 8 reps
    - Set 3: 135 lbs × 8 reps

Body Weight: 178 lbs
Notes: "Great energy today! 🔥"
```

**Exercise Progression Chart Example:**

```
Bench Press History

185 lbs ← Current PR
  ↑
180 lbs
  │
175 lbs
  │
170 lbs
  │
165 lbs
  └─────────────────────────
    Apr 1  Apr 15  May 1
```

**API Contract:**

```
POST /exercises
Body: { name: string, category: ExerciseCategory, equipment: ExerciseEquipment }
Response: { data: Exercise }

POST /workout-check-ins
Body: {
  workoutType: WorkoutType,
  duration: number,
  bodyWeight?: number,
  exercises: Array<{ exerciseId: string, sets: Array<{ weight, reps, setNumber }> }>
}
Response: { data: WorkoutCheckIn }

GET /exercises/:id/history
Response: { data: { maxWeight: number, progression: Array<{ date, weight, reps }> } }
```

**Technical Requirements:**

- Exercises table: id, userId, name, category, equipment, isCustom
- WorkoutCheckIns table: id, userId, checkInId (optional), workoutType, duration, bodyWeight, occurredAt
- ExerciseSets table: id, workoutCheckInId, exerciseId, weight, reps, setNumber, rpe (rate of perceived exertion)
- Calculate PRs: MAX(weight) GROUP BY exerciseId
- Chart library: Victory Native or recharts

**Privacy Notes:**

- Workouts default to SELF
- Can share individual workouts or PRs with privacy controls
- Exercise names are user-specific (not shared across users)

**Security Notes:**

- Rate limit: 50 workout logs per day
- Max 30 exercises per workout
- Max 20 sets per exercise

**Cost:** $0

---

### 7.4 Nutrition Module (Meal Tracking)

**Story:** As a user, I want to log meals so that I can build accountability around nutrition habits.

**Acceptance Criteria:**

- [ ] Nutrition detail page shows:
  - Today's meals (B/L/D/S with checkmarks)
  - This week's completion rate (14/21 meals)
  - Streak: "5-day streak of logging lunch 🔥"
- [ ] "Log Meal" button:
  - Meal type: Breakfast/Lunch/Dinner/Snack
  - Simple boolean: "Did you log it?" (yes/no)
  - Optional: notes (e.g., "Salad with chicken")
  - Timestamp (defaults to now)
- [ ] Weekly view:
  - Calendar grid showing logged vs missed meals
  - Color-coded: green (logged), gray (missed)
- [ ] Streak calculation:
  - "7-day streak of logging 2+ meals per day"
  - Hardcoded requirement: 2 meals/day (14/week) to maintain streak
- [ ] Share option: "Logged all meals this week! 🥗"
- [ ] Optional: Link habit ("Log 3 meals daily")

**Example Weekly View:**

```
Nutrition This Week (14/21 meals logged)

        B   L   D
Mon     ✓   ✓   ✓
Tue     ✓   ✓   ✗
Wed     ✓   ✓   ✓
Thu     ✓   ✗   ✓
Fri     ✓   ✓   ✓
Sat     ✗   ✓   ✓
Sun     ✓   ✓   ✓

Streak: 5 days 🔥
```

**Why:** Simple meal logging builds awareness without complex calorie counting. Binary tracking (logged vs not) reduces friction.

**API Contract:**

```
POST /meal-check-ins
Body: { mealType: MealType, logged: boolean, notes?: string, occurredAt: timestamp }
Response: { data: MealCheckIn }

GET /meal-check-ins/weekly
Response: { data: Array<{ date, breakfast, lunch, dinner, snack }>, meta: { totalLogged: number } }
```

**Technical Requirements:**

- MealCheckIns table: id, userId, checkInId (optional), mealType, logged, occurredAt, notes
- Streak requirement: 2 meals/day minimum (hardcoded in STREAK_REQUIREMENTS)
- Weekly grid calculated device-side

**Privacy Notes:**

- Meal logs default to SELF
- Can share weekly achievements

**Cost:** $0

---

### 7.5 Podcast Module

**Story:** As a user, I want to track podcasts I listen to so that I can see listening patterns and discover new shows.

**Acceptance Criteria:**

- [ ] Podcast detail page shows:
  - Recent episodes (last 30 days)
  - Total listening time this month
  - Top shows (by episode count)
- [ ] "Log Episode" button:
  - Show name (autocomplete from history)
  - Episode title (optional)
  - Duration (minutes)
  - Date listened (defaults to now)
- [ ] Listening history:
  - List of episodes with show name, date
  - "8 episodes this month (4.5 hours)"
- [ ] Show detail:
  - Tap show → see all episodes logged
  - Episode count, total time
- [ ] Share option: "Just listened to [Show] - [Episode] 🎧"
- [ ] Optional: Link habit ("Listen to podcast 2x/week")

**Example History:**

```
🎧 Podcasts This Month

Total: 8 episodes, 4.5 hours

Recent Episodes:
  The Tim Ferriss Show
  "How to Build Wealth" (45 min)
  2 days ago

  Huberman Lab
  "Sleep Optimization" (90 min)
  5 days ago

  Lex Fridman Podcast
  "AI and the Future" (2.5 hrs)
  1 week ago

Top Shows:
  1. Huberman Lab (3 episodes)
  2. The Tim Ferriss Show (2 episodes)
  3. Lex Fridman (2 episodes)
```

**API Contract:**

```
POST /podcast-check-ins
Body: { showName: string, episodeTitle?: string, duration: number, occurredAt: timestamp }
Response: { data: PodcastCheckIn }

GET /podcast-check-ins/stats
Response: {
  data: {
    totalEpisodes: number,
    totalMinutes: number,
    topShows: Array<{ showName, episodeCount }>
  }
}
```

**Technical Requirements:**

- PodcastCheckIns table: id, userId, checkInId (optional), showName, episodeTitle, duration, occurredAt, externalId
- Future: Spotify API integration for auto-sync
- Autocomplete show names from user's history

**Privacy Notes:**

- Podcast logs default to SELF
- Can share individual episodes

**Cost:** $0

---

### 7.6 Module Streaks System

**Story:** As a user, I want to see streaks for each module so that I stay motivated to maintain consistency.

**Acceptance Criteria:**

- [ ] Each module has independent streak calculation
- [ ] Hardcoded streak requirements:
  - Library: 1 log per week (any book activity)
  - Training: 3 logs per week (3 workouts)
  - Nutrition: 7 logs per week (at least 1 meal/day, simplified)
  - Podcast: 1 log per week (1 episode)
- [ ] Streak displayed on module cards:
  - "🔥 7-day streak" (green, active)
  - "⚠️ 0-day streak" (red, broken)
- [ ] Streak detail on module page:
  - Current streak
  - Longest streak
  - "Last activity: 2 days ago"
- [ ] Dashboard shows aggregate: "Active in 3/4 modules this week"

**Calculation Logic:**

```typescript
const STREAK_REQUIREMENTS = {
  BOOK: 1, // 1 log per week
  WORKOUT: 3, // 3 logs per week
  NUTRITION: 7, // 7 logs per week (daily, but simplified)
  PODCAST: 1, // 1 log per week
};

function calculateModuleStreak(userId: string, moduleType: ModuleType) {
  const minLogsPerWeek = STREAK_REQUIREMENTS[moduleType];
  const logs = getModuleLogs(userId, moduleType, last12Weeks);

  let currentStreak = 0;
  let currentWeek = thisWeek();

  while (currentWeek >= 0) {
    const logsThisWeek = logs.filter((log) => isSameWeek(log.occurredAt, currentWeek));

    if (logsThisWeek.length >= minLogsPerWeek) {
      currentStreak += 7; // Add 7 days to streak
      currentWeek--;
    } else {
      break; // Streak broken
    }
  }

  return currentStreak;
}
```

**Why:** Streaks gamify consistency and provide accountability. Hardcoded requirements keep logic simple (no per-user customization yet).

**Technical Requirements:**

- Reuse existing streak calculation logic from habits
- Query module check-ins per week
- Cache streak calculations (recalculate on new log)

**Cost:** $0

---

### 7.7 Module History & Progress Views

**Story:** As a user, I want to see detailed history for each module so that I can track progress over time.

**Acceptance Criteria:**

- [ ] Each module detail page has "History" tab
- [ ] History views per module:
  - **Library:** Timeline of books read, progress updates, ratings
  - **Training:** Calendar view of workouts, exercise PRs with charts
  - **Nutrition:** Weekly grids showing meal logging patterns
  - **Podcasts:** List of episodes with total listening time
- [ ] Charts/visualizations:
  - Line charts for trends (body weight, book progress)
  - Bar charts for counts (workouts per week, episodes per month)
  - Heatmaps for patterns (workout days, meal consistency)
- [ ] Filter options:
  - Date range: 7/30/90 days, all time
  - Module-specific filters (e.g., Training: by exercise, by workout type)
- [ ] Export option: "Download CSV" (future)

**Example: Training History**

```
Training History (Last 30 Days)

16 workouts logged
Avg duration: 68 min
Body weight: 178 lbs (-2 lbs)

[Calendar View]
May 2026
S  M  T  W  T  F  S
         1  2  3  4
      💪 💪    💪
5  6  7  8  9 10 11
💪    💪 💪    💪
12 13 14 15 16 17 18
💪    💪 💪    💪 💪
...

[Exercise PRs]
Bench Press: 185 lbs ↑
  [Chart showing progression]
Squats: 225 lbs →
Deadlift: 315 lbs ↑
```

**Why:** History views show long-term progress, identifying patterns and celebrating wins.

**Technical Requirements:**

- Query check-ins with date filters
- Generate charts using Victory Native
- Device-side calculations for aggregates

**Cost:** $0

---

### 7.8 Module Account Linking (API Sync Foundation)

**Story:** As a user, I want to connect external accounts (Goodreads, Strava, Spotify) so that my activity syncs automatically (future).

**Acceptance Criteria:**

- [ ] Module settings page: "⚙️ Connected Accounts"
- [ ] Each module shows available providers:
  - Library: Goodreads, Audible
  - Training: Strava, Apple Health (future M6)
  - Nutrition: MyFitnessPal (future)
  - Podcasts: Spotify, Apple Podcasts
- [ ] OAuth connection flow:
  - Tap "Connect [Provider]"
  - Redirect to provider OAuth
  - Store access token (encrypted) + refresh token
  - Show "✓ Connected as @username"
- [ ] Sync status:
  - Last sync timestamp
  - "Sync Now" button (manual trigger)
  - Auto-sync toggle (enable/disable)
- [ ] M5 MVP: OAuth plumbing only, NO auto-sync logic
  - Backend stores tokens
  - Future milestones: build sync adapters

**Example Settings:**

```
📚 Library Settings

Connected Accounts:
  ✓ Goodreads (@johndoe)
    Last sync: 2 hours ago
    [Disconnect]

  [ ] Audible
    [Connect]

Sync Preferences:
  [x] Auto-sync finished books
  [x] Sync currently reading
  [ ] Sync want-to-read list
```

**OAuth Flow:**

```
User taps "Connect Goodreads":
  ↓
App opens OAuth URL:
https://goodreads.com/oauth/authorize?
  client_id=APP_ID&
  redirect_uri=socialaccountability://oauth/goodreads&
  scope=read_books
  ↓
User authorizes in browser
  ↓
Goodreads redirects to app with code
  ↓
App exchanges code for access token
  ↓
POST /module-accounts
Body: {
  moduleType: 'BOOK',
  provider: 'goodreads',
  accessToken: 'encrypted',
  refreshToken: 'encrypted'
}
  ↓
Account linked ✓
```

**API Contract:**

```
POST /module-accounts
Body: {
  moduleType: ModuleType,
  provider: string,
  providerUserId?: string,
  accessToken: string,
  refreshToken?: string,
  tokenExpiresAt?: timestamp
}
Response: { data: ModuleAccount }

DELETE /module-accounts/:id
Response: { success: true }

GET /module-accounts/sync-status
Response: { data: Array<{ provider, lastSync, status }> }
```

**Technical Requirements:**

- ModuleAccounts table: id, userId, moduleType, provider, accessToken (encrypted), refreshToken (encrypted), tokenExpiresAt, lastSync, syncEnabled, status
- Use Expo AuthSession for OAuth flow
- Encrypt tokens with AES-256 (key in env vars, NOT in repo)
- Future: Background sync job (M6+)

**Privacy Notes:**

- Users control what data syncs (granular permissions)
- Can disconnect account anytime
- Synced data respects user's privacy settings

**Security Notes:**

- Never log tokens
- Encrypt at rest, decrypt only when making API calls
- Refresh token rotation (per OAuth 2.0 spec)

**Cost:** $0 (infrastructure only, no sync logic yet)

---

### 7.9 Module Social Sharing

**Story:** As a user, I want to share module achievements with friends so that they can celebrate my progress.

**Acceptance Criteria:**

- [ ] Each module entry has "Share" button
- [ ] Share generates post with:
  - Module-specific content (book title, workout PR, etc.)
  - Relevant emoji (📚 🎧 💪)
  - Privacy control (SELF/CLOSE_FRIENDS/FRIENDS/PUBLIC)
- [ ] Post types per module:
  - **Library:** "Just finished '[Title]' by [Author] ⭐⭐⭐⭐⭐"
  - **Training:** "New bench PR: 185 lbs! 💪" or "Crushed leg day (90 min) 🔥"
  - **Nutrition:** "Logged all meals this week! 🥗"
  - **Podcasts:** "Just listened to [Show] - [Episode] 🎧"
- [ ] Posts appear in friend feeds (respecting privacy)
- [ ] Friends can react with emojis + comments
- [ ] Module posts link back to module entry (tap post → view workout details)

**Example Post:**

```
[User Profile Pic] John Doe
2 hours ago

Just finished 'Atomic Habits' by James Clear ⭐⭐⭐⭐⭐ 📚

Game-changer for building better habits! Highly recommend.

[View Book Details]

Privacy: Friends

Reactions:
  🎉 Sarah, Mike, Lisa
  💪 Alex

Comments (2):
  Sarah: "This book is amazing! Changed my life."
  Mike: "Adding to my reading list 📚"
```

**API Contract:**

```
POST /posts
Body: {
  content: string,
  privacy: Privacy,
  moduleType?: ModuleType,
  moduleEntryId?: string, // Links to book_check_ins, workout_check_ins, etc.
  pillar?: Pillar
}
Response: { data: Post }
```

**Technical Requirements:**

- Posts table: add `moduleType` and `moduleEntryId` fields (optional)
- Generate post content templates per module
- Link posts to source entry for detail view

**Privacy Notes:**

- Posts default to user's global privacy setting
- Can override per post
- Module entry privacy must match or be more restrictive than post

**Cost:** $0

---

### 7.10 Habit + Module Integration

**Story:** As a user, I want to link habits to modules so that my habit check-ins include rich data (book progress, workout details).

**Acceptance Criteria:**

- [ ] Habit creation has "Module Type" option (optional):
  - None (basic habit)
  - 📚 Book Tracking
  - 💪 Workout Logging
  - 🥗 Meal Tracking
  - 🎧 Podcast Listening
- [ ] Module-linked habits show enhanced check-in UI:
  - Book habit: "Which book? Update progress?"
  - Workout habit: "Log exercises? Duration?"
  - Nutrition habit: "Which meal?"
- [ ] Habit check-in creates BOTH:
  - HabitCheckIn (for streak tracking)
  - ModuleCheckIn (for module history)
- [ ] Habit detail page shows module data:
  - "Read daily" habit → Shows books read via this habit
  - "Workout 4x/week" habit → Shows recent workouts
- [ ] User can check-in habit WITHOUT module data (just mark complete)

**Example: Book Tracking Habit**

```
Habit: "Read 30 min daily"
Module Type: Book Tracking
Frequency: Daily
Streak: 12 days 🔥

[Check-in Flow]
User taps "✓ Complete":
  ↓
Modal appears:
  "Update reading progress?"
  Currently reading: The Hobbit (52%)
  New progress: [60%]
  [Skip] [Save]
  ↓
Creates:
  1. HabitCheckIn (habit_check_ins table)
  2. BookCheckIn (book_check_ins table, linked via checkInId)
  ↓
Habit streak: 12 → 13 days
Book progress: 52% → 60%
```

**Database Link:**

```typescript
// HabitCheckIns table
{
  id: "checkin_123",
  habitId: "habit_456",
  occurredAt: "2026-05-01T08:30:00Z",
  moduleData: { bookId: "book_789", progressBefore: 52, progressAfter: 60 } // Optional JSON
}

// BookCheckIns table
{
  id: "book_checkin_abc",
  bookId: "book_789",
  checkInId: "checkin_123", // Links back to habit check-in
  progressBefore: 52,
  progressAfter: 60,
  occurredAt: "2026-05-01T08:30:00Z"
}
```

**Why:** Unifies habit tracking with rich module data. Users can track habits generically OR with detailed logging.

**Technical Requirements:**

- Habits table: add `moduleType` field (optional)
- HabitCheckIns table: add `moduleData` JSON field (optional)
- Module check-in tables: add `checkInId` FK (optional, links to habit_check_ins)
- Check-in UI: conditional rendering based on habit.moduleType

**Cost:** $0

---

## Database Schema

```sql
-- ========================================
-- GROWTH HUB: BOOKS MODULE
-- ========================================
CREATE TABLE books (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  isbn TEXT,
  status TEXT NOT NULL DEFAULT 'WANT_TO_READ',
  current_progress INTEGER DEFAULT 0,
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  rating INTEGER,
  cover_url TEXT,
  external_id TEXT, -- Goodreads/Audible ID
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CHECK (status IN ('READING', 'FINISHED', 'WANT_TO_READ')),
  CHECK (current_progress BETWEEN 0 AND 100),
  CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  CHECK (finished_at IS NULL OR finished_at >= started_at)
);

CREATE INDEX idx_books_user_status ON books(user_id, status);
CREATE INDEX idx_books_finished ON books(user_id, finished_at) WHERE status = 'FINISHED';

CREATE TABLE book_check_ins (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL,
  check_in_id TEXT, -- Optional FK to habit_check_ins
  progress_before INTEGER NOT NULL,
  progress_after INTEGER NOT NULL,
  pages_read INTEGER,
  occurred_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (check_in_id) REFERENCES habit_check_ins(id) ON DELETE SET NULL,
  CHECK (progress_after >= progress_before),
  CHECK (progress_before BETWEEN 0 AND 100),
  CHECK (progress_after BETWEEN 0 AND 100)
);

CREATE INDEX idx_book_checkins_book ON book_check_ins(book_id, occurred_at);

-- ========================================
-- GROWTH HUB: TRAINING MODULE
-- ========================================
CREATE TABLE exercises (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT, -- CHEST | LEGS | BACK | SHOULDERS | ARMS | CORE
  equipment TEXT, -- BARBELL | DUMBBELL | MACHINE | BODYWEIGHT | CABLE
  is_custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, name)
);

CREATE INDEX idx_exercises_user ON exercises(user_id);

CREATE TABLE workout_check_ins (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  check_in_id TEXT, -- Optional FK to habit_check_ins
  workout_type TEXT, -- STRENGTH | CARDIO | SPORT | FLEXIBILITY
  duration INTEGER, -- minutes
  body_weight REAL, -- lbs or kg
  occurred_at TIMESTAMP NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (check_in_id) REFERENCES habit_check_ins(id) ON DELETE SET NULL,
  CHECK (duration > 0),
  CHECK (body_weight IS NULL OR body_weight > 0)
);

CREATE INDEX idx_workout_checkins_user ON workout_check_ins(user_id, occurred_at);

CREATE TABLE exercise_sets (
  id TEXT PRIMARY KEY,
  workout_check_in_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  weight REAL NOT NULL,
  reps INTEGER NOT NULL,
  set_number INTEGER NOT NULL,
  rpe INTEGER, -- Rate of Perceived Exertion (1-10)

  FOREIGN KEY (workout_check_in_id) REFERENCES workout_check_ins(id) ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id),
  CHECK (weight >= 0),
  CHECK (reps > 0),
  CHECK (set_number > 0),
  CHECK (rpe IS NULL OR rpe BETWEEN 1 AND 10)
);

CREATE INDEX idx_exercise_sets_workout ON exercise_sets(workout_check_in_id);
CREATE INDEX idx_exercise_sets_exercise ON exercise_sets(exercise_id, workout_check_in_id);

-- ========================================
-- GROWTH HUB: NUTRITION MODULE
-- ========================================
CREATE TABLE meal_check_ins (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  check_in_id TEXT, -- Optional FK to habit_check_ins
  meal_type TEXT NOT NULL, -- BREAKFAST | LUNCH | DINNER | SNACK
  logged BOOLEAN DEFAULT TRUE,
  occurred_at TIMESTAMP NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (check_in_id) REFERENCES habit_check_ins(id) ON DELETE SET NULL,
  CHECK (meal_type IN ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'))
);

CREATE INDEX idx_meal_checkins_user ON meal_check_ins(user_id, occurred_at);

-- ========================================
-- GROWTH HUB: PODCAST MODULE
-- ========================================
CREATE TABLE podcast_check_ins (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  check_in_id TEXT, -- Optional FK to habit_check_ins
  show_name TEXT NOT NULL,
  episode_title TEXT,
  duration INTEGER, -- minutes
  occurred_at TIMESTAMP NOT NULL,
  external_id TEXT, -- Spotify episode ID
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (check_in_id) REFERENCES habit_check_ins(id) ON DELETE SET NULL
);

CREATE INDEX idx_podcast_checkins_user ON podcast_check_ins(user_id, occurred_at);

-- ========================================
-- GROWTH HUB: ACCOUNT LINKING
-- ========================================
CREATE TABLE module_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  module_type TEXT NOT NULL, -- BOOK | WORKOUT | NUTRITION | PODCAST
  provider TEXT NOT NULL, -- goodreads | audible | strava | spotify | myfitnesspal
  provider_user_id TEXT,
  access_token TEXT NOT NULL, -- AES-256 encrypted
  refresh_token TEXT, -- AES-256 encrypted
  token_expires_at TIMESTAMP,
  last_sync TIMESTAMP,
  sync_enabled BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'ACTIVE', -- ACTIVE | EXPIRED | REVOKED
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, module_type, provider)
);

CREATE INDEX idx_module_accounts_user ON module_accounts(user_id);

-- ========================================
-- HABIT EXTENSIONS (add module support)
-- ========================================
ALTER TABLE habits ADD COLUMN module_type TEXT; -- BOOK | WORKOUT | NUTRITION | PODCAST
ALTER TABLE habit_check_ins ADD COLUMN module_data JSON; -- Flexible module-specific data
```

---

## Validation Checklist

- [ ] Growth Hub landing page shows all module cards
- [ ] Library module: log books, track progress, mark finished
- [ ] Training module: log workouts, track exercise PRs, body weight
- [ ] Nutrition module: log meals, weekly view, streak tracking
- [ ] Podcast module: log episodes, listening stats
- [ ] Module streaks calculate correctly (per hardcoded requirements)
- [ ] History views display per module with charts
- [ ] Account linking OAuth flow works (tokens encrypted)
- [ ] Module posts generate and share to feed
- [ ] Habits can link to modules with enhanced check-ins

---

## What NOT to Build

❌ NO auto-sync logic (M6+ - just OAuth plumbing in M5)
❌ NO calorie counting (simple meal logging only)
❌ NO workout plan builder (just logging)
❌ NO book recommendations AI (manual search only)
❌ NO challenges (deferred to M6)
❌ NO HealthKit integration (M6)
❌ NO habit suggestions based on module data (M7+)

---

## Cost & Privacy Summary

**Monthly Cost:** $0-10 (1000 users)

- Module tracking: $0 (device-side + cloud DB)
- OAuth infrastructure: $5 (Lambda + encryption keys)
- Open Library API (book covers): $0

**Privacy Compliance:**

- ✅ Module entries respect privacy settings (SELF/CLOSE_FRIENDS/FRIENDS/PUBLIC)
- ✅ Connected accounts visible only to user
- ✅ OAuth tokens encrypted at rest (AES-256)
- ✅ No data sharing with external APIs without user consent
- ✅ Users control sync preferences per provider

---

## Reference

- [data-model.md](../data-model.md) - Add module tables
- [architecture.md](../architecture.md) - Module system architecture
- [M4-identity-analytics.md](M4-identity-analytics.md) - Identity system (prerequisite)
- [M6-build-break-stacking.md](M6-build-break-stacking.md) - Next milestone (BUILD/BREAK habits)
