/**
 * PostCard Component
 * Displays a single post in the feed with reactions
 */

import { useState } from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import type { FeedPost, ReactionEmoji } from "../../types";
import { spacing, borderRadius } from "../../theme/spacing";
import { typography } from "../../theme/typography";
import { ALLOWED_REACTIONS } from "../../types";
import { toggleReaction } from "../../storage/reactions";
import { formatRelativeTime } from "../../logic/dates";

type PostCardProps = {
  post: FeedPost;
  onPress: () => void;
  currentUserId: string;
};

export function PostCard({ post, onPress, currentUserId }: PostCardProps) {
  const [reactions, setReactions] = useState(post.reactions);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const handleReaction = async (emoji: ReactionEmoji) => {
    const result = await toggleReaction(currentUserId, { postId: post.id, emoji });

    if ("error" in result) {
      console.error("Failed to toggle reaction:", result.error);
      return;
    }

    // Update local state
    setReactions((prev) => {
      const existing = prev.find((r) => r.emoji === emoji);
      if (result.action === "added") {
        if (existing) {
          return prev.map((r) =>
            r.emoji === emoji ? { ...r, count: r.count + 1, userReacted: true } : r
          );
        }
        return [...prev, { emoji, count: 1, userReacted: true }];
      } else {
        if (existing && existing.count === 1) {
          return prev.filter((r) => r.emoji !== emoji);
        }
        return prev.map((r) =>
          r.emoji === emoji ? { ...r, count: r.count - 1, userReacted: false } : r
        );
      }
    });

    setShowReactionPicker(false);
  };

  const totalReactions = reactions.reduce((sum, r) => sum + r.count, 0);

  return (
    <Pressable style={styles.container} onPress={onPress}>
      {/* Author Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          {post.authorAvatarUrl ? (
            <Image source={{ uri: post.authorAvatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{post.authorName?.charAt(0) ?? "?"}</Text>
          )}
        </View>
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{post.authorName ?? "Unknown"}</Text>
          <Text style={styles.timestamp}>{formatRelativeTime(post.createdAt)}</Text>
        </View>
        <View style={styles.pillarBadge}>
          <Text style={styles.pillarText}>{post.pillar}</Text>
        </View>
      </View>

      {/* Linked Habit */}
      {post.linkedHabitTitle && (
        <View style={styles.linkedHabit}>
          <Text style={styles.linkedHabitText}>✓ Checked in: {post.linkedHabitTitle}</Text>
        </View>
      )}

      {/* Post Body */}
      {post.bodyText && <Text style={styles.bodyText}>{post.bodyText}</Text>}

      {/* Media */}
      {post.mediaUrl && (
        <Image source={{ uri: post.mediaUrl }} style={styles.media} resizeMode="cover" />
      )}

      {/* Reactions Bar */}
      <View style={styles.reactionsBar}>
        <Pressable
          style={styles.reactButton}
          onPress={() => setShowReactionPicker(!showReactionPicker)}
        >
          <Text style={styles.reactButtonText}>
            {totalReactions > 0 ? `${totalReactions} 👏` : "React"}
          </Text>
        </Pressable>

        {/* Current reactions */}
        <View style={styles.reactionsList}>
          {reactions.map((r) => (
            <Pressable
              key={r.emoji}
              style={[styles.reactionChip, r.userReacted && styles.reactionChipActive]}
              onPress={() => handleReaction(r.emoji)}
            >
              <Text style={styles.reactionEmoji}>{r.emoji}</Text>
              <Text style={styles.reactionCount}>{r.count}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Reaction Picker */}
      {showReactionPicker && (
        <View style={styles.reactionPicker}>
          {ALLOWED_REACTIONS.map((emoji) => (
            <Pressable
              key={emoji}
              style={styles.reactionPickerItem}
              onPress={() => handleReaction(emoji)}
            >
              <Text style={styles.reactionPickerEmoji}>{emoji}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Edited indicator */}
      {post.editedAt && <Text style={styles.editedText}>Edited</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: borderRadius.lg,
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: borderRadius.lg,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: borderRadius.lg,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    color: "#fff",
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: typography.fontWeight.semibold,
    color: "#000",
  },
  timestamp: {
    fontSize: typography.fontSize.xs,
    color: "#888",
    marginTop: spacing.xxs,
  },
  pillarBadge: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: borderRadius.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  pillarText: {
    fontSize: 11,
    color: "#666",
    fontWeight: typography.fontWeight.medium,
  },
  linkedHabit: {
    backgroundColor: "#e8f5e9",
    padding: borderRadius.md,
    borderRadius: borderRadius.md,
    marginBottom: borderRadius.lg,
  },
  linkedHabitText: {
    fontSize: 13,
    color: "#2e7d32",
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#333",
    marginBottom: borderRadius.lg,
  },
  media: {
    width: "100%",
    height: 200,
    borderRadius: borderRadius.md,
    marginBottom: borderRadius.lg,
  },
  reactionsBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: borderRadius.lg,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  reactButton: {
    paddingHorizontal: borderRadius.lg,
    paddingVertical: 6,
    backgroundColor: "#f5f5f5",
    borderRadius: spacing.md,
    marginRight: borderRadius.md,
  },
  reactButtonText: {
    fontSize: 13,
    color: "#666",
  },
  reactionsList: {
    flexDirection: "row",
    gap: 6,
  },
  reactionChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: borderRadius.md,
    paddingVertical: spacing.xs,
    backgroundColor: "#f5f5f5",
    borderRadius: borderRadius.lg,
  },
  reactionChipActive: {
    backgroundColor: "#e3f2fd",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  reactionEmoji: {
    fontSize: typography.fontSize.sm,
  },
  reactionCount: {
    fontSize: typography.fontSize.xs,
    color: "#666",
    marginLeft: spacing.xs,
  },
  reactionPicker: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.md,
    paddingTop: borderRadius.lg,
    paddingBottom: spacing.xs,
  },
  reactionPickerItem: {
    padding: borderRadius.md,
  },
  reactionPickerEmoji: {
    fontSize: 28,
  },
  editedText: {
    fontSize: 11,
    color: "#999",
    fontStyle: "italic",
    textAlign: "right",
    marginTop: borderRadius.md,
  },
});
