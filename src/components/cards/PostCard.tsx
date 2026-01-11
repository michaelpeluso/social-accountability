/**
 * PostCard Component
 * Displays a single post in the feed with reactions
 * Reactions are always visible, comments expand on click
 */

import { useState } from "react";
import { View, Text, StyleSheet, Pressable, Image, TextInput } from "react-native";
import type { FeedPost, ReactionEmoji, Comment } from "../../types";
import { spacing, borderRadius } from "../../theme/spacing";
import { typography } from "../../theme/typography";
import { ALLOWED_REACTIONS } from "../../types";
import { toggleReaction } from "../../storage/reactions";
import { createComment, getPostComments } from "../../storage/comments";
import { formatRelativeTime } from "../../logic/dates";

type PostCardProps = {
  post: FeedPost;
  onPress: () => void;
  currentUserId: string;
};

export function PostCard({ post, onPress, currentUserId }: PostCardProps) {
  const [reactions, setReactions] = useState(post.reactions);
  const [userReaction, setUserReaction] = useState<ReactionEmoji | null>(
    // Find the user's current reaction (should be only one)
    post.reactions.find((r) => r.userReacted)?.emoji ?? null
  );
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const handleToggleComments = async () => {
    const newShow = !showCommentInput;
    setShowCommentInput(newShow);

    // Load comments when expanding
    if (newShow && !commentsLoaded) {
      const loadedComments = await getPostComments(post.id);
      setComments(loadedComments);
      setCommentsLoaded(true);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    const result = await createComment(currentUserId, {
      postId: post.id,
      bodyText: commentText.trim(),
    });
    setIsSubmittingComment(false);

    if ("error" in result) {
      console.error("Failed to create comment:", result.error);
      return;
    }

    // Add the new comment to the list
    setComments((prev) => [...prev, result]);
    setCommentText("");
  };

  const handleReaction = async (emoji: ReactionEmoji) => {
    const result = await toggleReaction(currentUserId, { postId: post.id, emoji });

    if ("error" in result) {
      console.error("Failed to toggle reaction:", result.error);
      return;
    }

    // Update local state - user can only have one reaction at a time
    setReactions((prev) => {
      let updated = [...prev];

      // If user had a previous reaction, decrement its count
      if (userReaction && userReaction !== emoji) {
        updated = updated
          .map((r) =>
            r.emoji === userReaction
              ? { ...r, count: Math.max(0, r.count - 1), userReacted: false }
              : r
          )
          .filter((r) => r.count > 0);
      }

      if (result.action === "added") {
        // Add or increment the new reaction
        const existingIndex = updated.findIndex((r) => r.emoji === emoji);
        if (existingIndex >= 0) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            count:
              userReaction === emoji
                ? updated[existingIndex].count
                : updated[existingIndex].count + 1,
            userReacted: true,
          };
        } else {
          updated.push({ emoji, count: 1, userReacted: true });
        }
        setUserReaction(emoji);
      } else {
        // Remove the reaction
        updated = updated
          .map((r) =>
            r.emoji === emoji ? { ...r, count: Math.max(0, r.count - 1), userReacted: false } : r
          )
          .filter((r) => r.count > 0);
        setUserReaction(null);
      }

      return updated;
    });
  };

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

      {/* Post Type Tags (Suggested Tags) */}
      {post.postTypeTags && post.postTypeTags.length > 0 && (
        <View style={styles.postTypeTags}>
          {post.postTypeTags.map((tag) => (
            <View key={tag} style={styles.postTypeTag}>
              <Text style={styles.postTypeTagText}>
                {tag === "win"
                  ? "🏆"
                  : tag === "struggle"
                    ? "💭"
                    : tag === "question"
                      ? "❓"
                      : "🪞"}{" "}
                {tag}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Custom Tags */}
      {post.customTags && post.customTags.length > 0 && (
        <View style={styles.customTags}>
          {post.customTags.map((tag) => (
            <Text key={tag} style={styles.customTag}>
              #{tag}
            </Text>
          ))}
        </View>
      )}

      {/* Location Context (only location, not time - time is shown in header) */}
      {post.contextLocation && (
        <View style={styles.contextChips}>
          <View style={styles.contextChip}>
            <Text style={styles.contextChipText}>📍 {post.contextLocation}</Text>
          </View>
        </View>
      )}

      {/* Post Body */}
      {post.bodyText && <Text style={styles.bodyText}>{post.bodyText}</Text>}

      {/* Media */}
      {post.mediaUrl && (
        <Image source={{ uri: post.mediaUrl }} style={styles.media} resizeMode="cover" />
      )}

      {/* Reactions Bar - Always visible */}
      <View style={styles.reactionsBar}>
        {/* All reaction options always visible */}
        <View style={styles.reactionOptions}>
          {ALLOWED_REACTIONS.map((emoji) => {
            const reactionData = reactions.find((r) => r.emoji === emoji);
            const isActive = userReaction === emoji;
            return (
              <Pressable
                key={emoji}
                style={[styles.reactionOption, isActive && styles.reactionOptionActive]}
                onPress={() => handleReaction(emoji)}
              >
                <Text style={styles.reactionOptionEmoji}>{emoji}</Text>
                {reactionData && reactionData.count > 0 && (
                  <Text
                    style={[
                      styles.reactionOptionCount,
                      isActive && styles.reactionOptionCountActive,
                    ]}
                  >
                    {reactionData.count}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Comment Button */}
        <Pressable style={styles.commentButton} onPress={handleToggleComments}>
          <Text style={styles.commentButtonText}>
            💬 {comments.length > 0 ? comments.length : "Comment"}
          </Text>
        </Pressable>
      </View>

      {/* Comment Section (dropdown on click) */}
      {showCommentInput && (
        <View style={styles.commentInputContainer}>
          {/* Existing Comments */}
          {comments.length > 0 && (
            <View style={styles.commentsList}>
              {comments.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <Text style={styles.commentAuthor}>{comment.authorName ?? "User"}</Text>
                  <Text style={styles.commentBody}>{comment.bodyText}</Text>
                  <Text style={styles.commentTime}>{formatRelativeTime(comment.createdAt)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Comment Input */}
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment (50 char max)..."
            placeholderTextColor="#999"
            value={commentText}
            onChangeText={(text) => setCommentText(text.slice(0, 50))}
            maxLength={50}
            multiline={false}
          />
          <View style={styles.commentActions}>
            <Text style={styles.commentCharCount}>{commentText.length}/50</Text>
            <Pressable
              style={[
                styles.commentSendButton,
                (!commentText.trim() || isSubmittingComment) && styles.commentSendButtonDisabled,
              ]}
              disabled={!commentText.trim() || isSubmittingComment}
              onPress={handleSubmitComment}
            >
              <Text style={styles.commentSendButtonText}>
                {isSubmittingComment ? "..." : "Send"}
              </Text>
            </Pressable>
          </View>
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
  postTypeTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  postTypeTag: {
    backgroundColor: "#fff3e0",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.md,
  },
  postTypeTagText: {
    fontSize: 12,
    color: "#e65100",
    fontWeight: "500" as const,
  },
  customTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  customTag: {
    fontSize: 13,
    color: "#007AFF",
    fontWeight: "500" as const,
  },
  contextChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  contextChip: {
    backgroundColor: "#f3e5f5",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.md,
  },
  contextChipText: {
    fontSize: 12,
    color: "#7b1fa2",
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
    justifyContent: "space-between",
    paddingTop: borderRadius.lg,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  reactionOptions: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  reactionOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    backgroundColor: "#f5f5f5",
  },
  reactionOptionActive: {
    backgroundColor: "#e3f2fd",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  reactionOptionEmoji: {
    fontSize: typography.fontSize.md,
  },
  reactionOptionCount: {
    fontSize: typography.fontSize.xs,
    color: "#666",
    marginLeft: spacing.xxs,
  },
  reactionOptionCountActive: {
    color: "#007AFF",
    fontWeight: typography.fontWeight.semibold,
  },
  commentButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: "#f5f5f5",
    borderRadius: borderRadius.lg,
  },
  commentButtonText: {
    fontSize: 13,
    color: "#666",
  },
  commentInputContainer: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: "#f9f9f9",
    borderRadius: borderRadius.md,
  },
  commentsList: {
    marginBottom: spacing.sm,
  },
  commentItem: {
    marginBottom: spacing.xs,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  commentAuthor: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: "#333",
  },
  commentBody: {
    fontSize: typography.fontSize.sm,
    color: "#444",
    marginTop: 2,
  },
  commentTime: {
    fontSize: 10,
    color: "#999",
    marginTop: 2,
  },
  commentInput: {
    fontSize: typography.fontSize.sm,
    color: "#333",
    padding: spacing.xs,
    backgroundColor: "#fff",
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  commentActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  commentCharCount: {
    fontSize: typography.fontSize.xs,
    color: "#999",
  },
  commentSendButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    backgroundColor: "#007AFF",
    borderRadius: borderRadius.md,
  },
  commentSendButtonDisabled: {
    backgroundColor: "#ccc",
  },
  commentSendButtonText: {
    fontSize: typography.fontSize.sm,
    color: "#fff",
    fontWeight: typography.fontWeight.medium,
  },
  editedText: {
    fontSize: 11,
    color: "#999",
    fontStyle: "italic",
    textAlign: "right",
    marginTop: borderRadius.md,
  },
});
