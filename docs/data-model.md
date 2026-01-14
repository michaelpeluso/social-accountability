---
purpose: Complete database schema for all milestones
topics: SQLite tables, relationships, privacy enforcement, hierarchy
dependencies: architecture.md
---

# Data Model

**Complete schema with milestone markers**

---

## For v1 Implementation (M1-M3 ONLY)

**Build these tables first:**

- User, Friendship (M1)
- Identity (M2 - early onboarding)
- Goal (M2/M3 - quantitative targets)
- Habit, HabitCheckIn (M2)
- Post, Story, Comment, Reaction, Nudge (M3)

**Skip until M4:**

- HabitStack (habit stacking detection)
- Tag (rich metadata), BadgeEarned, JournalEntry, MoodEntry, Challenge
- Habit/Goal suggestions from Identity
- Intensity and outcome tracking in HabitCheckIn
- Atomic Habits strategy fields in Habit

**Skip until M5+:**

- HabitTrigger, Tag suggestions, Goal suggestions from Identity

---

## Enums

```typescript
// M1
enum Privacy {
  SELF = "SELF",
  FRIENDS = "FRIENDS", // M1-M3
  CLOSE_FRIENDS = "CLOSE_FRIENDS", // M4
  PUBLIC = "PUBLIC",
}

// M2
enum Pillar {
  MIND = "MIND",
  BODY = "BODY",
  HEART = "HEART",
  SOUL = "SOUL",
}

// M2
enum CheckInSource {
  MANUAL = "MANUAL",
  INTEGRATION = "INTEGRATION", // M4+ (HealthKit, etc.)
}

// M2
enum HabitType {
  BUILD = "BUILD", // Positive habits to develop
  BREAK = "BREAK", // Negative habits to overcome
}

// M4
enum CheckInOutcome {
  COMPLETED = "COMPLETED", // BUILD habits: completed the habit
  RESISTED = "RESISTED", // BREAK habits: resisted temptation
  LAPSED = "LAPSED", // BREAK habits: gave in to temptation
}

// M4
enum StackRelationship {
  BEFORE = "BEFORE", // Do this habit BEFORE the linked habit
  AFTER = "AFTER", // Do this habit AFTER the linked habit
}

// M6
enum DriftType {
  AVOIDANCE = "AVOIDANCE", // Momentum loss, skipping habits
  OVERCONSUMPTION = "OVERCONSUMPTION", // Time/usage above typical levels
  IMBALANCE = "IMBALANCE", // Over-optimizing one pillar
  COMPARISON = "COMPARISON", // Feed engagement vs habit consistency
  VOLATILITY = "VOLATILITY", // Emotional spikes affecting patterns
  IMPULSIVITY = "IMPULSIVITY", // Unplanned breaks in routine
  DEFENSIVENESS = "DEFENSIVENESS", // Avoiding logging after slips
}

// M2/M3
enum MetricType {
  COUNT = "COUNT", // "50 workouts"
  DURATION = "DURATION", // "30 minutes"
  DISTANCE = "DISTANCE", // "5 kilometers"
  WEIGHT = "WEIGHT", // "150 pounds"
  CUSTOM = "CUSTOM", // User-defined unit
}

// M3
enum ReactionEmoji {
  CLAP = "👏",
  FIRE = "🔥",
  STRONG = "💪",
  HEART = "❤️",
  SPARKLES = "🔥",
}
```

---

## Core Tables (M1-M3)

### Identity (M2)

```typescript
{
  id: string(uuid);
  userId: string;
  name: string; // "Athlete", "Student", "Parent"
  pillar: Pillar; // Each identity maps to ONE pillar
  icon: string; // Emoji or preset icon
  preset: boolean; // From predefined list vs custom (M4)
  createdAt: timestamp;
}
```

**Indexes:**

- PRIMARY KEY (id)
- INDEX (userId, pillar)

**Purpose:** "Who I want to be" - top of hierarchy

**Predefined List (M2):**

```typescript
const PRESET_IDENTITIES = [
  // BODY
  { name: "Athlete", pillar: "BODY", icon: "🏃" },
  { name: "Fitness Enthusiast", pillar: "BODY", icon: "💪" },
  { name: "Yogi", pillar: "BODY", icon: "🧘" },
  { name: "Healthy Eater", pillar: "BODY", icon: "🥗" },

  // MIND
  { name: "Student", pillar: "MIND", icon: "📚" },
  { name: "Professional", pillar: "MIND", icon: "💼" },
  { name: "Learner", pillar: "MIND", icon: "🎓" },
  { name: "Reader", pillar: "MIND", icon: "📖" },

  // HEART
  { name: "Friend", pillar: "HEART", icon: "🤝" },
  { name: "Partner", pillar: "HEART", icon: "❤️" },
  { name: "Parent", pillar: "HEART", icon: "👨‍👩‍👧" },
  { name: "Volunteer", pillar: "HEART", icon: "🌍" },

  // SOUL
  { name: "Artist", pillar: "SOUL", icon: "🎭" },
  { name: "Spiritual Seeker", pillar: "SOUL", icon: "🔥" },
  { name: "Meditator", pillar: "SOUL", icon: "🧘‍♂️" },
  { name: "Nature Lover", pillar: "SOUL", icon: "🌿" },
];
```

**Onboarding (M2):**

- User selects 2-4 identities during signup
- Later can add more or create custom (M4)

**Notes:**

- Custom identities enabled in M4
- Used to organize goals and suggest habits (M4/M5)

---

### User (M1)

```typescript
{
  id: string (uuid)
  displayName: string
  email?: string                    // Optional from Apple Sign-In
  photoUrl?: string
  bio?: string (280 char max)
  defaultPrivacy: Privacy           // M1 - defaults to SELF
  pillarWeights?: {                 // M4 - optional scoring preferences
    MIND: number (0-1),
    BODY: number (0-1),
    HEART: number (0-1),
    SOUL: number (0-1)
  }

  // M6: Auto-Post Controls - granular privacy for every auto-generated post type
  autoPostSettings?: {
    weeklyPatterns: { enabled: boolean, privacy: Privacy },      // Weekly drift summaries
    milestones: { enabled: boolean, privacy: Privacy },          // Goal completions
    streaks: { enabled: boolean, privacy: Privacy },             // Streak achievements
    badges: { enabled: boolean, privacy: Privacy },              // Badge unlocks
    challenges: { enabled: boolean, privacy: Privacy },          // Challenge completions
    recovery: { enabled: boolean, privacy: Privacy },            // Recovery milestones
    newHabits: { enabled: boolean, privacy: Privacy }            // New habits started
  }

  // M6: Behavioral Drift Settings
  driftSettings?: {
    shareWeeklyPatterns: boolean,        // Auto-post weekly summaries (opt-in)
    allowFriendSupport: boolean,         // Friends can offer help
    patternVisibility: Privacy,          // Who can see drift patterns
    showDetailedMetrics: boolean,        // Show performance numbers (with warning)
    autoShareRecovery: boolean           // Celebrate comebacks publicly
  }

  createdAt: timestamp
  updatedAt: timestamp
}
```

**Indexes:**

- PRIMARY KEY (id)
- INDEX (email) - for search

**Privacy:** User profiles respect defaultPrivacy (can be SELF/FRIENDS/PUBLIC)

---

### Friendship (M1)

```typescript
{
  id: string (uuid)
  userId: string                    // User who initiated
  friendId: string                  // User who accepted
  status: 'PENDING' | 'ACCEPTED'
  isCloseFriend: boolean            // M4 - defaults to false
  createdAt: timestamp
  acceptedAt?: timestamp            // Null if PENDING
}
```

**Indexes:**

- PRIMARY KEY (id)
- UNIQUE (userId, friendId)
- INDEX (userId, status)
- INDEX (friendId, status)

**Notes:**

- Bidirectional: Creates 2 records (A→B and B→A)
- isCloseFriend is one-way (A marks B as close, doesn't mean B marks A)

---

### Circle (M8)

```typescript
{
  id: string (uuid)
  ownerUserId: string               // Creator and admin
  name: string (100 char max)       // "Gym Buddies", "Family", "Work Friends"
  description?: string (500 char max)
  privacy: 'INVITE_ONLY' | 'PUBLIC' // INVITE_ONLY = members only, PUBLIC = discoverable
  createdAt: timestamp
  archivedAt?: timestamp            // Soft delete
}
```

**Indexes:**

- PRIMARY KEY (id)
- INDEX (ownerUserId, archivedAt)
- INDEX (privacy) - for discovery

**Purpose:** Private groups with dedicated feeds and group chat (distinct from friends)

**Notes:**

- Users can create multiple Circles for different contexts
- Each Circle has its own feed (posts scoped to circleId)
- Each Circle has its own group chat (CircleMessage)
- Only Circle members can see Circle content

---

### CircleMember (M8)

```typescript
{
  circleId: string;
  userId: string;
  role: "OWNER" | "MEMBER"; // OWNER = full admin, MEMBER = regular participant
  joinedAt: timestamp;
}
```

**Indexes:**

- PRIMARY KEY (circleId, userId)
- INDEX (userId) - for "my circles"
- INDEX (circleId, role)

**Notes:**

- OWNER can: remove members, delete posts/messages, archive Circle, transfer ownership
- MEMBER can: post to Circle feed, send Circle messages, leave Circle
- Only accepted friends can be invited to Circles

---

### CircleMessage (M8)

```typescript
{
  id: string (uuid)
  circleId: string
  fromUserId: string
  body: string (2000 char max)      // Message text
  mediaUrl?: string                 // Optional image/video
  mediaType?: 'photo' | 'video' | 'audio' // Optional - type of media
  createdAt: timestamp
  deletedAt?: timestamp             // Soft delete
  syncedAt?: timestamp
}
```

**Indexes:**

- PRIMARY KEY (id)
- INDEX (circleId, createdAt DESC) - for pagination
- INDEX (fromUserId)
- INDEX (deletedAt) - for filtering deleted messages

**Purpose:** Persistent group chat for Circle members

**Notes:**

- Messages are permanent (unless deleted by owner or author)
- Server must validate Circle membership before returning messages
- Supports pagination (load latest 50, then older messages)
- Future: read receipts, typing indicators, threaded replies

---

### Goal (M2/M3)

```typescript
{
  id: string (uuid)
  userId: string
  identityId?: string               // Optional: "Working toward Athlete identity"
  title: string                     // "Run 5K under 30 minutes"
  pillar: Pillar
  metric: {
    type: MetricType,               // COUNT, DURATION, DISTANCE, WEIGHT, CUSTOM
    target: number,                 // 30 (for 30 minutes)
    current?: number,               // Auto-calculated from linked habits
    unit: string                    // 'minutes', 'km', 'workouts', 'lbs'
  }
  deadline?: timestamp              // Optional target date
  completedAt?: timestamp           // When target achieved
  privacy: Privacy
  archivedAt?: timestamp
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Indexes:**

- PRIMARY KEY (id)
- INDEX (userId, completedAt, archivedAt)
- INDEX (identityId)
- INDEX (deadline) - for "upcoming deadlines"

**Purpose:** "Proof I'm becoming that person" - quantitative milestones

**Examples:**

- Identity: Athlete → Goal: "Run 5K in under 30 minutes"
- Identity: Student → Goal: "Read 24 books this year"
- Identity: Friend → Goal: "Call 3 friends per week"

**Completion Logic:**

- `metric.current` auto-calculated from linked Habit check-ins
- When `current >= target`, auto-set `completedAt`
- Completed goals stay visible (show achievement)

**Notes:**

- Goals CAN complete (unlike habits)
- Quantitative only (no vague "be healthier")
- Optional identity link (can have standalone goals)

---

### Habit (M2)

```typescript
{
  id: string (uuid)
  userId: string
  title: string
  pillar: Pillar
  habitType: HabitType              // BUILD or BREAK
  goalId?: string                   // Optional: contributes to goal progress
  identityId?: string               // Optional: supports this identity
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'custom'
    targetCount?: number             // e.g., 7 for daily, 3 for 3x/week
    daysOfWeek?: number[]           // [0-6] for weekly/custom, 0=Sunday
    timeSlotsOfDay?: {              // M2 - flexible scheduling
      day: number,                  // 0-6
      hour: number,                 // 0-23
      minute: number                // 0-59
    }[]
  }

  // M4: Atomic Habits strategies (auto-detected or user-set)
  miniVersion?: string (100 chars)  // 2-minute rule: "1 push-up", "Read 1 page"
  environmentalCue?: string (200 chars) // "Shoes by door", "Phone in other room"
  bestTimeHour?: number (0-23)      // ML-detected optimal time
  bestTimeConfidence?: number (0-1) // Confidence score for bestTimeHour

  // M5: Progressive overload (1% rule)
  progressiveOverload?: {
      enabled: boolean,
      incrementRate: number (0-1),  // 1% per completion
      allowDecimals: boolean,  // Round to nearest 0.1
      originalTarget: number,  // Started at 30 min
      currentTarget?: number,  // After 10 completions: 30 * 1.01^10 ≈ 33.5
      maxTarget?: number,  // Stop at 60 min
      lastIncrementedAt: timestamp
    },

  privacy: Privacy
  archivedAt?: timestamp
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Indexes:**

- PRIMARY KEY (id)
- INDEX (userId, archivedAt)
- INDEX (pillar)
- INDEX (goalId) - M4
- INDEX (identityId) - M4

**Notes:**

- Habits NEVER complete (recurring actions, not one-time)
- habitType: BUILD (develop good habits) vs BREAK (overcome bad habits)
- Tags are simple strings (M2), rich Tag table in M4
- timeSlotsOfDay allows "4pm Mon, 8am Fri" flexibility
- archivedAt soft-deletes (keeps history)
- goalId links habit progress to goal's metric.current
- miniVersion: Implements James Clear's "2-minute rule" for habit formation
- environmentalCue: Environmental design from Atomic Habits
- bestTimeHour/Confidence: ML-detected from check-in patterns (M4)
- progressiveOverload: Automatic target increment (1% rule), only for metric-based habits (count, duration, distance, weight)

---

### HabitCheckIn (M2)

```typescript
{
  id: string (uuid)
  habitId: string
  userId: string
  occurredAt: timestamp             // When habit was completed
  source: CheckInSource             // MANUAL or INTEGRATION
  evidenceRef?: string              // M4 - e.g., 'healthkit:steps:10543'
  note?: string                     // M4 - optional user note

  // M4: Intensity and outcome tracking
  intensity?: number (1-5)          // BUILD: how energized, BREAK: temptation strength
  outcome?: CheckInOutcome          // BREAK habits only: COMPLETED/RESISTED/LAPSED

  createdAt: timestamp              // When check-in was logged
}
```

**Indexes:**

- PRIMARY KEY (id)
- INDEX (habitId, occurredAt) - for streaks
- INDEX (userId, occurredAt) - for user timeline
- UNIQUE (habitId, occurredAt, source) - prevent duplicates

**Notes:**

- occurredAt vs createdAt: allows backdating check-ins
- evidenceRef stores integration metadata for debugging
- intensity (M4): For BUILD habits = energy/commitment level, for BREAK habits = temptation strength
- outcome (M4): Only for BREAK habits to track RESISTED vs LAPSED instances
- Defaults: intensity=3 if skipped (zero friction), outcome=COMPLETED for BUILD habits

---

### HabitStack (M5)

```typescript
{
  id: string(uuid);
  habitId: string; // The "trigger" habit
  linkedHabitId: string; // The habit that follows
  relationship: StackRelationship; // BEFORE or AFTER
  confidence: number(0 - 1); // ML-detected (30-day window, 30-min co-occurrence)
  userId: string; // Denormalized for queries
  createdAt: timestamp;
}
```

**Indexes:**

- PRIMARY KEY (id)
- INDEX (habitId, confidence DESC) - for stack suggestions
- INDEX (userId, habitId) - for user habit chains
- UNIQUE (habitId, linkedHabitId) - prevent duplicates

**Notes:**

- Implements James Clear's "habit stacking" from Atomic Habits
- Detected device-side: when 2 habits occur within 30 min, 70%+ of time over 30 days
- CASCADE DELETE when either habit is deleted
- confidence score determines UI priority (higher = show first)

---

### BehavioralDrift (M6)

```typescript
{
  id: string (uuid)
  userId: string
  habitId?: string                  // Optional - pattern may span multiple habits
  driftType: DriftType              // AVOIDANCE, OVERCONSUMPTION, etc.
  confidence: number (0-1)          // Detection confidence

  // Aggregate metrics (never raw sensor data)
  metrics: {
    completionRateCurrent: number   // This week's %
    completionRatePrevious: number  // Last 4 weeks avg %
    missedCount?: number            // For AVOIDANCE
    overageMinutes?: number         // For OVERCONSUMPTION
    pillarSkew?: object             // For IMBALANCE: { fitness: 80%, career: 20% }
    volatilityScore?: number        // For VOLATILITY: std deviation of check-ins
  }

  sharedWith?: Privacy              // null = SELF only, or CLOSE_FRIENDS/FRIENDS/PUBLIC
  detectedAt: timestamp             // When pattern was identified
  resolvedAt?: timestamp            // null until user marks resolved
}
```

**Indexes:**

- PRIMARY KEY (id)
- INDEX (userId, driftType, detectedAt DESC) - for pattern history
- INDEX (userId, resolvedAt IS NULL) - for active patterns
- INDEX (habitId, driftType) - when linked to specific habit

**Notes:**

- Detected device-side weekly (every Sunday 9am local time)
- metrics contains ONLY aggregates, never raw 3rd party data
- Defaults to SELF privacy until user explicitly shares
- Auto-expires after 4 weeks if not marked resolved
- habitId nullable because patterns like IMBALANCE span multiple habits
- Synced to cloud unlike temp-idea.md proposal (visible analytics are the goal)

---

## Social Tables (M3)

### Post (M3)

```typescript
{
  id: string (uuid)
  userId: string
  authorName: string                // Denormalized for performance
  authorPhotoUrl?: string           // Denormalized
  pillar: Pillar
  privacy: Privacy
  bodyText?: string (500 char max)
  mediaUrl?: string                 // Cloudinary URL
  mediaType?: 'photo' | 'video' | 'chart' // M3 - type of media
  tags: string[]                    // M2 - ['workout', 'progress']
  postTypeTags?: string[]           // M3 - ['win', 'struggle', 'question', 'reflection'] or custom
  linkedCheckInId?: string          // Optional link to HabitCheckIn
  linkedObjectId?: string           // M3 - Optional link to habit/goal/milestone/module
  linkedObjectType?: 'habit' | 'goal' | 'milestone' | 'module' // M3 - Type of linked object
  contextLocation?: string          // M3 - Location category name (e.g., 'gym', 'home', 'work')
  createdAt: timestamp
}
```

**Indexes:**

- PRIMARY KEY (id)
- INDEX (userId, createdAt DESC)
- INDEX (privacy, createdAt DESC) - for public feed
- INDEX (linkedCheckInId)

**Privacy Rules:**

- FRIENDS posts: visible to accepted friends only
- CLOSE_FRIENDS posts: visible to isCloseFriend=true only (M4)
- PUBLIC: visible to all authenticated users

**Notes:**

- Denormalized author fields to avoid joins (SQLite performance)
- Permanent (no TTL) - for thoughtful sharing
- Supports rich interactions (comments, not just reactions)

---

### Story (M3)

```typescript
{
  id: string (uuid)
  userId: string
  authorName: string                // Denormalized
  authorPhotoUrl?: string           // Denormalized
  pillar: Pillar
  privacy: Privacy
  mediaUrl: string                  // Required - always has photo/video
  mediaType: 'photo' | 'video'      // Required - type of media
  caption?: string (280 char max)   // Optional short caption
  tags: string[]                    // M2 - same as Post/Habit
  linkedCheckInId?: string          // Creates HabitCheckIn atomically
  badges?: {                        // Auto-calculated on post
    streak?: number,
    milestone?: number,             // e.g., 10th check-in
    achievement?: string            // 'first_week', 'perfect_month'
  }
  expiresAt: timestamp              // Auto-set to +24h
  createdAt: timestamp
}
```

**Indexes:**

- PRIMARY KEY (id)
- INDEX (userId, expiresAt) - for cleanup
- INDEX (privacy, createdAt DESC) - for feed
- INDEX (expiresAt) - for TTL cleanup job
- INDEX (linkedCheckInId)

**Privacy Rules:**

- Same as Post (FRIENDS/CLOSE_FRIENDS/PUBLIC)
- Inherits from Habit.privacy by default (user can override)

**Notes:**

- Always 24h TTL (deleted after expiresAt)
- Optimized for quick sharing (camera → post → done)
- No comments (reactions only)
- Badges calculated on creation (not stored in HabitCheckIn)

**Cleanup:**

```sql
DELETE FROM stories WHERE expiresAt < NOW()
```

---

### Comment (M3)

```typescript
{
  id: string (uuid)
  postId: string
  userId: string
  authorName: string                // Denormalized
  authorPhotoUrl?: string           // Denormalized
  bodyText: string (50 char max)
  isArchived: boolean,              // M5 post archive
  createdAt: timestamp,
  updatedAt: timestamp              // can edit
}
```

**Indexes:**

- PRIMARY KEY (id)
- INDEX (postId, createdAt) - for thread display
- INDEX (userId, createdAt DESC)

**Notes:**

- Only on Posts (not Stories)
- 50 word limit enforced client + server
- No nested replies (flat comments only for v1)
- No reactions on comments (keep it simple)

---

### Reaction (M3)

```typescript
{
  id: string(uuid);
  targetId: string; // postId or storyId
  targetType: "POST" | "STORY";
  userId: string;
  emoji: ReactionEmoji;
  createdAt: timestamp;
}
```

**Indexes:**

- PRIMARY KEY (id)
- UNIQUE (targetId, targetType, userId) - one reaction per user per item
- INDEX (targetId, targetType, createdAt) - for reaction counts

**Notes:**

- Works for both Posts and Stories
- User can change reaction (UPDATE emoji WHERE targetId+targetType+userId)
- Only 5 allowed emojis (prevent abuse)

---

### Nudge (M3)

```typescript
{
  id: string (uuid)
  fromUserId: string
  toUserId: string
  habitId?: string                  // Optional: nudge about specific habit
  templateId: string                // Predefined template
  message: string                   // Generated from template
  createdAt: timestamp
}
```

**Indexes:**

- PRIMARY KEY (id)
- INDEX (toUserId, createdAt DESC) - inbox
- INDEX (fromUserId, toUserId, createdAt) - rate limiting

**Rate Limits:**

- 3 nudges/day per fromUserId→toUserId pair
- 10 nudges/day per fromUserId total

**Templates:**

- keep-it-up, proud-streak, you-got-this, dont-break-chain, lets-do-together

---

### SavedLocation (M5)

```typescript
enum LocationCategory {
  HOME = 'HOME',
  WORK = 'WORK',
  SCHOOL = 'SCHOOL',
  GYM = 'GYM',
  LIBRARY = 'LIBRARY',
  CHURCH = 'CHURCH',
  SOCIAL = 'SOCIAL',
  ENTERTAINMENT = 'ENTERTAINMENT',
  CUSTOM = 'CUSTOM'
}

{
  id: string (uuid)
  userId: string
  name: string                      // User-assigned name: "My Gym", "Office", "Park"
  category: LocationCategory        // Preset or CUSTOM
  latitude: number                  // Encrypted at rest
  longitude: number                 // Encrypted at rest
  radius: number                    // Meters (e.g., 100m)
  icon?: string                     // Optional emoji
  useInContextChips: boolean        // Show in post context (defaults false)
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Indexes:**

- PRIMARY KEY (id)
- INDEX (userId)
- INDEX (userId, useInContextChips) - for post context suggestions

**Privacy:**

- Coordinates encrypted at rest with AES-256
- Never synced to server in plain text
- Only category name exposed in posts (never coordinates)
- User controls which locations appear in context chips

**Purpose:** User-defined locations for triggers and post context

**Examples:**

- "24 Hour Fitness" → GYM category, shows in post context if enabled
- "Office" → WORK category, used for work/life balance analytics
- "Riverside Trail" → OUTDOORS category, custom location for outdoor workouts

**Notes:**

- M5: Used for location-based triggers (HabitTrigger)
- M3: Optionally used for post context chips (category name only, never coords)
- User must explicitly create locations (no auto-detection)
- Can delete anytime (cascades to HabitTrigger configs)

---

### HabitTrigger (M5)

```typescript
enum TriggerType {
  LOCATION = 'LOCATION',            // Geofence entry/exit
  TIME_OF_DAY = 'TIME_OF_DAY',      // Scheduled time
  APP_OPENED = 'APP_OPENED',        // iOS Screen Time API
  HABIT_COMPLETED = 'HABIT_COMPLETED', // After linked habit
  CALENDAR_EVENT = 'CALENDAR_EVENT' // Calendar integration
}

enum TriggerAction {
  PROMPT_CHECKIN = 'PROMPT_CHECKIN',   // Notification: "Log habit?"
  PROMPT_STORY = 'PROMPT_STORY',       // Notification: "Share story?"
  AUTO_LOG = 'AUTO_LOG'                // Auto-create check-in
}

{
  id: string (uuid)
  habitId: string
  type: TriggerType
  action: TriggerAction
  config: {
    // Type-specific configuration
    location?: {
      savedLocationId: string,        // Reference to SavedLocation
      onEnter: boolean,               // Fire when entering
      onExit: boolean                 // Fire when exiting
    }
    timeOfDay?: {
      hour: number (0-23),
      minute: number (0-59),
      daysOfWeek: number[] (0-6)      // 0=Sunday
    }
    appOpened?: {
      bundleId: string,               // e.g., 'com.apple.mobilesafari'
      minimumDuration?: number        // Seconds (optional)
    }
    habitCompleted?: {
      linkedHabitId: string,          // Trigger after this habit
      delay?: number                  // Seconds to wait (optional)
    }
    calendarEvent?: {                 // M5+
      keyword: string,                // Match event title
      beforeMinutes?: number,
      afterMinutes?: number
    }
  }
  enabled: boolean
  createdAt: timestamp
  lastTriggeredAt?: timestamp
}
```

**Indexes:**

- PRIMARY KEY (id)
- INDEX (habitId, enabled)
- INDEX (type, enabled) - for background worker queries

**Privacy:**

- Location coordinates encrypted at rest
- Never exposed in Posts/Stories
- User must explicitly set triggers (no auto-detection)

**Implementation Notes:**

- Background worker checks triggers every 5 min (location, time)
- App-opened uses iOS App Intents / Screen Time API (M5)
- Habit-completed is synchronous (fire immediately after check-in)
- Rate limit: Max 1 trigger per habit per hour (prevent spam)

**Example Flows:**

```typescript
// Gym entry (references SavedLocation)
{
  type: 'LOCATION',
  action: 'PROMPT_STORY',
  config: {
    location: { savedLocationId: 'uuid-my-gym', onEnter: true }
  }
}
// "At 24 Hour Fitness? Share your workout!"

// Morning meditation
{
  type: 'TIME_OF_DAY',
  action: 'PROMPT_CHECKIN',
  config: {
    timeOfDay: { hour: 7, minute: 0, daysOfWeek: [1,2,3,4,5] }
  }
}
// "7am - Time to meditate?"

// Reading app closed
{
  type: 'APP_OPENED',
  action: 'PROMPT_CHECKIN',
  config: {
    appOpened: { bundleId: 'com.apple.iBooks', minimumDuration: 600 }
  }
}
// "You read for 10 min. Log it?"

// After morning run
{
  type: 'HABIT_COMPLETED',
  action: 'PROMPT_STORY',
  config: {
    habitCompleted: { linkedHabitId: 'uuid-morning-run', delay: 30 }
  }
}
// "Great run! Share it with friends?"
```

**App Store Risks:**

- LOCATION: Moderate (must justify in review, clear UI)
- TIME_OF_DAY: Low (standard notifications)
- APP_OPENED: HIGH (Screen Time API restricted, might be rejected)
- HABIT_COMPLETED: Low (internal app logic)
- CALENDAR_EVENT: Moderate (requires calendar permission)

---

## M4 Tables (Analytics & Suggestions)

### Tag (M4)

```typescript
{
  id: string (uuid)
  userId: string
  name: string                      // "Marathon Training"
  slug: string                      // "marathon-training"
  color?: string                    // Hex color for UI
  icon?: string                     // Emoji
  pillar?: Pillar                   // Optional pillar association
  useCount: number                  // How many times used
  createdAt: timestamp
}
```

**Indexes:**

- PRIMARY KEY (id)
- UNIQUE (userId, slug)
- INDEX (userId, useCount DESC) - for popular tags

**Purpose:** Rich tag metadata for analytics

**Notes:**

- M2-M3: Tags are just strings on Habit/Post/Story
- M4: Upgrade to table for analytics ("Show all #marathon-training activity")
- M5: Suggest popular tags from friends

**Migration from strings:**

```typescript
// When user creates tag-rich content, auto-create Tag record
if (!tagExists(userId, "marathon-training")) {
  createTag({ userId, slug: "marathon-training", useCount: 1 });
} else {
  incrementTagUseCount(userId, "marathon-training");
}
```

---

### BadgeEarned (M3)

```typescript
enum BadgeType {
  STREAK = 'STREAK',                // Consistency badges
  MILESTONE = 'MILESTONE',          // Check-in count badges
  PILLAR = 'PILLAR',                // Pillar-specific badges
  SOCIAL = 'SOCIAL',                // Social interaction badges
  CHALLENGE = 'CHALLENGE'           // Challenge winner badges (M4)
}

enum BadgeTier {
  BRONZE = 'BRONZE',                // 7 days, 10 check-ins
  SILVER = 'SILVER',                // 30 days, 50 check-ins
  GOLD = 'GOLD'                     // 100 days, 100 check-ins
}

{
  id: string (uuid)
  userId: string
  badgeId: string                   // 'streak-body-gold'
  type: BadgeType
  tier: BadgeTier
  pillar?: Pillar                   // If pillar-specific
  habitId?: string                  // If habit-specific
  metadata: {
    streakDays?: number,
    checkInCount?: number,
    value: number                   // The qualifying value (7, 30, 100)
  }
  sharedAsPostId?: string           // Auto-posted (with opt-out)
  earnedAt: timestamp
}
```

**Indexes:**

- PRIMARY KEY (id)
- UNIQUE (userId, badgeId, pillar, habitId) - no duplicates
- INDEX (userId, earnedAt DESC) - badge wall
- INDEX (type, tier) - leaderboards

**Purpose:** Automated celebrations and achievements

**Badge Structure:**

- **Streak Badges** (per pillar):
  - 🥉 Bronze: 7 days ("Week Warrior - Body")
  - 🥈 Silver: 30 days ("Month Master - Body")
  - 🥇 Gold: 100 days ("Century Club - Body")

- **Milestone Badges** (per pillar):
  - 🥉 Bronze: 10 check-ins
  - 🥈 Silver: 50 check-ins
  - 🥇 Gold: 100 check-ins

- **Pillar Badges:**
  - 🧠 Mind badges (100+ MIND check-ins)
  - 💪 Body badges (100+ BODY check-ins)
  - ❤️ Heart badges (100+ HEART check-ins)
  - 🔥 Soul badges (100+ SOUL check-ins)
  - 🌈 Balanced (25+ in ALL pillars)

- **Social Badges** (M3):
  - 👥 Connector (10 friends)
  - 🎉 Inspiration (100 reactions received)
  - 🤝 Supporter (100 reactions given)

**Auto-Posting:**

```typescript
// After badge earned
async function handleBadgeEarned(badge: BadgeEarned) {
  const user = await getUser(badge.userId);

  if (user.settings.autoShareBadges !== false) {
    // Opt-out
    const post = await createBadgePost(badge);
    await updateBadge(badge.id, { sharedAsPostId: post.id });
  }

  await showBadgeAnimation(badge);
}
```

**Settings:**

```typescript
UserSettings {
  autoShareBadges: boolean          // Default: true (opt-out)
}
```

---

### JournalEntry (M4)

```typescript
{
  id: string (uuid)
  userId: string
  bodyText: string (5000 char max)
  pillars: Pillar[]                 // Can tag multiple pillars
  mood?: number (1-5)               // Optional mood emoji scale
  privacy: Privacy                  // Defaults to SELF
  entryDate: timestamp              // Date of entry (can backdate)
  createdAt: timestamp
}
```

**Indexes:**

- PRIMARY KEY (id)
- INDEX (userId, entryDate DESC)
- FULLTEXT INDEX (bodyText) - SQLite FTS for search

---

### MoodEntry (M4)

```typescript
{
  id: string (uuid)
  userId: string
  value: number (1-5)               // 😞 😐 🙂 😊 😄
  note?: string (100 char max)
  timestamp: timestamp
  createdAt: timestamp
}
```

**Purpose:** Quick mood logging separate from journal

**Analytics:** Device-side trends (avg mood this week vs last week)

---

### Challenge (M4)

```typescript
{
  id: string (uuid)
  creatorId: string
  name: string
  habitId: string                   // Habit to compete on
  type: 'completion' | 'streak' | 'together'
  startDate: timestamp
  endDate: timestamp
  createdAt: timestamp
}

ChallengeParticipant {
  id: string (uuid)
  challengeId: string
  userId: string
  checkInsCount: number             // Updated on each check-in
  currentStreak: number
  joinedAt: timestamp
}
```

**Purpose:** Social challenges with friends

**Leaderboard:** Device-side query (ORDER BY checkInsCount DESC)

---

## M5+ Tables (Future)

### Integration (M5)

```typescript
{
  id: string (uuid)
  userId: string
  source: 'healthkit' | 'screentime' | 'location' | 'calendar'
  enabled: boolean
  permissions: {                    // Source-specific permissions
    [key: string]: boolean
  }
  lastSyncAt?: timestamp
  createdAt: timestamp
}
```

**Purpose:** Track which integrations user has enabled

---

### AutoLog (M5)

```typescript
{
  id: string (uuid)
  userId: string
  habitId: string
  source: string                    // e.g., 'healthkit:steps'
  confidence: number (0-1)          // ML confidence score
  suggestedAt: timestamp
  acceptedAt?: timestamp
  rejectedAt?: timestamp
}
```

**Purpose:** ML-suggested check-ins (user can accept/reject)

---

## Relationships Diagram

```
User
  ├─ Friendship (friends)
  ├─ Identity (M2) - "Who I want to be"
  │    └─ Goal (optional) - "Proof I'm that person"
  │         └─ Habit (optional) - "What I do daily"
  ├─ Goal (M2/M3) - Quantitative milestones
  │    └─ Habit (linked habits contribute to goal.metric.current)
  ├─ Habit (M2) - Recurring actions
  │    ├─ HabitCheckIn (logs)
  │    └─ HabitTrigger (automation, M5)
  ├─ Post (M3) - Permanent shares
  │    ├─ Comment (text responses)
  │    ├─ Reaction (emoji)
  │    └─ linkedCheckInId → HabitCheckIn
  ├─ Story (M3) - 24h ephemeral shares
  │    ├─ Reaction (emoji only)
  │    └─ linkedCheckInId → HabitCheckIn
  ├─ BadgeEarned (M3) - Auto-celebrations
  │    └─ sharedAsPostId → Post
  ├─ Nudge (M3) - Friend encouragement
  ├─ Tag (M4) - Rich tag metadata
  ├─ JournalEntry (M4)
  ├─ MoodEntry (M4)
  └─ Challenge (M4)
       └─ ChallengeParticipant
```

**Hierarchy:**

1. **Identity** (top) - Aspirational roles ("Athlete")
2. **Goal** (middle) - Measurable targets ("Run 5K in 30min")
3. **Habit** (bottom) - Daily actions ("Run 4x/month")

**Flow:**

- M2: User selects Identities → creates Habits
- M3: User creates Goals → links to Habits
- M4: App suggests Habits based on Goals
- M5: App suggests Goals based on Identities

---

## Privacy Enforcement (Critical)

### Server-Side Check (Every Query)

```typescript
// Example: GET /habits
function getHabits(viewerId: string, scope: "mine" | "friends" | "public") {
  let query = `SELECT * FROM habits WHERE`;

  if (scope === "mine") {
    query += ` userId = :viewerId`;
  } else if (scope === "friends") {
    query += ` (privacy = 'PUBLIC'
               OR (privacy = 'FRIENDS' AND userId IN (
                 SELECT friendId FROM friendships 
                 WHERE userId = :viewerId AND status = 'ACCEPTED'
               ))
               OR (privacy = 'CLOSE_FRIENDS' AND userId IN (
                 SELECT friendId FROM friendships
                 WHERE userId = :viewerId AND status = 'ACCEPTED' AND isCloseFriend = true
               )))`;
  } else {
    // public
    query += ` privacy = 'PUBLIC'`;
  }

  return db.execute(query, { viewerId });
}
```

**Rule:** NEVER trust client privacy filters. Server MUST re-validate.

---

## SQLite Migration Strategy

```typescript
const SCHEMA_VERSION = 5;

async function migrate(db: SQLiteDatabase) {
  const { user_version } = await db.getFirstAsync("PRAGMA user_version");

  if (user_version < 1) {
    // M1 tables
    await db.execAsync(`
      CREATE TABLE users (...);
      CREATE TABLE friendships (...);
    `);
  }

  if (user_version < 2) {
    // M2 tables
    await db.execAsync(`
      CREATE TABLE habits (...);
      CREATE TABLE habit_checkins (...);
    `);
  }

  if (user_version < 3) {
    // M3 tables
    await db.execAsync(`
      CREATE TABLE posts (...);
      CREATE TABLE reactions (...);
      CREATE TABLE nudges (...);
    `);
  }

  if (user_version < 4) {
    // M4 tables
    await db.execAsync(`
      CREATE TABLE goals (...);
      CREATE TABLE identities (...);
      CREATE TABLE journal_entries (...);
      CREATE TABLE mood_entries (...);
      CREATE TABLE challenges (...);
      ALTER TABLE friendships ADD COLUMN isCloseFriend BOOLEAN DEFAULT false;
    `);
  }

  if (user_version < 5) {
    // M5 tables
    await db.execAsync(`
      CREATE TABLE integrations (...);
      CREATE TABLE auto_logs (...);
    `);
  }

  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}
```

---

## Reference

- Architecture: [architecture.md](architecture.md)
- API Contracts: [api-contracts.md](api-contracts.md)
- M1 Implementation: [M1-account-privacy.md](M1-account-privacy.md)
- M2 Implementation: [M2-habits-tracking.md](M2-habits-tracking.md)
- M3 Implementation: [M3-social.md](M3-social.md)
- M4 Implementation: [M4-identity-analytics.md](M4-identity-analytics.md)
