/**
 * ScreenHeader Component
 * Reusable header with back button, title, and optional right action
 */

import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useTheme } from "../../theme";
import { spacing, borderRadius } from "../../theme/spacing";
import { typography } from "../../theme/typography";

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  showBack?: boolean;
  backLabel?: string;
  rightAction?: React.ReactNode;
  rightButton?: {
    label: string;
    onPress: () => void;
    variant?: "primary" | "secondary";
    disabled?: boolean;
  };
}

export function ScreenHeader({
  title,
  onBack,
  showBack = true,
  backLabel = "←",
  rightAction,
  rightButton,
}: ScreenHeaderProps) {
  const { theme } = useTheme();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.background.primary,
          borderBottomColor: theme.border.light,
        },
      ]}
    >
      {showBack ? (
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: theme.semantic.primary }]}>
            {backLabel}
          </Text>
        </Pressable>
      ) : (
        <View style={styles.placeholder} />
      )}

      <Text style={[styles.headerTitle, { color: theme.text.primary }]}>{title}</Text>

      {rightAction ? (
        rightAction
      ) : rightButton ? (
        <Pressable
          onPress={rightButton.onPress}
          disabled={rightButton.disabled}
          style={[
            styles.rightButton,
            rightButton.variant === "primary" && {
              backgroundColor: theme.button.primary.background,
            },
            rightButton.disabled && styles.disabled,
          ]}
        >
          <Text
            style={[
              styles.rightButtonText,
              {
                color:
                  rightButton.variant === "primary"
                    ? theme.button.primary.text
                    : theme.semantic.primary,
              },
            ]}
          >
            {rightButton.label}
          </Text>
        </Pressable>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing.xs,
    minWidth: 50,
  },
  backButtonText: {
    fontSize: typography.fontSize.base,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    minWidth: 50,
  },
  rightButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    minWidth: 50,
    alignItems: "center",
  },
  rightButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  disabled: {
    opacity: 0.5,
  },
});
