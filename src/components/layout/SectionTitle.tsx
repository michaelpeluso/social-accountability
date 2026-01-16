/**
 * SectionTitle Component
 * Reusable section header with consistent typography
 */

import { Text, StyleSheet, type TextStyle, type ViewStyle } from "react-native";
import { useTheme } from "../../theme";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";

interface SectionTitleProps {
  children: string;
  size?: "small" | "medium" | "large";
  style?: ViewStyle | TextStyle;
}

export function SectionTitle({ children, size = "medium", style }: SectionTitleProps) {
  const { theme } = useTheme();

  const fontSize =
    size === "large"
      ? typography.fontSize.xl
      : size === "medium"
        ? typography.fontSize.lg
        : typography.fontSize.base;

  return (
    <Text
      style={[
        styles.title,
        {
          fontSize,
          color: theme.text.primary,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: {
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.sm,
  },
});
