/**
 * User Profile Screen (Dynamic)
 * Shows user profile with privacy-aware content display
 * Can view own profile or other users' profiles based on privacy settings
 */

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { spacing, borderRadius } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";
import { getUserById, getFriends } from "../../src/storage/user";
import { getUserBadges } from "../../src/storage/badges";
import { getFeedPosts } from "../../src/storage/posts";
import { getHabitsByUserId } from "../../src/storage/habits";
import { auth } from "../../src/services/auth";
import type { User, Badge, FeedPost, Habit } from "../../src/types";
import { BADGE_INFO, getTieredBadgeInfo } from "../../src/types";
import { formatRelativeTime } from "../../src/logic/dates";
import { useTheme } from "../../src/theme";
import { PostCard, BadgeCard, HabitCard } from "../../src/components/cards";
import { Avatar, BadgeEarnedModal } from "../../src/components";

export default function UserProfileScreen() {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isFriend, setIsFriend] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);

  const isOwnProfile = currentUserId === id;

  const loadProfile = useCallback(async () => {
    if (!id) return;

    try {
      const currentUser = await auth.getUser();
      setCurrentUserId(currentUser?.id || null);

      const profileUser = await getUserById(id);
      if (!profileUser) {
        Alert.alert("Error", "User not found");
        router.back();
        return;
      }
      setUser(profileUser);

      // Check if friend
      let friendStatus = false;
      if (currentUser?.id && currentUser.id !== id) {
        const friends = await getFriends(currentUser.id);
        friendStatus = friends.some((f) => f.id === id);
        setIsFriend(friendStatus);
      }

      // Load badges (privacy aware)
      const userBadges = await getUserBadges(id);
      setBadges(userBadges);

      // Load habits (privacy aware)
      const userHabits = await getHabitsByUserId(
        id,
        currentUser?.id || id,
        friendStatus || currentUser?.id === id
      );
      setHabits(userHabits);

      // Load posts (privacy aware - only public and friends' posts if friend)
      const scope = isOwnProfile ? "mine" : friendStatus ? "friends" : "discover";
      const userPosts = await getFeedPosts(currentUser?.id || id, scope, 20);
      setPosts(userPosts.filter((p) => p.userId === id));
    } catch (error) {
      console.error("Failed to load profile:", error);
      Alert.alert("Error", "Failed to load profile");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, isOwnProfile]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfile();
  }, [loadProfile]);

  // Handle badge press - show details or allow sharing
  const handleBadgePress = useCallback(
    (badge: Badge) => {
      if (isOwnProfile) {
        setSelectedBadge(badge);
        setShowBadgeModal(true);
      }
    },
    [isOwnProfile]
  );

  // Handle badge share - navigate to create post with badge pre-filled
  const handleBadgeShare = useCallback((badge: Badge) => {
    // getTieredBadgeInfo extracts tier from badgeType (e.g., "posts-bronze")
    const badgeInfo = badge.tier
      ? getTieredBadgeInfo(badge.badgeType)
      : BADGE_INFO[badge.badgeType];

    const tierLabel = badge.tier ? badge.tier.charAt(0).toUpperCase() + badge.tier.slice(1) : "";

    // Navigate to feed create with pre-filled badge content
    router.push({
      pathname: "/feed/create",
      params: {
        prefillText: `${badgeInfo?.emoji} I just earned the ${tierLabel ? tierLabel + " " : ""}${badgeInfo?.name || badge.badgeType} badge! 🎉`,
        badgeId: badge.id,
      },
    });
    setShowBadgeModal(false);
  }, []);

  const renderEmptyBadges = () => (
    <View style={styles.emptyBadges}>
      <Text style={styles.emptyEmoji}>🏆</Text>
      <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>No badges yet</Text>
      <Text style={[styles.emptySubtitle, { color: theme.text.secondary }]}>
        {isOwnProfile
          ? "Complete streaks, hit milestones, and support friends to earn badges!"
          : isFriend
            ? `${user?.displayName} hasn't earned any badges yet`
            : "This user's badges are private"}
      </Text>
    </View>
  );

  const renderEmptyHabits = () => (
    <View style={styles.emptyBadges}>
      <Text style={styles.emptyEmoji}>🎯</Text>
      <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>No habits yet</Text>
      <Text style={[styles.emptySubtitle, { color: theme.text.secondary }]}>
        {isOwnProfile
          ? "Create habits to start tracking your progress!"
          : isFriend
            ? `${user?.displayName} hasn't shared any habits yet`
            : "This user's habits are private"}
      </Text>
    </View>
  );

  const renderEmptyPosts = () => (
    <View style={[styles.emptyPosts, { backgroundColor: theme.background.secondary }]}>
      <Text style={styles.emptyEmoji}>📭</Text>
      <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>No posts</Text>
      <Text style={[styles.emptySubtitle, { color: theme.text.secondary }]}>
        {isOwnProfile
          ? "Share your journey and connect with friends!"
          : isFriend
            ? `${user?.displayName} hasn't posted yet`
            : "This user's posts are private"}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.semantic.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.text.secondary }]}>User not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Privacy aware display
  const canSeeBio = isOwnProfile || user.defaultPrivacy !== "SELF";
  const canSeeBadges = isOwnProfile || (isFriend && user.defaultPrivacy !== "SELF");
  const canSeeHabits =
    isOwnProfile ||
    (isFriend && user.defaultPrivacy !== "SELF") ||
    user.defaultPrivacy === "PUBLIC";
  const canSeePosts =
    isOwnProfile ||
    user.defaultPrivacy === "PUBLIC" ||
    (isFriend && user.defaultPrivacy !== "SELF");

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: theme.border.light }]}>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.backButton, { color: theme.semantic.primary }]}>← Back</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Profile</Text>
        {isOwnProfile && (
          <Pressable onPress={() => router.push("/settings")}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </Pressable>
        )}
        {!isOwnProfile && <View style={{ width: 24 }} />}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: theme.card.background }]}>
          <Avatar imageUrl={user.photoUrl} name={user.displayName} size="xl" />
          <Text style={[styles.displayName, { color: theme.text.primary }]}>
            {user.displayName}
          </Text>
          {canSeeBio && user.bio && (
            <Text style={[styles.bio, { color: theme.text.secondary }]}>{user.bio}</Text>
          )}
          <Text style={[styles.joinDate, { color: theme.text.tertiary }]}>
            Joined {formatRelativeTime(user.createdAt)}
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={[styles.statsRow, { backgroundColor: theme.card.background }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text.primary }]}>{badges.length}</Text>
            <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Badges</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border.light }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text.primary }]}>{habits.length}</Text>
            <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Habits</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border.light }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text.primary }]}>{posts.length}</Text>
            <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Posts</Text>
          </View>
        </View>

        {/* Badges Section */}
        {canSeeBadges && (
          <View style={[styles.section, { backgroundColor: theme.card.background }]}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
              Badges ({badges.length})
            </Text>
            {badges.length === 0 ? (
              renderEmptyBadges()
            ) : (
              <View style={styles.badgesGrid}>
                {badges.map((badge) => (
                  <BadgeCard
                    key={badge.id}
                    badge={badge}
                    onPress={isOwnProfile ? handleBadgePress : undefined}
                    onShare={isOwnProfile ? handleBadgeShare : undefined}
                    showShareButton={isOwnProfile}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Habits Section */}
        {canSeeHabits && (
          <View style={[styles.section, { backgroundColor: theme.card.background }]}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
              Habits ({habits.length})
            </Text>
            {habits.length === 0 ? (
              renderEmptyHabits()
            ) : (
              <View>
                {habits.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    onPress={() => router.push(`/habits/${habit.id}`)}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Posts Section */}
        {canSeePosts && (
          <View style={styles.postsSection}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
              Posts ({posts.length})
            </Text>
            {posts.length === 0
              ? renderEmptyPosts()
              : posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onPress={() => router.push(`/feed/${post.id}`)}
                    onAuthorPress={() => router.push(`/profile/${post.userId}`)}
                    currentUserId={currentUserId ?? ""}
                  />
                ))}
          </View>
        )}

        {/* Privacy Notice */}
        {!isOwnProfile && !canSeeBadges && (
          <View style={[styles.privacyNotice, { backgroundColor: theme.card.background }]}>
            <Text style={[styles.privacyText, { color: theme.text.secondary }]}>
              🔒 This user&apos;s profile is private
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Badge Detail Modal (for sharing) */}
      <BadgeEarnedModal
        visible={showBadgeModal}
        badge={selectedBadge}
        onClose={() => setShowBadgeModal(false)}
        onShare={handleBadgeShare}
      />
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
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  settingsIcon: {
    fontSize: 20,
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
  profileHeader: {
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: typography.fontWeight.bold,
  },
  displayName: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  bio: {
    fontSize: typography.fontSize.md,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  joinDate: {
    fontSize: typography.fontSize.sm,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xxs,
  },
  statDivider: {
    width: 1,
  },
  section: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  emptyBadges: {
    alignItems: "center",
    padding: spacing.lg,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.sm,
    textAlign: "center",
  },
  postsSection: {
    marginBottom: spacing.md,
  },
  emptyPosts: {
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: borderRadius.md,
  },
  privacyNotice: {
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  privacyText: {
    fontSize: typography.fontSize.md,
    textAlign: "center",
  },
});
