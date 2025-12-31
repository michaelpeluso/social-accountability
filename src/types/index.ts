// Enums
export type Privacy = "SELF" | "CIRCLE" | "PUBLIC";
export type Pillar = "MIND" | "BODY" | "HEART" | "SOUL";
export type HabitFrequency = "daily" | "weekly";
export type CheckInSource = "MANUAL" | "INTEGRATION";
export type CircleRole = "OWNER" | "MEMBER";

// Schedule Type
export type HabitSchedule = {
  frequency: HabitFrequency;
  targetCount: number;
  daysOfWeek?: number[]; // 0-6, Sunday = 0
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

export type Goal = {
  id: string;
  userId: string;
  title: string;
  pillar: Pillar;
  privacy: Privacy;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type Habit = {
  id: string;
  userId: string;
  goalId?: string;
  parentHabitId?: string;
  title: string;
  schedule: HabitSchedule;
  privacy: Privacy;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type HabitCheckIn = {
  id: string;
  habitId: string;
  userId: string;
  occurredAt: string;
  source: CheckInSource;
  evidenceRef?: string;
  createdAt: string;
};

export type Post = {
  id: string;
  authorUserId: string;
  circleId?: string;
  pillar: Pillar;
  privacy: Privacy;
  bodyText?: string;
  mediaUrl?: string;
  createdAt: string;
};

export type Reaction = {
  id: string;
  postId: string;
  userId: string;
  emoji: string;
  createdAt: string;
};

export type Nudge = {
  id: string;
  fromUserId: string;
  toUserId: string;
  templateId: string;
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
  pillar: Pillar;
  privacy: Privacy;
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
};

export type CreateReactionRequest = {
  emoji: string;
};

export type CreateNudgeRequest = {
  toUserId: string;
  templateId: string;
};
