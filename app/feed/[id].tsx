/**
 * Post Detail Screen (M3.7)
 * Shows post details with edit/delete options for own posts
 */

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { spacing, borderRadius } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";
import { Avatar, PillarBadge, ReactionBar, CommentItem, CommentInput } from "../../src/components";
import { getPostById, updatePost, deletePost } from "../../src/storage/posts";
import { getPostComments, createComment } from "../../src/storage/comments";
import { toggleReaction, getPostReactions } from "../../src/storage/reactions";
import type { Post, Comment, Reaction, ReactionEmoji } from "../../src/types";
import { ALLOWED_REACTIONS } from "../../src/types";
import { formatRelativeTime } from "../../src/logic/dates";

// Mock current user (would come from auth context)
const CURRENT_USER_ID = "user_1";

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [userReaction, setUserReaction] = useState<ReactionEmoji | null>(null);

  const isOwnPost = post?.authorUserId === CURRENT_USER_ID;

  // Check if post is within 24h edit window
  const canEdit =
    isOwnPost && post
      ? Date.now() - new Date(post.createdAt).getTime() < 24 * 60 * 60 * 1000
      : false;

  const loadPost = useCallback(async () => {
    if (!id) return;
    const postData = await getPostById(id);
    if (postData) {
      setPost(postData);
      setEditText(postData.bodyText || "");
    }
    const commentsData = await getPostComments(id);
    setComments(commentsData);
    const reactionsData = await getPostReactions(id);
    setReactions(reactionsData);
    // Find user's reaction
    const myReaction = reactionsData.find((r) => r.userId === CURRENT_USER_ID);
    setUserReaction(myReaction?.emoji ?? null);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const handleEdit = async () => {
    if (!post) return;
    const result = await updatePost(post.id, CURRENT_USER_ID, {
      bodyText: editText.trim(),
    });
    if ("error" in result) {
      Alert.alert("Error", result.error);
      return;
    }
    setPost(result);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (!post) return;
    Alert.alert("Delete Post", "This cannot be undone. Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const result = await deletePost(CURRENT_USER_ID, post.id);
          if ("error" in result) {
            Alert.alert("Error", result.error);
            return;
          }
          router.back();
        },
      },
    ]);
  };

  const handleReaction = async (emoji: ReactionEmoji) => {
    if (!post) return;
    const result = await toggleReaction(CURRENT_USER_ID, { postId: post.id, emoji });
    if ("error" in result) return;

    if (result.action === "added") {
      // Remove old reaction if exists, add new
      setReactions((prev) => {
        const filtered = prev.filter((r) => r.userId !== CURRENT_USER_ID);
        if (result.reaction) {
          return [...filtered, result.reaction];
        }
        return filtered;
      });
      setUserReaction(emoji);
    } else {
      // Removed - filter out by matching user
      setReactions((prev) => prev.filter((r) => r.userId !== CURRENT_USER_ID));
      setUserReaction(null);
    }
  };

  const handleCommentSubmit = async (text: string) => {
    if (!post) return;
    const result = await createComment(CURRENT_USER_ID, {
      postId: post.id,
      bodyText: text,
    });
    if ("error" in result) {
      Alert.alert("Error", result.error);
      return;
    }
    setComments((prev) => [...prev, result]);
  };

  // Calculate reaction counts
  const reactionCounts = ALLOWED_REACTIONS.reduce(
    (acc, emoji) => {
      acc[emoji] = reactions.filter((r) => r.emoji === emoji).length;
      return acc;
    },
    {} as Record<ReactionEmoji, number>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "Post" }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "Post" }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Post not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Post",
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>← Back</Text>
            </Pressable>
          ),
          headerRight: () =>
            isOwnPost ? (
              <View style={styles.headerButtons}>
                {canEdit && (
                  <Pressable onPress={() => setIsEditing(!isEditing)} style={styles.headerButton}>
                    <Text style={styles.headerButtonText}>{isEditing ? "Cancel" : "Edit"}</Text>
                  </Pressable>
                )}
                <Pressable onPress={handleDelete} style={styles.headerButton}>
                  <Text style={[styles.headerButtonText, styles.deleteText]}>Delete</Text>
                </Pressable>
              </View>
            ) : null,
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Post Content */}
        <View style={styles.postCard}>
          <View style={styles.postHeader}>
            <Pressable
              style={styles.authorSection}
              onPress={() => post && router.push(`/profile/${post.authorUserId}`)}
            >
              <Avatar imageUrl={post.authorAvatarUrl} name={post.authorName} size="md" />
              <View style={styles.authorInfo}>
                <Text style={styles.authorName}>{post.authorName ?? "Unknown"}</Text>
                <Text style={styles.timestamp}>{formatRelativeTime(post.createdAt)}</Text>
              </View>
            </Pressable>
            <PillarBadge pillar={post.pillar} size="sm" />
          </View>

          {/* Media */}
          {post.mediaUrl && (
            <Image source={{ uri: post.mediaUrl }} style={styles.media} resizeMode="cover" />
          )}

          {/* Body - editable or static */}
          {isEditing ? (
            <View style={styles.editSection}>
              <TextInput
                style={styles.editInput}
                value={editText}
                onChangeText={(text) => setEditText(text.slice(0, 500))}
                multiline
                maxLength={500}
                placeholder="What's on your mind?"
              />
              <Text style={styles.charCount}>{editText.length}/500</Text>

              <Pressable style={styles.saveButton} onPress={handleEdit}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={styles.bodyText}>{post.bodyText}</Text>
              {post.editedAt && <Text style={styles.editedText}>Edited</Text>}
            </>
          )}
        </View>

        {/* Reactions */}
        <View style={styles.reactionsSection}>
          <Text style={styles.sectionTitle}>Reactions</Text>
          <ReactionBar
            reactions={ALLOWED_REACTIONS.map((emoji) => ({ emoji, count: reactionCounts[emoji] }))}
            userReaction={userReaction}
            onReaction={handleReaction}
            showAllReactions
          />
        </View>

        {/* Comments */}
        <View style={styles.commentsSection}>
          <Text style={styles.sectionTitle}>Comments ({comments.length})</Text>

          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              userId={comment.userId}
              userName={comment.authorName ?? "User"}
              userAvatarUrl={comment.authorAvatarUrl}
              text={comment.bodyText}
              timestamp={formatRelativeTime(comment.createdAt)}
              isOwnComment={comment.userId === CURRENT_USER_ID}
              onPressAuthor={() => router.push(`/profile/${comment.userId}`)}
            />
          ))}

          {/* Add comment */}
          <View style={styles.addComment}>
            <CommentInput
              placeholder="Add a comment (50 char max)..."
              maxLength={50}
              onSubmit={handleCommentSubmit}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: typography.fontSize.md,
    color: "#666",
  },
  scrollContent: {
    padding: spacing.md,
  },
  headerButtons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  headerButton: {
    padding: spacing.xs,
  },
  headerButtonText: {
    fontSize: typography.fontSize.sm,
    color: "#007AFF",
  },
  deleteText: {
    color: "#FF3B30",
  },
  postCard: {
    backgroundColor: "#fff",
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  authorSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
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
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: "#333",
  },
  pillarBadge: {
    backgroundColor: "#007AFF",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.md,
  },
  pillarText: {
    fontSize: typography.fontSize.xs,
    color: "#fff",
    fontWeight: typography.fontWeight.medium,
  },
  timestamp: {
    fontSize: typography.fontSize.xs,
    color: "#999",
  },
  media: {
    width: "100%",
    height: 200,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  bodyText: {
    fontSize: typography.fontSize.md,
    color: "#333",
    lineHeight: 22,
  },
  editedText: {
    fontSize: typography.fontSize.xs,
    color: "#999",
    fontStyle: "italic",
    marginTop: spacing.xs,
  },
  editSection: {
    marginTop: spacing.sm,
  },
  editInput: {
    backgroundColor: "#f9f9f9",
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: typography.fontSize.md,
    minHeight: 100,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: typography.fontSize.xs,
    color: "#999",
    textAlign: "right",
    marginTop: spacing.xxs,
  },
  saveButton: {
    backgroundColor: "#007AFF",
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: typography.fontSize.md,
    color: "#fff",
    fontWeight: typography.fontWeight.semibold,
  },
  reactionsSection: {
    backgroundColor: "#fff",
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: "#333",
    marginBottom: spacing.sm,
  },
  reactionOptions: {
    flexDirection: "row",
    gap: spacing.sm,
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
    backgroundColor: "#007AFF20",
  },
  reactionEmoji: {
    fontSize: 20,
  },
  reactionCount: {
    fontSize: typography.fontSize.sm,
    color: "#666",
    marginLeft: spacing.xxs,
  },
  reactionCountActive: {
    color: "#007AFF",
  },
  commentsSection: {
    backgroundColor: "#fff",
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  commentItem: {
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.xs,
  },
  commentAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentAvatarText: {
    color: "#fff",
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  commentContent: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: typography.fontSize.sm,
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
  addComment: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: typography.fontSize.sm,
  },
  commentSend: {
    backgroundColor: "#007AFF",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  commentSendDisabled: {
    backgroundColor: "#ccc",
  },
  commentSendText: {
    fontSize: typography.fontSize.sm,
    color: "#fff",
    fontWeight: typography.fontWeight.medium,
  },
});
