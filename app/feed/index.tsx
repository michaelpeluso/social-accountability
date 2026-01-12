/**
 * Feed Screen (M3)
 * Displays posts from friends with scope filters (mine/friends/discover)
 */

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../../src/services/auth";
import { getFeedPosts } from "../../src/storage/posts";
import type { FeedPost, FeedScope } from "../../src/types";
import { PostCard } from "../../src/components/cards";
import { useTheme } from "../../src/theme";
import { spacing, borderRadius } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";

const SCOPES: { key: FeedScope; label: string }[] = [
  { key: "friends", label: "Friends" },
  { key: "discover", label: "Discover" },
  { key: "mine", label: "My Posts" },
];

export default function FeedScreen() {
  const { theme } = useTheme();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [scope, setScope] = useState<FeedScope>("friends");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const feedPosts = await getFeedPosts(userId, scope, 20);
      setPosts(feedPosts);
    } catch (error) {
      console.error("Failed to load posts:", error);
      Alert.alert("Error", "Failed to load posts");
    } finally {
      setIsLoading(false);
    }
  }, [userId, scope]);

  useEffect(() => {
    async function loadUser() {
      const user = await auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    }
    loadUser();
  }, []);

  useEffect(() => {
    if (userId) {
      loadPosts();
    }
  }, [userId, loadPosts]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadPosts();
    setIsRefreshing(false);
  }, [loadPosts]);

  const handleCreatePost = () => {
    router.push("/feed/create");
  };

  const handlePostPress = (postId: string) => {
    router.push(`/feed/${postId}`);
  };

  const handleAuthorPress = (authorId: string) => {
    router.push(`/profile/${authorId}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border.light }]}>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.backButton, { color: theme.semantic.primary }]}>← Back</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text.primary }]}>Feed</Text>
        <Pressable
          onPress={handleCreatePost}
          style={[styles.createButton, { backgroundColor: theme.button.primary.background }]}
        >
          <Text style={[styles.createButtonText, { color: theme.button.primary.text }]}>
            + Post
          </Text>
        </Pressable>
      </View>

      {/* Scope Tabs */}
      <View style={[styles.scopeTabs, { borderBottomColor: theme.border.light }]}>
        {SCOPES.map((s) => (
          <Pressable
            key={s.key}
            style={[
              styles.scopeTab,
              { backgroundColor: theme.background.secondary },
              scope === s.key && { backgroundColor: theme.semantic.primary },
            ]}
            onPress={() => setScope(s.key)}
          >
            <Text
              style={[
                styles.scopeTabText,
                { color: theme.text.secondary },
                scope === s.key && { color: theme.button.primary.text, fontWeight: "600" as const },
              ]}
            >
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Posts List */}
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.semantic.primary} />
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={[styles.emptyText, { color: theme.text.secondary }]}>
            {scope === "mine"
              ? "You haven't posted yet"
              : scope === "friends"
                ? "No posts from friends yet"
                : "No public posts yet"}
          </Text>
          {scope === "mine" && (
            <Pressable
              style={[styles.emptyButton, { backgroundColor: theme.button.primary.background }]}
              onPress={handleCreatePost}
            >
              <Text style={[styles.emptyButtonText, { color: theme.button.primary.text }]}>
                Create Your First Post
              </Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onPress={() => handlePostPress(item.id)}
              onAuthorPress={() => handleAuthorPress(item.authorUserId)}
              currentUserId={userId ?? ""}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    fontSize: typography.fontSize.base,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  createButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.xl,
  },
  createButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  scopeTabs: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
  },
  scopeTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xxl,
  },
  scopeTabText: {
    fontSize: typography.fontSize.sm,
  },
  scopeTabTextActive: {
    fontWeight: typography.fontWeight.semibold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xxl - 8,
  },
  emptyEmoji: {
    fontSize: typography.fontSize.hero,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  emptyButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xxxl,
  },
  emptyButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  listContent: {
    padding: spacing.md,
  },
});
