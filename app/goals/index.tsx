/**
 * Goals Screen - Display and manage user goals
 * M2-2.1: Create Goal feature with comprehensive goal setup
 */

import { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, FlatList, RefreshControl, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { auth } from "../../src/services/auth";
import { createGoal, getGoals, archiveGoal } from "../../src/storage/goals";
import { PILLAR_INFO, ALL_PILLARS, PRIVACY_INFO } from "../../src/types/goals";
import type { Goal, Pillar } from "../../src/types";
import { CreateGoalModal, type CreateGoalData } from "../../src/components";
import { useTheme } from "../../src/theme";
import { spacing, borderRadius } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";

export default function GoalsScreen() {
  const { theme } = useTheme();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const initializeScreen = useCallback(async () => {
    const user = await auth.getUser();
    if (user) {
      setUserId(user.id);
      await loadGoals(user.id);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    initializeScreen();
  }, [initializeScreen]);

  async function loadGoals(uid: string) {
    try {
      const userGoals = await getGoals(uid);
      setGoals(userGoals);
    } catch {
      Alert.alert("Error", "Failed to load goals");
    }
  }

  const onRefresh = useCallback(async () => {
    if (!userId) return;
    setIsRefreshing(true);
    await loadGoals(userId);
    setIsRefreshing(false);
  }, [userId]);

  async function handleCreateGoal(data: CreateGoalData) {
    if (!userId) return;

    await createGoal(userId, {
      title: data.title,
      pillar: data.pillar,
      privacy: data.privacy,
      description: data.description,
      identityId: data.identityId,
      isIndefinite: data.isIndefinite,
      startValue: data.startValue,
      targetValue: data.targetValue,
      startDate: data.startDate,
      deadline: data.deadline,
      dataSource: data.dataSource,
    });

    await loadGoals(userId);
  }

  async function handleArchiveGoal(goalId: string, goalTitle: string) {
    if (!userId) return;

    Alert.alert("Archive Goal", `Archive "${goalTitle}"? You can restore it later.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Archive",
        onPress: async () => {
          try {
            await archiveGoal(goalId);
            await loadGoals(userId);
          } catch {
            Alert.alert("Error", "Failed to archive goal");
          }
        },
      },
    ]);
  }

  // Group goals by pillar
  const goalsByPillar = goals.reduce(
    (acc, goal) => {
      if (!acc[goal.pillar]) {
        acc[goal.pillar] = [];
      }
      acc[goal.pillar].push(goal);
      return acc;
    },
    {} as Record<Pillar, Goal[]>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background.secondary }]}>
        <Text style={[styles.loadingText, { color: theme.text.tertiary }]}>Loading goals...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.secondary }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.background.primary, borderBottomColor: theme.border.light },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: theme.semantic.primary }]}>Back</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Goals</Text>
        <Pressable
          onPress={() => setShowCreateModal(true)}
          style={[styles.addButton, { backgroundColor: theme.button.primary.background }]}
        >
          <Text style={[styles.addButtonText, { color: theme.button.primary.text }]}>+ New</Text>
        </Pressable>
      </View>

      {/* Goals List */}
      {goals.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🎯</Text>
          <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>No goals yet</Text>
          <Text style={[styles.emptySubtitle, { color: theme.text.tertiary }]}>
            Create your first goal to start tracking your progress
          </Text>
          <Pressable
            style={[styles.createFirstButton, { backgroundColor: theme.button.primary.background }]}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={[styles.createFirstButtonText, { color: theme.button.primary.text }]}>
              Create Goal
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={ALL_PILLARS.filter((p) => goalsByPillar[p]?.length > 0)}
          keyExtractor={(pillar) => pillar}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={theme.text.secondary}
            />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item: pillar }) => (
            <View style={styles.pillarSection}>
              <View
                style={[styles.pillarHeader, { backgroundColor: PILLAR_INFO[pillar].color + "20" }]}
              >
                <Text style={styles.pillarEmoji}>{PILLAR_INFO[pillar].emoji}</Text>
                <Text style={[styles.pillarTitle, { color: PILLAR_INFO[pillar].color }]}>
                  {PILLAR_INFO[pillar].label}
                </Text>
                <Text style={[styles.goalCount, { color: theme.text.tertiary }]}>
                  {goalsByPillar[pillar]?.length || 0}
                </Text>
              </View>
              {goalsByPillar[pillar]?.map((goal) => (
                <Pressable
                  key={goal.id}
                  style={[styles.goalCard, { backgroundColor: theme.card.background }]}
                  onPress={() => router.push(`/goals/${goal.id}`)}
                  onLongPress={() => handleArchiveGoal(goal.id, goal.title)}
                >
                  <Text style={[styles.goalTitle, { color: theme.text.primary }]}>
                    {goal.title}
                  </Text>
                  <View style={styles.goalMeta}>
                    <Text
                      style={[
                        styles.privacyBadge,
                        { color: theme.text.tertiary, backgroundColor: theme.background.secondary },
                      ]}
                    >
                      {PRIVACY_INFO[goal.privacy].label}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        />
      )}

      {/* Create Goal Modal */}
      <CreateGoalModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateGoal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    textAlign: "center",
    marginTop: 100,
    fontSize: typography.fontSize.base,
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
    padding: spacing.xs,
  },
  backButtonText: {
    fontSize: typography.fontSize.base,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  addButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  addButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.heading.h2.fontSize,
    fontWeight: typography.heading.h2.fontWeight,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.base,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  createFirstButton: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  createFirstButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  listContent: {
    padding: spacing.md,
  },
  pillarSection: {
    marginBottom: spacing.lg,
  },
  pillarHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  pillarEmoji: {
    fontSize: 20,
    marginRight: spacing.xs,
  },
  pillarTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    flex: 1,
  },
  goalCount: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  goalCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xs,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  goalTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  goalMeta: {
    flexDirection: "row",
  },
  privacyBadge: {
    fontSize: typography.fontSize.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
});
