/**
 * PostCard Component
 * Displays a single post in the feed with reactions
 * Reactions are always visible, comments expand on click
 *
 * Uses theme tokens for all colors/styling for light/dark mode support.
 */

import { useState } from "react";
import { View, Text, StyleSheet, Pressable, Image, TextInput } from "react-native";
import type { FeedPost, ReactionEmoji, Comment } from "../../../types";
import { ALLOWED_REACTIONS } from "../../../types";
import { toggleReaction } from "../../../storage/reactions";
import { createComment, getPostComments } from "../../../storage/comments";
import { formatRelativeTime } from "../../../logic/dates";
import { useTheme } from "../../../theme";
import { spacing, borderRadius } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";

type PostCardProps = {
  post: FeedPost;
  onPress?: () => void;
  onAuthorPress?: () => void;
  currentUserId: string;
  /** When true, comments are expanded by default and card is not pressable */
  isDetailView?: boolean;
};

export function PostCard({
  post,
  onPress,
  onAuthorPress,
  currentUserId,
  isDetailView = false,
}: PostCardProps) {
  const { theme } = useTheme();
  const [reactions, setReactions] = useState(post.reactions);
  const [userReaction, setUserReaction] = useState<ReactionEmoji | null>(
    // Find the user's current reaction (should be only one)
    post.reactions.find((r) => r.userReacted)?.emoji ?? null
  );
  const [showCommentInput, setShowCommentInput] = useState(isDetailView);
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
      text: commentText.trim(),
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
    const result = await toggleReaction(currentUserId, {
      targetId: post.id,
      targetType: "POST",
      emoji,
    });

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

  // Get pillar-specific color if available
  const pillarColor = post.pillar
    ? theme.pillars[post.pillar as keyof typeof theme.pillars]
    : undefined;

  const CardWrapper = isDetailView ? View : Pressable;

  return (
    <CardWrapper
      style={[
        styles.container,
        {
          backgroundColor: theme.card.background,
          borderRadius: theme.radius.large,
          padding: theme.space.cardPadding,
          borderColor: theme.border.light,
        },
        isDetailView && styles.detailContainer,
      ]}
      {...(!isDetailView && { onPress })}
    >
      {/* Author Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.avatarPressable}
          onPress={(e) => {
            e.stopPropagation();
            onAuthorPress?.();
          }}
        >
          <View style={[styles.avatar, { backgroundColor: pillarColor || theme.semantic.primary }]}>
            {post.userPhotoUrl ? (
              <Image source={{ uri: post.userPhotoUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={[styles.avatarText, { color: theme.button.primary.text }]}>
                {post.userName?.charAt(0) ?? "?"}
              </Text>
            )}
          </View>
        </Pressable>
        <Pressable
          style={styles.authorInfo}
          onPress={(e) => {
            e.stopPropagation();
            onAuthorPress?.();
          }}
        >
          <Text style={[styles.authorName, { color: theme.text.primary }]}>
            {post.userName ?? "Unknown"}
          </Text>
          <Text style={[styles.timestamp, { color: theme.text.tertiary }]}>
            {formatRelativeTime(post.createdAt)}
          </Text>
        </Pressable>
        <View style={[styles.pillarBadge, { backgroundColor: theme.background.tertiary }]}>
          <Text style={[styles.pillarText, { color: theme.text.secondary }]}>{post.pillar}</Text>
        </View>
      </View>

      {/* Linked Habit */}
      {post.linkedHabitTitle && (
        <View style={[styles.linkedHabit, { backgroundColor: `${theme.semantic.success}15` }]}>
          <Text style={[styles.linkedHabitText, { color: theme.semantic.success }]}>
            ✓ Checked in: {post.linkedHabitTitle}
          </Text>
        </View>
      )}

      {/* Post Type Tags (Suggested Tags) */}
      {post.postTypeTags && post.postTypeTags.length > 0 && (
        <View style={styles.postTypeTags}>
          {post.postTypeTags.map((tag) => (
            <View
              key={tag}
              style={[styles.postTypeTag, { backgroundColor: `${theme.semantic.warning}15` }]}
            >
              <Text style={[styles.postTypeTagText, { color: theme.semantic.warning }]}>
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
            <Text key={tag} style={[styles.customTag, { color: theme.semantic.primary }]}>
              #{tag}
            </Text>
          ))}
        </View>
      )}

      {/* Location Context (only location, not time - time is shown in header) */}
      {post.contextLocationId && (
        <View style={styles.contextChips}>
          <View style={[styles.contextChip, { backgroundColor: `${theme.semantic.secondary}15` }]}>
            <Text style={[styles.contextChipText, { color: theme.semantic.secondary }]}>
              📍 {post.contextLocationId}
            </Text>
          </View>
        </View>
      )}

      {/* Media */}
      {post.mediaUrl && (
        <Image
          source={{ uri: post.mediaUrl }}
          style={[
            styles.media,
            {
              aspectRatio:
                post.mediaAspectRatio === "3:2"
                  ? 3 / 2
                  : post.mediaAspectRatio === "2:3"
                    ? 2 / 3
                    : post.mediaAspectRatio === "1:1"
                      ? 1
                      : 3 / 2, // default to 3:2 landscape
            },
          ]}
          resizeMode="cover"
        />
      )}

      {/* Post Body */}
      {post.text && <Text style={[styles.text, { color: theme.text.primary }]}>{post.text}</Text>}

      {/* Edited indicator */}
      {post.editedAt && (
        <Text style={[styles.editedText, { color: theme.text.tertiary }]}>Edited</Text>
      )}

      {/* Reactions Bar - Always visible */}
      <View style={[styles.reactionsBar, { borderTopColor: theme.border.light }]}>
        {/* All reaction options always visible */}
        <View style={styles.reactionOptions}>
          {ALLOWED_REACTIONS.map((emoji) => {
            const reactionData = reactions.find((r) => r.emoji === emoji);
            const isActive = userReaction === emoji;
            return (
              <Pressable
                key={emoji}
                style={[
                  styles.reactionOption,
                  { backgroundColor: theme.background.tertiary },
                  isActive && {
                    backgroundColor: `${theme.semantic.primary}15`,
                    borderWidth: 1,
                    borderColor: theme.semantic.primary,
                  },
                ]}
                onPress={() => handleReaction(emoji)}
              >
                <Text style={styles.reactionOptionEmoji}>{emoji}</Text>
                {reactionData && reactionData.count > 0 && (
                  <Text
                    style={[
                      styles.reactionOptionCount,
                      { color: theme.text.secondary },
                      isActive && { color: theme.semantic.primary },
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
        <Pressable
          style={[styles.commentButton, { backgroundColor: theme.background.tertiary }]}
          onPress={handleToggleComments}
        >
          <Text style={[styles.commentButtonText, { color: theme.text.secondary }]}>
            💬{(post.commentCount ?? 0) > 0 ? ` ${post.commentCount}` : ""}
          </Text>
        </Pressable>
      </View>

      {/* Comment Section (dropdown on click) */}
      {showCommentInput && (
        <View
          style={[styles.commentInputContainer, { backgroundColor: theme.background.secondary }]}
        >
          {/* Existing Comments */}
          {comments.length > 0 && (
            <View style={styles.commentsList}>
              {comments.map((comment) => (
                <View
                  key={comment.id}
                  style={[styles.commentItem, { borderBottomColor: theme.border.light }]}
                >
                  <Text style={[styles.commentAuthor, { color: theme.text.primary }]}>
                    {comment.userName ?? "User"}
                  </Text>
                  <Text style={[styles.commentBody, { color: theme.text.secondary }]}>
                    {comment.text}
                  </Text>
                  <Text style={[styles.commentTime, { color: theme.text.tertiary }]}>
                    {formatRelativeTime(comment.createdAt)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Comment Input */}
          <TextInput
            style={[
              styles.commentInput,
              {
                color: theme.text.primary,
                backgroundColor: theme.input.background,
                borderColor: theme.input.border,
              },
            ]}
            placeholder="Add a comment (50 char max)..."
            placeholderTextColor={theme.input.placeholder}
            value={commentText}
            onChangeText={(text) => setCommentText(text.slice(0, 50))}
            maxLength={50}
            multiline={false}
          />
          <View style={styles.commentActions}>
            <Text style={[styles.commentCharCount, { color: theme.text.tertiary }]}>
              {commentText.length}/50
            </Text>
            <Pressable
              style={[
                styles.commentSendButton,
                { backgroundColor: theme.button.primary.background },
                (!commentText.trim() || isSubmittingComment) && {
                  backgroundColor: theme.interactive.borderDisabled,
                },
              ]}
              disabled={!commentText.trim() || isSubmittingComment}
              onPress={handleSubmitComment}
            >
              <Text style={[styles.commentSendButtonText, { color: theme.button.primary.text }]}>
                {isSubmittingComment ? "..." : "Send"}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </CardWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  detailContainer: {
    marginBottom: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  avatarPressable: {},
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: typography.fontWeight.semibold,
  },
  timestamp: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xxs,
  },
  pillarBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  pillarText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.medium,
  },
  linkedHabit: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  linkedHabitText: {
    fontSize: 13,
  },
  postTypeTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  postTypeTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.md,
  },
  postTypeTagText: {
    fontSize: 12,
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
    fontWeight: "500" as const,
  },
  contextChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  contextChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.md,
  },
  contextChipText: {
    fontSize: 12,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  media: {
    width: "100%",
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  reactionsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.sm,
    borderTopWidth: 1,
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
  },
  reactionOptionEmoji: {
    fontSize: typography.fontSize.md,
  },
  reactionOptionCount: {
    fontSize: typography.fontSize.xs,
    marginLeft: spacing.xxs,
    fontWeight: typography.fontWeight.semibold,
  },
  commentButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
  },
  commentButtonText: {
    fontSize: 13,
  },
  commentInputContainer: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  commentsList: {
    marginBottom: spacing.sm,
  },
  commentItem: {
    marginBottom: spacing.xs,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
  },
  commentAuthor: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  commentBody: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  commentTime: {
    fontSize: 10,
    marginTop: 2,
  },
  commentInput: {
    fontSize: typography.fontSize.sm,
    padding: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  commentActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  commentCharCount: {
    fontSize: typography.fontSize.xs,
  },
  commentSendButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.md,
  },
  commentSendButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  editedText: {
    fontSize: 11,
    fontStyle: "italic",
    textAlign: "right",
    marginTop: spacing.xs,
  },
});
