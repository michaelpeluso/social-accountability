/**
 * PillarBadge Component
 * Displays a pillar label with pillar-specific colors
 */

import { View, Text, StyleSheet, type ViewStyle } from "react-native";
import { useTheme } from "../../theme";
import { spacing, borderRadius } from "../../theme/spacing";
import { typography } from "../../theme/typography";
import type { Pillar } from "../../types";

type BadgeSize = "sm" | "md" | "lg";

interface PillarBadgeProps {
  /** The pillar to display */
  pillar: Pillar;
  /** Size variant */
  size?: BadgeSize;
  /** Show as outline instead of filled */
  outline?: boolean;
  /** Additional container style */
  style?: ViewStyle;
}

const SIZE_MAP: Record<BadgeSize, { paddingH: number; paddingV: number; fontSize: number }> = {
  sm: { paddingH: spacing.xs, paddingV: 2, fontSize: typography.fontSize.xxs },
  md: { paddingH: spacing.sm, paddingV: spacing.xxs, fontSize: typography.fontSize.xs },
  lg: { paddingH: spacing.md, paddingV: spacing.xs, fontSize: typography.fontSize.sm },
};

export function PillarBadge({ pillar, size = "md", outline = false, style }: PillarBadgeProps) {
  const { theme } = useTheme();
  const { paddingH, paddingV, fontSize } = SIZE_MAP[size];

  const pillarColor = theme.pillars[pillar] ?? theme.semantic.primary;

  return (
    <View
      style={[
        styles.badge,
        {
          paddingHorizontal: paddingH,
          paddingVertical: paddingV,
          backgroundColor: outline ? "transparent" : pillarColor,
          borderColor: pillarColor,
          borderWidth: outline ? 1 : 0,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            fontSize,
            color: outline ? pillarColor : "#fff",
          },
        ]}
      >
        {pillar}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: borderRadius.md,
    alignSelf: "flex-start",
  },
  text: {
    fontWeight: typography.fontWeight.medium,
    textTransform: "uppercase",
  },
});
