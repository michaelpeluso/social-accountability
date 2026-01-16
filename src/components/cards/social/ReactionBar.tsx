/**
 * ReactionBar Component
 * Displays reaction emoji options with counts
 */

import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "../../../theme";
import { spacing, borderRadius } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";
import type { ReactionEmoji } from "../../../types";
import { ALLOWED_REACTIONS } from "../../../types";

interface ReactionCount {
  emoji: ReactionEmoji;
  count: number;
}

interface ReactionBarProps {
  /** Current reaction counts */
  reactions: ReactionCount[];
  /** The emoji the current user has reacted with (if any) */
  userReaction?: ReactionEmoji | null;
  /** Called when user taps a reaction */
  onReaction: (emoji: ReactionEmoji) => void;
  /** Show all reactions or only those with counts */
  showAllReactions?: boolean;
  /** Compact mode (smaller) */
  compact?: boolean;
}

export function ReactionBar({
  reactions,
  userReaction,
  onReaction,
  showAllReactions = true,
  compact = false,
}: ReactionBarProps) {
  const { theme } = useTheme();

  // Build count map
  const countMap = reactions.reduce(
    (acc, r) => {
      acc[r.emoji] = r.count;
      return acc;
    },
    {} as Record<ReactionEmoji, number>
  );

  // Determine which reactions to show
  const reactionsToShow = showAllReactions
    ? ALLOWED_REACTIONS
    : ALLOWED_REACTIONS.filter((emoji) => (countMap[emoji] ?? 0) > 0 || userReaction === emoji);

  if (reactionsToShow.length === 0 && !showAllReactions) {
    return null;
  }

  return (
    <View style={styles.container}>
      {reactionsToShow.map((emoji) => {
        const count = countMap[emoji] ?? 0;
        const isActive = userReaction === emoji;

        return (
          <Pressable
            key={emoji}
            style={[
              styles.reactionButton,
              compact && styles.reactionButtonCompact,
              {
                backgroundColor: isActive
                  ? `${theme.semantic.primary}20`
                  : theme.background.secondary,
              },
            ]}
            onPress={() => onReaction(emoji)}
          >
            <Text style={[styles.emoji, compact && styles.emojiCompact]}>{emoji}</Text>
            {count > 0 && (
              <Text
                style={[
                  styles.count,
                  compact && styles.countCompact,
                  { color: isActive ? theme.semantic.primary : theme.text.secondary },
                ]}
              >
                {count}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  reactionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
  },
  reactionButtonCompact: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
  },
  emoji: {
    fontSize: 20,
  },
  emojiCompact: {
    fontSize: 16,
  },
  count: {
    fontSize: typography.fontSize.sm,
    marginLeft: spacing.xxs,
  },
  countCompact: {
    fontSize: typography.fontSize.xs,
  },
});
