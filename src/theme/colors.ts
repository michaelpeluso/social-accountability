/**
 * Color Palette
 * Central color constants for the app theme
 */

export const colors = {
  // Brand colors
  primary: "#007AFF", // iOS blue
  secondary: "#5856D6", // Purple
  success: "#34C759", // Green
  warning: "#FF9500", // Orange
  danger: "#FF3B30", // Red

  // Neutral colors
  black: "#000000",
  white: "#FFFFFF",
  gray: {
    50: "#F2F2F7",
    100: "#E5E5EA",
    200: "#D1D1D6",
    300: "#C7C7CC",
    400: "#AEAEB2",
    500: "#8E8E93",
    600: "#636366",
    700: "#48484A",
    800: "#3A3A3C",
    900: "#1C1C1E",
  },

  // Commonly used grays (for quick access)
  lightGray: "#ccc",
  mediumGray: "#999",
  darkGray: "#666",
  borderLight: "#eee",
  borderMedium: "#e5e5e5",
  backgroundLight: "#fafafa",
  backgroundMedium: "#f5f5f5",
  backgroundGray: "#f0f0f0",

  // Pillar colors (from vision.md)
  pillars: {
    MIND: "#6366F1", // Indigo
    BODY: "#10B981", // Green
    HEART: "#EF4444", // Red
    SOUL: "#8B5CF6", // Purple
  },

  // Semantic colors
  background: {
    light: "#FFFFFF",
    dark: "#000000",
    secondaryLight: "#F2F2F7",
    secondaryDark: "#1C1C1E",
  },

  text: {
    primary: {
      light: "#000000",
      dark: "#FFFFFF",
    },
    secondary: {
      light: "#3A3A3C",
      dark: "#AEAEB2",
    },
    tertiary: {
      light: "#8E8E93",
      dark: "#636366",
    },
  },

  // Component-specific
  card: {
    background: {
      light: "#FFFFFF",
      dark: "#1C1C1E",
    },
    border: {
      light: "#E5E5EA",
      dark: "#3A3A3C",
    },
  },

  input: {
    background: {
      light: "#F2F2F7",
      dark: "#1C1C1E",
    },
    border: {
      light: "#D1D1D6",
      dark: "#48484A",
    },
    placeholder: {
      light: "#8E8E93",
      dark: "#8E8E93",
    },
  },

  button: {
    primary: {
      background: "#007AFF",
      text: "#FFFFFF",
    },
    secondary: {
      background: "#F2F2F7",
      text: "#000000",
    },
    danger: {
      background: "#FF3B30",
      text: "#FFFFFF",
    },
  },

  // Badge rarity colors
  badges: {
    common: "#8E8E93", // Gray
    rare: "#007AFF", // Blue
    epic: "#8B5CF6", // Purple
    legendary: "#F59E0B", // Gold
  },
} as const;

export type Color = keyof typeof colors;
export type PillarColor = keyof typeof colors.pillars;
export type BadgeRarity = keyof typeof colors.badges;
