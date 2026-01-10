/**
 * Goal and Habit display utilities for M2
 * Types are defined in ./index.ts - this file provides display constants
 */

import type { Pillar } from "./index";
import { colors } from "../theme";

// Re-export types from index for convenience
export type {
  Pillar,
  Goal,
  Habit,
  HabitCheckIn,
  HabitSchedule,
  HabitFrequency,
  CheckInSource,
  CreateGoalRequest,
  CreateHabitRequest,
  CreateCheckInRequest,
} from "./index";

// Pillar display info for UI
export const PILLAR_INFO: Record<Pillar, { label: string; emoji: string; color: string }> = {
  MIND: { label: "Mind", emoji: "🧠", color: colors.pillars.MIND },
  BODY: { label: "Body", emoji: "💪", color: colors.pillars.BODY },
  HEART: { label: "Heart", emoji: "❤️", color: colors.pillars.HEART },
  SOUL: { label: "Soul", emoji: "✨", color: colors.pillars.SOUL },
};

// All pillars for iteration
export const ALL_PILLARS: Pillar[] = ["MIND", "BODY", "HEART", "SOUL"];

// Privacy display info for UI
export const PRIVACY_INFO: Record<string, { label: string; description: string }> = {
  SELF: { label: "Private", description: "Only you can see" },
  FRIENDS: { label: "Friends", description: "Your friends can see" },
  PUBLIC: { label: "Public", description: "Anyone can see" },
};
