# Milestone 5: BUILD/BREAK Habits, Stacking & Progressive Overload

**Goal:** Add BUILD/BREAK habit types, intensity tracking, habit stacking detection, progressive habits (1% rule), and HealthKit steps proof-of-concept.
**Timeline:** 3-4 weeks
**Cost Target:** $0 (device-side + HealthKit)
**Dependencies:** M4 complete (identities & analytics working)

---

## Overview

M5 extends habit tracking with BUILD (positive) vs BREAK (negative) habit types, intensity ratings for tracking habit quality, automated habit stacking detection using Atomic Habits principles, progressive overload (1% rule) for metric-based habits, and HealthKit steps integration as first automation proof-of-concept.

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

**Context-Based Triggers (Future Enhancement - M7):**

Beyond time-based stacking, habits can be triggered by environmental context:

```typescript
// Location-based triggers (with user consent)
{
  trigger: "LOCATION",
  location: "Gym",
  action: "Log workout check-in",
  privacy: "Location hash stored encrypted, never shared"
}

{
  trigger: "LOCATION",
  location: "Home",
  action: "Remind to meditate",
  timeRange: "after 6pm"
}

// Bluetooth device triggers
{
  trigger: "BLUETOOTH_CONNECT",
  device: "Car bluetooth",
  action: "Start audiobook habit",
  note: "Automatically suggest listening when in car"
}

// Other habit completion triggers
{
  trigger: "HABIT_COMPLETE",
  completedHabit: "Morning workout",
  action: "Remind to log breakfast",
  delay: "15 minutes"
}

{
  trigger: "HABIT_COMPLETE",
  completedHabit: "Finish work for day",
  action: "Suggest evening walk"
}

// App state triggers
{
  trigger: "PHONE_UNLOCK",
  condition: "before 9am",
  action: "Block social media apps (BREAK habit support)"
}
```

**Implementation Note:** Context-based triggers require additional iOS permissions and are planned for M7 (see M7-growth-hub.md). M5 focuses on time-based pattern detection only.

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
      evidenceUrl: "healthkit:steps:10543",
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
        evidenceUrl: `healthkit:steps:${steps}`,
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

### 5.6 Progressive Habits (1% Rule)

**Story:** As a user, I want my habit targets to automatically increase over time so I can gradually build more capability (progressive overload).

**Acceptance Criteria:**

- [ ] Habit creation includes "Progressive Overload" toggle
- [ ] Toggle only appears for metric-based habits (count, duration, distance, weight)
- [ ] Progressive settings:
  - Increment rate: 1%, 2%, 5%, or 10% (default 1%)
  - Allow decimal targets: yes (round to nearest 0.1) | no (round to whole number)
  - Optional max cap: stop incrementing at this value
  - Increments automatically after every completed check-in
- [ ] Dashboard shows:
  - Current target vs original target
  - Progress toward next increment
  - Visual indicator (📈 icon)
- [ ] Habit detail includes progression graph over time
- [ ] Celebration notification when target increases: "New challenge: 31 minutes! 💪"

**Example Progressive Habits:**

```typescript
// Duration-based: Exercise
{
  habit: "Morning run",
  progressiveOverload: {
    enabled: true,
    incrementRate: 0.01,  // 1% per completion
    allowDecimals: true,  // Round to nearest 0.1
    originalTarget: 30,  // Started at 30 min
    currentTarget: 33.5,  // After 10 completions: 30 * 1.01^10 ≈ 33.5
    maxTarget: 60,  // Stop at 60 min
    lastIncrementedAt: "2026-01-05"
  },
  schedule: { frequency: "daily", targetDuration: 33.5 }
}

// Count-based: Pushups
{
  habit: "Daily pushups",
  progressiveOverload: {
    enabled: true,
    incrementRate: 0.02,  // 2% per completion
    allowDecimals: false,  // Whole numbers only
    originalTarget: 10,
    currentTarget: 15,  // After ~20 completions: 10 * 1.02^20 ≈ 15
    maxTarget: null,  // No cap
  },
  schedule: { frequency: "daily", targetCount: 15 }
}

// Distance-based: Running
{
  habit: "Weekly long run",
  progressiveOverload: {
    enabled: true,
    incrementRate: 0.05,  // 5% per completion (aggressive)
    allowDecimals: true,  // Round to nearest 0.1 mile
    originalTarget: 5.0,  // Started at 5 miles
    currentTarget: 7.4,  // After 8 completions: 5 * 1.05^8 ≈ 7.4
    maxTarget: 13.1,  // Half-marathon distance
  }
}

// Weight-based: Strength training
{
  habit: "Bench press",
  progressiveOverload: {
    enabled: true,
    incrementRate: 0.025,  // 2.5% per completion
    allowDecimals: false,  // Whole pounds only (easier for gym plates)
    originalTarget: 135,  // lbs
    currentTarget: 150,  // After ~5 completions: 135 * 1.025^5 ≈ 153
    maxTarget: 225,
  }
}
```

**Dashboard Display:**

```
┌─────────────────────────────────────────┐
│  🏃 Morning run (progressive) 📈        │
├─────────────────────────────────────────┤
│  Current target: 33.5 min               │
│  Original: 30 min (+11%)                │
│                                         │
│  Next: 33.8 min (after next check-in)   │
│                                         │
│  Progress over time:                    │
│  30.0──31.2──32.4──33.5──→              │
│  W1   W4   W7   W10                     │
│                                         │
│  [View Details]                         │
└─────────────────────────────────────────┘
```

**Progression Graph:**

```
Target Over Time (Last 12 Completions)

35 min  ─────────────────────────● Goal

33 min  ──────────────────────●

30 min  ──────────────────●

27 min  ●
        │  │  │  │  │  │  │  │  │  │  │
        #1 #2 #4 #5 #7 #8 #10 #11 #12
```

**Future Projection (Dashboard Forecast):**

The dashboard will include a small forecast graph that projects the habit's future targets based on the user's chosen `incrementRate` and `incrementFrequency`. The projection uses the current target as a starting point and applies the multiplier (1 + incrementRate) for each increment period over a user-configurable horizon (e.g., 4, 12, 52 periods). The projection is presented as a dashed line extending beyond the historical target series.

Example projection display on the dashboard:

```
Target: 30.0 → 33.5 (current)

Projection (next 12 weeks):
33.5 ───┐──────────┐──────────┐─── dashed →
35.2 ───┘          \          \
37.1 ──────────────\          \
40.3 ──────────────────────────●

Legend: solid = historical targets, dashed = projected targets
```

Calculation snippet (device-side):

```typescript
function projectTargets(
  currentTarget: number,
  rate: number,
  periods: number,
  allowDecimals: boolean
) {
  const out: number[] = [];
  let t = currentTarget;
  for (let i = 1; i <= periods; i++) {
    t = t * (1 + rate);
    if (allowDecimals) {
      t = Math.round(t * 10) / 10; // Round to nearest 0.1
    } else {
      t = Math.round(t); // Round to nearest whole number
    }
    out.push(t);
  }
  return out; // array of projected targets per period
}
```

Notes:

- Projection respects `maxTarget` and stops the dashed line at the cap.
- The dashboard projection will show an optional confidence overlay based on recent completion consistency (deferred to M7 for ML-driven confidence). In M5 the confidence indicator is a simple completion-rate threshold (e.g., show as high/medium/low).

**Increment Logic:**

```typescript
// Called automatically after each successful check-in
function incrementHabitTarget(habit: Habit): number {
  const { progressiveOverload } = habit;

  if (!progressiveOverload?.enabled) {
    return habit.currentTarget;
  }

  // Calculate new target
  const multiplier = 1 + progressiveOverload.incrementRate;
  let newTarget = progressiveOverload.currentTarget * multiplier;

  // Apply rounding
  if (progressiveOverload.allowDecimals) {
    newTarget = Math.round(newTarget * 10) / 10; // Round to nearest 0.1
  } else {
    newTarget = Math.round(newTarget); // Round to nearest whole number
  }

  // Apply max cap
  if (progressiveOverload.maxTarget && newTarget > progressiveOverload.maxTarget) {
    newTarget = progressiveOverload.maxTarget;
    // Stop incrementing, achieved max
    progressiveOverload.enabled = false;
    showNotification(`🎉 Maximum target reached: ${newTarget} ${habit.unit}!`);
  } else {
    // Show celebration for normal increment
    showNotification(`New challenge: ${newTarget} ${habit.unit}! 💪`);
  }

  // Update habit
  progressiveOverload.currentTarget = newTarget;
  progressiveOverload.lastIncrementedAt = new Date().toISOString();

  return newTarget;
}

// Triggered after check-in creation
function onHabitCheckIn(habitId: string) {
  const habit = getHabit(habitId);
  if (habit.progressiveOverload?.enabled) {
    const newTarget = incrementHabitTarget(habit);
    updateHabit(habit);
  }
}
```

**Why:**

- Progressive overload is the foundation of fitness and skill development
- Auto-incrementing prevents plateau and maintains challenge
- 1% rule makes growth feel achievable (not overwhelming)
- Training module users expect this feature (standard in workout apps)

**Design Rationale:**

- **Metric-based only:** Boolean check-in habits ("Meditate daily") can't meaningfully increment
- **Opt-in per habit:** Not all habits benefit from progression (e.g., "Read before bed" vs "Run 5K")
- **Auto-increment on completion:** Simplest possible UX - just complete the habit, target increases automatically
- **Adjustable rate:** Small increments (1%) for sustainability, larger (5-10%) for aggressive training
- **Decimal choice matters:** "Run 30.3 minutes" is fine for some users, but "15.7 pushups" feels awkward; let users choose per habit
- **Max cap prevents absurdity:** Without cap, "10 pushups" becomes "1000 pushups" after 200 completions
- **Show progression graph:** Users need to see their growth trajectory to stay motivated

**Training Module Integration:**

Progressive habits are especially powerful in the Training module (M5 Growth Hub):

```typescript
// Training module workout habits auto-enable progressive overload
{
  habit: "Squat",
  module: "TRAINING",
  progressiveOverload: {
    enabled: true,  // Default ON for training
    incrementRate: 0.025,  // 2.5% per workout
    allowDecimals: false,  // Whole pounds for plates
    originalTarget: 135,
    currentTarget: 150,
  }
}
```

**Social Sharing:**

Progressive habits create natural social moments:

- "Sarah just increased her running target to 35 minutes! 🎉" (auto-post on milestone, opt-in)
- Habit detail shows progression graph (with privacy controls)
- Badge: "1% Better" (awarded after 10 increments on any progressive habit)

**Privacy Notes:**

- Progression is SELF-only by default
- User can share progression milestones (opt-in)
- Graph visibility inherits habit privacy setting

**Limitations & Future Enhancements (M7+):**

**Not included in M5:**

- ❌ ML-detected optimal increment rate (e.g., analyzing completion consistency to suggest faster/slower progression)
- ❌ Automatic deload weeks (reduce 10% every 4th week for recovery)
- ❌ Adaptive increments based on intensity ratings (if user rates workouts 2/5 consistently, slow progression)
- ❌ Comparison with similar users' progression rates
- ❌ Auto-suggest progressive overload for appropriate habits

**Example limitation:**

```typescript
// M5: User manually enables progressive overload
{
  habit: "Morning run",
  progressiveOverload: { enabled: true, ... }
}

// M7: ML suggests it after detecting consistent completion
{
  suggestion: {
    type: "ENABLE_PROGRESSIVE",
    habit: "Morning run",
    reason: "You've completed this habit 90% of days for 60 days. Ready to challenge yourself with 1% weekly increases?",
    confidence: 0.87
  }
}
```

**Cost:** $0

**Technical Requirements:**

- Habit.progressiveOverload column (JSON object)
- Device-side increment calculation (no server calls)
- Weekly cron job to check and increment eligible habits
- Notification on increment
- Progression graph component (reusable across habit types)

**Testing Checklist:**

- [ ] Progressive toggle only shown for metric-based habits
- [ ] Increment calculation accurate across all rounding rules
- [ ] Max cap prevents over-incrementing
- [ ] Graph displays progression over time
- [ ] Celebration notification appears on increment
- [ ] Training module habits default to progressive

---

### 5.7 Goal Enhancements: Weighted Habit Contributions

**Story:** As a user, I want my linked habits to contribute different weights to my goal progress.

**Acceptance Criteria:**

- [ ] Goal editing shows linked habits with weight sliders (0-100%)
- [ ] Total weights don't need to sum to 100% (each habit contributes independently)
- [ ] Goal progress calculated as weighted average of habit completion
- [ ] Example: "Run marathon" goal with habits:
  - Long run (40% weight)
  - Speed training (30% weight)
  - Recovery stretching (20% weight)
  - Nutrition tracking (10% weight)
- [ ] Goal progress updates when any linked habit is checked in
- [ ] Progress visualization shows contribution breakdown

**Example:**

```typescript
{
  goal: {
    title: "Run a marathon",
    linkedHabitWeights: {
      "habit-long-run": 0.4,
      "habit-speed-training": 0.3,
      "habit-stretching": 0.2,
      "habit-nutrition": 0.1,
    },
    currentProgress: 0.75, // weighted from habit completions
  }
}
```

**Technical Requirements:**

- Goal.linkedHabitWeights column (JSON object: {habitId: weight})
- Calculate progress: Σ(habitCompletionRate × weight) / Σ(weights)
- Device-side calculation on check-in
- Update goal progress whenever linked habit is checked in

**Why:** Not all habits contribute equally to a goal. A marathon goal benefits more from long runs than stretching.

**Privacy Notes:**

- Weights are internal calculation, not shared

**Cost:** $0

---

### 5.8 Goal Enhancements: Habit-Derived Data Source

**Story:** As a user, I want my goal progress to be automatically calculated from my habit check-ins.

**Acceptance Criteria:**

- [ ] Goal dataSource can be "HABIT_DERIVED" (in addition to MANUAL)
- [ ] When HABIT_DERIVED:
  - Goal links to one or more habits
  - Progress calculated from check-in count, duration, or value
  - No manual entry needed (read-only progress)
- [ ] Derivation formula configurable:
  - COUNT: Goal progress = number of check-ins
  - SUM: Goal progress = sum of check-in values
  - AVERAGE: Goal progress = average of check-in values
- [ ] Example: "Run 100 miles this month" derived from daily run check-ins
- [ ] Dashboard shows "Auto-updating from habits" badge

**Example:**

```typescript
{
  goal: {
    title: "Run 100 miles this month",
    goalType: "COUNT",
    metric: "miles",
    targetValue: 100,
    dataSource: "HABIT_DERIVED",
    derivationConfig: {
      habitId: "habit-morning-run",
      formula: "SUM", // sum all check-in values
      valueField: "value", // use value field from check-ins
    },
    currentValue: 67.5, // auto-calculated
  }
}
```

**Technical Requirements:**

- Goal.derivationConfig column (JSON: {habitId, formula, valueField})
- Recalculate goal progress on each linked habit check-in
- Device-side aggregation query
- Clear distinction in UI between manual and derived goals

**Why:** Reduces duplicate data entry. If user tracks "Morning run" habit with miles, goal "Run 100 miles" shouldn't require separate entry.

**Privacy Notes:**

- Derived data respects source habit's privacy level

**Cost:** $0

---

### 5.9 Habit Signals (Ribbons + Warnings)

Story:
As a user, I want clear visual signals on my habits so I can instantly see what’s going well (ribbons) and what needs attention (warnings) without reading metrics.

Overview:
Habit Signals are lightweight visual markers attached to habit icons. These attributes should linked to the habit, so it shows in the habit menu but also will be listed in its own ribbon/warning sections on the dashboard.

- Ribbons = positive achievements
- Warnings = negative or risk states
- A habit can show only ONE signal at a time (either a ribbon OR a warning)
- Signals are relative, not absolute

Visual System:

Ribbons (Positive):
[icon]
horizontal colored ribbon across icon
short label (1 word)
muted positive color

Warnings (Negative):
[icon]
small triangle or flag in bottom-right
short label (1 word)
yellow = early risk, red = confirmed issue

Acceptance Criteria:

- Habit shows either a ribbon OR a warning, never both
- Signals are computed weekly (default), optionally monthly
- Signals are relative across the user’s habits
- No numbers or percentages shown
- Tap signal opens habit insight detail
- Signals auto-update and auto-clear
- Signals respect habit privacy settings

Ribbon Set (Positive):

- Consistent
- Longest
- Completed
- Recovered
- High-Effort

Warning Set (Negative):

- Avoided
- Lapsed
- Missed
- Reset
- Low-Effort

Ribbon ↔ Warning Mapping:
Consistent ↔ Avoided
Longest ↔ Lapsed
Completed ↔ Missed
Recovered ↔ Reset
High-Effort ↔ Low-Effort

Signal Selection Logic (Device-Side):

function assignHabitSignals(habits, window) {
const stats = computeHabitStats(habits, window);

const positives = {
consistent: maxBy(stats, 'completionRate'),
longest: maxBy(stats, 'currentStreak'),
completed: maxBy(stats, 'completionCount'),
recovered: maxBy(stats, 'recoveryCount'),
highEffort: maxBy(stats, 'avgIntensity'),
};

const negatives = {
avoided: minBy(stats, 'completionRate'),
lapsed: minBy(stats, 'daysSinceLapse'),
missed: maxBy(stats, 'missCount'),
reset: maxBy(stats, 'resetCount'),
lowEffort: minBy(stats, 'avgIntensity'),
};

return resolveConflicts(positives, negatives);
}

Rules:

- Minimum data threshold required
- If difference is insignificant, no signal shown
- BREAK habits prefer recovery framing
- Warnings override ribbons when both apply

Dashboard Example:
Gym → Consistent
Reading → Longest
No Social Media → Avoided
Meditation → Lapsed

Interaction:

- Tap ribbon: “This was your most consistent habit this week”
- Tap warning: “This habit was most missed this week”
- No forced actions or shame language

Privacy:

- Signals inherit habit visibility
- No metrics exposed via signals
- Warnings never auto-posted socially

Why:
Separating ribbons (wins) from warnings (attention signals) keeps achievements meaningful, reduces shame, and makes the dashboard instantly readable.

Cost: $0

---

### 5.10 Habit Spectrum (Coupled Analytics Bar)

Story:
As a user, I want to see a simple visual spectrum on each habit page so I can understand where this habit falls between positive and negative extremes at a glance.

Overview:
The Habit Spectrum is a horizontal gradient bar shown on each habit detail page.
It visualizes a habit’s position between two coupled attributes (positive ↔ negative). When clicked, take user to the scoreboard page that shows all habits and their spectrums.

The spectrum is descriptive, not judgmental.

Visual Format:
consistent ─────●───── avoided

- Left label = positive attribute
- Right label = negative attribute
- Dot position = relative placement within window
- No numbers shown

Acceptance Criteria:

- Each habit page displays 1–3 spectrum bars
- Each spectrum uses paired opposites
- Dot position updates automatically per time window
- Labels are static and consistent across habits
- Bars are read-only (no interaction required)

Coupled Attribute Pairs:

- Consistent ↔ Avoided
- Longest ↔ Lapsed
- Completed ↔ Missed
- Recovered ↔ Reset
- High-Effort ↔ Low-Effort

Bar Behavior:

- Dot is centered when habit is neutral
- Dot shifts left as positive signal strengthens
- Dot shifts right as negative signal strengthens
- Bars animate smoothly on update

Selection Logic:

- Pairs shown depend on habit type (BUILD vs BREAK)
- Maximum of 3 bars per habit page
- Bars chosen based on strongest signals for that habit

Computation Logic:

function computeHabitSpectrum(habit, window) {
return {
consistency: normalize(habit.completionRate),
streak: normalize(habit.currentStreak),
completion: normalize(habit.completionCount),
recovery: normalize(habit.recoveryScore),
effort: normalize(habit.avgIntensity),
};
}

Normalization Rules:

- Values scaled to -1.0 → +1.0
- 0 = neutral baseline
- Negative values lean toward right-side label
- Positive values lean toward left-side label

Example Habit Page:
Habit: Morning Workout

Consistency:
consistent ─────●───── avoided

Effort:
high-effort ───●────── low-effort

Streak:
longest ───────●─── lapsed

Interaction:

- Tap bar opens explanation tooltip
- Tooltip explains what moves the dot
- No raw metrics shown

Privacy:

- Spectrum bars visible only to habit owner
- Shared views show ribbons/warnings only
- No spectrum values exposed socially

Why:
The spectrum bar conveys nuance better than binary states, helping users understand trends without numbers or shame.

Cost: $0

---

### 5.11 Spectrum Highlights (Top Signals)

Story:
As a user, I want the most important positive and negative habits for a selected spectrum to be highlighted at the top of the scoreboard so I can instantly see my best and worst habits before scanning the full list.

Overview:
Spectrum Highlights are two pinned habit cards shown at the top of a Habit Spectrum Scoreboard.

- One represents the positive extreme (ribbon habit)
- One represents the negative extreme (warning habit)

These are the same habits that receive ribbons or warnings elsewhere in the app.

Placement:

- Always pinned at the top of the Spectrum Scoreboard
- Displayed before the full sorted list
- Visually separated from the rest of the list

Visual Layout:

BEST
[icon] Morning Workout
━━ CONSISTENT ━━

NEEDS ATTENTION
[icon] No Late Scrolling
⚠️ AVOIDED

All Habits (Sorted)
[icon] Reading consistent ───●──── avoided
[icon] Journaling consistent ─────●── avoided
[icon] Meditation consistent ───────● avoided

Acceptance Criteria:

- Exactly two highlight slots shown when data exists
- Positive slot shows habit with ribbon
- Negative slot shows habit with warning
- If only one extreme exists, show only one slot
- If no clear extremes, hide highlight section entirely
- Highlights update with time window changes

Logic:

- Highlight habits are selected using the same logic as ribbons/warnings
- No additional calculations required
- Highlights are read-only and informational

Interaction:

- Tap highlighted habit → opens habit detail page
- Tap ribbon or warning → opens spectrum explanation
- No actions (no dismiss, no hide)

Privacy:

- Highlights inherit habit visibility
- Never shown in shared or social views
- No metrics or ranks exposed

Why:
Pinning the strongest positive and negative signals at the top reduces cognitive load, guides attention, and makes the scoreboard instantly useful without forcing users to interpret the full list.

Cost: $0

---

## Validation Checklist

- [ ] BUILD/BREAK habits created with different icons
- [ ] Intensity slider on check-ins (defaults to 3)
- [ ] Habit stacking detected and displayed
- [ ] HealthKit permission requested and steps tracked
- [ ] Challenges created, joined, leaderboard updates
- [ ] Habit Signals

---

## What NOT to Build

❌ NO behavioral drift detection (M6)
❌ NO Calendar/ScreenTime APIs (M7)
❌ NO ML sentiment analysis (M7)
❌ NO location triggers (M7)
❌ NO auto-suggest habits for goals (M7+)
❌ NO integration data sources for goals (M7+)

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
