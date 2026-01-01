# Milestone 6: Behavioral Drift & Social Support

**Goal:** Add behavioral pattern detection, visual analytics, social support requests, and auto-generated status updates.
**Timeline:** 3-4 weeks
**Cost Target:** $0 (device-side detection + cloud sync for processed metrics)
**Dependencies:** M5 complete (BUILD/BREAK habits & stacking working)

---

## Overview

M6 introduces behavioral drift detection (momentum loss, overconsumption, comparison spirals, etc.) with transparent visual analytics, friend support requests, and opt-in auto-generated status updates. Users see their patterns, choose to share them, and get friend support during struggles.

---

## Core Philosophy

**"Users should never feel like they're working on themselves alone"**

- Friends involved in wins AND struggles (with user consent)
- Patterns are shareable states, not shameful secrets
- Auto-posts describe state qualitatively: "I slowed down this week"
- Visual analytics show patterns to user, optionally to close friends
- Supportive presence > performance metrics

---

## Design Principles

1. **Visible, Not Hidden:** Show drift patterns transparently (no silent manipulation)
2. **Social-First:** Every pattern has social support option
3. **User Control:** All sharing requires consent (no forced auto-posts)
4. **Qualitative Sharing:** Friends see states, not metrics
5. **Ephemeral 3rd Party Data:** Query → Process → Delete → Sync aggregates only

---

## User Stories

### 6.1 Behavioral Pattern Detection

**Story:** As a user, I want to see my behavioral patterns so I can adjust my approach.

**Acceptance Criteria:**

- [ ] Dashboard "Patterns" tab shows drift states:
  - **Momentum shift:** "Logged 3 habits vs 7 last week"
  - **Overconsumption:** "Social media usage up 50% from typical"
  - **Comparison spiral:** "Feed time vs habit time imbalanced"
- [ ] Visual analytics: Line charts, week-over-week comparison
- [ ] Insight cards with actionable suggestions:
  - "Most missed: Evening workouts"
  - "What helps: Shrink to mini versions"
  - "What helps: Invite a friend to join"
- [ ] "Share with friends" button (generates qualitative post)
- [ ] "Adjust habit" button (suggests mini version)

**Example Detected Patterns:**

```typescript
[
  {
    type: "AVOIDANCE",
    detected: "2026-01-05",
    metrics: {
      completionRateCurrent: 0.43, // 43% completion this week
      completionRatePrevious: 0.86, // 86% last week
      missedCount: 4,
      mostMissedHabit: "Evening workout",
    },
    confidence: 0.82,
    insight: "You completed 43% of habits this week (down from 86%)",
    suggestions: [
      "Try mini versions: 5 push-ups instead of full workout",
      "Most missed: Evening workouts. Try morning instead?",
      "Invite a friend to join for accountability",
    ],
    suggestedPost: "I slowed down a bit this week, but working on consistency 🎯",
  },
  {
    type: "OVERCONSUMPTION",
    detected: "2026-01-06",
    metrics: {
      categoryUsage: "Social Media",
      currentMinutes: 180, // 3 hours
      typicalMinutes: 120, // 2 hours baseline
      percentIncrease: 0.5,
    },
    confidence: 0.75,
    insight: "Social media usage up 50% from your typical 2hr baseline",
    suggestions: [
      "Set app limits in Screen Time settings",
      "Replace scrolling time with a BUILD habit",
      "Share your reduction goal with close friends",
    ],
  },
  {
    type: "COMPARISON",
    detected: "2026-01-07",
    metrics: {
      feedTimeMinutes: 45,
      habitTimeMinutes: 15,
      ratio: 3.0, // 3x more feed time than habit time
    },
    insight: "You spent 3x more time viewing feed than doing habits",
    suggestions: [
      "Try 'Do first, scroll second' rule",
      "Set feed time limit: 15min after completing 1 habit",
      "Consider a digital detox day",
    ],
  },
];
```

**Pattern Detection Dashboard:**

```
┌────────────────────────────────────────┐
│  📊 Patterns This Week                  │
├────────────────────────────────────────┤
│  ⚠️ Momentum Shift                        │
│  Completed 43% of habits (down from 86%)│
│                                        │
│  Most missed: Evening workout          │
│  💡 Try morning workouts instead       │
│                                        │
│  [Share with Friends] [Adjust Habit]   │
└────────────────────────────────────────┘
```

**Generated Post Preview:**

```
Sharing with: Close Friends

"I slowed down a bit this week, but working on consistency 🎯

Most missed: evening workouts
Plan: Try morning sessions instead

Keeping it real 💪"

[Edit] [Cancel] [Share]
```

**Why:** Behavioral drift is normal but invisible without tracking. Transparent detection (no shame, just data) helps users course-correct before patterns become entrenched.

**Detection Types:**

```typescript
enum DriftType {
  AVOIDANCE = "AVOIDANCE", // Momentum loss, skipping habits
  OVERCONSUMPTION = "OVERCONSUMPTION", // Time/usage above typical
  IMBALANCE = "IMBALANCE", // Over-optimizing one pillar
  COMPARISON = "COMPARISON", // Feed engagement vs habit consistency
  VOLATILITY = "VOLATILITY", // Emotional spikes affecting patterns
  IMPULSIVITY = "IMPULSIVITY", // Unplanned breaks in routine
  DEFENSIVENESS = "DEFENSIVENESS", // Avoiding logging after slips
}
```

**Detection Algorithm (Device-Side):**

```typescript
// Runs weekly on Sunday
function detectBehavioralPatterns() {
  const thisWeek = getCheckIns(last7Days);
  const lastWeek = getCheckIns(previous7Days);

  const completionThis = thisWeek.length / expectedCheckIns;
  const completionLast = lastWeek.length / expectedCheckIns;

  if (completionThis < completionLast * 0.7 && completionThis < 0.6) {
    createDrift({
      type: "AVOIDANCE",
      metrics: {
        completionRateCurrent: completionThis,
        completionRatePrevious: completionLast,
        missedCount: expectedCheckIns - thisWeek.length,
      },
      confidence: 0.8,
      suggestedPost: "I slowed down a bit this week, but working on consistency 🎯",
    });
  }
}
```

**Privacy:**

- Drift metrics sync to cloud (processed aggregates only)
- Raw 3rd party data (ScreenTime, Location) deleted immediately after processing
- User controls who sees patterns (SELF, CLOSE_FRIENDS, FRIENDS)

**Cost:** $0 (device-side detection, cloud storage <1KB per detection)

---

### 6.2 Visual Analytics & Trend Charts

**Story:** As a user, I want to see visual representations of my patterns to understand what's changing.

**Acceptance Criteria:**

- [ ] Trend chart: Habit completion rate over time
- [ ] Annotations on chart: drift detections marked
- [ ] Comparative view: "Down 27% from peak, recovering this week 📈"
- [ ] Share button → converts chart to image for Story post
- [ ] Insight summaries in plain language

**Example Trend Visualization:**

```
Habit Completion Rate - Last 8 Weeks

  95% ●────●────●  ← Peak performance
      │         ╭───╮
  85% │         │   │
      │         │   │
  75% │        🚨   │  ← Drift detected
      │         │   │
  65% │         │   ●
      │         │    ╭──╮
  75% │         │    │  ●  ← Recovering
      │         │    │  │
  85% │         ╰────╯  ●───●
     ─┴──────────────────────────
     W1  W2  W3  W4  W5  W6  W7  W8

Insight: Down 27% from peak (W1-W3), recovering this week (+10%)
```

**Annotated Chart Data:**

```typescript
{
  chartData: [
    { week: 1, completionRate: 0.92, annotation: null },
    { week: 2, completionRate: 0.95, annotation: "Peak 🌟" },
    { week: 3, completionRate: 0.90, annotation: null },
    { week: 4, completionRate: 0.75, annotation: "Drift detected 🚨" },
    { week: 5, completionRate: 0.68, annotation: "Lowest point" },
    { week: 6, completionRate: 0.75, annotation: "Recovery started 💪" },
    { week: 7, completionRate: 0.82, annotation: null },
    { week: 8, completionRate: 0.88, annotation: "Strong comeback!" }
  ],
  summary: {
    peak: 0.95,
    low: 0.68,
    current: 0.88,
    trend: "RECOVERING",
    change: "+0.20 from low"
  }
}
```

**Shareable Story Image:**

```
┌────────────────────────────────────────┐
│                                        │
│       [Chart rendered as image]       │
│                                        │
│  "Had a rough couple weeks            │
│   (completion dropped to 68%),         │
│   but I'm getting back on track 💪"  │
│                                        │
│  Down but not out 📈                  │
│                                        │
│  Privacy: Close Friends               │
└────────────────────────────────────────┘
```

**Comparative Insights:**

```typescript
[
  {
    metric: "Completion Rate",
    peak: 95,
    current: 88,
    change: -7,
    trend: "RECOVERING",
    message: "Down 7% from peak, up 20% from low",
  },
  {
    metric: "Average Intensity",
    peak: 4.5,
    current: 3.8,
    change: -0.7,
    trend: "STABLE",
    message: "Quality down slightly, but showing up consistently",
  },
  {
    metric: "Best Pillar",
    value: "BODY",
    score: 92,
    message: "Physical habits strongest this month",
  },
];
```

**Why:** Visualizing trends makes abstract patterns concrete. Annotations provide context ("drift" vs "recovery"), removing shame and framing struggles as temporary states.

**Chart Example:**

```
Habit Completion Rate
  85% ●────●
      │     ╲
  75% │      ●
      │       ╲
  65% │        ●  ← Drift detected
      │         ╲
  55% │          ●
      │           ╱
  70% │          ●  ← Recovery started
     ─┴─────────────────
     W1  W2  W3  W4  W5
```

**Share Flow:**

1. User taps "Share" on chart
2. App generates: "Had a rough couple weeks (completion dropped), but I'm getting back on track 💪"
3. User can edit or dismiss before posting
4. Privacy defaults to CLOSE_FRIENDS

**Cost:** $0 (client-side chart rendering)

---

### 6.3 Support Requests

**Story:** As a user, I want to ask friends for support when struggling with a habit.

**Acceptance Criteria:**

- [ ] When drift detected, prompt: "Ask a friend for support?"
- [ ] User selects friend(s) who can help
- [ ] Pre-filled message (editable):
  - "I've been struggling with morning meditation. Mind nudging me if I miss it?"
- [ ] Friend receives request with [Accept] [Send encouragement] options
- [ ] If accepted:
  - Friend gets gentle prompt if user misses 2 days: "Check in with Michael?"
  - No metrics shown to friend (qualitative only)
  - Just: "Michael could use encouragement today"

**Example Support Request Flow:**

```typescript
// Step 1: User creates request
{
  from: "Michael",
  to: ["Sarah", "Jake"],
  habit: "Morning meditation",
  message: "I've been struggling with morning meditation lately. Mind nudging me if I miss a couple days? 🙏",
  privacy: "SELF",  // Request details private
  createdAt: "2026-01-05"
}

// Step 2: Sarah accepts
{
  friend: "Sarah",
  status: "ACCEPTED",
  message: "Of course! You got this 💪",
  notificationSettings: {
    nudgeAfterMisses: 2,
    maxNudgesPerWeek: 3
  }
}

// Step 3: Michael misses 2 days
// Sarah receives notification:
{
  type: "SUPPORT_NUDGE",
  title: "Michael could use encouragement",
  body: "He's been working on morning meditation. Send him a message?",
  actions: [
    { label: "Send message", action: "OPEN_CHAT" },
    { label: "React with 💙", action: "SEND_REACTION" },
    { label: "Later", action: "DISMISS" }
  ]
}

// Step 4: Sarah sends encouragement
{
  from: "Sarah",
  to: "Michael",
  message: "Hey! How's the meditation going? Want to do a session together this weekend?",
  timestamp: "2026-01-07T08:00:00Z"
}
```

**Friend's Support Dashboard:**

```
┌────────────────────────────────────────┐
│  🤝 Friends Who Could Use Support     │
├────────────────────────────────────────┤
│                                        │
│  👤 Michael                            │
│     "Working through momentum dip"     │
│     Habit: Morning meditation          │
│                                        │
│     [Send encouragement] [Message]     │
│                                        │
│  ────────────────────────────────  │
│                                        │
│  👤 Emma                              │
│     "Taking it lighter this week"      │
│     Habit: Evening workout             │
│                                        │
│     [Send encouragement] [Message]     │
└────────────────────────────────────────┘
```

**Privacy Enforcement:**

```typescript
// What friends SEE:
{
  friendName: "Michael",
  status: "Working through momentum dip",
  habit: "Morning meditation",
  actionSuggestion: "Send encouragement"
}

// What friends DON'T see:
{
  missedDays: 5,              // ❌ Hidden
  completionRate: 0.43,       // ❌ Hidden
  driftType: "AVOIDANCE",     // ❌ Hidden
  detailedMetrics: {...}      // ❌ Hidden
}
```

**Quick Encouragement Templates:**

```typescript
[
  "Hey! Thinking of you. How's it going?",
  "You got this! 💪 Want to work on it together?",
  "No pressure, just checking in ❤️",
  "Remember: showing up > perfection. You're doing great!",
  "Tough week? That's okay. Let's reset together.",
];
```

**Why:** Users struggle alone by default. Explicit support requests (with consent) turn friends into accountability partners without exposing shameful details. Qualitative language ("working through") removes judgment.

**Friend's Dashboard:**

```
┌─────────────────────────────────────┐
│  Friends Who Could Use Support      │
├─────────────────────────────────────┤
│  👤 Michael                          │
│     "Working through momentum dip"  │
│     [Send encouragement]            │
└─────────────────────────────────────┘
```

**Privacy:**

- Friends never see specific numbers (missed 5 times)
- Friends never see drift type labels (AVOIDANCE, etc.)
- Only qualitative states ("slowed down", "working through it")

**Cost:** $0

---

### 6.4 Auto-Generated Status Updates (Opt-In)

**Story:** As a user, I want to optionally share weekly pattern summaries with close friends.

**Acceptance Criteria:**

- [ ] Settings: "Share weekly patterns with close friends" (opt-in, default OFF)
- [ ] Sunday morning prompt: "Share this week's update?"
- [ ] Pre-generated post (user can edit or dismiss):
  - Templates based on drift state
  - "I slowed down a bit this week, but working on consistency 🎯"
  - "Taking it lighter this week, focusing on showing up over perfection"
  - "Missed a few days, but not giving up 💪"
- [ ] Privacy defaults to CLOSE_FRIENDS (user can adjust)
- [ ] Never posted without user consent

**Example Generated Posts:**

```typescript
// Drift type: AVOIDANCE
{
  template: "I slowed down a bit this week, but working on consistency 🎯",
  alternates: [
    "Taking it lighter this week, focusing on showing up",
    "Missed a few days, but not giving up 💪",
    "Working through a rough patch, staying committed"
  ],
  metrics: {
    completionRate: 0.43,
    previousRate: 0.86,
    mostMissed: "Evening workout"
  },
  privacy: "CLOSE_FRIENDS",
  editable: true,
  requiresConsent: true
}

// Drift type: OVERCONSUMPTION
{
  template: "I noticed I've been overdoing it—time for better balance ⚖️",
  alternates: [
    "Scaling back to sustainable levels this week",
    "Taking a step back to reset habits",
    "Focusing on quality over quantity"
  ]
}

// Drift type: COMPARISON
{
  template: "Taking a step back from the feed, focusing on my own path 🧘",
  alternates: [
    "Comparing less, appreciating progress more",
    "Eyes on my own paper this week",
    "Less scrolling, more doing"
  ]
}

// Positive momentum (RECOVERY)
{
  template: "Back on track this week! 📈 Feels good to show up consistently",
  alternates: [
    "Recovering strong—up 20% from last week 💪",
    "Bouncing back! Consistency is returning",
    "Rough patch is behind me, momentum building"
  ]
}
```

**Sunday Morning Prompt UI:**

```
┌────────────────────────────────────────┐
│  💬 Weekly Pattern Update               │
├────────────────────────────────────────┤
│                                        │
│  Based on this week's patterns, we     │
│  generated this update:                │
│                                        │
│  "🎯 I slowed down a bit this week,   │
│   but working on consistency.          │
│                                        │
│   Most missed: evening workouts        │
│   Plan: Try morning sessions instead   │
│                                        │
│   Keeping it real 💪"                  │
│                                        │
│  Share with: Close Friends             │
│                                        │
│  [Edit Post] [Share] [Not This Week]  │
└────────────────────────────────────────┘
```

**Edit Interface:**

```
┌────────────────────────────────────────┐
│  Edit Your Update                     │
├────────────────────────────────────────┤
│  [Text editor with generated content] │
│                                        │
│  Try these alternatives:              │
│  • "Taking it lighter this week"      │
│  • "Missed a few days, not giving up" │
│  • "Working through rough patch"      │
│                                        │
│  Privacy: [Close Friends ▼]          │
│                                        │
│  [Cancel] [Share]                     │
└────────────────────────────────────────┘
```

**Settings Screen:**

```
┌────────────────────────────────────────┐
│  Pattern Sharing Settings             │
├────────────────────────────────────────┤
│                                        │
│  ☐ Share weekly pattern summaries    │
│     (Opt-in, default OFF)             │
│                                        │
│  When enabled:                        │
│  • Get prompt every Sunday morning    │
│  • Preview before sharing             │
│  • Can edit or dismiss                │
│  • Defaults to Close Friends          │
│                                        │
│  🔒 Your patterns stay private unless  │
│     you explicitly share them.        │
└────────────────────────────────────────┘
```

**Why:** Auto-generated updates reduce friction for sharing struggles (users often don't know how to phrase vulnerability). Opt-in + preview ensures control. Close friends default creates safe space for honesty.

**Template Generation:**

```typescript
function generatePatternPost(driftType: DriftType): string {
  const templates = {
    AVOIDANCE: [
      "I slowed down a bit this week, but working on consistency 🎯",
      "Taking it lighter this week, focusing on showing up",
      "Missed a few days, but not giving up 💪",
    ],
    OVERCONSUMPTION: [
      "I noticed I've been overdoing it—time for better balance ⚖️",
      "Scaling back to sustainable levels this week",
    ],
    COMPARISON: [
      "Taking a step back from the feed, focusing on my own path 🧘",
      "Comparing less, appreciating progress more",
    ],
    // ... other states
  };

  return randomChoice(templates[driftType]);
}
```

**Cost:** $0

---

### 6.5 Pattern Sharing with Visuals

**Story:** As a user, I want to share my trend chart as a Story to show friends my journey.

**Acceptance Criteria:**

- [ ] "Share as Story" button on any chart
- [ ] Generates Story with:
  - Chart rendered as image
  - Caption: "Down but not out 📉→📈"
  - Badge: pattern type (momentum_shift, recovery)
  - Privacy: CLOSE_FRIENDS default
- [ ] Friends can react with supportive emojis only (🔥💪❤️)
- [ ] Friends can send nudge: "You got this!"

**Why:** Visual progress (including dips) normalizes struggle and invites support. Chart Stories become shareable proof that setbacks are temporary, not failures.

**Cost:** $0

---

### 6.6 Privacy Controls & Settings

**Story:** As a user, I want granular control over what gets shared and with whom.

**Acceptance Criteria:**

- [ ] Settings → Pattern Sharing:
  - ☑ Share weekly summaries (opt-in)
  - ☑ Allow support requests (default on)
  - ☑ Celebrate recovery publicly (default on for recovery, off for struggles)
  - Pattern visibility: SELF / CLOSE_FRIENDS / FRIENDS
  - ☐ Show drift metrics (with warning: "This shows detailed performance data that may be self-critical")
- [ ] Settings → Auto-Post Controls (every type individually toggleable):
  - ☑ Weekly pattern summaries
  - ☑ Milestone completions
  - ☑ Streak achievements
  - ☑ Badge unlocks
  - ☑ Challenge completions
  - ☑ Recovery milestones
  - ☑ New habits started
  - Each with privacy level selector (SELF/CLOSE_FRIENDS/FRIENDS/PUBLIC)
- [ ] Warning when enabling "Show drift metrics":
  - "⚠️ This setting shows detailed performance metrics including completion rates and miss counts. This data can be motivating for some, but may feel self-critical for others. You can change this anytime."

**Why:** Users have different comfort levels with vulnerability. Granular controls respect individual boundaries while defaulting to privacy-safe settings (opt-in for sensitive sharing).

**Auto-Post Settings Schema:**

```typescript
User {
  autoPostSettings: {
    weeklyPatterns: { enabled: boolean, privacy: Privacy },
    milestones: { enabled: boolean, privacy: Privacy },
    streaks: { enabled: boolean, privacy: Privacy },
    badges: { enabled: boolean, privacy: Privacy },
    challenges: { enabled: boolean, privacy: Privacy },
    recovery: { enabled: boolean, privacy: Privacy },
    newHabits: { enabled: boolean, privacy: Privacy }
  },
  driftSettings: {
    shareWeeklyPatterns: boolean,
    allowFriendSupport: boolean,
    patternVisibility: Privacy,
    showDetailedMetrics: boolean,  // Advanced, with warning
    autoShareRecovery: boolean
  }
}
```

**Defaults:**

- All auto-posts: disabled by default (opt-in)
- Support requests: enabled (social-first)
- Detailed metrics: disabled (protect users)
- Recovery celebration: enabled (positive framing)

**Cost:** $0

---

## Validation Checklist

- [ ] Behavioral patterns detected weekly
- [ ] Dashboard shows patterns with charts
- [ ] Support requests sent and received
- [ ] Auto-generated posts require user approval
- [ ] All privacy settings work correctly
- [ ] Drift metrics visible only when user enables (with warning)
- [ ] Every auto-post type can be toggled independently

---

## What NOT to Build

❌ NO Calendar integration (M7)
❌ NO ScreenTime API (M7)
❌ NO Location triggers (M7)
❌ NO ML sentiment analysis (M7)

---

## Cost & Privacy Summary

**Monthly Cost:** $0

- Detection on-device: free
- Cloud storage for aggregates: <1KB per detection

**Privacy:**

- ✅ All sharing requires consent
- ✅ Friends see qualitative states only
- ✅ Raw 3rd party data never synced
- ✅ Detailed metrics opt-in with warning

---

## Reference

- [data-model.md](../data-model.md) - BehavioralDrift table
- [architecture.md](../architecture.md#data-sync-model) - Ephemeral 3rd party data model
- [copilot-instructions.md](../../.github/copilot-instructions.md#social-first-philosophy) - Social-first philosophy
