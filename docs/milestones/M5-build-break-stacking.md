# Milestone 5: BUILD/BREAK Habits & Stacking

**Goal:** Add BUILD/BREAK habit types, intensity tracking, habit stacking detection, and HealthKit steps proof-of-concept.
**Timeline:** 3-4 weeks
**Cost Target:** $0 (device-side + HealthKit)
**Dependencies:** M4 complete (identities & analytics working)

---

## Overview

M5 extends habit tracking with BUILD (positive) vs BREAK (negative) habit types, intensity ratings for tracking habit quality, automated habit stacking detection using Atomic Habits principles, and HealthKit steps integration as first automation proof-of-concept.

---

## Design Principles

1. **Mirror BUILD & BREAK:** Both habit types get same features (stacking, intensity, strategies)
2. **Atomic Habits Integration:** Mini versions, environmental cues, habit stacking (James Clear)
3. **Device-Side ML:** Pattern detection without cloud costs
4. **Privacy-Safe Automation:** HealthKit steps only, explicit consent

---

## User Stories

### 5.1 BUILD vs BREAK Habits

**Story:** As a user, I want to track both positive habits I'm building and negative habits I'm breaking.

**Acceptance Criteria:**

- [ ] Habit creation form includes habitType selector: BUILD or BREAK
- [ ] BUILD habits: Track completion (existing behavior)
- [ ] BREAK habits: Check-in with outcome:
  - RESISTED (positive) - resisted temptation
  - LAPSED (neutral data) - gave in
  - Intensity (1-5): How strong was the temptation?
- [ ] Dashboard shows both:
  - BUILD: "7-day streak 🔥"
  - BREAK: "7 days since last lapse 🛡️" (recovery framing)
- [ ] Both support: goals, social sharing (opt-in), stacking

**Example BUILD Habits:**

```typescript
[
  { name: "Morning run", type: "BUILD", pillar: "BODY", icon: "🏃" },
  { name: "Read 30min", type: "BUILD", pillar: "MIND", icon: "📚" },
  { name: "Meditate", type: "BUILD", pillar: "SOUL", icon: "🧘" },
];
```

**Example BREAK Habits:**

```typescript
[
  {
    name: "No social media before 9am",
    type: "BREAK",
    pillar: "MIND",
    icon: "📵",
    checkIn: { outcome: "RESISTED", intensity: 4, note: "Almost checked Instagram" },
  },
  {
    name: "No late night snacking",
    type: "BREAK",
    pillar: "BODY",
    icon: "🚫🍪",
    checkIn: { outcome: "LAPSED", intensity: 2, note: "Small snack at 10pm" },
  },
  {
    name: "Quit smoking",
    type: "BREAK",
    pillar: "BODY",
    icon: "🚭",
    lastLapse: "2025-12-15",
    daysClean: 17,
  },
];
```

**Dashboard Display Examples:**

```
BUILD Habits:
🏃 Morning run          7-day streak 🔥
📚 Read 30min          5/7 this week ⭐

BREAK Habits:
🚭 Quit smoking        17 days clean 🛡️
📵 No social media     Resisted 6/7 times 💪
🚫🍪 No late snacking   3 days since last slip
```

**Why:** Users need to track both building good habits AND breaking bad ones. Recovery framing ("days clean") is more motivating than shame-based counting.

**Privacy Notes:**

- BREAK habits default to SELF privacy (more sensitive)
- Warn before sharing: "Share sensitive behaviors with close friends only?"
- Only share milestones ("7 days smoke-free!"), never lapses

**Cost:** $0

---

### 5.2 Intensity Tracking

**Story:** As a user, I want to rate habit intensity so that I can see performance patterns.

**Acceptance Criteria:**

- [ ] Check-in flow includes optional intensity slider (1-5 dots)
- [ ] Defaults to 3 if skipped (zero friction)
- [ ] Intensity semantics:
  - BUILD: How energized (1=going through motions, 5=peak flow)
  - BREAK-RESISTED: Temptation strength (1=fleeting, 5=overwhelming)
  - BREAK-LAPSED: How much you gave in (1=small slip, 5=full relapse)
- [ ] Habit detail shows trends:
  - Average intensity this week
  - Best time of day (highest avg intensity)
- [ ] Dashboard insight: "Morning workouts 40% more intense than evening"

**Example Intensity Data:**

```typescript
// BUILD habit: Morning run
[
  { date: "Mon", intensity: 5, time: "7:00am", note: "Felt amazing, PRed my 5K!" },
  { date: "Tue", intensity: 3, time: "7:15am", note: "Tired but showed up" },
  { date: "Wed", intensity: 4, time: "6:45am", note: "Good energy" },
  { date: "Thu", intensity: 2, time: "8:00pm", note: "Exhausted after work" }
]

// Analysis:
{
  avgIntensity: 3.5,
  avgMorningIntensity: 4.0,
  avgEveningIntensity: 2.0,
  insight: "Morning runs are 100% more energized than evening runs. Consider scheduling workouts before 8am."
}
```

```typescript
// BREAK habit: No social media before 9am
[
  { date: "Mon", outcome: "RESISTED", intensity: 2, note: "Easy, wasn't tempted" },
  { date: "Tue", outcome: "RESISTED", intensity: 4, note: "Really wanted to check" },
  { date: "Wed", outcome: "LAPSED", intensity: 5, note: "Couldn't resist, checked for 20min" },
  { date: "Thu", outcome: "RESISTED", intensity: 3, note: "Moderate urge" }
]

// Analysis:
{
  resistRate: 0.75, // 75% success
  avgTemptation: 3.5,
  highRiskDays: ["Wednesday"], // Highest intensity day
  insight: "Wednesdays are hardest. Try putting phone in another room on Tuesday nights."
}
```

**Visual Intensity Display:**

```
Morning Run - Last 7 Days

Intensity:
  5 ● Peak flow
  4   ●───●
  3     ● ●
  2       ●
  1
    M T W T F S S

Best time: 6-7am (avg 4.5)
Worst time: 7-9pm (avg 2.3)
```

**Why:** Not all completions are equal. A half-hearted workout vs peak performance matters for understanding patterns and optimizing timing.

**Cost:** $0

---

### 5.3 Habit Stacking & Strategy Detection

**Story:** As a user, I want the app to detect my habit patterns and suggest stacking opportunities.

**Acceptance Criteria:**

- [ ] Device-side pattern detection (runs daily):
  - Analyze check-in timestamps (30-day window)
  - Detect habits done together (within 30 min)
  - Calculate confidence score (% co-occurrence)
- [ ] Insight card:
  - "You meditate after making coffee 80% of the time"
  - [Create Trigger] [Dismiss]
- [ ] Habit detail shows:
  - Mini version: "1 push-up", "Read 1 page" (user-editable)
  - Environmental cue: "Shoes by door"
  - Best time: "You workout best at 7am (intensity: 4.5)"
  - Habit stack: "Usually done after 'Make coffee'"

**Example Detected Stacks:**

```typescript
[
  {
    trigger: "Make coffee",
    action: "Meditate 10min",
    confidence: 0.85, // 85% co-occurrence
    timeDelta: "5 minutes after",
    streak: 12, // Consecutive days following this pattern
    insight: "You meditate after making coffee 17 of the last 20 days (85%)",
  },
  {
    trigger: "Finish workout",
    action: "Journal",
    confidence: 0.73,
    timeDelta: "10 minutes after",
    insight: "You're 73% more likely to journal after workouts",
  },
  {
    trigger: "Lunch break",
    action: "15min walk",
    confidence: 0.68,
    insight: "Walking after lunch is becoming automatic (68% consistency)",
  },
];
```

**Example Mini Versions (2-Minute Rule):**

```typescript
{
  habit: "Morning workout",
  fullVersion: "Gym 45 min",
  miniVersion: "5 push-ups", // User can edit
  insight: "On busy days, doing just 5 push-ups keeps the identity of 'someone who works out'"
}

{
  habit: "Read before bed",
  fullVersion: "30 minutes",
  miniVersion: "1 page",
  insight: "Can't do 30min? Read just 1 page to maintain the streak"
}
```

**Example Environmental Cues:**

```typescript
[
  { habit: "Morning run", cue: "Running shoes by bed", success: "85% run rate when shoes visible" },
  { habit: "Read", cue: "Book on nightstand", success: "73% read rate" },
  { habit: "Meditate", cue: "Cushion in living room", success: "68% meditation rate" },
  { habit: "No phone at night", cue: "Charger in other room", success: "82% success rate" },
];
```

**Stack Insight Card UI:**

```
┌─────────────────────────────────────────┐
│  🔗 Pattern Detected                    │
├─────────────────────────────────────────┤
│  You meditate after making coffee       │
│  17 of 20 days (85%)                    │
│                                         │
│  💡 This is a strong habit stack!       │
│                                         │
│  [Save as Trigger] [Dismiss]           │
└─────────────────────────────────────────┘
```

**Why:** Habit stacking (Atomic Habits) leverages existing routines as triggers. Auto-detection reveals unconscious patterns and suggests optimization opportunities.

**Detection Algorithm:**

```typescript
// Device-side, runs daily
function detectHabitStacks() {
  const stacks = db.query(`
    SELECT c1.habitId, c2.habitId, COUNT(*) as coOccurrences
    FROM habit_checkins c1
    JOIN habit_checkins c2 
      ON c2.occurredAt BETWEEN c1.occurredAt AND c1.occurredAt + 30 MINUTES
    WHERE c1.userId = ? 
      AND c1.habitId != c2.habitId
      AND c1.occurredAt > NOW() - 30 DAYS
    GROUP BY c1.habitId, c2.habitId
    HAVING coOccurrences >= 5
  `);

  for (const stack of stacks) {
    const confidence = stack.coOccurrences / totalCheckIns;
    if (confidence >= 0.7) {
      insertHabitStack({ ...stack, relationship: "AFTER", confidence });
      showInsight(`You usually do "${habit1}" after "${habit2}"`);
    }
  }
}
```

**Cost:** $0

---

### 5.4 HealthKit Steps (Proof-of-Concept)

**Story:** As a user, I want my iPhone steps to auto-log so I don't have to manually track walking.

**Acceptance Criteria:**

- [ ] "Enable Steps Tracking" button in settings
- [ ] Clear consent screen explaining data usage
- [ ] If granted:
  - Query HealthKit daily for steps count
  - Auto-log check-in if >= 10k steps
  - Dashboard shows steps trend
- [ ] Can disable anytime (stops querying, keeps history)
- [ ] Clear UI: "Steps: 10,543 (from Apple Health)"

**Example Integration Flow:**

```typescript
// Day 1: User enables
User taps "Enable Steps Tracking"
→ Permission prompt: "Social Accountability would like to access Steps"
→ User grants permission
→ App queries today's steps: 8,432
→ No auto-check-in (below 10k threshold)
→ Dashboard shows: "Steps today: 8,432 (2k to goal)"

// Day 2: Reaches goal
Background query at 9pm: 10,543 steps
→ Auto-creates check-in for "10k steps" habit
→ Notification: "🎉 10k steps! Auto-logged for you"
→ Dashboard: "Steps: 10,543 ✅"
→ Streak: 1 day

// Day 3: User disables
User taps "Disable Steps Tracking"
→ App stops querying HealthKit
→ History preserved (2 days of data)
→ Can re-enable anytime
```

**Data Flow:**

```typescript
// What gets stored:
{
  habitId: "steps_habit_123",
  checkIns: [
    {
      date: "2026-01-01",
      source: "INTEGRATION",
      evidenceRef: "healthkit:steps:10543",
      automated: true
    }
  ]
}

// What does NOT get stored:
- Heart rate
- Sleep data
- Location
- Other HealthKit metrics
```

**Consent Screen Text:**

```
Enable Steps Tracking?

We'll check your steps once daily and auto-log when you reach 10,000.

✅ Steps count only (no heart rate, sleep, or location)
✅ Data stays on your device unless you sync
✅ You can disable anytime

Your steps will be visible according to your habit privacy settings.

[Enable Tracking] [Maybe Later]
```

**Dashboard Widget:**

```
┌──────────────────────────────────┐
│  🚶 Steps                        │
├──────────────────────────────────┤
│  Today: 10,543 ✅                │
│  7-day avg: 9,234                │
│                                  │
│  ●───●───●                       │
│  Mon Tue Wed                     │
│  8.4k 10.5k 9.1k                │
│                                  │
│  Source: Apple Health            │
│  [Settings]                      │
└──────────────────────────────────┘
```

**Why:** First automation proof-of-concept. Steps are low-friction (always tracking), privacy-safe (no sensitive data), and demonstrate value of integrations for M7 expansion.

**HealthKit Flow:**

```typescript
async function enableStepsTracking() {
  const granted = await HealthKit.requestPermissions([
    { type: "quantity", identifier: "stepCount" },
  ]);

  if (granted) {
    const steps = await HealthKit.queryQuantity({
      identifier: "stepCount",
      unit: "count",
      startDate: startOfDay(),
      endDate: endOfDay(),
    });

    if (steps >= 10000) {
      await createCheckIn(stepsHabitId, {
        source: "INTEGRATION",
        evidenceRef: `healthkit:steps:${steps}`,
      });
    }
  }
}
```

**Privacy Notes:**

- Steps only (no heart rate, sleep, location)
- Explicit consent required
- User can disable anytime
- Data stays on device unless user syncs

**Cost:** $0 (HealthKit is free)

---

### 5.5 Habit Challenges

**Story:** As a user, I want to challenge friends so we can compete and support each other.

**Acceptance Criteria:**

- [ ] "Create Challenge" button
- [ ] Challenge form:
  - Name (e.g., "30-Day Workout Challenge")
  - Habit (from user's habits)
  - Duration (7/14/30 days)
  - Type: completion / streak / together
  - Invites (select friends)
- [ ] Challenge detail shows:
  - Leaderboard (ranked by check-ins or streak)
  - Each participant's progress
  - Days remaining
  - Celebrations when someone completes
- [ ] Challenge ends: badges awarded (bronze/silver/gold)
- [ ] Can leave anytime (no penalty)

**Example Challenges:**

```typescript
[
  {
    name: "30-Day Workout Challenge",
    habit: "Morning workout",
    duration: 30,
    type: "COMPLETION", // Most check-ins wins
    participants: [
      { user: "Alice", checkIns: 28, rank: 1, badge: "GOLD" },
      { user: "Bob", checkIns: 25, rank: 2, badge: "SILVER" },
      { user: "Carol", checkIns: 22, rank: 3, badge: "BRONZE" },
    ],
    status: "COMPLETED",
  },
  {
    name: "Meditation Streak Battle",
    habit: "Daily meditation",
    duration: 14,
    type: "STREAK", // Longest streak wins
    participants: [
      { user: "David", currentStreak: 12, bestStreak: 12, rank: 1 },
      { user: "Eve", currentStreak: 8, bestStreak: 10, rank: 2 },
    ],
    daysRemaining: 2,
    status: "ACTIVE",
  },
  {
    name: "Coffee Date Challenge",
    habit: "Meet friends",
    duration: 7,
    type: "TOGETHER", // Same-day check-ins count double
    participants: [
      { user: "Frank", checkIns: 4, togetherCount: 2 },
      { user: "Grace", checkIns: 4, togetherCount: 2 },
    ],
    insight: "You met up 2 times this week! 🎉",
  },
];
```

**Leaderboard UI:**

```
┌────────────────────────────────────────┐
│  30-Day Workout Challenge              │
│  21 days remaining                     │
├────────────────────────────────────────┤
│  🥇 1. Alice        28/30 (93%) ━━━━━  │
│  🥈 2. Bob          25/30 (83%) ━━━━─  │
│  🥉 3. Carol        22/30 (73%) ━━━──  │
│     4. You          20/30 (67%) ━━━──  │
│     5. David        18/30 (60%) ━━───  │
└────────────────────────────────────────┘

[View Details] [Leave Challenge]
```

**Challenge Types Explained:**

```typescript
enum ChallengeType {
  COMPLETION = 'COMPLETION',  // Most check-ins wins (encourages consistency)
  STREAK = 'STREAK',          // Longest unbroken streak wins (encourages discipline)
  TOGETHER = 'TOGETHER'       // Same-day check-ins bonus (encourages coordination)
}

// COMPLETION scoring:
{ user: "Alice", score: 28 }  // 28 check-ins

// STREAK scoring:
{ user: "Bob", score: 14 }    // 14-day streak

// TOGETHER scoring:
{ user: "Carol", score: 10 }  // 6 solo + (2 together × 2)
```

**Badge Award Ceremony:**

```
┌────────────────────────────────────────┐
│  🎉 Challenge Complete!                │
├────────────────────────────────────────┤
│  You earned SILVER! 🥈                 │
│                                        │
│  30-Day Workout Challenge              │
│  25/30 days completed (83%)            │
│                                        │
│  Keep going! Your next challenge:      │
│  "60-Day Consistency Challenge"        │
│                                        │
│  [Share Achievement] [Start New]       │
└────────────────────────────────────────┘
```

**Why:** Social competition (positive, not shameful) dramatically increases consistency. Friends become accountability partners and celebrate progress together.

**Privacy Notes:**

- Challenges FRIENDS-only (must be friends to join)
- Leaderboard visible to participants only

**Cost:** $0

---

## Validation Checklist

- [ ] BUILD/BREAK habits created with different icons
- [ ] Intensity slider on check-ins (defaults to 3)
- [ ] Habit stacking detected and displayed
- [ ] HealthKit permission requested and steps tracked
- [ ] Challenges created, joined, leaderboard updates

---

## What NOT to Build

❌ NO behavioral drift detection (M6)
❌ NO Calendar/ScreenTime APIs (M7)
❌ NO ML sentiment analysis (M7)
❌ NO location triggers (M7)

---

## Cost & Privacy Summary

**Monthly Cost:** $0

- HealthKit: free
- All detection on-device: free

**Privacy:**

- ✅ HealthKit steps only, explicit consent
- ✅ BREAK habits default SELF-only
- ✅ Pattern detection device-only

---

## Reference

- [data-model.md](../data-model.md) - HabitType, HabitStack, CheckInOutcome
- Atomic Habits by James Clear - habit stacking, 2-minute rule
