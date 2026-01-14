# Milestone 8+: Future Expansion (Post-v1)

**Status:** Future roadmap (not in v1 scope)
**Timeline:** TBD after M1-M6 shipped and validated
**Cost Target:** TBD (may require paid tiers)

---

## Overview

M7+ features require additional permissions, ML infrastructure, or are higher risk for App Store approval. Ship M1-M6 first, gather user feedback, prove value, then expand carefully.

**What's Already in v1 (M1-M6):**

- ✅ Identity system (M4)
- ✅ Journal + mood tracking (M4)
- ✅ BUILD/BREAK habits with intensity (M5)
- ✅ Habit stacking detection (M5)
- ✅ HealthKit proof-of-concept (M5)
- ✅ Behavioral drift detection (M6)
- ✅ Visual analytics dashboard (M6)
- ✅ Social support requests (M6)

---

## User Stories

### 8.0 Plant Visual Representation

**Story:** As a user, I want a visual plant that represents my consistency score so that I can see my progress at a glance and share it with friends.

**Acceptance Criteria:**

- [ ] Plant visual displays on dashboard (home screen)
- [ ] Plant appearance maps to consistency score (0-100) with 5 stages:
  - **0-20:** Seedling (small sprout, 1-2 tiny leaves, pale green)
  - **21-40:** Sprout (short stem, 3-4 leaves, light green)
  - **41-60:** Growing (medium stem, 5-6 leaves, healthy green)
  - **61-80:** Blooming (tall stem, full leaves, small flowers, vibrant)
  - **81-100:** Thriving (large plant, lush leaves, many flowers, glowing)
- [ ] Plant animates smoothly when transitioning between stages
- [ ] Recency bonus triggers "perk" animation (leaf unfurl) after check-in
- [ ] Tap plant to see numeric score + breakdown
- [ ] Privacy settings: Share plant with FRIENDS/PUBLIC/SELF
- [ ] Friend profiles show their plant (if shared)
- [ ] Friend feed can optionally display small plant thumbnails

**Visual Cues:**

- Height increases with score
- Leaf count increases
- Color saturation increases (pale → vibrant)
- Flowers appear at 61+ score
- Glow effect at 81+ (thriving state)

**Why Plant Metaphor:**

- Growth mindset: plants grow with consistent care (like habits)
- Natural cycles: plants can wilt and recover (like users)
- Non-judgmental: "needs attention" not "you failed"
- Universal: plants transcend cultural contexts
- Visual: instantly readable state without numbers

**Implementation (Post-M4):**

```typescript
// Map score to plant stage
function getPlantStage(score: number): PlantStage {
  if (score >= 81) return 'thriving';
  if (score >= 61) return 'blooming';
  if (score >= 41) return 'growing';
  if (score >= 21) return 'sprout';
  return 'seedling';
}

// Component
<PlantDisplay
  score={user.consistencyScore}
  stage={getPlantStage(user.consistencyScore)}
  showAnimation={justCheckedIn}
  size="large" // or "small" for friend thumbnails
  onPress={() => showScoreBreakdown()}
/>
```

**Assets Needed:**

- 5 SVG files: `plant-seedling.svg`, `plant-sprout.svg`, `plant-growing.svg`, `plant-blooming.svg`, `plant-thriving.svg`
- Lottie animations: `plant-perk.json` (recency bonus), `plant-transition.json` (stage change)
- Colors: Base green `#7ED321`, thriving glow `#FFD700` (gold)

**Social Features:**

- Friend grid shows small plants (if privacy = FRIENDS or PUBLIC)
- Plant state visible but not numeric score (unless user shares explicitly)
- No plant comparisons or leaderboards (anti-competitive)
- "Send water" metaphor for encouragement when friend's plant is wilted

**Privacy Notes:**

- Plant visual privacy: Defaults to FRIENDS
- Numeric score privacy: Defaults to SELF (tap to reveal)
- Can hide plant entirely (fallback to initials/photo)
- Plant data stored locally, synced only if user opts in

**Cost:** $0 (static SVG assets + device-side rendering)

**Dependencies:** M4 (consistency score calculation must exist)

**Reference:** Brainstorming session Jan 2026 on visual character representation

---

### 8.1 Calendar Integration

**Story:** As a user, I want the app to detect my calendar events and suggest relevant habit check-ins.

**Acceptance Criteria:**

- [ ] Request EventKit permission with clear justification
- [ ] Detect gym/workout appointments → prompt workout habit check-in
- [ ] Detect meeting-heavy days → show stress awareness reminder
- [ ] Suggest habit adjustments based on schedule (busy day → mini version)
- [ ] Settings toggle: "Use calendar for suggestions" (opt-in, default OFF)
- [ ] Privacy: Only event titles/times read, never synced to server

**Example Calendar-Habit Flows:**

```typescript
// Scenario 1: Gym appointment detected
{
  calendarEvent: {
    title: "Gym - Personal Training",
    startTime: "2026-01-15T18:00:00Z",
    endTime: "2026-01-15T19:00:00Z"
  },
  matchedHabit: "Evening workout",
  suggestion: {
    type: "PRE_EVENT_REMINDER",
    time: "2026-01-15T17:45:00Z", // 15min before
    message: "Gym session in 15 minutes. Ready to log your workout?",
    actions: ["Pre-log", "Remind me after", "Dismiss"]
  }
}

// Scenario 2: Meeting-heavy day
{
  day: "2026-01-15",
  meetings: [
    { start: "09:00", end: "10:00", title: "Team standup" },
    { start: "10:30", end: "11:30", title: "Client review" },
    { start: "13:00", end: "14:30", title: "Sprint planning" },
    { start: "15:00", end: "16:00", title: "1:1 with manager" }
  ],
  meetingDensity: 0.75, // 6 hours of meetings in 8-hour workday
  suggestion: {
    type: "STRESS_AWARENESS",
    message: "Heavy meeting day ahead (6hrs of meetings). Consider:",
    recommendations: [
      "Schedule 5-min breathing breaks between meetings",
      "Use mini habit versions today (1 page reading vs 30min)",
      "Defer non-critical habits to tomorrow"
    ]
  }
}

// Scenario 3: Schedule conflict
{
  habit: "Morning meditation",
  scheduledTime: "07:00",
  conflictingEvent: {
    title: "Early flight to NYC",
    startTime: "06:00"
  },
  suggestion: {
    type: "TIME_ADJUSTMENT",
    message: "You have an early flight tomorrow. Meditate tonight instead?",
    proposedTime: "Tonight at 9pm",
    actions: ["Reschedule", "Skip this once", "Do it anyway"]
  }
}
```

**Detection Keywords:**

```typescript
const WORKOUT_KEYWORDS = [
  "gym",
  "workout",
  "fitness",
  "yoga",
  "pilates",
  "crossfit",
  "training",
  "exercise",
  "run",
  "swim",
  "cycle",
  "spin",
];

const MEAL_KEYWORDS = ["lunch", "dinner", "breakfast", "brunch", "coffee", "meal"];

const SOCIAL_KEYWORDS = ["coffee", "drinks", "dinner", "hangout", "meetup", "party"];

function detectEventType(title: string): string {
  const lower = title.toLowerCase();
  if (WORKOUT_KEYWORDS.some((k) => lower.includes(k))) return "WORKOUT";
  if (MEAL_KEYWORDS.some((k) => lower.includes(k))) return "MEAL";
  if (SOCIAL_KEYWORDS.some((k) => lower.includes(k))) return "SOCIAL";
  return "OTHER";
}
```

**Permission Request Screen:**

```
┌────────────────────────────────────────┐
│  📅 Calendar Integration               │
├────────────────────────────────────────┤
│                                        │
│  We can help you stay on track by:    │
│                                        │
│  ✅ Reminding you before gym sessions  │
│  ✅ Suggesting habit adjustments       │
│     on busy days                       │
│  ✅ Preventing schedule conflicts      │
│                                        │
│  Privacy:                              │
│  • Only event titles & times read     │
│  • Data processed on-device only      │
│  • Nothing synced to our servers      │
│  • You can disable anytime            │
│                                        │
│  [Enable Calendar Access] [No Thanks] │
└────────────────────────────────────────┘
```

**Why:** Calendar context enables intelligent habit scheduling. Suggesting mini versions on busy days prevents all-or-nothing failure. Respects time constraints users already committed to.

**Technical Requirements:**

- Use EventKit framework (iOS)
- Device-side processing only
- Pattern matching: "gym", "workout", "fitness", "yoga" keywords
- Calculate meeting density (meetings/hour) for stress detection

**Privacy Notes:**

- Calendar access requires App Store justification (clear value prop)
- Never store raw calendar data
- Only store derived flags: `hasGymAppointment: boolean`

**Cost:** $0 (device-side processing)

---

### 8.2 Screen Time API (Full Integration)

**Story:** As a user, I want detailed app usage tracking to monitor "no social media" habits beyond basic detection.

**Acceptance Criteria:**

- [ ] Request Screen Time API access (high-friction permission)
- [ ] Track per-app usage for user-defined categories
- [ ] Show productivity vs distraction breakdown
- [ ] Alert when exceeding daily limits for specific apps
- [ ] Visual timeline: "You used Instagram 45min today in 12 sessions"
- [ ] Integration with BREAK habits (verify social media limits)

**Example Usage Tracking:**

```typescript
// Daily Screen Time Report
{
  date: "2026-01-15",
  categories: [
    {
      name: "Social Media",
      totalMinutes: 127,
      apps: [
        { name: "Instagram", minutes: 45, sessions: 12, avgSession: 3.75 },
        { name: "Twitter", minutes: 38, sessions: 8, avgSession: 4.75 },
        { name: "TikTok", minutes: 44, sessions: 15, avgSession: 2.93 }
      ],
      trend: "+18% from 7-day avg",
      status: "OVER_LIMIT"
    },
    {
      name: "Productivity",
      totalMinutes: 92,
      apps: [
        { name: "Notion", minutes: 35, sessions: 4 },
        { name: "VS Code", minutes: 57, sessions: 2 }
      ],
      trend: "-12% from 7-day avg",
      status: "BELOW_TARGET"
    },
    {
      name: "Entertainment",
      totalMinutes: 68,
      apps: [
        { name: "YouTube", minutes: 52, sessions: 6 },
        { name: "Netflix", minutes: 16, sessions: 1 }
      ]
    }
  ],
  insights: [
    "Social media up 18% today (127min vs 108min avg)",
    "Instagram: 12 pickups (highest ever)",
    "Peak usage: 8-9pm (42min in 1 hour)"
  ]
}
```

**BREAK Habit Integration:**

```typescript
// User has BREAK habit: "No social media before 9am"
{
  habit: "No social media before 9am",
  type: "BREAK",
  cutoffTime: "09:00",
  verification: {
    date: "2026-01-15",
    socialMediaApps: ["Instagram", "Twitter", "TikTok"],
    firstUsageToday: "08:32", // ❌ Before 9am
    app: "Instagram",
    duration: "4 minutes",
    outcome: "LAPSED",
    autoDetected: true
  },
  notification: {
    time: "09:05",
    message: "You checked Instagram at 8:32am. Log this as a lapse?",
    actions: ["Yes, log it", "No, false positive", "Dismiss"]
  }
}

// Successful resistance
{
  habit: "No social media after 10pm",
  verification: {
    date: "2026-01-14",
    cutoffTime: "22:00",
    lastUsage: "21:47", // ✅ Before 10pm
    nextUsage: "07:15" (next day),
    outcome: "RESISTED",
    streak: 7,
    autoDetected: true
  },
  celebration: "7-day streak! You haven't used social media after 10pm all week 🎉"
}
```

**Visual Timeline:**

```
Instagram Usage - Today

       12 sessions, 45 minutes total

7am  ▂ 4m
8am  ▄ 6m  ← Before cutoff (lapse)
9am
10am ▂ 3m
11am ▄ 5m
12pm ▆ 8m
1pm
2pm  ▂ 2m
3pm
4pm  ▄ 4m
5pm
6pm
7pm  ▂ 3m
8pm  ████ 10m  ← Peak usage
```

**Alert System:**

```typescript
// Real-time usage alert
{
  trigger: "APPROACHING_LIMIT",
  category: "Social Media",
  currentUsage: 55, // minutes
  dailyLimit: 60,
  remaining: 5,
  notification: {
    title: "📱 5 minutes left",
    body: "You've used 55min of your 60min social media limit today",
    actions: ["Got it", "Extend 15min", "View breakdown"]
  }
}

// Exceeded limit
{
  trigger: "LIMIT_EXCEEDED",
  category: "Social Media",
  currentUsage: 73,
  dailyLimit: 60,
  overage: 13,
  notification: {
    title: "⚠️ Over limit",
    body: "Social media: 73min today (60min limit). Consider logging off?",
    relatedHabit: "No excessive scrolling",
    actions: ["Log as lapse", "Adjust limit", "Dismiss"]
  }
}
```

**Why:** Screen Time data enables automatic BREAK habit verification (no manual logging). Detailed breakdowns reveal true usage patterns ("I don't use social media that much" vs reality). HIGH App Store risk requires proven value first.

**Technical Requirements:**

- Use DeviceActivityMonitor API (iOS 15+)
- Store only aggregates: `appCategory: minutes`, not app-specific data
- Background monitoring with daily summary
- Respect system Screen Time limits (don't override)

**Privacy Notes:**

- HIGH App Store risk (requires strict justification)
- Never expose which specific apps user uses in shares
- Only share categories: "Social media usage up 30%"

**Security Notes:**

- Screen Time data never leaves device
- Cloud sync only receives aggregated category totals

**Cost:** $0 (device-side)

---

### 8.3 ML & Sentiment Analysis

**Story:** As a user, I want AI-powered insights from my journal entries to understand mood patterns.

**Acceptance Criteria:**

- [ ] On-device sentiment analysis of journal entries
- [ ] Mood trend visualization: "You've been stressed this week"
- [ ] Habit correlation: "Meditation days → 40% happier journal entries"
- [ ] Optimal habit timing suggestions: "You work out best at 7am"
- [ ] Anomaly detection: "Unusual pattern: 5 missed workouts after travel"
- [ ] All ML runs on-device (Core ML)

**Example Sentiment Analysis:**

```typescript
// Journal entry analysis
{
  entry: {
    date: "2026-01-15",
    title: "Great day!",
    body: "Finally hit my deadlift PR! Feeling accomplished but also tired. Need to focus on recovery tomorrow."
  },
  sentiment: {
    overall: 0.82, // Positive (0-1 scale)
    emotions: {
      joy: 0.75,
      pride: 0.85,
      fatigue: 0.45,
      determination: 0.70
    },
    keywords: ["accomplished", "great", "PR", "tired"],
    topics: ["fitness", "recovery", "achievement"]
  },
  correlations: [
    {
      habit: "Morning workout",
      completed: true,
      sentimentDelta: +0.35, // 35% more positive on workout days
      confidence: 0.78
    }
  ]
}
```

**Mood Trend Insights:**

```typescript
// Weekly mood analysis
{
  period: "2026-01-08 to 2026-01-15",
  entries: 7,
  avgSentiment: 0.68,
  trend: "STABLE",
  insights: [
    "You've been consistently positive this week (avg 6.8/10)",
    "Stress keywords appeared 3 times (down from 7 last week)",
    "Most positive day: Saturday (0.92) - workout + social time",
    "Lowest day: Monday (0.41) - mentioned 'overwhelmed' twice"
  ],
  patterns: [
    {
      trigger: "Workout days",
      effect: "+35% mood improvement",
      frequency: 5/7,
      recommendation: "Your mood is significantly better on workout days. Consider morning exercise on Mondays."
    },
    {
      trigger: "Poor sleep (<6hrs)",
      effect: "-28% mood decline",
      frequency: 2/7,
      recommendation: "Sleep quality strongly affects your mood. Prioritize 7+ hours."
    }
  ]
}
```

**Habit-Mood Correlations:**

```typescript
[
  {
    habit: "Morning meditation",
    correlation: 0.72, // Strong positive
    data: {
      daysCompleted: 18,
      avgMoodWith: 0.78,
      avgMoodWithout: 0.54,
      improvement: "+44%",
    },
    insight: "You're 44% happier on meditation days (7.8/10 vs 5.4/10)",
    suggestion: "Meditation is a keystone habit for your mood. Try increasing to daily.",
  },
  {
    habit: "No late-night snacking",
    correlation: 0.65,
    data: {
      daysResisted: 15,
      avgMoodAfter: 0.71,
      avgMoodAfterLapse: 0.48,
      improvement: "+48%",
    },
    insight: "Next-day mood is 48% better when you resist late snacking",
    suggestion: "Late snacking affects your sleep quality and morning mood.",
  },
  {
    habit: "Social time with friends",
    correlation: 0.68,
    insight: "Your mood improves by 40% on days you see friends",
    suggestion:
      "Social connection is crucial for your wellbeing. Schedule 2-3 social activities weekly.",
  },
];
```

**Optimal Timing Predictions:**

```typescript
// ML model learns user's patterns
{
  habit: "Evening workout",
  analysis: {
    timeSlotsAnalyzed: [
      { time: "06:00", successRate: 0.92, avgIntensity: 4.5, completions: 23 },
      { time: "18:00", successRate: 0.58, avgIntensity: 3.1, completions: 14 },
      { time: "20:00", successRate: 0.34, avgIntensity: 2.3, completions: 7 }
    ],
    optimalTime: "06:00",
    insight: "You're 158% more likely to complete workouts at 6am vs 6pm",
    factors: [
      "Higher intensity in mornings (4.5 vs 3.1 avg)",
      "92% completion rate (best time)",
      "Journal entries show more energy in AM"
    ],
    recommendation: "Consider switching to morning workouts for better consistency"
  }
}
```

**Anomaly Detection:**

```typescript
// Unusual pattern detection
{
  type: "BEHAVIOR_CHANGE",
  detected: "2026-01-10",
  anomaly: {
    habit: "Morning workout",
    normalCompletionRate: 0.85,
    recentCompletionRate: 0.43,
    duration: "7 days",
    deviation: "-49%"
  },
  context: [
    "Journal entries mention 'travel' 3 times",
    "Sleep avg dropped to 5.2hrs (from 7.1hrs)",
    "Mood sentiment down 23%"
  ],
  insight: "Unusual pattern: Missed 5 workouts after travel. Travel disrupts your routine.",
  suggestions: [
    "Pack workout clothes when traveling",
    "Use hotel gyms or bodyweight exercises",
    "Set mini version: 10 push-ups instead of full workout"
  ]
}
```

**Privacy-Preserving ML:**

```typescript
// All processing on-device
{
  model: "on_device_sentiment_v2",
  framework: "CoreML",
  processing: "LOCAL_ONLY",
  dataFlow: {
    journalText: "DEVICE_ONLY", // Never leaves device
    sentimentScore: "SYNCED", // Only aggregate score synced
    rawText: "NEVER_SYNCED"
  },
  privacy: [
    "✅ Journal text analyzed locally",
    "✅ Only aggregate scores synced (0.82)",
    "❌ Never: Raw text, specific keywords, personal details"
  ]
}
```

**Why:** Manual journaling + ML insights reveal hidden patterns ("meditation improves my mood 44%"). On-device processing maintains privacy while delivering personalized recommendations. No cloud ML = $0 cost.

**Technical Requirements:**

- Use NaturalLanguage framework for sentiment
- Core ML models for pattern prediction (habit success likelihood)
- Train personalized model per user (federated learning approach)
- Background processing during device charging

**Privacy Notes:**

- All ML models run on-device
- Journal text never sent to server
- Only aggregated insights synced (e.g., "positive mood: 7/10")

**Cost:** $0 (device-side), minimal battery impact

---

### 8.4 More HealthKit Metrics

**Story:** As a user, I want expanded HealthKit integration to track sleep, HRV, and nutrition habits.

**Acceptance Criteria:**

- [ ] Sleep tracking: Detect 8hr sleep goal compliance
- [ ] Heart rate variability (HRV) correlation with stress habits
- [ ] Workout type detection: Running vs strength training
- [ ] Nutrition logging integration (if user uses Apple Health)
- [ ] Dashboard widget: "Sleep 7.2hr avg this week (-0.8hr from goal)"
- [ ] Each metric requires separate permission request

**Why:** Sleep, HRV, and workout types provide objective habit verification. Users often underestimate sleep impact on performance. Nutrition integration leverages existing Apple Health logging (no duplicate entry).

**Technical Requirements:**

- Expand HealthKit query types: `HKQuantityType` for sleep/HRV
- Workout type parsing: `HKWorkoutActivityType`
- Nutrition: `HKQuantityType.dietaryEnergyConsumed` (optional)
- Aggregation: Daily/weekly averages only

**Privacy Notes:**

- Each metric needs clear use case explanation for App Store
- Raw health data never synced (only aggregates: "slept 7hrs")

**Cost:** $0

---

### 8.5 Background Location (Gym/Park)

**Story:** As a user, I want auto-check-in when I arrive at the gym or park without manual tracking.

**Acceptance Criteria:**

- [ ] Request "Always" location permission (very high friction)
- [ ] Geofence significant places: Home, gym, work, park
- [ ] Auto-suggest check-in: "You're at the gym. Log workout?"
- [ ] Walking/running route detection for outdoor exercise habits
- [ ] Battery-efficient: Use significant location changes only
- [ ] Settings: Manage geofenced locations + disable per location

**Why:** Auto-check-in based on location removes friction ("I forgot to log it"). Gym arrivals trigger workout reminders. VERY HIGH App Store risk requires bulletproof privacy justification.

**Technical Requirements:**

- Use CLLocationManager with `allowsBackgroundLocationUpdates`
- Geofencing: `CLCircularRegion` with ~100m radius
- Visit detection: `CLVisit` for gym/park arrivals
- Coordinates encrypted at rest if stored

**Privacy Notes:**

- VERY HIGH App Store risk (always-on location)
- Coordinates never synced to server
- Only sync visit boolean: `visitedGym: true` with timestamp
- Clear justification needed: "Auto-check-in at gym for workout habits"

**Security Notes:**

- Location data encrypted with user's device passcode
- No location sharing with friends (coordinates never exposed)

**Cost:** $0, but battery drain

---

### 8.6 Circle Groups (Private Groups with Feed + Chat)

**Story:** As a user, I want to create Circle groups with their own private feed and group chat, distinct from my general friends list.

**What are Circles?**

Circles are private groups (like Slack workspaces or Discord servers) where users can:

- Create multiple Circles for different contexts ("Gym Buddies", "Family", "Work Friends")
- Invite members (who must be friends) to join
- Post to a Circle-specific feed (visible only to Circle members)
- Chat with Circle members in a persistent group DM
- Receive notifications for Circle activity

**Key distinction:** Circles are NOT the same as friends. Users can have multiple Circles, and each Circle has its own private feed and chat.

**Acceptance Criteria:**

- [ ] Create/edit/delete Circles: name, description, privacy (invite-only / public)
- [ ] Assign roles: `OWNER` (creator, full admin), `MEMBER` (regular participant)
- [ ] Invite friends to Circles; members can see member list
- [ ] Circle Feed: posts scoped to `circleId` visible only to Circle members
- [ ] Circle Chat: persistent group DM with messages (`CircleMessage`) supporting text, media, pagination
- [ ] Notifications: `CIRCLE_POST`, `CIRCLE_MESSAGE`, `CIRCLE_INVITE`, `CIRCLE_MEMBER_JOINED`
- [ ] Moderation: owners can remove posts/messages, remove members, archive Circle
- [ ] User can leave Circle (owners can transfer ownership or archive)

**Why:** Users have different circles with different sharing comfort levels. Work friends see professional growth, gym buddies see fitness journey, family sees personal struggles. Circles provide dedicated spaces for each group with their own conversations and feeds, avoiding oversharing or under-sharing.

**Technical Requirements:**

**Data Model:**

- `circles` table: `id`, `ownerUserId`, `name`, `description`, `privacy` (INVITE_ONLY/PUBLIC), `createdAt`, `archivedAt`
- `circle_members` table: `circleId`, `userId`, `role` (OWNER/MEMBER), `joinedAt`
- `circle_messages` table: `id`, `circleId`, `fromUserId`, `body`, `mediaUrl`, `createdAt`, `deletedAt`
- `circle_invites` table: `id`, `circleId`, `fromUserId`, `toUserId`, `status` (PENDING/ACCEPTED/DECLINED), `createdAt`
- `posts` table: existing `circleId` field now enforced; posts with `circleId` only visible to Circle members

**API Endpoints:**

- `POST /circles` - Create Circle
- `GET /circles/:id` - Get Circle details + members
- `POST /circles/:id/invite` - Invite friend to Circle
- `POST /circles/:id/leave` - Leave Circle
- `DELETE /circles/:id/members/:userId` - Remove member (owner only)
- `GET /circles/:id/feed` - Get Circle-scoped posts (paginated)
- `GET /circles/:id/messages` - Get Circle chat messages (paginated)
- `POST /circles/:id/messages` - Send message to Circle chat
- `DELETE /circles/:id/messages/:msgId` - Delete message (owner or author)

**Privacy Enforcement:**

- Server MUST validate Circle membership before returning feed or messages
- Non-members see 403 Forbidden
- Circle coordinates or location info must respect user privacy settings
- Audit log: track post/message deletions, member removals

**UI Components:**

- Circle creation flow (name, description, privacy)
- Circle member management screen (invite, remove, transfer ownership)
- Circle Feed screen (posts scoped to Circle)
- Circle Chat screen (group DM with real-time updates)
- Circle list view (user's Circles)

**Future Enhancements (M9+):**

- Read receipts and typing indicators in Circle chat
- Threaded replies in Circle chat
- Message reactions and pinned messages
- Circle events and shared goals
- Polls and scheduling tools
- Cross-Circle mentions
- Circle discovery (public Circles)

**Privacy Notes:**

- Circle members can see each other and the member list
- Circle names and descriptions visible to members only (unless public)
- Friends can see which Circles you're in together (shared Circles)
- Non-members cannot see Circle content

**Cost:** $0 (server storage and bandwidth for messages; monitor usage)

---

### 8.7 Monetization

**Story:** As a user, I want access to premium features like advanced analytics while keeping the core app free.

**Acceptance Criteria:**

- [ ] Free tier: All M1-M6 features fully functional
- [ ] Premium tier ($2.99/month):
  - Advanced analytics (trend predictions, correlations)
  - Export data (CSV/JSON)
  - Priority support
  - Early access to M7+ features
- [ ] Implement in-app purchases (RevenueCat SDK)
- [ ] Upgrade CTA: Non-intrusive banner in settings
- [ ] Trial: 14-day free trial of premium

**Why:** Free tier ensures accessibility. Premium tier funds development without ads/data-selling. Early access model rewards supporters. RevenueCat handles subscription complexity (cross-platform, restoration, etc.).

**Technical Requirements:**

- RevenueCat SDK integration
- Entitlements: `premium` boolean flag synced to Postgres
- Feature gates: Check `user.isPremium` before showing premium UI
- Restore purchases: Handle account recovery

**Privacy Notes:**

- Subscription status synced to server (required for feature access)
- Payment processed by Apple (we don't see credit cards)

**Cost:** RevenueCat free tier (<$2500/month revenue), then 1% of revenue

---

### 8.8 Content Moderation

**Story:** As a platform, we need automated and manual moderation to keep the community safe.

**Acceptance Criteria:**

- [ ] AI-based content detection: Hate speech, spam, explicit content
- [ ] User reporting: "Report post" button (abuse, spam, inappropriate)
- [ ] Moderator dashboard: Review flagged content
- [ ] Auto-actions: Hide posts with high confidence violations
- [ ] Appeal process: Users can contest removals
- [ ] Transparency: Moderation log visible to affected user

**Why:** Scaled communities need moderation. AI filters obvious violations (hate speech, spam). Human moderators handle edge cases. Transparency reduces false positive frustration. Essential for App Store compliance.

**Technical Requirements:**

- OpenAI Moderation API for text analysis
- Image moderation: AWS Rekognition or Sightengine
- Queue system: Flagged content → moderator review
- Admin panel: Built with React Admin + Postgres queries
- Action types: Hide, warn user, suspend account (escalation)

**Privacy Notes:**

- Reported content shared with moderators (humans review)
- Reporter identity hidden from reported user

**Security Notes:**

- Rate limiting on reports (prevent abuse)
- Moderator actions logged for accountability

**Cost:** $10-50/month (OpenAI Moderation API + image scanning)

---

### 8.9 Direct Messaging

**Story:** As a user, I want to send private messages to friends for sensitive habit support conversations.

**Acceptance Criteria:**

- [ ] 1:1 chat with any friend (must be mutual friends)
- [ ] Message types: Text, emoji reactions, habit links
- [ ] Read receipts (optional, toggleable)
- [ ] Typing indicators
- [ ] E2E encryption (if technically feasible)
- [ ] Block/report: Prevent DM spam

**Why:** Public posts don't work for vulnerable conversations ("I relapsed", "struggling with depression"). DMs enable private support. E2E encryption builds trust. HIGH abuse risk (spam, harassment) requires careful design.

**Technical Requirements:**

- Real-time messaging: Supabase Realtime or Postgres LISTEN/NOTIFY
- Schema: `messages` table (senderId, receiverId, content, timestamp)
- Encryption: libsodium for message content (E2E if possible)
- Delivery: WebSocket connection, fallback to polling

**Privacy Notes:**

- Messages encrypted at rest
- E2E encryption ideal (decrypt only on recipient device)
- Deleted messages: Hard delete after 30 days (GDPR compliance)

**Security Notes:**

- HIGH abuse risk (spam, harassment)
- Rate limiting: 100 messages/day to prevent spam
- Require mutual friendship to initiate DM

**Cost:** $0 (Supabase Realtime included in free tier <500 concurrent)

---

### 8.10 Suggestion Engine

**Story:** As a user, I want smart suggestions based on my habit patterns to stay on track.

**Acceptance Criteria:**

- [ ] Time-based: "You usually work out after breakfast. Try it today?"
- [ ] Miss detection: "You've missed meditation 3 days. Restart with 5 minutes?"
- [ ] Success patterns: "You're most consistent on Mondays. Schedule habits then."
- [ ] Stacking suggestions: "You always journal after morning coffee. Add gratitude?"
- [ ] Dismiss/snooze: User can ignore suggestions
- [ ] Settings: Disable suggestion types individually

**Why:** Rules-based suggestions (no ML) leverage existing patterns. "You usually X after Y" feels helpful, not creepy. Dismissable ensures user control. Prepares groundwork for ML-powered recommendations (M8+).

**Technical Requirements:**

- Device-side rules engine (no ML needed initially)
- Patterns: Time-of-day analysis, day-of-week success rates
- Trigger: Check daily at 6am, 12pm, 6pm for relevant suggestions
- Notification: Local push notification with suggestion text

**Privacy Notes:**

- All analysis on-device (no server-side profiling)
- Suggestions never imply surveillance ("We noticed..." → "You might try...")

**Cost:** $0 (device-side logic)

---

---

### 8.4 External Social Media Feed

**Story:** As a user, I want to include selected external social media posts (Instagram, Twitter/X, YouTube, etc.) in my social feed to provide motivational content from accounts I follow.

**Acceptance Criteria:**

- [ ] Users can connect selected external accounts (Instagram, X, YouTube, etc.) in Growth Hub → Connected Accounts
- [ ] For an external account to show posts in the user's feed, it must receive approvals from at least **3 accepted friends** in the user's circle (explicit approvals UI)
- [ ] Approved external posts appear in the user's own feed as a special card type (attribution + link to original post), and can be reshared according to user's privacy settings
- [ ] Users can revoke account access or withdraw an account from the feed at any time
- [ ] The feature is opt-in and disabled by default; users must enable External Feed in Settings

**Approval Flow (3-friend rule):**

1. User connects an external account (OAuth) and marks it "Suggested For Circle".
2. App sends approval requests to user's circle (only to accepted friends) with a simple approve/deny CTA.
3. Once the user receives **3 approvals**, the account becomes "Active for Feed" and recent public posts are eligible to appear.
4. Approvals are stored as ephemeral approvals records; a user may remove approvals anytime which will deactivate the feed until approvals are regained.

**Signals & Eligibility:**

- Only public posts (and posts the account owner has explicitly allowed) are considered.
- Posts are fetched and displayed as links/embeds (we do not store full media content unless user chooses to save a copy)
- Exclude any posts that the user or their circle has marked as sensitive or blocked

**UI Placement & Behavior:**

- Approved external posts appear as a distinct card in the social feed with clear attribution (source platform, account name) and a timestamp
- Card actions: Open Original, Save to Growth Hub (optional), Share (respecting privacy), Dismiss
- Dismissed posts are suppressed locally and optionally report back (opt-in) for improved recommendations

**Technical Requirements & Risk:**

- OAuth plumbing for each provider (Instagram Basic Display, Twitter/X API, YouTube Data API) in `module_accounts` or `external_accounts` table
- Server-side polling or webhook ingestion for connected accounts (M8+ background jobs) — initial MVP may only support manual pull ("Fetch latest")
- Store only references: `externalPostId`, `platform`, `url`, `title`, `timestamp`, `snippet`
- Moderate rate limits per provider; comply with each platform's terms (no scraping)
- App Store risk: embedding external content increases review scrutiny — include strong privacy justification and opt-in flow

**Privacy & Safety:**

- External feed is opt-in and OFF by default
- Do not show external posts from accounts that would reveal sensitive personal data about the user or their friends
- Approval requests are private: only invited approvers see them; approval choices are not public
- Provide clear UI explaining what approval means (consent to surface posts from this account in your feed)

**Edge Cases & Moderation:**

- If an account posts something NSFW or disallowed, the user or any approver can flag it; flagged posts are hidden and optionally forwarded to moderation pipeline (if enabled)
- If platform revokes access or tokens expire, mark account as "Disconnected" and notify the user

**API Contract (examples):**

```
POST /external-accounts
Body: { provider: 'instagram' | 'x' | 'youtube', providerAccountId, accessToken }
Response: { data: ExternalAccount }

POST /external-accounts/:id/approve
Body: { approverUserId }
Response: { data: { approvalsCount, status } }

GET /external-feed?userId=me&limit=20
Response: { data: [ { platform, externalPostId, url, snippet, timestamp, originAccount } ] }
```

**Future Enhancements (M9+):**

- Webhook-driven real-time ingestion for low-latency display
- On-device filtering and sentiment scoring of external posts before display
- Smart curation: suggest accounts that historically motivate the user's circle (opt-in)

**Why:** Provides lightweight motivational content while preserving privacy and consent through a friend-approval safeguard. Enables users to augment their social feed with curated external inspiration without exposing private activity.

---

### 8.5 AI-Powered Habit Join Suggestions

**Story:** As a user, I want the app to suggest habits I should join based on my interests, friends' habits, and success patterns.

**Acceptance Criteria:**

- [ ] "Suggested Habits to Join" section appears in Habits tab (below user's habits)
- [ ] Suggestions show:
  - Friend's habit name + description
  - Friend's name/avatar
  - Match signals: "Sarah has similar goals (Fitness, Mind)" or "3 mutual friends in this habit"
  - Success indicators: "Sarah: 45-day streak 🔥"
- [ ] Tap suggestion opens habit preview with join request button
- [ ] User can dismiss suggestions (suppressed for 30 days)
- [ ] Suggestions refresh daily or when user's habits/identities change
- [ ] Feature is opt-in and disabled by default in Settings → Social → "Show Habit Suggestions"

**Matching Signals (ML-powered):**

1. **Shared Identities:** User and friend have same identity (Athlete, Student, etc.)
2. **Shared Pillars:** User focuses on same pillar (BODY, MIND, etc.)
3. **Complementary Habits:** User's existing habits suggest interest (e.g., "Running" + friend's "Marathon Training")
4. **Mutual Participants:** Multiple mutual friends already in the habit
5. **Success Pattern:** Friend has strong streak/completion rate (social proof)
6. **Similar Check-in Times:** User and friend active at similar times of day

**Scoring Algorithm:**

```typescript
function calculateHabitJoinScore(user: User, habit: Habit, habitOwner: User) {
  let score = 0;

  // Identity match (highest weight)
  const sharedIdentities = intersection(user.identities, habitOwner.identities);
  score += sharedIdentities.length * 10;

  // Pillar match
  if (user.activePillars.includes(habit.pillar)) {
    score += 5;
  }

  // Complementary habits (semantic similarity via embeddings)
  const userHabitNames = user.habits.map((h) => h.name);
  const similarity = cosineSimilarity(embed(habit.name), embed(userHabitNames));
  score += similarity * 8;

  // Mutual participants
  const mutualParticipants = intersection(
    user.friends,
    habit.participants.map((p) => p.userId)
  );
  score += mutualParticipants.length * 3;

  // Success pattern (social proof)
  const ownerStreak = habitOwner.streaks[habit.id] || 0;
  if (ownerStreak >= 30) score += 5;
  else if (ownerStreak >= 14) score += 3;
  else if (ownerStreak >= 7) score += 1;

  // Time compatibility
  const userActiveHours = getUserActiveHours(user);
  const habitActiveHours = getHabitActiveHours(habit);
  const timeOverlap = intersection(userActiveHours, habitActiveHours).length;
  score += timeOverlap * 0.5;

  return score;
}

// Threshold: show suggestions with score >= 15
```

**Example Suggestions:**

```
Suggested Habits to Join

┌────────────────────────────────────┐
│ Sarah's "Morning Meditation" 🧘    │
├────────────────────────────────────┤
│ Match: You both have "Student"     │
│        identity and focus on MIND  │
│ Sarah: 45-day streak 🔥            │
│ Also joined by: Mike, Lisa (mutual)│
│                                    │
│ [View Habit] [Dismiss]             │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ Mike's "Weekend Long Runs" 🏃      │
├────────────────────────────────────┤
│ Match: Similar to your "5K         │
│        Training" habit             │
│ Mike: 12-day streak                │
│ 4 mutual friends in this habit     │
│                                    │
│ [View Habit] [Dismiss]             │
└────────────────────────────────────┘
```

**Habit Preview Screen:**

```
Mike's "Weekend Long Runs" 🏃

Description:
"Long slow runs every Saturday morning.
Join me for accountability!"

Frequency: Weekly (Saturdays)
Pillar: BODY
Privacy: FRIENDS

Participants (5):
  Mike (owner) - 12-day streak 🔥
  Alex - 8-day streak
  Jordan - 5-day streak
  + 2 mutual friends

Recent Activity:
  Last Saturday: 5/5 completed
  This month: 18 total check-ins

Why suggested:
✓ Similar to your "5K Training" habit
✓ 4 mutual friends already joined
✓ Mike has consistent 12-day streak

[Request to Join] [Dismiss] [Not Interested]
```

**Privacy & Consent:**

- Suggestions based only on FRIENDS/PUBLIC habits (respect privacy)
- User must opt-in to "Show Habit Suggestions" feature
- Dismissed suggestions not shown again for 30 days
- "Not Interested" permanently hides that habit type (user can undo in settings)
- Suggestions never reveal private habits or identities without permission

**Technical Requirements:**

- Server-side ML model using habit embeddings (OpenAI Ada or on-device Core ML)
- Batch compute suggestions daily (cron job: 6am user's local time)
- Cache suggestions per user for 24 hours
- Store dismissed suggestions: userId, habitId, dismissedAt, reason
- Semantic similarity via sentence transformers (e.g., all-MiniLM-L6-v2)

**API Contract:**

```
GET /habit-suggestions?userId=me&limit=10
Response: {
  data: Array<{
    habit: Habit,
    owner: User,
    score: number,
    signals: {
      sharedIdentities: string[],
      mutualParticipants: number,
      similarity: number,
      ownerStreak: number
    },
    reason: string // Human-readable: "Similar to your 5K Training"
  }>
}

POST /habit-suggestions/:id/dismiss
Body: { reason?: 'NOT_INTERESTED' | 'ALREADY_DOING' | 'NOT_NOW' }
Response: { success: true }
```

**Cost:**

- OpenAI embeddings: $0.0001 per 1K tokens (~$1/month for 1000 users, 10 habits each)
- Or Core ML on-device (free, but limited model)
- Compute: $5/month for daily batch job (Lambda)
- Total: **$5-10/month**

**Future Enhancements (M9+):**

- Reinforcement learning: track which suggestions user accepts → improve model
- Temporal patterns: suggest habits when user is most likely to commit (Mondays, New Year)
- Collaborative filtering: "Users like you also joined..."
- Habit creation suggestions: "No meditation habit yet? 5 friends meditate daily"

**Why:** Reduces friction in finding accountability partners. Users discover habits they wouldn't find manually. Social proof (friends' streaks) increases join likelihood. Semantic similarity ensures relevant suggestions.

---

### 8.11 Designated Accountability Partner

**Story:** As a user, I want to designate one trusted friend as my "accountability partner" who gets deeper access to my progress and struggles.

**Acceptance Criteria:**

- [ ] Settings → Privacy → "Accountability Partner" section
- [ ] User can select one friend from their circle as accountability partner
- [ ] Partner receives special access permissions:
  - View ALL habits (including SELF privacy habits)
  - View detailed analytics and trend breakdowns
  - View journal entries (if user enables)
  - See real-time struggle signals (missed streaks, behavioral drift)
  - Receive alerts when user is slipping ("Sarah missed meditation 3 days in a row")
- [ ] Partnership requires mutual acceptance (partner must accept role)
- [ ] User can revoke partnership anytime (immediate access removal)
- [ ] Partner badge: Special indicator in friend list ("Your Accountability Partner 🤝")
- [ ] Settings granular controls: User can toggle specific permissions (habits, journal, analytics)

**Permission Levels:**

```typescript
type AccountabilityPartnerPermissions = {
  viewSelfHabits: boolean; // See private (SELF) habits
  viewJournal: boolean; // Read journal entries
  viewDetailedAnalytics: boolean; // Consistency score breakdowns, trends
  receiveStrugggleAlerts: boolean; // "User missed X 3 days in a row"
  viewCheckInHistory: boolean; // See full check-in timeline
  viewIdentities: boolean; // See all identities (even private ones)
};

// Default: All true when user designates partner
// User can granularly disable any permission
```

**Acceptance Flow:**

```
User → Selects Friend → "Invite as Accountability Partner"
        ↓
Friend receives invitation: "Sarah wants you as her accountability partner.
You'll have deeper access to her progress. Accept?"
        ↓
[Accept] [Decline] [Learn More]
        ↓
Partnership active ✅

Settings → Accountability Partner
  Current Partner: Mike Johnson 🤝

  Permissions:
  ✅ View my private habits
  ✅ View my journal
  ✅ View detailed analytics
  ✅ Receive struggle alerts
  ✅ View check-in history
  ❌ View my private identities (disabled)

  [Revoke Partnership] [Adjust Permissions]
```

**Partner Dashboard (What Partner Sees):**

```
Sarah's Progress (Accountability Partner View)

Overview:
  Consistency Score: 78/100 (↓ -5 from last week)
  Active Habits: 7
  Current Streaks: 2 active, 1 broken this week ⚠️

Recent Struggles:
  ⚠️ Morning meditation: Missed 3 days in a row
  ⚠️ Consistency score dropped 5 points this week
  ℹ️ Sleep avg: 6.2hrs (down from 7.1hrs usual)

Habits (including private):
  ✅ Morning meditation (SELF) - 0-day streak ❌
  ✅ Evening workout (FRIENDS) - 12-day streak 🔥
  ✅ No late-night snacking (SELF) - 8-day streak
  ...

Journal (if enabled):
  Jan 14: "Feeling overwhelmed with work deadlines..."
  Jan 12: "Skipped meditation again. Need to reset routine."

Suggested Support:
  💬 "Sarah's meditation streak broke. Send encouragement?"
  🔔 "Consistency score down. Check in on Sarah?"
```

**Use Cases:**

1. **Spouse/Partner:** Wife sees husband's smoking cessation progress, offers support when he's struggling
2. **Best Friend:** College roommate tracks each other's study habits and mental health check-ins
3. **Parent/Teen:** Parent monitors teen's screen time and sleep habits (with teen's consent)
4. **Trainer/Client:** Personal trainer sees client's workout and nutrition habits in detail
5. **Therapist/Patient:** Therapist (if friended) sees patient's mood journal and coping habit adherence

**Why Designated (Single) Partner:**

- **Trust Level:** Only 1 person gets deepest access (spouse, best friend level)
- **Intimacy:** Prevents oversharing with entire friend circle
- **Accountability:** Most effective with one trusted person vs diffuse group
- **Focus:** Partner can meaningfully engage vs casual friends who skim feed

**Privacy Safeguards:**

- User must explicitly invite and partner must accept
- Granular permission toggles (not all-or-nothing)
- Instant revoke (no delay, immediate access removal)
- Audit log: User can see what partner viewed (optional transparency)
- Partner can't share user's data further (enforced by app, not exportable)

**Technical Requirements:**

- New table: `accountability_partnerships` (userId, partnerId, status: 'PENDING' | 'ACTIVE', permissions: JSON, createdAt)
- Authorization: Check partnership + permissions before serving data
- Notifications: Real-time alerts to partner when user struggles (configurable frequency)
- Revoke: Cascade delete access, clear partner-specific cached data

**API Contract:**

```
POST /accountability-partner/invite
Body: { partnerId: string, permissions: AccountabilityPartnerPermissions }
Response: { data: Partnership }

POST /accountability-partner/accept
Body: { partnershipId: string }
Response: { data: Partnership }

PATCH /accountability-partner/permissions
Body: { permissions: Partial<AccountabilityPartnerPermissions> }
Response: { data: Partnership }

DELETE /accountability-partner
Response: { success: true }

GET /accountability-partner/dashboard?forUserId=:id
Response: {
  data: {
    consistencyScore, habits, recentStruggles, journalEntries?, analytics
  }
}
```

**Edge Cases:**

- User unfriends partner → Partnership auto-revoked
- Partner deletes account → Partnership removed, user notified
- User switches partner → Old partner immediately loses access, new invited
- Both users are each other's partners → Mutual accountability (allowed)

**Cost:** $0 (server-side authorization logic only)

**Dependencies:** M4 (journal), M6 (consistency score, behavioral drift)

**Future Enhancements (M9+):**

- Multiple accountability partners (2-3 max) with role-based permissions
- Partner coaching prompts: "Sarah missed meditation. Suggested message: 'Hey, want to meditate together tomorrow morning?'"
- Shared habit goals: Partner and user work on habit together with combined streak

**Why:** Deepest level of accountability requires trust with ONE person. Spouse, best friend, or close confidant can provide meaningful support vs superficial friend circle. Opt-in model respects privacy while enabling vulnerable sharing for users who want it.

---

### 8.X Goal Enhancements: Auto-Suggest Habits

**Story:** As a user, I want the app to suggest habits that will help me achieve my goal.

**Acceptance Criteria:**

- [ ] When creating a goal, "Suggest habits" button appears
- [ ] System analyzes goal type, metric, and target to suggest habits:
  - Weight loss goal → "Daily walk", "Log meals", "Drink water"
  - Reading goal → "Read 30 min", "Visit library weekly"
  - Savings goal → "Track expenses", "Skip daily coffee"
- [ ] Suggestions are curated templates (not ML-generated initially)
- [ ] User can:
  - Accept suggestion (creates habit linked to goal)
  - Customize suggestion (edit before creating)
  - Dismiss suggestion
- [ ] Suggestions improve over time based on:
  - User's successful habits
  - Community popular habits for similar goals
  - ML recommendations (future)
- [ ] Can toggle off suggestions in settings

**Example:**

```typescript
{
  goal: {
    title: "Lose 20 lbs",
    goalType: "WEIGHT",
    metric: "lbs",
  },
  suggestedHabits: [
    {
      template: "Daily walk",
      icon: "🚶",
      pillar: "BODY",
      frequency: { type: "DAILY" },
      reason: "Walking burns calories and builds consistency",
    },
    {
      template: "Log meals",
      icon: "📝",
      pillar: "BODY",
      frequency: { type: "DAILY" },
      reason: "Tracking food increases awareness of eating habits",
    },
    {
      template: "Drink 8 glasses of water",
      icon: "💧",
      pillar: "BODY",
      frequency: { type: "DAILY" },
      reason: "Hydration aids metabolism and reduces hunger",
    },
  ],
}
```

**Technical Requirements:**

- Curated template database (50-100 templates per goal type)
- Template matching: goalType + metric → relevant templates
- Device-side template search (no API calls)
- Track acceptance rates for template refinement
- ML ranking (M8+): Personalized suggestions based on user history

**Why:** Users often know their goal but not the daily actions to achieve it. Suggestions bridge the gap between "I want to lose weight" and "What should I do every day?"

**Privacy Notes:**

- Templates are public (no user data in suggestions)
- Acceptance data can be anonymized for template ranking

**Cost:** $0 (device-side template matching)

**Dependencies:** M5 (linked habits), M6 (behavioral patterns for ML ranking)

---

### 8.X Goal Enhancements: Integration Data Sources

**Story:** As a user, I want my goal progress to update automatically from connected apps (HealthKit, banking, etc.).

**Acceptance Criteria:**

- [ ] Goal dataSource can be "INTEGRATION"
- [ ] Supported integrations:
  - HealthKit: steps, weight, calories, workouts
  - ScreenTime API: app usage limits
  - Banking APIs (future): spending tracking
  - Calendar API (future): time allocation
- [ ] Integration config specifies:
  - Source (e.g., "healthkit.weight")
  - Aggregation (LATEST, SUM, AVERAGE)
  - Time range (daily, weekly, monthly)
- [ ] Goal progress auto-updates on app launch
- [ ] Manual override available ("Update now" button)
- [ ] Clear consent flow: "This goal will read data from HealthKit"
- [ ] Can disconnect integration without deleting goal

**Example:**

```typescript
{
  goal: {
    title: "Lose 20 lbs",
    goalType: "WEIGHT",
    metric: "lbs",
    startValue: 180,
    targetValue: 160,
    dataSource: "INTEGRATION",
    integrationConfig: {
      source: "healthkit.bodyMass",
      aggregation: "LATEST",
      unit: "lb",
    },
    currentValue: 172, // auto-populated from HealthKit
  },
  permissions: {
    healthKit: ["bodyMass"], // required permission
  },
}
```

**Technical Requirements:**

- Integration registry: Define supported sources with schemas
- Permission mapping: Each source → required iOS/API permissions
- Consent UI: Clear explanation of data access per integration
- Retry logic: Handle API failures gracefully
- Caching: Don't poll APIs excessively (rate limits)
- See [M501-integrations-expansion.md](M501-integrations-expansion.md) for integration architecture

**Supported Sources (Priority Order):**

1. **HealthKit** (M7 proof-of-concept in M5)
   - Steps, weight, workouts, sleep, calories
2. **ScreenTime** (M7)
   - App usage, category limits
3. **Banking** (M8+)
   - Plaid integration for spending goals
4. **Calendar** (M8+)
   - Time allocation, meeting counts

**Why:** Automation is the app's core value proposition. Users shouldn't manually enter data that already exists in their devices.

**Privacy Notes:**

- Explicit consent per integration
- Data processed locally (not synced to cloud)
- Can revoke access anytime
- Clear data audit: "What does this goal access?"

**Cost:** $0 (device-side APIs) or $0.01/user/month (Plaid banking - future)

**Dependencies:** M5 (HealthKit POC), M7 (full sensor integration)

---

## Guiding Principles for M7+

1. **Ship M1-M6 first, validate product-market fit**
2. **One permission at a time** (prove safety per [startup_guide.md](startup_guide.md))
3. **Always device-first** (keep costs low)
4. **User control** (can disable any feature)
5. **Privacy-forward** (never surprise users)

---

## Reference

- [spec/permissions.md](permissions.md#L17-L19) - M7+ sources marked "not allowed / risky"
- [spec/startup_guide.md](startup_guide.md#L148-L157) - High-friction sources (post-approval)
- [spec/high_level.md](high_level.md#L174-L256) - Original ML vision (deferred)
