// Enums
export type Privacy = "SELF" | "FRIENDS" | "PUBLIC";
export type Pillar = "MIND" | "BODY" | "HEART" | "SOUL";
export type HabitFrequency = "daily" | "weekly" | "monthly" | "custom";
export type HabitType = "BUILD" | "QUIT"; // BUILD = maintain/grow, QUIT = break/stop
export type CompletionType = "BINARY" | "COUNT" | "DURATION"; // How to measure completion
export type CheckInSource = "MANUAL" | "INTEGRATION";
export type CircleRole = "OWNER" | "MEMBER";

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
  createdAt: string;
};

export type Circle = {
  id: string;
  ownerUserId: string;
  name: string;
  createdAt: string;
};

export type CircleMember = {
  circleId: string;
  userId: string;
  role: CircleRole;
  createdAt: string;
};

export type Identity = {
  id: string;
  userId: string;
  name: string; // "Student", "Athlete", etc.
  pillar: Pillar; // Each identity maps to one pillar
  icon: string; // Emoji
  preset: boolean; // True if from preset list, false if custom
  createdAt: string;
};

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
  startValue?: number; // Where you're starting from
  targetValue?: number; // Where you want to get to
  currentValue?: number; // Current progress value

  // Timeframe
  startDate?: string; // When goal tracking starts
  deadline?: string; // Hard deadline for completion

  // Data Source
  dataSource: GoalDataSource; // MANUAL, HABIT_DERIVED, INTEGRATION

  // Linked Habits (M2: basic linking, M5: weighted contribution)
  linkedHabitIds?: string[]; // Habits contributing to this goal

  // Future: Metric/unit from tracked data sources (M5+)
  // dataSourceMetric?: string; // e.g., "weight", "steps", "instagram_time"

  // Future: Reward on completion (M4)
  // reward?: string;

  isArchived: boolean;
  archivedAt?: string;
  // Vacation mode - pause tracking for all linked habits
  vacationMode?: boolean;
  vacationEndsAt?: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
};

export type Habit = {
  id: string;
  userId: string;
  goalId?: string;
  parentHabitId?: string;
  title: string;
  description?: string; // Brief/steps/reminder (max 500 chars)
  pillar: Pillar; // Inherited from goal or set directly

  // Type & Measurement
  habitType: HabitType; // BUILD or QUIT
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

  // Future: Triggers & Context (M5)
  // triggerId?: string;
  // cue?: string;
  // stackAfterHabitId?: string;

  // Future: Reminders (M4)
  // reminderEnabled?: boolean;
  // reminderTimes?: string[];
  // reminderText?: string;
  // reflectionPrompt?: string;

  privacy: Privacy;
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

export type HabitCheckIn = {
  id: string;
  habitId: string;
  userId: string;
  occurredAt: string;
  source: CheckInSource;
  // Completion data
  value?: number; // For COUNT/DURATION: actual value logged (e.g., 25 mins, 8 reps)
  evidenceRef?: string;
  note?: string; // Optional note (max 500 chars)
  createdAt: string;
  syncedAt?: string;
};

export type Post = {
  id: string;
  authorUserId: string;
  circleId?: string;
  pillar: Pillar;
  privacy: Privacy;
  bodyText?: string;
  mediaUrl?: string;
  // Optional link to a check-in
  linkedCheckInId?: string;
  linkedHabitId?: string;
  // Edit tracking
  editedAt?: string;
  createdAt: string;
  syncedAt?: string;
};

export type Reaction = {
  id: string;
  postId: string;
  userId: string;
  emoji: ReactionEmoji;
  createdAt: string;
  syncedAt?: string;
};

// Fixed set of allowed reaction emojis
export type ReactionEmoji = "👏" | "🔥" | "💪" | "❤️" | "✨";

export const ALLOWED_REACTIONS: ReactionEmoji[] = ["👏", "🔥", "💪", "❤️", "✨"];

export type Nudge = {
  id: string;
  fromUserId: string;
  toUserId: string;
  templateId: NudgeTemplateId;
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
  "you-got-this": { text: "You've got this!", emoji: "✨" },
  "dont-break-chain": { text: "Don't break the chain!", emoji: "⛓️" },
  "lets-do-together": { text: "Let's do this together!", emoji: "🙌" },
};

// Badge Types
export type BadgeType =
  // Streak badges
  | "streak-7"
  | "streak-30"
  | "streak-100"
  // Milestone badges
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
  earnedAt: string;
  sharedAt?: string; // If user shared badge as post
  syncedAt?: string;
};

export const BADGE_INFO: Record<
  BadgeType,
  {
    name: string;
    description: string;
    emoji: string;
    rarity: "common" | "rare" | "epic" | "legendary";
  }
> = {
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
    emoji: "✨",
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
  | "NUDGE_RECEIVED"
  | "BADGE_EARNED"
  | "FRIEND_POSTED"
  | "HABIT_REMINDER";

export type AppNotification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>; // Navigation data
  read: boolean;
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
  evidenceRef?: string;
};

export type CreatePostRequest = {
  pillar: Pillar;
  privacy: Privacy;
  bodyText?: string;
  mediaUrl?: string;
  circleId?: string;
  linkedCheckInId?: string;
  linkedHabitId?: string;
};

export type CreateReactionRequest = {
  postId: string;
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
  authorName: string;
  authorAvatarUrl?: string;
  reactions: { emoji: ReactionEmoji; count: number; userReacted: boolean }[];
  linkedHabitTitle?: string;
  linkedCheckInDate?: string;
};

// Rate limit constants
export const RATE_LIMITS = {
  POSTS_PER_DAY: 20,
  REACTIONS_PER_DAY: 100,
  NUDGES_PER_PAIR_PER_DAY: 3,
  NUDGES_TOTAL_PER_DAY: 10,
} as const;
