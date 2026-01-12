/**
 * FriendItem Component
 * Displays a friend/user with avatar, info, and action button
 */

import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "../../../theme";
import { spacing, borderRadius } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";

interface FriendItemProps {
  displayName: string;
  bio?: string;
  meta?: string;
  actionLabel?: string;
  actionVariant?: "primary" | "secondary" | "outline";
  onAction?: () => void;
  onPress?: () => void;
}

export function FriendItem({
  displayName,
  bio,
  meta,
  actionLabel,
  actionVariant = "outline",
  onAction,
  onPress,
}: FriendItemProps) {
  const { theme } = useTheme();

  const getButtonStyle = () => {
    switch (actionVariant) {
      case "primary":
        return {
          backgroundColor: theme.button.primary.background,
          borderColor: theme.button.primary.background,
        };
      case "secondary":
        return {
          backgroundColor: theme.background.secondary,
          borderColor: theme.border.medium,
        };
      default:
        return {
          backgroundColor: "transparent",
          borderColor: theme.border.medium,
        };
    }
  };

  const getTextColor = () => {
    switch (actionVariant) {
      case "primary":
        return theme.button.primary.text;
      default:
        return theme.text.secondary;
    }
  };

  return (
    <Pressable
      style={[
        styles.item,
        {
          backgroundColor: theme.card.background,
          borderBottomColor: theme.border.light,
        },
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.info}>
        <Text style={[styles.name, { color: theme.text.primary }]}>{displayName}</Text>
        {bio && (
          <Text style={[styles.bio, { color: theme.text.secondary }]} numberOfLines={1}>
            {bio}
          </Text>
        )}
        {meta && <Text style={[styles.meta, { color: theme.text.tertiary }]}>{meta}</Text>}
      </View>
      {actionLabel && onAction && (
        <Pressable style={[styles.actionButton, getButtonStyle()]} onPress={onAction}>
          <Text style={[styles.actionButtonText, { color: getTextColor() }]}>{actionLabel}</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  bio: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  meta: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  actionButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: typography.fontSize.sm,
  },
});
