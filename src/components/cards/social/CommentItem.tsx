/**
 * CommentItem Component
 * Displays a single comment with avatar, author, text, and timestamp
 */

import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "../../../theme";
import { spacing, borderRadius } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";
import { Avatar } from "../../layout/Avatar";

interface CommentItemProps {
  /** Comment author ID */
  userId: string;
  /** Author display name */
  userName: string;
  /** Author avatar URL */
  userAvatarUrl?: string | null;
  /** Comment text content */
  text: string;
  /** Formatted timestamp (e.g., "2h ago") */
  timestamp: string;
  /** Whether current user authored this comment */
  isOwnComment?: boolean;
  /** Called when user taps delete (only shown for own comments) */
  onDelete?: () => void;
  /** Called when user taps the author name/avatar */
  onPressAuthor?: () => void;
}

export function CommentItem({
  userName,
  userAvatarUrl,
  text,
  timestamp,
  isOwnComment = false,
  onDelete,
  onPressAuthor,
}: CommentItemProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background.secondary }]}>
      <Pressable onPress={onPressAuthor} disabled={!onPressAuthor}>
        <Avatar imageUrl={userAvatarUrl} name={userName} size="sm" />
      </Pressable>

      <View style={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={onPressAuthor} disabled={!onPressAuthor}>
            <Text style={[styles.authorName, { color: theme.text.primary }]}>{userName}</Text>
          </Pressable>
          <Text style={[styles.timestamp, { color: theme.text.secondary }]}>{timestamp}</Text>
        </View>

        <Text style={[styles.text, { color: theme.text.primary }]}>{text}</Text>

        {isOwnComment && onDelete && (
          <Pressable style={styles.deleteButton} onPress={onDelete}>
            <Text style={[styles.deleteText, { color: theme.semantic.danger }]}>Delete</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xxs,
  },
  authorName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  timestamp: {
    fontSize: typography.fontSize.xs,
  },
  text: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  deleteButton: {
    marginTop: spacing.xs,
    alignSelf: "flex-start",
  },
  deleteText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
});
