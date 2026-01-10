/**
 * Dark Theme Tokens
 * Alternative theme mapping for dark mode
 *
 * To activate: Change the import in src/theme/index.ts from "./tokens.light" to "./tokens.dark"
 */

import { colors } from "./colors";
import { spacing, borderRadius, borderWidth, shadow } from "./spacing";
import { typography } from "./typography";

export const theme = {
  // Card styling
  card: {
    background: colors.gray[900],
    border: colors.gray[700],
    shadow: shadow.medium,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },

  // Input/Form styling
  input: {
    background: colors.gray[800],
    border: colors.gray[700],
    borderFocus: colors.primary,
    borderError: colors.danger,
    text: colors.white,
    placeholder: colors.gray[500],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: borderWidth.thick,
  },

  // Button styling
  button: {
    primary: {
      background: colors.primary,
      text: colors.white,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    secondary: {
      background: colors.gray[800],
      text: colors.white,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    danger: {
      background: colors.danger,
      text: colors.white,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
  },

  // Text styling
  text: {
    primary: colors.text.primary.dark,
    secondary: colors.text.secondary.dark,
    tertiary: colors.text.tertiary.dark,
    link: colors.primary,
    error: colors.danger,
    success: colors.success,
  },

  // Background colors
  background: {
    primary: colors.black,
    secondary: colors.gray[900],
    tertiary: colors.gray[800],
    elevated: colors.gray[900],
  },

  // Border colors
  border: {
    light: colors.gray[800],
    medium: colors.gray[700],
    dark: colors.gray[600],
    focus: colors.primary,
    error: colors.danger,
  },

  // Spacing (semantic names)
  space: {
    screenPadding: spacing.md,
    sectionGap: spacing.lg,
    cardPadding: spacing.md,
    listItemPadding: spacing.sm,
    componentGap: spacing.sm,
    inlineGap: spacing.xs,
  },

  // Border radius (semantic names)
  radius: {
    small: borderRadius.sm,
    medium: borderRadius.md,
    large: borderRadius.lg,
    pill: borderRadius.full,
  },

  // Typography (semantic names)
  typography: {
    h1: {
      fontSize: typography.heading.h1.fontSize,
      fontWeight: typography.heading.h1.fontWeight,
      lineHeight: typography.heading.h1.lineHeight,
    },
    h2: {
      fontSize: typography.heading.h2.fontSize,
      fontWeight: typography.heading.h2.fontWeight,
      lineHeight: typography.heading.h2.lineHeight,
    },
    h3: {
      fontSize: typography.heading.h3.fontSize,
      fontWeight: typography.heading.h3.fontWeight,
      lineHeight: typography.heading.h3.lineHeight,
    },
    body: {
      fontSize: typography.body.base.fontSize,
      fontWeight: typography.body.base.fontWeight,
      lineHeight: typography.body.base.lineHeight,
    },
    bodySmall: {
      fontSize: typography.body.small.fontSize,
      fontWeight: typography.body.small.fontWeight,
      lineHeight: typography.body.small.lineHeight,
    },
    caption: {
      fontSize: typography.caption.fontSize,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.lineHeight,
    },
    button: {
      fontSize: typography.button.fontSize,
      fontWeight: typography.button.fontWeight,
      lineHeight: typography.button.lineHeight,
    },
  },

  // Pillar colors (preserved from design system)
  pillars: colors.pillars,

  // Badge colors (preserved from design system)
  badges: colors.badges,

  // Semantic colors
  semantic: {
    primary: colors.primary,
    secondary: colors.secondary,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
  },

  // Shadows
  shadow: {
    small: shadow.small,
    medium: shadow.medium,
    large: shadow.large,
  },

  // Selection/Active states
  interactive: {
    background: colors.gray[800],
    backgroundSelected: colors.gray[700],
    border: colors.gray[700],
    borderSelected: colors.white,
    borderDisabled: colors.gray[600],
  },
} as const;

export type Theme = typeof theme;
