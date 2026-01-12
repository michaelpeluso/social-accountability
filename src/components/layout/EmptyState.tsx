/**
 * EmptyState Component
 * Reusable empty state with emoji, title, subtitle, and optional CTA button
 */

import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "../../theme";
import { spacing, borderRadius } from "../../theme/spacing";
import { typography } from "../../theme/typography";

interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
  size?: "small" | "medium" | "large";
}

export function EmptyState({
  emoji,
  title,
  subtitle,
  ctaLabel,
  onCtaPress,
  size = "medium",
}: EmptyStateProps) {
  const { theme } = useTheme();

  const emojiSize = size === "large" ? 64 : size === "medium" ? 48 : 32;
  const titleSize =
    size === "large"
      ? typography.fontSize.xxl
      : size === "medium"
        ? typography.fontSize.lg
        : typography.fontSize.base;

  return (
    <View style={styles.container}>
      <Text style={[styles.emoji, { fontSize: emojiSize }]}>{emoji}</Text>
      <Text
        style={[
          styles.title,
          {
            fontSize: titleSize,
            color: theme.text.primary,
          },
        ]}
      >
        {title}
      </Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: theme.text.secondary }]}>{subtitle}</Text>
      )}
      {ctaLabel && onCtaPress && (
        <Pressable
          style={[styles.ctaButton, { backgroundColor: theme.button.primary.background }]}
          onPress={onCtaPress}
        >
          <Text style={[styles.ctaButtonText, { color: theme.button.primary.text }]}>
            {ctaLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xxl,
  },
  emoji: {
    marginBottom: spacing.md,
  },
  title: {
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    textAlign: "center",
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  ctaButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  ctaButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});
