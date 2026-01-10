/**
 * PostCard Component
 * Displays a single post in the feed with reactions
 */

import { useState } from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import type { FeedPost, ReactionEmoji } from "../../types";
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  timestamp: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  pillarBadge: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pillarText: {
    fontSize: 11,
    color: "#666",
    fontWeight: "500",
  },
  linkedHabit: {
    backgroundColor: "#e8f5e9",
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  linkedHabitText: {
    fontSize: 13,
    color: "#2e7d32",
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#333",
    marginBottom: 12,
  },
  media: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  reactionsBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  reactButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    marginRight: 8,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
  },
  reactionChipActive: {
    backgroundColor: "#e3f2fd",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  reactionPicker: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  reactionPickerItem: {
    padding: 8,
  },
  reactionPickerEmoji: {
    fontSize: 28,
  },
  editedText: {
    fontSize: 11,
    color: "#999",
    fontStyle: "italic",
    textAlign: "right",
    marginTop: 8,
  },
});
