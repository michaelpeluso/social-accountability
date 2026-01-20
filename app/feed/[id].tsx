/**
 * Post Detail Screen (M3.7)
 * Shows post details with edit/delete options for own posts
 * Uses PostCard in detail mode for consistent UI
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
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useTheme, spacing, borderRadius } from "../../src/theme";
import { typography } from "../../src/theme/typography";
import { PostCard } from "../../src/components";
import { getFeedPostById, updatePost, deletePost } from "../../src/storage/posts";
import { auth } from "../../src/services/auth";
import type { FeedPost } from "../../src/types";

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const [post, setPost] = useState<FeedPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");

  const isOwnPost = post?.userId === currentUserId;

  // Check if post is within 24h edit window
  const canEdit =
    isOwnPost && post
      ? Date.now() - new Date(post.createdAt).getTime() < 24 * 60 * 60 * 1000
      : false;

  const loadPost = useCallback(async () => {
    if (!id || !currentUserId) return;
    const postData = await getFeedPostById(id, currentUserId);
    if (postData) {
      setPost(postData);
      setEditText(postData.text || "");
    }
    setLoading(false);
  }, [id, currentUserId]);

  useEffect(() => {
    async function loadUser() {
      const user = await auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    }
    loadUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadPost();
    }
  }, [currentUserId, loadPost]);

  const handleEdit = async () => {
    if (!post) return;
    const result = await updatePost(post.id, currentUserId, {
      text: editText.trim(),
    });
    if ("error" in result) {
      Alert.alert("Error", result.error);
      return;
    }
    // Reload post to get updated data
    await loadPost();
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
          const result = await deletePost(post.id, currentUserId);
          if ("error" in result) {
            Alert.alert("Error", result.error);
            return;
          }
          router.back();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background.primary }]}
        edges={["bottom"]}
      >
        <Stack.Screen options={{ title: "Post" }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.semantic.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background.primary }]}
        edges={["bottom"]}
      >
        <Stack.Screen options={{ title: "Post" }} />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.text.secondary }]}>Post not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background.primary }]}
      edges={["bottom"]}
    >
      <Stack.Screen
        options={{
          title: "Post",
          headerRight: () =>
            isOwnPost ? (
              <View style={styles.headerButtons}>
                {canEdit && (
                  <Pressable onPress={() => setIsEditing(!isEditing)} style={styles.headerButton}>
                    <Text style={[styles.headerButtonText, { color: theme.semantic.primary }]}>
                      {isEditing ? "Cancel" : "Edit"}
                    </Text>
                  </Pressable>
                )}
                <Pressable onPress={handleDelete} style={styles.headerButton}>
                  <Text style={[styles.headerButtonText, { color: theme.semantic.danger }]}>
                    Delete
                  </Text>
                </Pressable>
              </View>
            ) : null,
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Edit Mode */}
        {isEditing ? (
          <View style={[styles.editCard, { backgroundColor: theme.card.background }]}>
            <TextInput
              style={[
                styles.editInput,
                {
                  backgroundColor: theme.input.background,
                  color: theme.text.primary,
                  borderColor: theme.input.border,
                },
              ]}
              value={editText}
              onChangeText={(text) => setEditText(text.slice(0, 500))}
              multiline
              maxLength={500}
              placeholder="What's on your mind?"
              placeholderTextColor={theme.input.placeholder}
            />
            <Text style={[styles.charCount, { color: theme.text.tertiary }]}>
              {editText.length}/500
            </Text>

            <Pressable
              style={[styles.saveButton, { backgroundColor: theme.button.primary.background }]}
              onPress={handleEdit}
            >
              <Text style={[styles.saveButtonText, { color: theme.button.primary.text }]}>
                Save Changes
              </Text>
            </Pressable>
          </View>
        ) : (
          /* Post Card in Detail View */
          <PostCard
            post={post}
            currentUserId={currentUserId}
            isDetailView
            onAuthorPress={() => router.push(`/profile/${post.userId}`)}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: typography.fontSize.md,
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
    fontWeight: "600",
  },
  editCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  editInput: {
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: typography.fontSize.md,
    minHeight: 100,
    textAlignVertical: "top",
    borderWidth: 1,
  },
  charCount: {
    fontSize: typography.fontSize.xs,
    textAlign: "right",
    marginTop: spacing.xxs,
  },
  saveButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: "600",
  },
});
