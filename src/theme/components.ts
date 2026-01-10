/**
 * Reusable Component Styles
 * Common styles for buttons, cards, inputs, etc.
 */

import { StyleSheet } from "react-native";
import { colors } from "./colors";
import { spacing, borderRadius, borderWidth, shadow } from "./spacing";
import { typography } from "./typography";

export const componentStyles = {
  // Button styles
  button: StyleSheet.create({
    base: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    primary: {
      backgroundColor: colors.button.primary.background,
    },
    secondary: {
      backgroundColor: colors.button.secondary.background,
    },
    danger: {
      backgroundColor: colors.button.danger.background,
    },
    text: {
      fontSize: typography.button.fontSize,
      fontWeight: typography.button.fontWeight,
      lineHeight: typography.button.lineHeight * typography.button.fontSize,
    },
    textPrimary: {
      color: colors.button.primary.text,
    },
    textSecondary: {
      color: colors.button.secondary.text,
    },
  }),

  // Card styles
  card: StyleSheet.create({
    base: {
      backgroundColor: colors.card.background.light,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      borderWidth: borderWidth.thin,
      borderColor: colors.card.border.light,
    },
    shadow: {
      shadowColor: colors.black,
      ...shadow.medium,
    },
  }),

  // Input styles
  input: StyleSheet.create({
    base: {
      backgroundColor: colors.input.background.light,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      fontSize: typography.fontSize.base,
      borderWidth: borderWidth.normal,
      borderColor: colors.input.border.light,
    },
    focus: {
      borderColor: colors.primary,
      borderWidth: borderWidth.thick,
    },
    error: {
      borderColor: colors.danger,
    },
  }),

  // Text styles
  text: StyleSheet.create({
    h1: {
      fontSize: typography.heading.h1.fontSize,
      fontWeight: typography.heading.h1.fontWeight,
      lineHeight: typography.heading.h1.fontSize * typography.heading.h1.lineHeight,
      color: colors.text.primary.light,
    },
    h2: {
      fontSize: typography.heading.h2.fontSize,
      fontWeight: typography.heading.h2.fontWeight,
      lineHeight: typography.heading.h2.fontSize * typography.heading.h2.lineHeight,
      color: colors.text.primary.light,
    },
    h3: {
      fontSize: typography.heading.h3.fontSize,
      fontWeight: typography.heading.h3.fontWeight,
      lineHeight: typography.heading.h3.fontSize * typography.heading.h3.lineHeight,
      color: colors.text.primary.light,
    },
    body: {
      fontSize: typography.body.base.fontSize,
      fontWeight: typography.body.base.fontWeight,
      lineHeight: typography.body.base.fontSize * typography.body.base.lineHeight,
      color: colors.text.primary.light,
    },
    bodySecondary: {
      fontSize: typography.body.base.fontSize,
      fontWeight: typography.body.base.fontWeight,
      lineHeight: typography.body.base.fontSize * typography.body.base.lineHeight,
      color: colors.text.secondary.light,
    },
    caption: {
      fontSize: typography.caption.fontSize,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.fontSize * typography.caption.lineHeight,
      color: colors.text.tertiary.light,
    },
  }),

  // Badge styles
  badge: StyleSheet.create({
    base: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: borderRadius.full,
      alignItems: "center",
      justifyContent: "center",
    },
    common: {
      backgroundColor: colors.badges.common,
    },
    rare: {
      backgroundColor: colors.badges.rare,
    },
    epic: {
      backgroundColor: colors.badges.epic,
    },
    legendary: {
      backgroundColor: colors.badges.legendary,
    },
    text: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
      color: colors.white,
    },
  }),

  // Chip styles (for pillars, tags)
  chip: StyleSheet.create({
    base: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: borderRadius.full,
      alignItems: "center",
      justifyContent: "center",
    },
    mind: {
      backgroundColor: colors.pillars.MIND,
    },
    body: {
      backgroundColor: colors.pillars.BODY,
    },
    heart: {
      backgroundColor: colors.pillars.HEART,
    },
    soul: {
      backgroundColor: colors.pillars.SOUL,
    },
    text: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      color: colors.white,
    },
  }),
} as const;
