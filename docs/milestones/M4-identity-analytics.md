# Milestone 4: Identity, Analytics & Engagement

**Goal:** Add identity system, journal/mood tracking, enhanced analytics, close friends feature, and report exports.
**Timeline:** 3-4 weeks
**Cost Target:** $0-5 (all device-side compute + optional PDF export)
**Dependencies:** M3 complete (social features working)

---

## Overview

M4 enriches the tracking experience with identities (Student, Athlete, Parent, etc.) that map to pillars, manual journal/mood entries for self-reflection, deeper analytics (correlations, time-of-day patterns), close friends privacy tier, and report exports. All analytics calculated device-side for zero cost.

---

## Design Principles

1. **Identity-Driven:** Habits can link to identities, dashboard shows per-identity contributions
2. **Manual First:** Journal and mood are manual inputs (no ML sentiment analysis yet)
3. **Device-Side Analytics:** All correlations, trends, patterns calculated on device (free)
4. **Privacy-First:** Identities and journal entries default to SELF-only
5. **Granular Privacy:** Close friends tier for selective sharing with inner circle

**Reference:** Original spec sections expanded with close friends model and export features

---

## User Stories

### 4.1 Identity System

**Story:** As a user, I want to define identities so that I can organize habits by my life roles.

**Acceptance Criteria:**

- [ ] Identity setup screen (onboarding + settings)
- [ ] User can add identities from preset list:
  - Name (e.g., "Student", "Athlete", "Parent", "Artist")
  - Pillar assignment (each identity maps to ONE pillar: MIND/BODY/HEART/SOUL)
  - Icon (emoji from preset list)
- [ ] Habits can link to identity (optional field in habit creation)
- [ ] Dashboard shows per-identity breakdown:
  - Habits count per identity
  - Check-ins count per identity
  - Pillar contribution percentage
- [ ] Can edit/delete identities (habits remain, link removed)

**Example Identities:**

```typescript
{
  name: "Student",
  pillar: "MIND",
  icon: "📚",
  habits: ["Study 2 hours", "Read textbook chapter"]
}
{
  name: "Athlete",
  pillar: "BODY",
  icon: "🏃",
  habits: ["Morning run", "Gym 3x/week"]
}
{
  name: "Friend",
  pillar: "HEART",
  icon: "🤝",
  habits: ["Call mom weekly", "Coffee with friends"]
}
```

**Why:** Users have multiple life roles. Identities help organize habits meaningfully and show which roles are thriving vs neglected.

**API Contract:**

```
POST /identities
Body: { name: string, pillar: Pillar, icon: string }
Response: { data: Identity }

PATCH /habits/:id
Body: { identityId?: string }
Response: { data: Habit }
```

**Technical Requirements:**

- Identity table: id, userId, name, pillar, icon, createdAt
- Habit.identityId foreign key (optional)
- Dashboard query: GROUP BY identityId, count check-ins
- Identity table: id, userId, name, pillar, icon, preset (boolean), createdAt
- Habit.identityId foreign key (optional)
- Dashboard query: GROUP BY identityId, COUNT check-ins
- Device-side calculation (no API calls)

**Privacy Notes:**

- Identities are SELF-only (never shared)
- Habits linked to identities respect habit privacy

**Security Notes:**

- Max 20 identities per user
- Rate limit: 50 identity operations per day

**Cost:** $0

---

### 4.2 Journal Tracking

**Story:** As a user, I want to write private journal entries so that I can reflect on my day.

**Acceptance Criteria:**

- [ ] Journal tab with list of entries (most recent first)
- [ ] "New Entry" button opens editor:
  - Title (optional, 100 chars)
  - Body (required, 5000 chars max)
  - Timestamp (defaults to now, can backdate up to 7 days)
- [ ] Markdown support: bold, italic, lists
- [ ] Entry detail view with edit/delete options
- [ ] Full-text search (SQLite FTS5 on device)
- [ ] Dashboard widget: "Last journaled X days ago"

**Example Entry:**

```typescript
{
  title: "Great workout today",
  body: "Finally hit my PR on deadlifts! 💪\n\nFeeling accomplished but also tired. Need to focus on recovery tomorrow.\n\n**Key wins:**\n- Deadlift PR: 315lbs\n- Stayed hydrated\n- Good sleep last night (7.5hrs)",
  timestamp: "2026-01-01T18:30:00Z",
  privacy: "SELF"
}
```

**Why:** Journaling promotes self-reflection and helps users process their habit journey. Private by default to encourage honest writing.

**API Contract:**

```
POST /journal
Body: { title?: string, body: string, timestamp: string, privacy: Privacy }
Response: { data: JournalEntry }
```

**Technical Requirements:**

- JournalEntry table: id, userId, title, body, privacy, timestamp, createdAt, updatedAt
- SQLite FTS5 for full-text search (device-side)
- react-native-markdown-display for rendering

**Privacy Notes:**

- Journal entries default to SELF-only
- Warn before changing to PUBLIC: "Journal entries can be very personal"

**Security Notes:**

- Rate limit: 20 journal entries per day
- Max 5000 chars

**Cost:** $0

---

### 4.3 Mood Tracking

**Story:** As a user, I want to track my mood over time so that I can see patterns.

**Acceptance Criteria:**

- [ ] Quick mood log from dashboard:
  - Emoji scale: 😞 😐 🙂 😊 😄 (1-5)
  - Optional note (100 chars)
  - Timestamp (defaults to now)
- [ ] Mood history: line chart (7/30/90 days view)
- [ ] Mood insights (device-side):
  - Average mood this week vs last week
  - Best/worst day of week
  - Time of day patterns
- [ ] Dashboard widget: mood trend line

**Example Mood Data:**

```typescript
[
  { value: 5, note: "Crushed my workout! 💪", timestamp: "2026-01-01T07:00:00Z" },
  { value: 3, note: "Stressful work meeting", timestamp: "2026-01-01T14:00:00Z" },
  { value: 4, note: "Good evening with family", timestamp: "2026-01-01T20:00:00Z" }
]

// Insights:
{
  avgThisWeek: 4.2,
  avgLastWeek: 3.8,
  trend: "↑ Improving",
  bestDay: "Saturday",
  worstDay: "Monday"
}
```

**Why:** Mood tracking helps users identify triggers and patterns. Simple emoji scale reduces friction (no complex questionnaires).

**Calculation (Device-Side):**

```typescript
function calculateMoodInsights(moods: MoodEntry[]) {
  const thisWeek = moods.filter((m) => isThisWeek(m.timestamp));
  const lastWeek = moods.filter((m) => isLastWeek(m.timestamp));

  return {
    avgThisWeek: average(thisWeek.map((m) => m.value)),
    avgLastWeek: average(lastWeek.map((m) => m.value)),
    bestDay: maxBy(groupBy(moods, "dayOfWeek"), avg),
    worstDay: minBy(groupBy(moods, "dayOfWeek"), avg),
  };
}
```

**API Contract:**

```
POST /moods
Body: { value: number (1-5), note?: string, timestamp: string }
Response: { data: MoodEntry }
```

**Technical Requirements:**

- MoodEntry table: id, userId, value (1-5), note, timestamp, createdAt
- Victory Native for charts
- Calculate insights on device (no API calls)

**Privacy Notes:**

- Mood data SELF-only (never shared)
- Can optionally share aggregated trends in posts (e.g., "Feeling better this week ☀️")

**Cost:** $0

---

### 4.4 Consistency Score

**Story:** As a user, I want a single score that represents my overall habit consistency so that I can track my progress holistically.

**Acceptance Criteria:**

- [ ] Dashboard displays consistency score (0-100)
- [ ] Score calculated from 4 weighted factors:
  - Consistency (40%): Check-ins completed vs expected (last 60 days, weighted)
  - Pillar Balance (25%): Are all 4 pillars getting attention?
  - Social Engagement (20%): Posts, reactions, nudges given
  - Momentum (15%): Active streaks across habits
- [ ] Score uses exponential-weighted moving average (EWMA) with 60-day window
- [ ] Recent check-ins boost score immediately (recency bonus)
- [ ] Score updates daily at midnight + instantly after check-ins
- [ ] Tap score to see breakdown by factor
- [ ] Score stored locally, synced to server for friend visibility (M8+)

**Why 60 Days:** Aligns with habit formation research (Atomic Habits: ~60 days to form habit)

**Why These Weights:**

- **Consistency (40%):** Core metric but not overwhelming
- **Pillar Balance (25%):** Reflects identity system; prevents "one-pillar" users
- **Social Engagement (20%):** Social accountability is the product (sharing, supporting friends)
- **Momentum (15%):** Rewards streaks without toxic "don't break chain" pressure

**Formula (Exponential-Weighted 60-Day Window):**

```typescript
// Base score: EWMA over 60 days (stability)
function calculateBaseScore(userId: string): number {
  const halfLife = 20; // Days
  const window = 60;

  // 1. Consistency (40%)
  let consistencyScore = 0;
  let totalWeight = 0;
  for (let d = 0; d < window; d++) {
    const weight = Math.pow(0.5, d / halfLife);
    const completed = getCheckInsForDay(userId, d);
    const expected = getExpectedCheckInsForDay(userId, d);
    consistencyScore += weight * (completed / Math.max(expected, 1));
    totalWeight += weight;
  }
  consistencyScore = (consistencyScore / totalWeight) * 40;

  // 2. Pillar Balance (25%)
  const checkIns = getCheckInsLastNDays(userId, window);
  const activePillars = new Set(checkIns.map((c) => c.habit.pillar)).size;
  const balanceScore = (activePillars / 4) * 25;

  // 3. Social Engagement (20%)
  const socialActions = getSocialActionsLastNDays(userId, window); // posts + reactions + nudges
  const socialScore = Math.min(socialActions / 30, 1) * 20; // Target: ~30 actions in 60 days

  // 4. Momentum (15%)
  const habits = getUserHabits(userId);
  const activeStreaks = habits.filter((h) => h.currentStreak >= 3).length;
  const momentumScore = (activeStreaks / Math.max(habits.length, 1)) * 15;

  return Math.round(consistencyScore + balanceScore + socialScore + momentumScore);
}

// Recency boost: immediate feedback after check-in
function applyRecencyBonus(baseScore: number, userId: string): number {
  const checkedInToday = hasCheckInToday(userId);
  const currentStreak = getLongestActiveStreak(userId);

  let recencyFactor = 0;
  if (checkedInToday) {
    recencyFactor += 0.1; // +10% for today's check-in
    recencyFactor += Math.min(0.05 * (currentStreak - 1), 0.15); // +5% per streak day, cap at +15%
  }

  return Math.round(Math.min(100, baseScore * (1 + recencyFactor)));
}

// Final score shown to user
const finalScore = applyRecencyBonus(calculateBaseScore(userId), userId);
```

**Storage (Device-First):**

```typescript
// User table addition
interface User {
  // ... existing fields
  consistencyScore: number; // 0-100 (final score)
  baseScore: number; // EWMA without recency bonus
  lastScoreUpdate: Date;
}

// Optional: Daily aggregate for faster calculation
interface DailyAggregate {
  id: string;
  userId: string;
  date: Date;
  checkInsCount: number;
  expectedCount: number;
  activePillars: Pillar[]; // Which pillars had check-ins
  socialActionsCount: number; // Posts + reactions + nudges
}
```

**Implementation Notes:**

- **Daily cron:** Recalculate all users' base scores at midnight
- **Real-time update:** After check-in, increment score immediately (optimistic)
- **Grace period:** First 24h of inactivity shows no decay (avoids anxiety)
- **Floor protection:** Score never drops below 10
- **All device-side:** No API calls, instant UX
- **Sync to cloud:** For friend visibility (M8+, opt-in)

**UI Display:**

```
┌─────────────────────────────┐
│  Consistency Score          │
│                             │
│         ╔═══════╗           │
│         ║  78   ║           │
│         ╚═══════╝           │
│                             │
│  Tap to see breakdown       │
└─────────────────────────────┘

// Breakdown view:
Consistency:     32/40  ████████░░
Pillar Balance:  19/25  ████████░░
Social:          14/20  ███████░░░
Momentum:        13/15  █████████░
```

**Privacy Notes:**

- Score calculation device-only (M4)
- M8+ may add opt-in sharing with friends (plant visualization)
- Breakdown never shared, only final score

**Cost:** $0 (all device-side)

---

### 4.5 Dashboard Correlations

**Story:** As a user, I want to see correlations between habits so that I understand what helps me succeed.

**Acceptance Criteria:**

- [ ] Dashboard "Insights" tab
- [ ] User selects 2 habits from dropdowns
- [ ] Chart shows correlation over last 30 days
- [ ] Insight card: "You're 80% more likely to workout after good sleep"
- [ ] Minimum 14 days of data required

**Example Correlations:**

```typescript
// User selects: "Morning meditation" + "Productive work day"
{
  habit1: "Morning meditation",
  habit2: "Productive work day",
  correlation: 0.85, // 85% correlation
  insight: "You completed 'Productive work day' on 17 of 20 days when you meditated (85%)",
  recommendation: "Try meditating before work to boost focus"
}

// Another example: "Late night snacking" + "Poor sleep"
{
  correlation: -0.72, // Negative correlation
  insight: "You slept poorly on 13 of 18 days after late night snacking (72%)",
  recommendation: "Consider eating dinner earlier for better sleep"
}
```

**Why:** Users discover which habits unlock others (keystone habits) or which negatively impact performance.

**Calculation (Device-Side):**

```typescript
function calculateCorrelation(habit1Id: string, habit2Id: string) {
  const days = last30Days();
  const data = days.map((day) => ({
    habit1Done: checkIns.some((c) => c.habitId === habit1Id && isSameDay(c.occurredAt, day)),
    habit2Done: checkIns.some((c) => c.habitId === habit2Id && isSameDay(c.occurredAt, day)),
  }));

  const bothDone = data.filter((d) => d.habit1Done && d.habit2Done).length;
  const habit1Done = data.filter((d) => d.habit1Done).length;

  return habit1Done > 0 ? (bothDone / habit1Done) * 100 : 0;
}
```

**Technical Requirements:**

- UI: two dropdowns for habit selection
- Chart: scatter plot or line chart
- All calculations on-device
- Min 14 days data for accuracy

**Privacy Notes:**

- Correlations never leave device (pure client-side)

**Cost:** $0

---

### 4.6 Time of Day Heatmap

**Story:** As a user, I want to see when I'm most productive so that I can schedule habits accordingly.

**Acceptance Criteria:**

- [ ] Dashboard shows heatmap:
  - X-axis: day of week (Mon-Sun)
  - Y-axis: hour of day (0-23)
  - Color intensity: number of check-ins
- [ ] Insight: "You're most active Tue/Thu 7-9am"
- [ ] Tap cell to see which habits were completed
- [ ] Device-side calculation

**Example Heatmap:**

```typescript
// Heatmap data structure
[
  { day: "Mon", hour: 7, count: 5, habits: ["Workout", "Meditation"] },
  { day: "Mon", hour: 19, count: 3, habits: ["Read"] },
  { day: "Tue", hour: 7, count: 4, habits: ["Workout", "Journal"] },
  // ... more cells
];

// Generated insight:
("You're most productive on Tuesday and Thursday mornings (7-9am) with an average of 4.5 check-ins. Consider scheduling important habits during this time.");
```

**Visual Example:**

```
        Mon  Tue  Wed  Thu  Fri  Sat  Sun
6am     ░░   ░░   ░    ░░   ░    ▓▓   ▓▓
7am     ▓▓▓  ▓▓▓  ▓▓   ▓▓▓  ▓▓   ▓▓▓  ░
8am     ▓▓   ▓▓   ░    ▓▓   ░    ░    ░
...
7pm     ▓    ▓▓   ▓▓▓  ▓    ░    ▓▓   ▓▓
```

**Why:** Helps users identify their peak performance windows and schedule important habits when they're most likely to succeed.

**Technical Requirements:**

- Custom grid with react-native-svg
- Query: `SELECT dayOfWeek, hour, COUNT(*) FROM check_ins GROUP BY dayOfWeek, hour`
- Device-side calculation

**Privacy Notes:**

- Heatmap is SELF-only (never shared)

**Cost:** $0

---

### 4.7 Close Friends Feature

**Story:** As a user, I want to mark certain friends as "close friends" so that I can share more privately with my inner circle.

**Acceptance Criteria:**

- [ ] Friends list shows "Mark as Close Friend" toggle per friend
- [ ] Close friends get ⭐ badge next to name
- [ ] New privacy level: CLOSE_FRIENDS (between SELF and FRIENDS)
- [ ] Privacy levels now: SELF → CLOSE_FRIENDS → FRIENDS → PUBLIC
- [ ] Posts/habits with CLOSE_FRIENDS privacy only visible to:
  - User themselves
  - Friends they've marked as close friends
- [ ] Settings: default privacy can be set to CLOSE_FRIENDS

**Example Privacy Flow:**

```typescript
// User has 50 friends, marks 5 as close friends:
const closeFriends = [
  { id: "user_123", name: "Sarah", isCloseFriend: true },
  { id: "user_456", name: "Mike", isCloseFriend: true },
  { id: "user_789", name: "Lisa", isCloseFriend: true },
  // ... 47 more regular friends
];

// Creates post about struggling with anxiety:
{
  content: "Having a tough week with anxiety. Working through it.",
  privacy: "CLOSE_FRIENDS" // Only Sarah, Mike, Lisa see this
}

// Creates post about workout PR:
{
  content: "New deadlift PR! 💪",
  privacy: "FRIENDS" // All 50 friends see this
}
```

**Privacy Enforcement Example:**

```typescript
function canViewPost(viewerId: string, post: Post, friendships: Friendship[]) {
  if (post.userId === viewerId) return true; // Own posts always visible
  if (post.privacy === "PUBLIC") return true;

  const friendship = friendships.find(
    (f) =>
      (f.userId === post.userId && f.friendId === viewerId) ||
      (f.friendId === post.userId && f.userId === viewerId)
  );

  if (!friendship || friendship.status !== "ACCEPTED") return false;

  if (post.privacy === "FRIENDS") return true;
  if (post.privacy === "CLOSE_FRIENDS") {
    // Check if viewer is marked as close friend by post author
    return friendship.userId === post.userId && friendship.isCloseFriend;
  }

  return false;
}
```

**Why:** Instagram Close Friends model - users need intermediate privacy between "all friends" and "just me" for vulnerable sharing.

**API Contract:**

```
PATCH /friendships/:id
Body: { isCloseFriend: boolean }
Response: { data: Friendship }
```

**Technical Requirements:**

- Add Friendship.isCloseFriend field (boolean, defaults to false)
- Update privacy enforcement logic across all queries
- Update all privacy dropdowns
- Update feed/story filtering

**Privacy Notes:**

- Close friends designation is private (others can't see who you marked)
- One-way designation (A marks B doesn't mean B marks A)
- Marking/unmarking doesn't notify the friend

**Cost:** $0

---

### 4.8 Dashboard Export Reports

**Story:** As a user, I want to export reports so that I can analyze my data externally or share with a coach.

**Acceptance Criteria:**

- [ ] "Export Report" button on dashboard
- [ ] Report types:
  - Weekly summary (PDF or CSV)
  - Monthly summary
  - Custom date range
- [ ] Report includes:
  - Pillar scores over time
  - Habit completion rates
  - Streaks summary
  - Mood trends (if tracked)
  - Identity contributions
- [ ] Download or share via email

**Example Report Structure:**

```typescript
// Weekly Summary Report
{
  period: "Dec 25 - Dec 31, 2025",
  summary: {
    totalCheckIns: 42,
    habitsTracked: 8,
    longestStreak: 14,
    pillarScores: {
      MIND: 85,
      BODY: 92,
      HEART: 78,
      SOUL: 88
    }
  },
  habitBreakdown: [
    { name: "Morning run", completionRate: 100, checkIns: 7 },
    { name: "Meditation", completionRate: 86, checkIns: 6 },
    { name: "Read 30min", completionRate: 71, checkIns: 5 }
  ],
  moodTrend: {
    average: 4.1,
    trend: "↑ +0.3 from last week",
    bestDay: "Saturday",
    worstDay: "Monday"
  },
  identityContributions: [
    { name: "Athlete", pillar: "BODY", checkIns: 15, percentage: 35.7 },
    { name: "Student", pillar: "MIND", checkIns: 12, percentage: 28.6 }
  ]
}
```

**CSV Format Example:**

```
Date,Habit,Completed,Mood,Notes
2025-12-25,Morning run,Yes,4,"Great start to the day"
2025-12-25,Meditation,Yes,4,""
2025-12-25,Read 30min,No,3,"Too tired"
...
```

**Why:** Users want to share progress with coaches/therapists, or analyze in external tools (Excel, data science notebooks). Export empowers data ownership.

**API Contract:**

```
GET /reports/weekly
Response: { data: { summary, charts, csvUrl } }
```

**Technical Requirements:**

- Generate PDF: react-native-pdf or server-side (wkhtmltopdf)
- CSV: simple string formatting
- Charts: screenshot of dashboard charts (react-native-view-shot)

**Privacy Notes:**

- Reports contain user's own data only
- Warn before sharing externally

**Security Notes:**

- Rate limit: 10 reports per day

**Cost:** $0 (if client-side) or $5/month (if server-side PDF generation via Lambda)

---

## Validation Checklist

- [ ] Identities created and linked to habits
- [ ] Dashboard shows per-identity breakdown
- [ ] Journal entries created, searched, displayed
- [ ] Mood tracking with charts working
- [ ] Correlations calculated correctly (min 14 days data)
- [ ] Heatmap displays check-in patterns
- [ ] Close friends marked and privacy enforced
- [ ] All privacy levels work: SELF/CLOSE_FRIENDS/FRIENDS/PUBLIC
- [ ] Reports export to PDF/CSV

---

## What NOT to Build

❌ NO BUILD/BREAK habits (M5)
❌ NO habit stacking (M5)
❌ NO intensity tracking (M5)
❌ NO HealthKit integration (M5)
❌ NO challenges (M5)
❌ NO behavioral drift (M6)
❌ NO ML/automation (M7)

---

## Cost & Privacy Summary

**Monthly Cost:** $0-5 (1000 users)

- All analytics on device: $0
- PDF generation: $0 (client-side) or $5 (Lambda)

**Privacy Compliance:**

- ✅ Journal SELF-only by default
- ✅ Mood never shared (SELF-only)
- ✅ Correlations device-only
- ✅ Close friends private designation
- ✅ Reports contain user's own data only

---

## Reference

- [data-model.md](../data-model.md) - Identity, JournalEntry, MoodEntry tables
- [architecture.md](../architecture.md#privacy-enforcement) - Privacy model
