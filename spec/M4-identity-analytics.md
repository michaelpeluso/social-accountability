# Milestone 4: Identity, Analytics & Engagement

**Goal:** Add identity system, journal/mood tracking, enhanced analytics, and social challenges.
**Timeline:** 3-4 weeks
**Cost Target:** $0 (all device-side compute + HealthKit proof-of-concept)
**Dependencies:** M3 complete (social features working)

---

## Overview

M4 enriches the tracking experience with identities (Student, Athlete, Parent, etc.) that map to pillars, manual journal/mood entries, deeper analytics (all device-side), and social challenges. Also includes first integration: HealthKit steps (proof-of-concept for M5 expansion).

---

## Design Principles

1. **Identity-Driven:** Habits can link to identities, dashboard shows per-identity contributions
2. **Manual First:** Journal and mood are manual inputs (no ML sentiment analysis yet)
3. **Device-Side Analytics:** All correlations, trends, patterns calculated on device (free)
4. **Privacy-Safe Integration:** HealthKit steps only, explicit consent, can disable anytime
5. **Positive Challenges:** Compete with friends on habits (no shame, celebrate together)

**Reference:** Original spec sections restored (2.1, 2.4 partial, 2.6 expanded)

---

## User Stories

### 4.1 Identity System

**Story:** As a user, I want to define identities so that I can organize habits by my life roles.

**Acceptance Criteria:**
- [ ] Identity setup screen (onboarding + settings)
- [ ] User can add identities:
  - Name (e.g., "Student", "Athlete", "Parent", "Artist")
  - Pillar assignment (each identity maps to ONE pillar: MIND/BODY/HEART/SOUL)
  - Icon (choose from preset list)
- [ ] Habits can link to identity (optional field)
- [ ] Dashboard shows per-identity breakdown:
  - Habits count per identity
  - Check-ins count per identity
  - Pillar contribution (how much each identity contributes to its pillar score)
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
- Device-side calculation (no API calls)

**Privacy Notes:**
- Identities are SELF-only (never shared)
- Habits linked to identities respect habit privacy

**Security Notes:**
- Max 20 identities per user (prevent abuse)
- Rate limit: 50 identity operations per day

**Cost:** $0

**Reference:** Original spec 2.1 (Identity & Pillar Assignment)

---

### 4.2 Journal Entries

**Story:** As a user, I want to write journal entries so that I can reflect on my day and tag them to pillars.

**Acceptance Criteria:**
- [ ] "New Journal Entry" button
- [ ] Entry form:
  - Body text (required, 5000 chars max)
  - Pillar tags (multi-select: can tag multiple pillars)
  - Mood (optional, emoji scale: 😞 😐 🙂 😊 😄)
  - Privacy (required, defaults to SELF)
  - Date (defaults to today, can backdate up to 7 days)
- [ ] Save stores locally, syncs in background
- [ ] Journal list shows entries chronologically
- [ ] Search/filter by pillar, mood, date range
- [ ] Can edit/delete entries

**API Contract:**
```
POST /journal
Body: { 
  bodyText: string, 
  pillars: Pillar[], 
  mood?: number, 
  privacy: Privacy, 
  entryDate: string 
}
Response: { data: JournalEntry }
```

**Technical Requirements:**
- JournalEntry table: id, userId, bodyText, pillars (JSON array), mood (1-5), privacy, entryDate, createdAt
- SQLite full-text search on bodyText
- Mood: 1 = 😞, 2 = 😐, 3 = 🙂, 4 = 😊, 5 = 😄
- Sync queue with retry

**Privacy Notes:**
- Default privacy: SELF (most sensitive)
- Warn if changing to PUBLIC (journal can be very personal)
- Never share journal content in analytics

**Security Notes:**
- Rate limit: 20 journal entries per day
- Max 5000 chars (prevent abuse)

**Cost:** $0 (text storage minimal)

**Reference:** Original spec 2.4 (Manual Inputs - Journal)

---

### 4.3 Mood Tracking

**Story:** As a user, I want to track my mood over time so that I can see patterns.

**Acceptance Criteria:**
- [ ] Quick mood log (separate from journal):
  - Emoji scale: 😞 😐 🙂 😊 😄
  - Optional note (100 chars)
  - Timestamp (defaults to now)
- [ ] Mood history: line chart showing mood over time (7/30/90 days)
- [ ] Mood insights (device-side):
  - Average mood this week vs last week
  - Best/worst day of week (e.g., "Mondays are tough")
  - Time of day patterns (e.g., "Mornings are best")
- [ ] Dashboard widget: mood trend line

**Calculation (Device-Side):**
```typescript
function calculateMoodTrends(moods: MoodEntry[]): MoodInsights {
  const thisWeek = moods.filter(m => isThisWeek(m.timestamp));
  const avgThisWeek = average(thisWeek.map(m => m.value));
  
  const lastWeek = moods.filter(m => isLastWeek(m.timestamp));
  const avgLastWeek = average(lastWeek.map(m => m.value));
  
  const byDayOfWeek = groupBy(moods, m => getDayOfWeek(m.timestamp));
  const bestDay = maxBy(byDayOfWeek, (day, entries) => average(entries.map(e => e.value)));
  
  return { avgThisWeek, avgLastWeek, bestDay };
}
```

**API Contract:**
```
POST /moods
Body: { value: number, note?: string, timestamp: string }
Response: { data: MoodEntry }
```

**Technical Requirements:**
- MoodEntry table: id, userId, value (1-5), note, timestamp, createdAt
- Chart library: Victory Native or react-native-svg-charts
- Calculate insights on device (no API calls)

**Privacy Notes:**
- Mood data SELF-only (never shared)
- Optional: share mood trends in feed (aggregated, not individual entries)

**Security Notes:**
- Rate limit: 50 mood logs per day

**Cost:** $0

**Reference:** Original spec 2.4 (Mood logging)

---

### 4.4 Enhanced Dashboard - Correlations

**Story:** As a user, I want to see correlations between habits so that I understand what helps me succeed.

**Acceptance Criteria:**
- [ ] Dashboard tab: "Insights"
- [ ] Correlation matrix:
  - User selects 2 habits (e.g., "Sleep 8 hours" vs "Morning workout")
  - Chart shows correlation over time
  - Insight: "You're 80% more likely to workout after good sleep"
- [ ] Preset correlations (if data available):
  - Sleep vs mood
  - Exercise vs energy (if journaled)
  - Social habits vs mood
- [ ] Device-side calculation (simple statistical correlation)

**Calculation (Device-Side):**
```typescript
function calculateCorrelation(habit1: Habit, habit2: Habit, checkIns: HabitCheckIn[]): number {
  const days = last30Days();
  
  const data = days.map(day => ({
    habit1Completed: checkIns.some(c => c.habitId === habit1.id && isSameDay(c.occurredAt, day)),
    habit2Completed: checkIns.some(c => c.habitId === habit2.id && isSameDay(c.occurredAt, day))
  }));
  
  // Simple correlation: % of days both completed
  const bothCompleted = data.filter(d => d.habit1Completed && d.habit2Completed).length;
  const habit1Completed = data.filter(d => d.habit1Completed).length;
  
  return habit1Completed > 0 ? (bothCompleted / habit1Completed) * 100 : 0;
}
```

**Technical Requirements:**
- UI: select 2 habits from dropdown
- Chart: scatter plot or line chart
- Calculate on device (no API call)
- Min 14 days data required for insight

**Privacy Notes:**
- Correlations never leave device
- User owns their patterns

**Security Notes:**
- N/A (device-only)

**Cost:** $0

**Reference:** Original spec 2.6 (Dashboard - Correlations)

---

### 4.5 Enhanced Dashboard - Time-of-Day Heatmap

**Story:** As a user, I want to see when I'm most productive so that I can schedule habits accordingly.

**Acceptance Criteria:**
- [ ] Dashboard shows heatmap:
  - X-axis: day of week (Mon-Sun)
  - Y-axis: hour of day (0-23)
  - Color intensity: # of check-ins at that time
- [ ] Insight: "You're most active Tue/Thu 7-9am"
- [ ] Tap cell: see which habits completed at that time
- [ ] Device-side calculation

**Calculation (Device-Side):**
```typescript
function calculateHeatmap(checkIns: HabitCheckIn[]): number[][] {
  const heatmap = Array(7).fill(0).map(() => Array(24).fill(0));
  
  checkIns.forEach(c => {
    const day = getDayOfWeek(c.occurredAt); // 0-6
    const hour = getHour(c.occurredAt); // 0-23
    heatmap[day][hour]++;
  });
  
  return heatmap;
}
```

**Technical Requirements:**
- Chart: custom grid (react-native-svg)
- Query SQLite: SELECT dayOfWeek, hour, COUNT(*) FROM check_ins GROUP BY dayOfWeek, hour
- Device-side calculation

**Privacy Notes:**
- Heatmap never shared (SELF-only)

**Security Notes:**
- N/A (device-only)

**Cost:** $0

**Reference:** Original spec 2.6 (Dashboard - Time Patterns)

---

### 4.6 Enhanced Dashboard - Export Reports

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

**Reference:** Original spec 2.6 (Dashboard - Historical Metrics)

---

### 4.7 HealthKit Steps (Proof-of-Concept)

**Story:** As a user, I want to auto-log my daily steps so that I don't have to manually track walking.

**Acceptance Criteria:**
- [ ] "Enable Steps Tracking" button in settings
- [ ] Clear consent screen:
  - "We'll access your steps count from Apple Health"
  - "You can disable anytime"
  - "Data stays on device, only syncs if you choose"
- [ ] Request HealthKit permission (steps only)
- [ ] If granted:
  - Create "Daily Steps" habit automatically (10k target)
  - Query HealthKit daily for steps count
  - Auto-log check-in if >= 10k steps
  - Dashboard shows steps trend
- [ ] Can disable in settings (stops querying, keeps history)

**HealthKit Setup:**
```typescript
import * as HealthKit from 'expo-health-kit';

async function enableStepsTracking() {
  const granted = await HealthKit.requestPermissions([
    { type: 'quantity', identifier: 'stepCount' }
  ]);
  
  if (granted) {
    // Query steps daily (cron job or on app open)
    const steps = await HealthKit.queryQuantity({
      identifier: 'stepCount',
      unit: 'count',
      startDate: startOfDay(),
      endDate: endOfDay()
    });
    
    if (steps >= 10000) {
      await createCheckIn(stepsHabitId, { source: 'INTEGRATION' });
    }
  }
}
```

**API Contract:**
```
POST /habits/:id/checkins
Body: { occurredAt: string, source: 'INTEGRATION', evidenceRef: 'healthkit:steps:10543' }
```

**Technical Requirements:**
- expo-health-kit or react-native-health
- Query once per day (background task or on app open)
- Store permission state in SQLite
- Can revoke anytime (deletes permission, stops querying)

**Privacy Notes:**
- Steps only (no heart rate, sleep, location)
- Explicit consent required
- User can disable anytime
- Data stays on device unless user syncs
- Clear UI: "Steps: 10,543 (from Apple Health)"

**Security Notes:**
- Never query HealthKit without permission
- Log permission grants/revokes

**Cost:** $0 (HealthKit is free)

**Reference:** spec/permissions.md#L12, original spec 2.2 (limited to steps only)

---

### 4.8 Habit Challenges

**Story:** As a user, I want to challenge friends so that we can compete and support each other.

**Acceptance Criteria:**
- [ ] "Create Challenge" button
- [ ] Challenge form:
  - Name (e.g., "30-Day Workout Challenge")
  - Habit (select from user's habits)
  - Duration (7/14/30 days)
  - Invites (select friends from circles)
- [ ] Invitees see challenge invite, can Accept/Decline
- [ ] Challenge detail shows:
  - Leaderboard (ranked by check-in count or streak)
  - Each participant's progress
  - Days remaining
  - Celebration when someone completes
- [ ] Challenge ends after duration:
  - Winner announced (most check-ins or longest streak)
  - Badge awarded to all participants (bronze/silver/gold)
- [ ] Can leave challenge anytime (no penalty)

**Challenge Types:**
- Completion: who completes most check-ins?
- Streak: who maintains longest streak?
- Together: everyone aims to complete (not competitive)

**API Contract:**
```
POST /challenges
Body: { 
  name: string, 
  habitId: string, 
  durationDays: number, 
  type: "completion" | "streak" | "together",
  inviteeIds: string[]
}
Response: { data: Challenge }

POST /challenges/:id/join
Response: { data: { message: "Joined challenge" } }
```

**Technical Requirements:**
- Challenge table: id, creatorId, name, habitId, type, startDate, endDate, createdAt
- ChallengeParticipant table: challengeId, userId, joinedAt, checkInsCount, currentStreak
- Leaderboard: device-side query (ORDER BY checkInsCount DESC)
- Update leaderboard on every check-in (background)

**Privacy Notes:**
- Challenges FRIENDS-only (must be friends to join)
- Cannot challenge PUBLIC (prevents spam)
- Leaderboard visible to participants only

**Security Notes:**
- Max 50 participants per challenge
- Rate limit: 10 challenges per user per week

**Cost:** $0

**Reference:** Original spec M3 (productive competitions), now M4

---

### 4.9 Close Friends Feature

**Story:** As a user, I want to mark certain friends as "close friends" so that I can share more privately with my inner circle.

**Acceptance Criteria:**
- [ ] Friends list shows "Mark as Close Friend" toggle
- [ ] Close friends badge (⭐) next to their name
- [ ] New privacy option: CLOSE_FRIENDS
- [ ] Privacy levels now: SELF / CLOSE_FRIENDS / FRIENDS / PUBLIC
- [ ] Posts/habits with CLOSE_FRIENDS privacy only visible to:
  - User themselves
  - Friends marked as "close friends"
- [ ] Settings: default privacy can be CLOSE_FRIENDS
- [ ] Close friends count shown in profile (optional)

**Why:** Users want an intermediate privacy level between "just me" and "all friends" (Instagram Close Friends model)

**API Contract:**
```
PATCH /friends/:friendshipId
Body: { isCloseFriend: boolean }
Response: { data: Friendship }

Privacy enum now includes: SELF | CLOSE_FRIENDS | FRIENDS | PUBLIC
```

**Technical Requirements:**
- Add isCloseFriend field to Friendship table (defaults to false)
- Update privacy enforcement:
  - CLOSE_FRIENDS checks: user is friend AND isCloseFriend = true
- Update all privacy dropdowns to include CLOSE_FRIENDS
- Update feed filtering logic

**Privacy Notes:**
- Close friends designation is private (others can't see who you marked)
- Marking/unmarking doesn't notify the friend
- One-way designation (A marks B as close, doesn't mean B marks A)

**Security Notes:**
- No limit on close friends count
- Cannot see who marked you as close friend

**Cost:** $0

**Reference:** Instagram Close Friends, simplified privacy model for M4

---

## Validation Checklist

Before moving to M5:
- [ ] Identity system works (create, link to habits, dashboard breakdown)
- [ ] Journal entries created, searched, filtered
- [ ] Mood tracking with trend visualization
- [ ] Dashboard shows correlations, heatmaps
- [ ] Reports export to PDF/CSV
- [ ] HealthKit steps tracking (proof-of-concept)
- [ ] Challenges created, joined, leaderboard updates
- [ ] Close friends feature works (mark/unmark, CLOSE_FRIENDS privacy enforced)
- [ ] Tests pass:
  - [ ] Correlation calculation
  - [ ] Heatmap generation
  - [ ] HealthKit permission handling
  - [ ] Challenge leaderboard ranking
  - [ ] Close friends privacy filtering

---

## What NOT to Build in M4

❌ NO full ML/auto-logging (steps only, manual everything else)
❌ NO calendar integration (M5)
❌ NO sentiment analysis on journal (M5)
❌ NO predictive suggestions (M5)
❌ NO more HealthKit metrics beyond steps (M5)
❌ NO direct messaging (M5+)
❌ NO monetization (M5+)

---

## Cost & Privacy Summary

**Monthly Cost (1000 users):** $0-5
- HealthKit: free
- All analytics on device: free
- PDF generation: $0 (client-side) or $5 (Lambda)

**Privacy Compliance:**
- ✅ HealthKit steps only, explicit consent
- ✅ Journal entries SELF-only by default
- ✅ Mood data never shared
- ✅ All analytics on device (no cloud compute)
- ✅ Challenges CIRCLE-only (no public leaderboards)

---

## Dependencies

**Before M4:**
- M3 complete (social features working)
- Mac day scheduled (for HealthKit integration testing)

**After M4:**
- M5 can start (more integrations, ML, monetization)

---

## Reference Documents

- Original spec sections 2.1, 2.4, 2.6 (restored in M4)
- [spec/permissions.md](spec/permissions.md#L12) - HealthKit steps approval
- [spec/startup_guide.md](spec/startup_guide.md#L133-L146) - First integrations phase
- [spec/data-model.md](spec/data-model.md) - New tables: Identity, JournalEntry, MoodEntry, Challenge
