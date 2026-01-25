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
import { ScreenHeader, EmptyState, ScopeTabs, PostCard } from "../../src/components";
import { useTheme, spacing } from "../../src/theme";

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

  const getEmptyMessage = () => {
    switch (scope) {
      case "mine":
        return "You haven't posted yet";
      case "friends":
        return "No posts from friends yet";
      default:
        return "No public posts yet";
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
      <ScreenHeader
        title="Feed"
        rightAction={
          <Pressable
            onPress={handleCreatePost}
            style={[styles.createButton, { backgroundColor: theme.button.primary.background }]}
          >
            <Text style={[styles.createButtonText, { color: theme.button.primary.text }]}>
              + Post
            </Text>
          </Pressable>
        }
      />

      <ScopeTabs tabs={SCOPES} activeTab={scope} onTabChange={setScope} />

      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.semantic.primary} />
        </View>
      ) : posts.length === 0 ? (
        <EmptyState
          emoji="📭"
          title={getEmptyMessage()}
          ctaLabel={scope === "mine" ? "Create Your First Post" : undefined}
          onCtaPress={scope === "mine" ? handleCreatePost : undefined}
        />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onPress={() => handlePostPress(item.id)}
              onAuthorPress={() => handleAuthorPress(item.userId)}
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
  createButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderRadius: 20,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: spacing.md,
  },
});
