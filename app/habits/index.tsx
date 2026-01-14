/**
 * Habits Screen - Display and manage user habits
 * M2-2.2: Create Habit feature
 */

import { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, FlatList, RefreshControl, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { auth } from "../../src/services/auth";
import { createHabit, getHabits } from "../../src/storage/habits";
import { getGoals } from "../../src/storage/goals";
import { PILLAR_INFO, ALL_PILLARS } from "../../src/types/goals";
import type { Habit, Goal, Pillar } from "../../src/types";
import { useTheme } from "../../src/theme";
import { spacing, borderRadius } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";
import { CreateHabitModal, type CreateHabitData } from "../../src/components";

export default function HabitsScreen() {
  const { theme } = useTheme();
  const params = useLocalSearchParams<{ goalId?: string }>();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const loadHabits = useCallback(
    async (uid: string) => {
      try {
        const userHabits = await getHabits(uid, { goalId: params.goalId });
        setHabits(userHabits);
      } catch {
        Alert.alert("Error", "Failed to load habits");
      }
    },
    [params.goalId]
  );

  const loadGoals = useCallback(async (uid: string) => {
    try {
      const userGoals = await getGoals(uid);
      setGoals(userGoals);
    } catch {
      // Silent fail for goals - not critical
    }
  }, []);

  const initializeScreen = useCallback(async () => {
    const user = await auth.getUser();
    if (user) {
      setUserId(user.id);
      await Promise.all([loadHabits(user.id), loadGoals(user.id)]);
    }
    setIsLoading(false);
  }, [loadHabits, loadGoals]);

  useEffect(() => {
    initializeScreen();
  }, [initializeScreen]);

  const onRefresh = useCallback(async () => {
    if (!userId) return;
    setIsRefreshing(true);
    await loadHabits(userId);
    setIsRefreshing(false);
  }, [userId, loadHabits]);

  async function handleCreateHabit(data: CreateHabitData) {
    if (!userId) return;

    await createHabit(userId, {
      title: data.title,
      goalId: data.goalId,
      pillar: data.pillar,
      schedule: data.schedule,
      privacy: data.privacy,
      description: data.description,
      habitType: data.habitType,
      completionType: data.completionType,
      targetValue: data.targetValue,
      unit: data.unit,
      icon: data.icon,
      difficulty: data.difficulty,
      miniVersion: data.miniVersion,
      graceDays: data.graceDays,
    });

    await loadHabits(userId);
  }

  // Group habits by pillar
  const habitsByPillar = habits.reduce(
    (acc, habit) => {
      if (!acc[habit.pillar]) {
        acc[habit.pillar] = [];
      }
      acc[habit.pillar].push(habit);
      return acc;
    },
    {} as Record<Pillar, Habit[]>
  );

  const getGoalTitle = (goalId?: string) => {
    if (!goalId) return null;
    const goal = goals.find((g) => g.id === goalId);
    return goal?.title;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background.secondary }]}>
        <Text style={[styles.loadingText, { color: theme.text.secondary }]}>Loading habits...</Text>
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
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Habits</Text>
        <Pressable
          onPress={() => setShowCreateModal(true)}
          style={[styles.addButton, { backgroundColor: theme.button.primary.background }]}
        >
          <Text style={[styles.addButtonText, { color: theme.button.primary.text }]}>+ New</Text>
        </Pressable>
      </View>

      {/* Habits List */}
      {habits.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🔄</Text>
          <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>No habits yet</Text>
          <Text style={[styles.emptySubtitle, { color: theme.text.secondary }]}>
            Create recurring habits to build consistency
          </Text>
          <Pressable
            style={[styles.createFirstButton, { backgroundColor: theme.button.primary.background }]}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={[styles.createFirstButtonText, { color: theme.button.primary.text }]}>
              Create Habit
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={ALL_PILLARS.filter((p) => habitsByPillar[p]?.length > 0)}
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
                <Text style={[styles.habitCount, { color: theme.text.tertiary }]}>
                  {habitsByPillar[pillar]?.length || 0}
                </Text>
              </View>
              {habitsByPillar[pillar]?.map((habit) => (
                <Pressable
                  key={habit.id}
                  style={[styles.habitCard, { backgroundColor: theme.card.background }]}
                  onPress={() => router.push(`/habits/${habit.id}`)}
                >
                  <View style={styles.habitHeader}>
                    <Text style={[styles.habitTitle, { color: theme.text.primary }]}>
                      {habit.title}
                    </Text>
                    {habit.currentStreak > 0 && (
                      <View
                        style={[
                          styles.streakBadge,
                          { backgroundColor: theme.semantic.danger + "20" },
                        ]}
                      >
                        <Text style={[styles.streakText, { color: theme.semantic.danger }]}>
                          {habit.currentStreak} day streak
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.habitMeta}>
                    <Text
                      style={[
                        styles.scheduleBadge,
                        {
                          color: theme.text.secondary,
                          backgroundColor: theme.background.secondary,
                        },
                      ]}
                    >
                      {habit.schedule.targetCount}x {habit.schedule.frequency}
                    </Text>
                    {getGoalTitle(habit.goalId) && (
                      <Text style={[styles.goalLink, { color: theme.semantic.primary }]}>
                        {getGoalTitle(habit.goalId)}
                      </Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        />
      )}

      {/* Create Habit Modal */}
      <CreateHabitModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateHabit}
        goals={goals}
        initialGoalId={params.goalId}
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
    paddingVertical: spacing.xmd,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing.sm,
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
    paddingVertical: spacing.sm,
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
    fontSize: typography.fontSize.hero,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.base,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  createFirstButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.smd,
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
    paddingHorizontal: spacing.xmd,
    paddingVertical: spacing.xmd,
    borderRadius: borderRadius.xmd,
    marginBottom: spacing.sm,
  },
  pillarEmoji: {
    fontSize: typography.fontSize.xl,
    marginRight: spacing.sm,
  },
  pillarTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    flex: 1,
  },
  habitCount: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  habitCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: borderRadius.sm,
    elevation: 2,
  },
  habitHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  habitTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    flex: 1,
  },
  streakBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
  },
  streakText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  habitMeta: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  scheduleBadge: {
    fontSize: typography.fontSize.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  goalLink: {
    fontSize: typography.fontSize.xs,
  },
});
