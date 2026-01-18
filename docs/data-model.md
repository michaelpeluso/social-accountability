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

## Database Normalization (Current Implementation)

**Naming Conventions**

| Pattern          | Rule                    | Examples                                                              |
| ---------------- | ----------------------- | --------------------------------------------------------------------- |
| Boolean fields   | `is` prefix             | `isPreset`, `isArchived`, `isRead`, `isCloseFriend`, `isVacationMode` |
| Timestamps       | `At` suffix             | `createdAt`, `updatedAt`, `syncedAt`, `deletedAt`, `earnedAt`         |
| User references  | `userId` + denormalized | `userId`, `userName`, `userPhotoUrl`                                  |
| Foreign keys     | Simple `{table}Id`      | `habitId`, `goalId`, `postId`, `checkInId`                            |
| Text content     | Semantic naming         | `text` (short), `description` (long), `note` (annotations)            |
| Reaction targets | Polymorphic pattern     | `targetId`, `targetType` (for posts/stories)                          |

**Schema Status:**

- Single consolidated schema supporting M0-M8+ milestones
- No incremental migrations - fresh start with SCHEMA_VERSION=1
- All tables include `syncedAt` for offline-first sync tracking
- Soft deletes use `deletedAt` or `archivedAt` + `isArchived` boolean

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
enum StackRelationship {
  AFTER = "AFTER", // linkedHabitId happens AFTER habitId (habitId triggers linkedHabitId)
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
  isPreset: boolean; // From predefined list vs custom (M4)
  createdAt: timestamp;
  updatedAt: timestamp;
  syncedAt?: timestamp;
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
  appleId?: string                  // Apple Sign-In identifier
  displayName: string
  email?: string                    // Optional from Apple Sign-In
  photoUrl?: string
  bio?: string (280 char max)
  defaultPrivacy: Privacy           // M1 - defaults to SELF
  isVacationMode: boolean           // M2 - pause habit tracking
  vacationEndsAt?: timestamp        // M2 - when vacation mode ends
  createdAt: timestamp
  updatedAt: timestamp
  deletedAt?: timestamp             // Soft delete
  syncedAt?: timestamp              // Last cloud sync
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
  acceptedAt?: timestamp            // Null if PENDING
  createdAt: timestamp
  updatedAt: timestamp
  syncedAt?: timestamp
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
  updatedAt: timestamp
  archivedAt?: timestamp            // Soft delete
  syncedAt?: timestamp
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
  id: string (uuid)
  circleId: string
  userId: string
  role: "OWNER" | "MEMBER"  // OWNER = full admin, MEMBER = regular participant
  joinedAt: timestamp
  syncedAt?: timestamp
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
  userId: string                    // Message sender
  text: string (2000 char max)      // Message text
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
  description?: string              // Optional detailed description
  pillar: Pillar
  privacy: Privacy
  isIndefinite: boolean             // No deadline - ongoing goal
  metricType: MetricType            // COUNT, DURATION, DISTANCE, WEIGHT, CUSTOM
  metricUnit?: string               // 'minutes', 'km', 'workouts', 'lbs'
  startValue?: number               // Starting point
  targetValue?: number              // Goal target
  currentValue?: number             // Auto-calculated from linked habits
  startDate?: timestamp             // When goal tracking starts
  deadline?: timestamp              // Optional target date
  dataSource: 'MANUAL' | 'INTEGRATION' // How progress is tracked
  linkedHabitIds?: string[]         // Habits contributing to this goal
  isVacationMode: boolean           // Goal tracking paused
  vacationEndsAt?: timestamp        // When vacation mode ends
  completedAt?: timestamp           // When target achieved
  isArchived: boolean               // Archived goals
  archivedAt?: timestamp
  createdAt: timestamp
  updatedAt: timestamp
  syncedAt?: timestamp
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
  goalId?: string                   // Optional: contributes to goal progress
  identityId?: string               // Optional: supports this identity
  parentHabitId?: string            // M5: For habit sub-habits
  stackAfterHabitId?: string        // M5: Do THIS habit after THAT habit (creates linked list chain)
  title: string
  description?: string              // Optional detailed description
  pillar: Pillar
  habitType: HabitType              // BUILD or BREAK
  completionType: 'BINARY' | 'NUMERIC' // M2 - Binary (yes/no) or Numeric (count/duration)
  targetValue?: number              // For numeric habits - daily target
  unit?: string                     // For numeric habits - 'minutes', 'reps', etc.
  icon?: string                     // Optional emoji icon
  tags?: string                     // JSON array of tags
  schedule: string                  // JSON object with frequency config
  timezone?: string                 // User's timezone for scheduling
  difficulty?: number (1-5)         // M4 - self-assessed difficulty
  miniVersion?: string (100 chars)  // M4 - 2-minute rule: "1 push-up", "Read 1 page"
  graceDays: number                 // M2 - allowed misses before streak breaks (default 0)
  privacy: Privacy
  isArchived: boolean               // Archived habits
  archivedAt?: timestamp
  currentStreak: number             // Current consecutive completions
  longestStreak: number             // Best ever streak
  lastCheckInAt?: timestamp         // Most recent check-in
  lastMissedAt?: timestamp          // Most recent miss
  recoveryStreak: number            // M3 - comeback streak after break
  environmentalCue?: string (200 chars) // M4 - "Shoes by door", "Phone in other room"
  progressiveOverload?: string      // M5 - JSON config for progressive overload
  progressiveOverloadStart?: number // M5 - initial numeric target for progressive overload (e.g. starting rep/duration)
  progressiveOverloadPrevious?: number // M5 - previous target before last auto-increment
  progressiveOverloadLastAppliedAt?: timestamp // M5 - when last auto-increment was applied
  isReminderEnabled: boolean        // M5 - Enable reminder notifications
  reminderTimes?: string            // M5 - JSON array of reminder times
  reminderText?: string             // M5 - Custom reminder message
  reflectionPrompt?: string         // M5 - Custom reflection prompt after check-in
  createdAt: timestamp
  updatedAt: timestamp
  syncedAt?: timestamp
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
- **schedule field responsibility**: Determines success/failure criteria for streak calculation
  - Daily habits: Must have check-in each day (after graceDays tolerance)
  - Flexible habits: "3x/week" counts check-ins in rolling 7-day window, no specific days required
  - Custom patterns: "Mon/Wed/Fri", "every 3 days", etc. evaluated per schedule logic
  - Absence of check-in = didn't do it (schedule determines if that's acceptable)
- archivedAt soft-deletes (keeps history)
- goalId links habit progress to goal's metric.current
- miniVersion: Implements James Clear's "2-minute rule" for habit formation
- environmentalCue: Environmental design from Atomic Habits
- bestTimeHour/Confidence: ML-detected from check-in patterns (M4)
- completionPrior: Bayesian prior probability P(complete|habit) - cached and updated weekly or after 5+ check-ins
  - Calculation: (completions + α) / (total_opportunities + α + β) where α=1, β=1 (Beta prior)
  - Updated: On background sync after new check-ins, or weekly for active habits
  - Use case: Predict likelihood of completion, prioritize nudges, calculate recovery scores
- priorLastUpdatedAt: Tracks staleness of prior (recalculate if >7 days old)
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
  success: boolean                  // Did I succeed? (interpretation depends on Habit.habitType)
  value?: number                    // For numeric habits - actual value
  evidenceUrl?: string              // M4 - URL to evidence photo/video
  note?: string (500 char max)      // M4 - optional user note
  intensity?: number (1-5)          // M4 - BUILD: energy level, BREAK: temptation strength
  moodBefore?: number (1-5)         // M4 - Mood before check-in
  moodAfter?: number (1-5)          // M4 - Mood after check-in
  createdAt: timestamp              // When check-in was logged
  syncedAt?: timestamp
}
```

**Indexes:**

- PRIMARY KEY (id)
- INDEX (habitId, occurredAt) - for streaks
- INDEX (userId, occurredAt) - for user timeline
- UNIQUE (habitId, occurredAt, source) - prevent duplicates

**Notes:**

- occurredAt vs createdAt: allows backdating check-ins
- evidenceUrl stores integration metadata for debugging
- intensity (M4): For BUILD habits = energy/commitment level, for BREAK habits = temptation strength
- **success field interpretation (depends on Habit.habitType)**:
  - BUILD habits: success=true means "I did the habit" (ran, meditated, worked out)
  - BREAK habits: success=true means "I resisted" (avoided social media, didn't smoke)
  - BREAK habits: success=false means "I lapsed" (gave in to temptation)
  - BUILD habits rarely use success=false (just don't create check-in if didn't do it)
- No check-in = didn't do it (for BUILD) or no temptation faced (for BREAK)
- Streak evaluation: Habit's schedule field defines success criteria (daily, 3x/week, etc.)
  - Daily habits: Missing check-in for a day = potential streak break (after graceDays)
  - Flexible habits ("3x/week"): Count check-ins in window, no concept of "missed Tuesday"
- Defaults: success=true if not specified

---

### HabitStack (M5)

**Purpose:** ML-detected habit co-occurrence patterns (separate from user-configured stacking)

```typescript
{
  id: string(uuid);
  habitId: string; // The "trigger" habit that happens first
  linkedHabitId: string; // The habit that tends to follow
  relationship: StackRelationship; // Always AFTER (linkedHabitId follows habitId)
  confidence: number(0 - 1); // ML confidence (30-day window, 30-min co-occurrence, 70%+ frequency)
  userId: string; // Denormalized for queries
  createdAt: timestamp;
  updatedAt: timestamp;
}
```

**Indexes:**

- PRIMARY KEY (id)
- INDEX (habitId, confidence DESC) - for stack suggestions
- INDEX (userId, habitId) - for user habit chains
- UNIQUE (habitId, linkedHabitId) - prevent duplicates

**Notes:**

- **ML-detected only** - not user-configured (user config uses `Habit.stackAfterHabitId`)
- Detected device-side: when 2 habits occur within 30 min, 70%+ of time over 30 days
- CASCADE DELETE when either habit is deleted
- confidence score determines UI priority (higher = show first)
- Used for suggestions: "You usually stretch after running. Want to link them?"
- Example: User always does meditation then journal → (meditation, journal, AFTER, 0.85)

**User-Configured Stacking (in Habit table):**

For explicit user chains like "Meditate → Journal → Breakfast":

- Meditate.stackAfterHabitId = null (start of chain)
- Journal.stackAfterHabitId = meditateId
- Breakfast.stackAfterHabitId = journalId

This creates a simple linked list: each habit knows its "previous" habit.

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
  userId: string                    // Post author (join with User table for name/photo)
  circleId?: string                 // M8 - Optional circle post
  pillar: Pillar
  privacy: Privacy
  text?: string (500 char max)      // Post content
  mediaUrl?: string                 // Cloudinary URL
  mediaType?: 'photo' | 'video' | 'chart' // M3 - type of media
  tags?: string                     // JSON array - all tags unified (e.g. ['workout', 'win', 'my-custom-tag'])
  checkInId?: string                // M3 - Optional link to HabitCheckIn
  habitId?: string                  // M3 - Optional link to Habit
  goalId?: string                   // M3 - Optional link to Goal
  linkedObjectId?: string           // M3 - Generic linked object
  linkedObjectType?: string         // M3 - Type of linked object
  contextTimeOfDay?: string         // M3 - 'morning', 'afternoon', 'evening', 'night'
  contextLocationIdId?: string        // M3 - Reference to SavedLocation.id (category displayed from location)
  editedAt?: timestamp              // M3 - Last edit timestamp (24h window)
  createdAt: timestamp
  updatedAt: timestamp
  syncedAt?: timestamp
}
```

**Indexes:**

- PRIMARY KEY (id)
- INDEX (userId, createdAt DESC)
- INDEX (privacy, createdAt DESC) - for public feed
- INDEX (checkInId)

**Privacy Rules:**

- FRIENDS posts: visible to accepted friends only
- CLOSE_FRIENDS posts: visible to isCloseFriend=true only (M4)
- PUBLIC: visible to all authenticated users

**Notes:**

- Use JOIN with User table for author name/photo (consistency over denormalization)
- Permanent (no TTL) - for thoughtful sharing
- Supports rich interactions (comments, not just reactions)

---

### Story (M3)

```typescript
{
  id: string (uuid)
  userId: string                    // Story author (join with User table for name/photo)
  pillar: Pillar
  privacy: Privacy
  mediaUrl: string                  // Required - always has photo/video
  mediaType: 'photo' | 'video'      // Required - type of media
  caption?: string (200 char max)   // Optional short caption
  tags?: string                     // JSON array - all tags unified
  checkInId?: string                // Creates HabitCheckIn atomically
  habitId?: string                  // Optional habit link
  expiresAt: timestamp              // Auto-set to +24h
  createdAt: timestamp
  syncedAt?: timestamp
}
```

**Indexes:**

- PRIMARY KEY (id)
- INDEX (userId, expiresAt) - for cleanup
- INDEX (privacy, createdAt DESC) - for feed
- INDEX (expiresAt) - for TTL cleanup job
- INDEX (checkInId)

**Privacy Rules:**

- Same as Post (FRIENDS/CLOSE_FRIENDS/PUBLIC)
- Inherits from Habit.privacy by default (user can override)

**Notes:**

- Always 24h TTL (deleted after expiresAt)
- Optimized for quick sharing (camera → post → done)
- No comments (reactions only)
- Use JOIN with User table for author name/photo
- Badges generate their own optional auto-posts (like LinkedIn's automatic posts)

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
  text: string (50 word max)        // Comment content
  isArchived: boolean               // M5 post archive
  createdAt: timestamp
  updatedAt: timestamp              // can edit
  syncedAt?: timestamp
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
  postId?: string;                  // Optional - reaction on post
  storyId?: string;                 // Optional - reaction on story (one must be set)
  userId: string;
  emoji: ReactionEmoji;
  createdAt: timestamp;
  syncedAt?: timestamp;
}
```

**Indexes:**

- PRIMARY KEY (id)
- UNIQUE (postId, userId) WHERE postId IS NOT NULL - one reaction per user per post
- UNIQUE (storyId, userId) WHERE storyId IS NOT NULL - one reaction per user per story
- INDEX (postId, createdAt) - for post reaction counts
- INDEX (storyId, createdAt) - for story reaction counts

**Notes:**

- Either postId OR storyId must be set (CHECK constraint)
- User can change reaction (UPDATE emoji WHERE postId/storyId + userId)
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
  createdAt: timestamp
  syncedAt?: timestamp
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
{
  id: string (uuid)
  userId: string
  name: string                      // User-assigned name: "My Gym", "Office", "Park"
  category: string                  // HOME, WORK, GYM, etc.
  latitude: number                  // Encrypted at rest
  longitude: number                 // Encrypted at rest
  radiusMeters: number              // Radius in meters (e.g., 100m)
  createdAt: timestamp
  updatedAt: timestamp
  syncedAt?: timestamp
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

> **Note:** The config structure for HabitTrigger is not fully planned out yet. This schema is subject to change and should not be implemented until finalized.

```typescript
enum TriggerType {
  LOCATION = 'LOCATION',            // Geofence entry/exit
  TIME_OF_DAY = 'TIME_OF_DAY',      // Scheduled time
  APP_OPENED = 'APP_OPENED',        // iOS Screen Time API
  HEALTH_KIT = 'HEALTH_KIT',        // HealthKit data (M6+)
  HABIT_COMPLETED = 'HABIT_COMPLETED', // After linked habit
  CALENDAR_EVENT = 'CALENDAR_EVENT' // Calendar integration
}

enum TriggerAction {
  PROMPT_CHECKIN = 'PROMPT_CHECKIN',   // Notification: "Log habit?"
  PROMPT_STORY = 'PROMPT_STORY',       // Notification: "Share story?"
  AUTO_LOG = 'AUTO_LOG',               // Auto-create check-in
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
  slug: string                      // "marathon-training" (display as "Marathon Training" via formatting)
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

### Badge (M3)

```typescript
{
  id: string (uuid)
  userId: string
  badgeName: string                 // 'streak-body-gold', 'milestone-50', etc.
  pillar?: Pillar                   // If pillar-specific
  habitId?: string                  // If habit-specific
  tier?: number                     // 1=Bronze, 2=Silver, 3=Gold
  metadata?: string                 // JSON object with badge details
  sharedAt?: timestamp              // When shared as post (optional)
  earnedAt: timestamp
  syncedAt?: timestamp
}
```

**Indexes:**

- PRIMARY KEY (id)
- UNIQUE (userId, badgeName, pillar, habitId) - no duplicates
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
  text: string (5000 char max)
  pillar?: Pillar                   // Can tag single pillar
  tags?: string                     // JSON array of tags
  privacy: Privacy                  // Defaults to SELF
  createdAt: timestamp
  updatedAt: timestamp
  syncedAt?: timestamp
}
```

**Indexes:**

- PRIMARY KEY (id)
- INDEX (userId, entryDate DESC)
- FULLTEXT INDEX (text) - SQLite FTS for search

---

### MoodEntry (M4)

```typescript
{
  id: string (uuid)
  userId: string
  mood: number (1-5)                // 😞 😐 🙂 😊 😄
  emotion?: Emotion                 // Optional micro-emotion within mood level
  note?: string (250 char max)
  createdAt: timestamp
  syncedAt?: timestamp
}
```

**Purpose:** Quick mood logging separate from journal

**Analytics:** Device-side trends (avg mood this week vs last week)

---

### Challenge (M4)

```typescript
// Challenge
{
  id: string (uuid)
  creatorUserId?: string            // Optional - null for system-created challenges
  title: string
  description?: string
  pillar?: Pillar                   // Optional pillar focus
  habitIds?: string                 // JSON array - directly linked habits
  goalIds?: string                  // JSON array - linked goals (their habits also count)
  startDate: timestamp
  endDate: timestamp
  privacy: Privacy
  isArchived: boolean
  createdAt: timestamp
  updatedAt: timestamp
  syncedAt?: timestamp
}
```

**Notes:**

- habitIds: Habits directly part of challenge
- goalIds: Goals linked to challenge - their associated habits automatically count toward challenge
- At least one of habitIds or goalIds should be set
- Challenge progress calculated from check-ins on all linked habits (direct + via goals)

```typescript
// ChallengeParticipant
{
  id: string (uuid)
  challengeId: string
  userId: string
  status: string                    // 'ACTIVE', 'COMPLETED', 'DROPPED'
  score: number                     // Check-ins count or other metric
  progress: number                  // 0-100% completion toward challenge goal
  joinedAt: timestamp
  completedAt?: timestamp
  syncedAt?: timestamp
}
```

**Purpose:** Social challenges with friends

**Leaderboard:** Device-side query (ORDER BY score DESC, progress DESC)

---

## M5+ Tables (Future)

### Integration (M5)

```typescript
{
  id: string (uuid)
  userId: string
  provider: string                  // 'HEALTHKIT', 'SCREENTIME', 'LOCATION', 'CALENDAR'
  accessToken?: string              // Encrypted
  refreshToken?: string             // Encrypted
  expiresAt?: timestamp
  scopes?: string                   // JSON array of permissions
  isEnabled: boolean
  lastSyncAt?: timestamp
  createdAt: timestamp
  updatedAt: timestamp
  syncedAt?: timestamp
}
```

**Purpose:** Track which integrations user has enabled

---

### AutoLog (M5)

```typescript
enum ValueType {
  NUMBER = 'NUMBER',                // Numeric values (steps, minutes, etc.)
  BOOLEAN = 'BOOLEAN',              // True/false (workout completed, etc.)
  TIMESTAMP = 'TIMESTAMP',          // Time-based values (sleep time, etc.)
  DURATION = 'DURATION',            // Duration in seconds
}

{
  id: string (uuid)
  userId: string
  integrationId: string             // Reference to integration
  metricType: string                // 'steps', 'screentime', 'workout', 'sleep', etc.
  valueType: ValueType              // Type of the value
  valueNumber?: number              // For NUMBER, DURATION types
  valueBoolean?: boolean            // For BOOLEAN type
  valueTimestamp?: timestamp        // For TIMESTAMP type
  unit?: string                     // 'steps', 'minutes', 'km', etc.
  occurredAt: timestamp             // When the activity occurred
  rawData?: string                  // JSON metadata (optional)
  createdAt: timestamp
  syncedAt?: timestamp
}
```

**Purpose:** ML-suggested check-ins (user can accept/reject)

**Notes:**

- valueType determines which value field is populated
- Only one value field should be set based on valueType

---

## Relationships Diagram

```
User
  ├─ Friendship (friends)
  ├─ Identity (M2) - "Who I want to be"
  │    └─ Goal (optional) - "Proof I'm that person"
  │         └─ Habit (optional) - "What I do daily"
  ├─ Goal (M2/M3) - Quantitative milestones
  │    └─ Habit (linked habits contribute to goal progress)
  ├─ Habit (M2) - Recurring actions
  │    ├─ HabitCheckIn (logs)
  │    └─ HabitTrigger (automation, M5)
  ├─ Post (M3) - Permanent shares
  │    ├─ Comment (text responses)
  │    ├─ Reaction (emoji)
  │    └─ checkInId → HabitCheckIn
  ├─ Story (M3) - 24h ephemeral shares
  │    ├─ Reaction (emoji only)
  │    └─ checkInId → HabitCheckIn
  ├─ Badge (M3) - Auto-celebrations
  │    └─ sharedAt (optional post timestamp)
  ├─ Nudge (M3) - Friend encouragement
  ├─ Tag (M4) - Rich tag metadata
  ├─ JournalEntry (M4)
  ├─ MoodEntry (M4)
  ├─ Integration (M5)
  │    └─ AutoLog (M5)
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

---

## Future Tables (In Progress)

> **Note:** These tables are drafted but not finalized. Implementation should wait until requirements are confirmed.

### HabitFollower (M5+)

**Purpose:** Allow friends to join/follow someone's habit for social accountability

```typescript
{
  id: string (uuid)
  habitId: string                   // The habit being followed
  userId: string                    // The follower
  ownerId: string                   // The habit owner (denormalized for queries)
  role: 'FOLLOWER' | 'PARTNER'      // FOLLOWER = one-way, PARTNER = mutual accountability
  notifyOnCheckIn: boolean          // Get notified when owner checks in
  notifyOnMiss: boolean             // Get notified when owner misses
  joinedAt: timestamp
  leftAt?: timestamp                // Soft leave (keeps history)
  syncedAt?: timestamp
}
```

**Indexes:**

- PRIMARY KEY (id)
- UNIQUE (habitId, userId)
- INDEX (userId, leftAt IS NULL) - habits I'm following
- INDEX (ownerId, leftAt IS NULL) - who's following my habits

---

### AccountabilityPartner (M5+)

**Purpose:** Dedicated partner relationship beyond regular friendship for deeper accountability

```typescript
{
  id: string (uuid)
  userId: string                    // User A
  partnerId: string                 // User B
  status: 'PENDING' | 'ACTIVE' | 'PAUSED' | 'ENDED'
  focusPillar?: Pillar              // Optional focus area
  checkInFrequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY'  // How often to sync
  lastCheckInAt?: timestamp         // Last accountability check-in
  nextCheckInAt?: timestamp         // Scheduled next check-in
  sharedHabitIds?: string           // JSON array - habits shared with partner
  sharedGoalIds?: string            // JSON array - goals shared with partner
  notes?: string                    // Private notes about partnership
  startedAt: timestamp
  endedAt?: timestamp
  createdAt: timestamp
  updatedAt: timestamp
  syncedAt?: timestamp
}
```

**Indexes:**

- PRIMARY KEY (id)
- UNIQUE (userId, partnerId)
- INDEX (userId, status)
- INDEX (partnerId, status)
- INDEX (nextCheckInAt) - for reminder scheduling

**Notes:**

- Bidirectional relationship (creates single record, not two)
- Different from Friendship - focused on accountability, not social
- checkInFrequency drives reminder notifications

---

### UserStats (M4+)

**Purpose:** Aggregated statistics for user dashboard and profile

```typescript
{
  id: string (uuid)
  userId: string
  periodType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL_TIME'
  periodStart: timestamp            // Start of period (null for ALL_TIME)

  // Habit stats
  totalCheckIns: number
  successfulCheckIns: number
  completionRate: number (0-100)
  currentStreakMax: number          // Longest active streak
  longestStreakEver: number

  // Pillar breakdown
  pillarCheckIns: string            // JSON: { MIND: 10, BODY: 20, HEART: 5, SOUL: 3 }
  pillarCompletionRates: string     // JSON: { MIND: 85, BODY: 90, HEART: 70, SOUL: 60 }

  // Goal stats
  goalsCompleted: number
  goalsInProgress: number

  // Social stats
  reactionsGiven: number
  reactionsReceived: number
  nudgesSent: number
  nudgesReceived: number
  postsCreated: number
  commentsGiven: number

  // Engagement
  activeDays: number                // Days with at least 1 check-in
  bestDayOfWeek?: number (0-6)      // Most productive day
  bestTimeOfDay?: number (0-23)     // Most productive hour

  calculatedAt: timestamp           // When stats were computed
  syncedAt?: timestamp
}
```

**Indexes:**

- PRIMARY KEY (id)
- UNIQUE (userId, periodType, periodStart)
- INDEX (userId, periodType)
- INDEX (calculatedAt) - for stale data cleanup

**Notes:**

- Recalculated periodically (daily for daily stats, weekly for weekly, etc.)
- ALL_TIME stats updated on each check-in
- Stored vs computed trade-off: store for expensive aggregations, compute for simple counts

---

### HabitStats (M4+)

**Purpose:** Per-habit aggregated statistics

```typescript
{
  id: string (uuid)
  habitId: string
  userId: string                    // Denormalized for queries
  periodType: 'WEEKLY' | 'MONTHLY' | 'ALL_TIME'
  periodStart?: timestamp

  totalCheckIns: number
  successfulCheckIns: number
  completionRate: number (0-100)
  currentStreak: number
  longestStreak: number

  // Time patterns
  avgCheckInHour?: number (0-23)
  mostFrequentDay?: number (0-6)
  avgTimeBetweenCheckIns?: number   // In hours

  // Value tracking (for numeric habits)
  avgValue?: number
  maxValue?: number
  totalValue?: number

  // Mood correlation (M4)
  avgMoodBefore?: number (1-5)
  avgMoodAfter?: number (1-5)
  moodImpact?: number (-2 to +2)    // Avg mood change

  calculatedAt: timestamp
  syncedAt?: timestamp
}
```

**Indexes:**

- PRIMARY KEY (id)
- UNIQUE (habitId, periodType, periodStart)
- INDEX (userId, periodType)
- INDEX (habitId, calculatedAt)

---

### HabitSignal (M6+)

**Purpose:** Computed signals for habit health (warnings, ribbons)

> **Decision:** May be computed at render time instead of stored. Storing provides history tracking and push notification triggers.

```typescript
{
  id: string (uuid)
  habitId: string
  userId: string                    // Denormalized
  signalType: 'AT_RISK' | 'RECOVERY' | 'HOT_STREAK' | 'MOMENTUM_LOSS' | 'PERSONAL_BEST' | 'NEEDS_ATTENTION'
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  message?: string                  // Optional display message
  metadata?: string                 // JSON with signal-specific data
  isActive: boolean                 // Currently displayed
  triggeredAt: timestamp
  resolvedAt?: timestamp            // When signal no longer applies
  acknowledgedAt?: timestamp        // User dismissed
  syncedAt?: timestamp
}
```

**Indexes:**

- PRIMARY KEY (id)
- INDEX (habitId, isActive)
- INDEX (userId, isActive, severity)
- INDEX (signalType, isActive)
- INDEX (triggeredAt DESC)

**Signal Types:**

- **AT_RISK**: Streak about to break (1 day left in grace period)
- **RECOVERY**: User bouncing back after break
- **HOT_STREAK**: Exceptional consistency (10+ days)
- **MOMENTUM_LOSS**: Declining check-in frequency
- **PERSONAL_BEST**: New longest streak
- **NEEDS_ATTENTION**: Habit neglected (no check-in in 7+ days)

---

## Not Yet Designed

The following features are identified but need more research before modeling:

1. **Goal Statistics** - Similar to HabitStats but for goals (may be simpler due to fewer dimensions)
2. **Identity Statistics** - Aggregate stats per identity (derived from linked goals/habits)
3. **Social Graph Analytics** - Friend influence, engagement patterns (privacy considerations)
4. **Push Notification Queue** - May use existing sync_queue or separate table
5. **A/B Test Assignments** - Feature flag and experiment tracking

---

## Reference

- Architecture: [architecture.md](architecture.md)
- API Contracts: [api-contracts.md](api-contracts.md)
- M1 Implementation: [M1-account-privacy.md](M1-account-privacy.md)
- M2 Implementation: [M2-habits-tracking.md](M2-habits-tracking.md)
- M3 Implementation: [M3-social.md](M3-social.md)
- M4 Implementation: [M4-identity-analytics.md](M4-identity-analytics.md)
