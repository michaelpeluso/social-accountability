// Enums
export type Privacy = "SELF" | "FRIENDS" | "CLOSE_FRIENDS" | "PUBLIC"; // CLOSE_FRIENDS added for M4
export type Pillar = "MIND" | "BODY" | "HEART" | "SOUL";
export type HabitFrequency = "daily" | "weekly" | "monthly" | "custom";
export type HabitType = "BUILD" | "BREAK"; // BUILD = maintain/grow, BREAK = break/stop bad habits (per data-model.md)
export type CompletionType = "BINARY" | "COUNT" | "DURATION"; // How to measure completion
export type CheckInSource = "MANUAL" | "INTEGRATION";
export type CircleRole = "OWNER" | "MEMBER";

// M5: Check-in outcome for BREAK habits
export type CheckInOutcome = "COMPLETED" | "RESISTED" | "LAPSED" | "SKIPPED";

// M3: Advanced Post Options
// MediaType: photo/video = user-uploaded media, chart = auto-generated visualization
// IMPORTANT: Media types are mutually exclusive:
//   - "photo" or "video": User uploads image/video (requires mediaUrl)
//   - "chart": Auto-generated graph/badge/visualization (replaces user media)
export type MediaType = "photo" | "video" | "chart";
export type PostTypeTag = "win" | "struggle" | "question" | "reflection";
export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";
export type LocationCategory = "home" | "work" | "gym" | "outdoors";
export type LinkedObjectType = "habit" | "goal" | "milestone" | "module";

// Goal Types
export type GoalDataSource = "MANUAL" | "HABIT_DERIVED" | "INTEGRATION";

// Identity preset names (M4 will expand this)
export type IdentityPreset =
  | "Student"
  | "Athlete"
  | "Parent"
  | "Artist"
  | "Professional"
  | "Friend"
  | "Partner";

// Schedule Types
export type ScheduleTime = {
  hour: number; // 0-23
  minute: number; // 0-59
};

export type ScheduleSlot = {
  dayOfWeek?: number; // 0-6, Sunday = 0 (for weekly)
  dayOfMonth?: number; // 1-31 (for monthly)
  time?: ScheduleTime; // Optional specific time
};

export type HabitSchedule = {
  frequency: HabitFrequency;
  targetCount: number; // How many times per period
  slots?: ScheduleSlot[]; // Specific times/days (e.g., Mon 5pm, Fri 4pm)
};

// Domain Models
export type User = {
  id: string;
  displayName: string;
  photoUrl?: string;
  bio?: string;
  defaultPrivacy: Privacy;
  isVacationMode?: boolean; // Global vacation mode
  vacationEndsAt?: string;
  createdAt: string;
  updatedAt?: string;
};

export type Circle = {
  id: string;
  ownerUserId: string;
  name: string;
  description?: string; // Circle description (max 500 chars)
  privacy: "INVITE_ONLY" | "PUBLIC"; // Circle privacy
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  syncedAt?: string;
};

export type CircleMember = {
  id: string;
  circleId: string;
  userId: string;
  role: CircleRole;
  joinedAt: string;
  syncedAt?: string;
};

export type CircleMessage = {
  id: string;
  circleId: string;
  userId: string;
  text: string; // Message text (max 2000 chars)
  mediaUrl?: string; // Optional image/video
  mediaType?: "photo" | "video" | "audio"; // Optional - type of media
  createdAt: string;
  deletedAt?: string; // Soft delete
  syncedAt?: string;
};

export type Identity = {
  id: string;
  userId: string;
  name: string; // "Student", "Athlete", etc.
  pillar: Pillar; // Each identity maps to one pillar
  icon: string; // Emoji
  isPreset: boolean; // True if from preset list, false if custom
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
};

// Goal Metric Types (M2+)
export type GoalMetricType = "COUNT" | "DURATION" | "DISTANCE" | "WEIGHT" | "CUSTOM";

export type Goal = {
  id: string;
  userId: string;
  title: string;
  description?: string; // Brief description (max 500 chars)
  pillar: Pillar;
  privacy: Privacy;

  // Identity (M2: optional, M4: full identity system)
  identityId?: string; // Link to Identity

  // Values
  isIndefinite: boolean; // If true, no target value (ongoing goal)
  metricType: GoalMetricType; // COUNT, DURATION, DISTANCE, WEIGHT, CUSTOM
  metricUnit?: string; // Unit label (e.g., "kg", "miles", "minutes")
  startValue?: number; // Where you're starting from
  targetValue?: number; // Where you want to get to
  currentValue?: number; // Current progress value

  // Timeframe
  startDate?: string; // When goal tracking starts
  deadline?: string; // Hard deadline for completion
  completedAt?: string; // When goal was achieved (currentValue >= targetValue)

  // Data Source
  dataSource: GoalDataSource; // MANUAL, HABIT_DERIVED, INTEGRATION

  // Linked Habits (M2: basic linking, M5: weighted contribution)
  linkedHabitIds?: string[]; // Habits contributing to this goal

  isArchived: boolean;
  archivedAt?: string;
  // Vacation mode - pause tracking for all linked habits
  isVacationMode?: boolean;
  vacationEndsAt?: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
};

export type Habit = {
  id: string;
  userId: string;
  goalId?: string;
  identityId?: string; // M4: Link to Identity
  parentHabitId?: string;
  stackAfterHabitId?: string; // M5: Habit stacking
  title: string;
  description?: string; // Brief/steps/reminder (max 500 chars)
  pillar: Pillar; // Inherited from goal or set directly

  // Type & Measurement
  habitType: HabitType; // BUILD or BREAK
  completionType: CompletionType; // How to measure (binary, count, duration)
  targetValue?: number; // Target for count/duration (e.g., 30 mins, 10 reps)
  unit?: string; // Unit label (min, reps, pages, ml, etc.)

  // Visual
  icon?: string; // Emoji or icon identifier
  tags?: string[]; // User-defined tags for filtering

  // Scheduling
  schedule: HabitSchedule;
  timezone?: string; // IANA timezone (e.g., "America/New_York")

  // Flexibility & Tolerance
  difficulty?: 1 | 2 | 3 | 4 | 5; // User-rated difficulty
  miniVersion?: string; // Minimum viable version (e.g., "1 push-up")
  graceDays?: number; // Days allowed to miss without breaking streak (0-3)

  // M4/M5: Analytics & Automation
  bestTimeHour?: number; // Best time to do habit (0-23)
  bestTimeConfidence?: number; // Confidence score (0-1)
  environmentalCue?: string; // Contextual cue
  progressiveOverload?: string; // JSON: progression rules

  // M4: Reminders
  isReminderEnabled?: boolean;
  reminderTimes?: string[]; // ISO times for reminders
  reminderText?: string; // Custom reminder text
  reflectionPrompt?: string; // Post-completion prompt

  // Privacy: who can see this habit exists/requirements (owner controls)
  privacy: Privacy;
  // Performance privacy: who can see the owner's progress on this habit (owner controls)
  // For joined habits, each participant has their own performancePrivacy in habit_participants
  performancePrivacy?: Privacy;
  isArchived: boolean;
  archivedAt?: string;
  // Streak data (cached, recalculated on check-in)
  currentStreak: number;
  longestStreak: number;
  lastCheckInAt?: string;
  lastMissedAt?: string;
  recoveryStreak: number;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
};

/**
 * Extended habit type with additional metadata for display
 * Includes owner info (for joined habits) and participant count
 */
export type HabitWithMeta = Habit & {
  // Owner info (populated when viewing joined habits)
  ownerName?: string;
  ownerPhotoUrl?: string;
  // Is this a habit the user joined (vs created)?
  isJoined?: boolean;
  // Participant performance privacy (for joined habits)
  participantPerformancePrivacy?: Privacy;
  // Participant count (for both owned and joined habits)
  participantCount?: number;
};

export type HabitCheckIn = {
  id: string;
  habitId: string;
  userId: string;
  occurredAt: string;
  source: CheckInSource;
  // Completion data
  value?: number; // For COUNT/DURATION: actual value logged (e.g., 25 mins, 8 reps)
  evidenceUrl?: string; // URL to photo/video evidence
  note?: string; // Optional note (max 500 chars)
  // M4/M5: Intensity and outcome tracking
  intensity?: number; // 1-5: For BUILD: energy level, for BREAK: temptation strength
  outcome?: CheckInOutcome; // COMPLETED/RESISTED/LAPSED (for BREAK habits)
  moodBefore?: number; // M6: mood before check-in (1-5)
  moodAfter?: number; // M6: mood after check-in (1-5)
  createdAt: string;
  syncedAt?: string;
};

// Habit participant role
export type HabitParticipantRole = "OWNER" | "MEMBER";

// Habit participant (for habit joining feature)
export type HabitParticipant = {
  id: string;
  habitId: string;
  userId: string;
  role: HabitParticipantRole;
  joinedAt: string;
  // Performance privacy: who can see this user's progress on this habit
  // Independent of habit visibility (controlled by habit owner)
  performancePrivacy: Privacy;
  syncedAt?: string;
  // Joined user info (for display)
  userName?: string;
  userPhotoUrl?: string;
};

// Goal participant role
export type GoalParticipantRole = "OWNER" | "MEMBER";

// Goal participant (for goal joining feature)
export type GoalParticipant = {
  id: string;
  goalId: string;
  userId: string;
  role: GoalParticipantRole;
  joinedAt: string;
  // Performance privacy: who can see this user's progress on this goal
  performancePrivacy: Privacy;
  syncedAt?: string;
  // Joined user info (for display)
  userName?: string;
  userPhotoUrl?: string;
};

// Goal with metadata for lists (includes owner info for joined goals)
export type GoalWithMeta = Goal & {
  ownerName?: string;
  ownerPhotoUrl?: string;
  isJoined?: boolean;
  participantPerformancePrivacy?: Privacy;
  participantCount?: number;
};

export type Post = {
  id: string;
  userId: string;
  userName?: string; // Denormalized for performance
  userPhotoUrl?: string; // Denormalized for performance
  circleId?: string;
  pillar: Pillar;
  privacy: Privacy;
  text?: string; // Post body text (max 500 chars)
  mediaUrl?: string;
  mediaAspectRatio?: "3:2" | "2:3" | "1:1"; // User-selected aspect ratio for media
  // M3: Advanced options
  mediaType?: MediaType; // Type of media (photo/video/chart)
  tags?: string[]; // Simple tags (M2-M3)
  postTypeTags?: PostTypeTag[]; // win, struggle, question, reflection
  customTags?: string[]; // User-defined tags (with # prefix)
  // Optional link to a check-in
  checkInId?: string;
  habitId?: string;
  goalId?: string;
  // M3: Link to any object type
  linkedObjectId?: string;
  linkedObjectType?: LinkedObjectType;
  // M3: Context chips (optional, privacy-controlled)
  contextTimeOfDay?: TimeOfDay;
  contextLocationId?: string; // Location category name (not coordinates)
  // Edit tracking
  editedAt?: string;
  createdAt: string;
  updatedAt?: string;
  syncedAt?: string;
};

// M3: Story - 24h TTL ephemeral posts
export type Story = {
  id: string;
  userId: string;
  userName?: string; // Denormalized
  userPhotoUrl?: string; // Denormalized
  pillar: Pillar;
  privacy: Privacy;
  mediaUrl: string; // Required - always has photo/video
  mediaType: "photo" | "video"; // Required
  caption?: string; // Optional short caption (280 char max)
  tags?: string[]; // Same as Post/Habit
  checkInId?: string; // Creates HabitCheckIn atomically
  habitId?: string;
  badges?: {
    streak?: number;
    milestone?: number; // e.g., 10th check-in
    achievement?: string; // 'first_week', 'perfect_month'
  };
  expiresAt: string; // Auto-set to +24h
  createdAt: string;
  syncedAt?: string;
};

export type CreateStoryRequest = {
  pillar: Pillar;
  privacy: Privacy;
  mediaUrl: string;
  mediaType: "photo" | "video";
  caption?: string;
  tags?: string[];
  checkInId?: string;
  habitId?: string;
};

export type CreatePostRequest = {
  circleId?: string;
  pillar: Pillar;
  privacy: Privacy;
  text?: string;
  // Media options (mutually exclusive):
  //   - For photo/video: provide mediaUrl + mediaType
  //   - For chart: system generates chart, no mediaUrl needed
  //   - Chart type posts cannot include user-uploaded images/videos
  mediaUrl?: string;
  mediaType?: MediaType;
  mediaAspectRatio?: "3:2" | "2:3" | "1:1"; // User-selected aspect ratio
  // M3: Advanced options
  postTypeTags?: PostTypeTag[];
  customTags?: string[];
  checkInId?: string;
  habitId?: string;
  goalId?: string;
  linkedObjectId?: string;
  linkedObjectType?: LinkedObjectType;
  contextTimeOfDay?: TimeOfDay;
  contextLocationId?: string;
};

// M3: Reaction target types
export type ReactionTargetType = "POST" | "STORY";

export type Reaction = {
  id: string;
  targetId: string; // postId or storyId
  targetType: ReactionTargetType; // POST or STORY
  userId: string;
  emoji: ReactionEmoji;
  createdAt: string;
  syncedAt?: string;
};

// Fixed set of allowed reaction emojis
export type ReactionEmoji = "👍" | "❤️" | "👏" | "🔥" | "📈";

export type Comment = {
  id: string;
  postId: string;
  userId: string; // Author of the comment
  text: string; // Max 50 words (word limit enforced)
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  // Joined fields (denormalized for display)
  userName?: string;
  userPhotoUrl?: string;
};

export type CreateCommentRequest = {
  postId: string;
  text: string;
};

export const ALLOWED_REACTIONS: ReactionEmoji[] = ["👍", "❤️", "👏", "🔥", "📈"];

export type Nudge = {
  id: string;
  fromUserId: string;
  toUserId: string;
  habitId?: string; // Optional: nudge about specific habit
  templateId: NudgeTemplateId;
  message?: string; // Generated from template
  createdAt: string;
  syncedAt?: string;
};

// Nudge templates (fixed set for positive-only messages)
export type NudgeTemplateId =
  | "keep-it-up"
  | "proud-streak"
  | "you-got-this"
  | "dont-break-chain"
  | "lets-do-together";

export const NUDGE_TEMPLATES: Record<NudgeTemplateId, { text: string; emoji: string }> = {
  "keep-it-up": { text: "Keep it up!", emoji: "💪" },
  "proud-streak": { text: "Proud of your streak!", emoji: "🔥" },
  "you-got-this": { text: "You've got this!", emoji: "🔥" },
  "dont-break-chain": { text: "Don't break the chain!", emoji: "⛓️" },
  "lets-do-together": { text: "Let's do this together!", emoji: "🙌" },
};

// Badge Tier System
export type BadgeTier = "bronze" | "silver" | "gold" | "platinum";

export const BADGE_TIER_THRESHOLDS: Record<BadgeTier, number> = {
  bronze: 1, // First tier (e.g., 10, 3, 1)
  silver: 2, // Second tier (e.g., 30, 10, 5)
  gold: 3, // Third tier (e.g., 100, 30, 15)
  platinum: 4, // Fourth tier (e.g., 500, 100, 50)
};

export const BADGE_TIER_COLORS: Record<BadgeTier, string> = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
  platinum: "#E5E4E2",
};

// Badge Categories (for grouping in UI)
export type BadgeCategory =
  | "posts" // Sharing posts
  | "habits" // Creating habits
  | "goals" // Completing goals
  | "checkins" // Logging check-ins
  | "streaks" // Maintaining streaks
  | "social" // Reactions, nudges, comments
  | "recovery" // Coming back after misses
  | "pillar"; // Pillar completion

// Badge Types - Now with tiered structure
export type BadgeType =
  // Tiered Badges - Posts (10, 30, 100, 500)
  | "posts-bronze"
  | "posts-silver"
  | "posts-gold"
  | "posts-platinum"
  // Tiered Badges - Habits Created (3, 10, 30, 100)
  | "habits-bronze"
  | "habits-silver"
  | "habits-gold"
  | "habits-platinum"
  // Tiered Badges - Goals Completed (1, 5, 15, 50)
  | "goals-bronze"
  | "goals-silver"
  | "goals-gold"
  | "goals-platinum"
  // Tiered Badges - Check-ins (10, 50, 200, 1000)
  | "checkins-bronze"
  | "checkins-silver"
  | "checkins-gold"
  | "checkins-platinum"
  // Tiered Badges - Reactions Given (10, 50, 200, 1000)
  | "reactions-bronze"
  | "reactions-silver"
  | "reactions-gold"
  | "reactions-platinum"
  // Tiered Badges - Nudges Sent (5, 20, 75, 300)
  | "nudges-bronze"
  | "nudges-silver"
  | "nudges-gold"
  | "nudges-platinum"
  // Tiered Badges - Comments Made (10, 30, 100, 500)
  | "comments-bronze"
  | "comments-silver"
  | "comments-gold"
  | "comments-platinum"
  // Streak badges (legacy format kept for compatibility)
  | "streak-7"
  | "streak-30"
  | "streak-100"
  // Legacy milestone badges (kept for backwards compatibility)
  | "habits-10"
  | "checkins-100"
  | "checkins-1000"
  // Recovery badges
  | "recovery-3"
  | "recovery-7"
  // Pillar badges
  | "pillar-mind-90"
  | "pillar-body-90"
  | "pillar-heart-90"
  | "pillar-soul-90"
  // Social badges
  | "reactions-50"
  | "nudges-10";

export type Badge = {
  id: string;
  userId: string;
  badgeType: BadgeType;
  pillar?: Pillar; // For pillar-specific badges
  habitId?: string; // For habit-specific badges
  tier?: BadgeTier; // Badge tier (bronze, silver, gold, platinum)
  metadata?: Record<string, unknown>; // Extra badge data
  earnedAt: string;
  sharedAt?: string; // If user shared badge as post
  syncedAt?: string;
};

// Tiered badge definitions with thresholds for each tier
export type TieredBadgeDefinition = {
  category: BadgeCategory;
  name: string;
  emoji: string;
  thresholds: { bronze: number; silver: number; gold: number; platinum: number };
  getDescription: (tier: BadgeTier, threshold: number) => string;
};

export const TIERED_BADGE_DEFINITIONS: Record<string, TieredBadgeDefinition> = {
  posts: {
    category: "posts",
    name: "Storyteller",
    emoji: "📝",
    thresholds: { bronze: 10, silver: 30, gold: 100, platinum: 500 },
    getDescription: (_tier, threshold) => `Shared ${threshold} posts`,
  },
  habits: {
    category: "habits",
    name: "Architect",
    emoji: "🏗️",
    thresholds: { bronze: 3, silver: 10, gold: 30, platinum: 100 },
    getDescription: (_tier, threshold) => `Created ${threshold} habits`,
  },
  goals: {
    category: "goals",
    name: "Achiever",
    emoji: "🎯",
    thresholds: { bronze: 1, silver: 5, gold: 15, platinum: 50 },
    getDescription: (_tier, threshold) =>
      threshold === 1 ? "Completed first goal" : `Completed ${threshold} goals`,
  },
  checkins: {
    category: "checkins",
    name: "Consistent",
    emoji: "✅",
    thresholds: { bronze: 10, silver: 50, gold: 200, platinum: 1000 },
    getDescription: (_tier, threshold) => `Logged ${threshold} check-ins`,
  },
  reactions: {
    category: "social",
    name: "Supporter",
    emoji: "👏",
    thresholds: { bronze: 10, silver: 50, gold: 200, platinum: 1000 },
    getDescription: (_tier, threshold) => `Gave ${threshold} reactions`,
  },
  nudges: {
    category: "social",
    name: "Cheerleader",
    emoji: "📣",
    thresholds: { bronze: 5, silver: 20, gold: 75, platinum: 300 },
    getDescription: (_tier, threshold) => `Sent ${threshold} nudges`,
  },
  comments: {
    category: "social",
    name: "Conversationalist",
    emoji: "💬",
    thresholds: { bronze: 10, silver: 30, gold: 100, platinum: 500 },
    getDescription: (_tier, threshold) => `Made ${threshold} comments`,
  },
};

// Helper to get tier rarity
export const TIER_RARITY: Record<BadgeTier, "common" | "rare" | "epic" | "legendary"> = {
  bronze: "common",
  silver: "rare",
  gold: "epic",
  platinum: "legendary",
};

// Helper to get badge info for tiered badges
export function getTieredBadgeInfo(badgeType: BadgeType): {
  name: string;
  description: string;
  emoji: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  tier: BadgeTier;
  category: BadgeCategory;
} | null {
  // Parse badge type (e.g., "posts-bronze" -> { base: "posts", tier: "bronze" })
  const tiers: BadgeTier[] = ["bronze", "silver", "gold", "platinum"];
  for (const tier of tiers) {
    if (badgeType.endsWith(`-${tier}`)) {
      const base = badgeType.replace(`-${tier}`, "");
      const definition = TIERED_BADGE_DEFINITIONS[base];
      if (definition) {
        const threshold = definition.thresholds[tier];
        return {
          name: `${definition.name} (${tier.charAt(0).toUpperCase() + tier.slice(1)})`,
          description: definition.getDescription(tier, threshold),
          emoji: definition.emoji,
          rarity: TIER_RARITY[tier],
          tier,
          category: definition.category,
        };
      }
    }
  }
  return null;
}

export const BADGE_INFO: Record<
  BadgeType,
  {
    name: string;
    description: string;
    emoji: string;
    rarity: "common" | "rare" | "epic" | "legendary";
  }
> = {
  // Tiered Posts Badges
  "posts-bronze": {
    name: "Storyteller (Bronze)",
    description: "Shared 10 posts",
    emoji: "📝",
    rarity: "common",
  },
  "posts-silver": {
    name: "Storyteller (Silver)",
    description: "Shared 30 posts",
    emoji: "📝",
    rarity: "rare",
  },
  "posts-gold": {
    name: "Storyteller (Gold)",
    description: "Shared 100 posts",
    emoji: "📝",
    rarity: "epic",
  },
  "posts-platinum": {
    name: "Storyteller (Platinum)",
    description: "Shared 500 posts",
    emoji: "📝",
    rarity: "legendary",
  },
  // Tiered Habits Badges
  "habits-bronze": {
    name: "Architect (Bronze)",
    description: "Created 3 habits",
    emoji: "🏗️",
    rarity: "common",
  },
  "habits-silver": {
    name: "Architect (Silver)",
    description: "Created 10 habits",
    emoji: "🏗️",
    rarity: "rare",
  },
  "habits-gold": {
    name: "Architect (Gold)",
    description: "Created 30 habits",
    emoji: "🏗️",
    rarity: "epic",
  },
  "habits-platinum": {
    name: "Architect (Platinum)",
    description: "Created 100 habits",
    emoji: "🏗️",
    rarity: "legendary",
  },
  // Tiered Goals Badges
  "goals-bronze": {
    name: "Achiever (Bronze)",
    description: "Completed first goal",
    emoji: "🎯",
    rarity: "common",
  },
  "goals-silver": {
    name: "Achiever (Silver)",
    description: "Completed 5 goals",
    emoji: "🎯",
    rarity: "rare",
  },
  "goals-gold": {
    name: "Achiever (Gold)",
    description: "Completed 15 goals",
    emoji: "🎯",
    rarity: "epic",
  },
  "goals-platinum": {
    name: "Achiever (Platinum)",
    description: "Completed 50 goals",
    emoji: "🎯",
    rarity: "legendary",
  },
  // Tiered Check-ins Badges
  "checkins-bronze": {
    name: "Consistent (Bronze)",
    description: "Logged 10 check-ins",
    emoji: "✅",
    rarity: "common",
  },
  "checkins-silver": {
    name: "Consistent (Silver)",
    description: "Logged 50 check-ins",
    emoji: "✅",
    rarity: "rare",
  },
  "checkins-gold": {
    name: "Consistent (Gold)",
    description: "Logged 200 check-ins",
    emoji: "✅",
    rarity: "epic",
  },
  "checkins-platinum": {
    name: "Consistent (Platinum)",
    description: "Logged 1000 check-ins",
    emoji: "✅",
    rarity: "legendary",
  },
  // Tiered Reactions Badges
  "reactions-bronze": {
    name: "Supporter (Bronze)",
    description: "Gave 10 reactions",
    emoji: "👏",
    rarity: "common",
  },
  "reactions-silver": {
    name: "Supporter (Silver)",
    description: "Gave 50 reactions",
    emoji: "👏",
    rarity: "rare",
  },
  "reactions-gold": {
    name: "Supporter (Gold)",
    description: "Gave 200 reactions",
    emoji: "👏",
    rarity: "epic",
  },
  "reactions-platinum": {
    name: "Supporter (Platinum)",
    description: "Gave 1000 reactions",
    emoji: "👏",
    rarity: "legendary",
  },
  // Tiered Nudges Badges
  "nudges-bronze": {
    name: "Cheerleader (Bronze)",
    description: "Sent 5 nudges",
    emoji: "📣",
    rarity: "common",
  },
  "nudges-silver": {
    name: "Cheerleader (Silver)",
    description: "Sent 20 nudges",
    emoji: "📣",
    rarity: "rare",
  },
  "nudges-gold": {
    name: "Cheerleader (Gold)",
    description: "Sent 75 nudges",
    emoji: "📣",
    rarity: "epic",
  },
  "nudges-platinum": {
    name: "Cheerleader (Platinum)",
    description: "Sent 300 nudges",
    emoji: "📣",
    rarity: "legendary",
  },
  // Tiered Comments Badges
  "comments-bronze": {
    name: "Conversationalist (Bronze)",
    description: "Made 10 comments",
    emoji: "💬",
    rarity: "common",
  },
  "comments-silver": {
    name: "Conversationalist (Silver)",
    description: "Made 30 comments",
    emoji: "💬",
    rarity: "rare",
  },
  "comments-gold": {
    name: "Conversationalist (Gold)",
    description: "Made 100 comments",
    emoji: "💬",
    rarity: "epic",
  },
  "comments-platinum": {
    name: "Conversationalist (Platinum)",
    description: "Made 500 comments",
    emoji: "💬",
    rarity: "legendary",
  },
  // Streak badges
  "streak-7": { name: "Week Warrior", description: "7-day streak", emoji: "🔥", rarity: "common" },
  "streak-30": {
    name: "Monthly Master",
    description: "30-day streak",
    emoji: "🏆",
    rarity: "rare",
  },
  "streak-100": {
    name: "Century Club",
    description: "100-day streak",
    emoji: "💯",
    rarity: "epic",
  },
  "habits-10": {
    name: "Habit Builder",
    description: "Created 10 habits",
    emoji: "🛠️",
    rarity: "common",
  },
  "checkins-100": {
    name: "Consistent",
    description: "100 check-ins logged",
    emoji: "✅",
    rarity: "common",
  },
  "checkins-1000": {
    name: "Dedication",
    description: "1000 check-ins logged",
    emoji: "⭐",
    rarity: "epic",
  },
  "recovery-3": {
    name: "Comeback Kid",
    description: "Recovered after 3-day miss",
    emoji: "💪",
    rarity: "common",
  },
  "recovery-7": {
    name: "Resilient",
    description: "Recovered after 7-day miss",
    emoji: "🦸",
    rarity: "rare",
  },
  "pillar-mind-90": {
    name: "Sharp Mind",
    description: "90% MIND completion for a month",
    emoji: "🧠",
    rarity: "rare",
  },
  "pillar-body-90": {
    name: "Peak Physical",
    description: "90% BODY completion for a month",
    emoji: "💪",
    rarity: "rare",
  },
  "pillar-heart-90": {
    name: "Big Heart",
    description: "90% HEART completion for a month",
    emoji: "❤️",
    rarity: "rare",
  },
  "pillar-soul-90": {
    name: "Soulful",
    description: "90% SOUL completion for a month",
    emoji: "🔥",
    rarity: "rare",
  },
  "reactions-50": {
    name: "Supporter",
    description: "Gave 50 reactions",
    emoji: "👏",
    rarity: "common",
  },
  "nudges-10": {
    name: "Cheerleader",
    description: "Sent 10 nudges",
    emoji: "📣",
    rarity: "common",
  },
};

// Notification Types
export type NotificationType =
  | "REACTION_RECEIVED"
  | "COMMENT_RECEIVED"
  | "NUDGE_RECEIVED"
  | "BADGE_EARNED"
  | "FRIEND_POSTED"
  | "HABIT_REMINDER"
  | "HABIT_JOIN_REQUEST"
  | "HABIT_JOIN_ACCEPTED"
  | "HABIT_MEMBER_JOINED"
  | "GOAL_JOIN_REQUEST"
  | "GOAL_JOIN_ACCEPTED"
  | "GOAL_MEMBER_JOINED"
  | "CIRCLE_POST"
  | "CIRCLE_MESSAGE"
  | "CIRCLE_INVITE"
  | "CIRCLE_MEMBER_JOINED"
  | "FRIEND_REQUEST";

export type AppNotification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  text: string; // Notification body
  data?: Record<string, string>; // Navigation data
  isRead: boolean;
  createdAt: string;
};

// API Types
export type ApiError = {
  code: string;
  message: string;
};

export type ApiResponse<T> = { data: T } | { error: ApiError };

export type PaginatedResponse<T> = {
  data: T[];
  nextCursor?: string;
};

// Request Types
export type CreateGoalRequest = {
  title: string;
  description?: string;
  pillar: Pillar;
  privacy: Privacy;
  identityId?: string;
  isIndefinite: boolean;
  startValue?: number;
  targetValue?: number;
  startDate?: string;
  deadline?: string;
  dataSource: GoalDataSource;
  linkedHabitIds?: string[];
};

export type CreateHabitRequest = {
  title: string;
  goalId?: string;
  parentHabitId?: string;
  schedule: HabitSchedule;
  privacy: Privacy;
};

export type CreateCheckInRequest = {
  occurredAt: string;
  source?: CheckInSource;
  evidenceUrl?: string;
  note?: string;
  value?: number;
  intensity?: number;
  outcome?: CheckInOutcome;
};

export type CreateReactionRequest = {
  targetId: string;
  targetType: "POST" | "STORY";
  emoji: ReactionEmoji;
};

export type CreateNudgeRequest = {
  toUserId: string;
  templateId: NudgeTemplateId;
};

export type CreateBadgeRequest = {
  userId: string;
  badgeType: BadgeType;
};

// Feed types
export type FeedScope = "friends" | "discover" | "mine";

export type FeedPost = Post & {
  reactions: { emoji: ReactionEmoji; count: number; userReacted: boolean }[];
  linkedHabitTitle?: string;
  linkedCheckInDate?: string;
  commentCount?: number;
};

// Rate limit constants
export const RATE_LIMITS = {
  POSTS_PER_DAY: 20,
  REACTIONS_PER_DAY: 100,
  COMMENTS_PER_DAY: 50,
  NUDGES_PER_PAIR_PER_DAY: 3,
  NUDGES_TOTAL_PER_DAY: 10,
} as const;

// ============================================
// M4+ TYPES: Journal, Mood, Challenges
// ============================================

// Journal entry (M4)
export type JournalEntry = {
  id: string;
  userId: string;
  text: string;
  mood?: number; // 1-5 scale
  pillar?: Pillar;
  privacy: Privacy;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
};

// Mood entry (M4: quick mood logging)
export type MoodEntry = {
  id: string;
  userId: string;
  mood: number; // 1-5 scale
  note?: string;
  createdAt: string;
  syncedAt?: string;
};

// Challenge (M4+)
export type Challenge = {
  id: string;
  creatorUserId: string;
  title: string;
  description?: string;
  habitId?: string;
  startDate: string;
  endDate: string;
  privacy: Privacy;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
};

// Challenge participant
export type ChallengeParticipant = {
  id: string;
  challengeId: string;
  userId: string;
  status: "ACTIVE" | "COMPLETED" | "QUIT";
  score: number;
  joinedAt: string;
  completedAt?: string;
  syncedAt?: string;
};

// ============================================
// M5+ TYPES: Integrations, Triggers, Stacks
// ============================================

// Integration provider types
export type IntegrationProvider =
  | "APPLE_HEALTH"
  | "GOOGLE_FIT"
  | "STRAVA"
  | "OURA"
  | "WHOOP"
  | "SCREEN_TIME";

// Connected integration
export type Integration = {
  id: string;
  userId: string;
  provider: IntegrationProvider;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  scopes?: string[];
  isEnabled: boolean;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
};

// Auto-logged data from integrations
export type AutoLog = {
  id: string;
  userId: string;
  integrationId: string;
  metricType: string;
  value: number;
  unit?: string;
  occurredAt: string;
  rawData?: Record<string, unknown>;
  createdAt: string;
  syncedAt?: string;
};

// Habit stack (M5: habit chaining)
export type HabitStack = {
  id: string;
  userId: string;
  name: string;
  habitIds: string[];
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
};

// Trigger types for habit automation
export type TriggerType = "LOCATION" | "TIME" | "EVENT" | "COMPLETION";

// Habit trigger
export type HabitTrigger = {
  id: string;
  habitId: string;
  triggerType: TriggerType;
  locationId?: string;
  timeRange?: { start: string; end: string };
  eventType?: string;
  createdAt: string;
  syncedAt?: string;
};

// Saved location (M5: location-based triggers)
export type SavedLocation = {
  id: string;
  userId: string;
  name: string;
  category: LocationCategory;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
};

// ============================================
// M6 TYPES: Behavioral Drift
// ============================================

// Behavioral drift detection
export type DriftType = "MOMENTUM_LOSS" | "OVERCONSUMPTION" | "PATTERN_CHANGE" | "STREAK_RISK";
export type DriftSeverity = "LOW" | "MEDIUM" | "HIGH";

export type BehavioralDrift = {
  id: string;
  userId: string;
  habitId?: string;
  pillar?: Pillar;
  driftType: DriftType;
  severity: DriftSeverity;
  detectedAt: string;
  resolvedAt?: string;
  supportRequestedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  syncedAt?: string;
};

// ============================================
// M8 TYPES: Tags
// ============================================

// User-defined tag
export type Tag = {
  id: string;
  userId: string;
  name: string;
  color?: string;
  createdAt: string;
  syncedAt?: string;
};
