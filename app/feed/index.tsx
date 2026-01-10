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
import { PostCard } from "../../src/components/cards/PostCard";

const SCOPES: { key: FeedScope; label: string }[] = [
  { key: "friends", label: "Friends" },
  { key: "discover", label: "Discover" },
  { key: "mine", label: "My Posts" },
];

export default function FeedScreen() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [scope, setScope] = useState<FeedScope>("friends");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (userId) {
      loadPosts();
    }
  }, [scope, userId]);

  async function loadUser() {
    const user = await auth.getUser();
    if (user) {
      setUserId(user.id);
    }
  }

  async function loadPosts() {
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
  }

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadPosts();
    setIsRefreshing(false);
  }, [userId, scope]);

  const handleCreatePost = () => {
    router.push("/feed/create");
  };

  const handlePostPress = (postId: string) => {
    router.push(`/feed/${postId}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Feed</Text>
        <Pressable onPress={handleCreatePost} style={styles.createButton}>
          <Text style={styles.createButtonText}>+ Post</Text>
        </Pressable>
      </View>

      {/* Scope Tabs */}
      <View style={styles.scopeTabs}>
        {SCOPES.map((s) => (
          <Pressable
            key={s.key}
            style={[styles.scopeTab, scope === s.key && styles.scopeTabActive]}
            onPress={() => setScope(s.key)}
          >
            <Text style={[styles.scopeTabText, scope === s.key && styles.scopeTabTextActive]}>
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Posts List */}
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyText}>
            {scope === "mine"
              ? "You haven't posted yet"
              : scope === "friends"
                ? "No posts from friends yet"
                : "No public posts yet"}
          </Text>
          {scope === "mine" && (
            <Pressable style={styles.emptyButton} onPress={handleCreatePost}>
              <Text style={styles.emptyButtonText}>Create Your First Post</Text>
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
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    fontSize: 16,
    color: "#007AFF",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  createButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  scopeTabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  scopeTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
  },
  scopeTabActive: {
    backgroundColor: "#007AFF",
  },
  scopeTabText: {
    fontSize: 14,
    color: "#666",
  },
  scopeTabTextActive: {
    color: "#fff",
    fontWeight: "600",
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
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
  },
});
