/**
 * Goal Detail Screen - View goal and its linked habits
 * M2-2.5: Archive Goal feature
 */

import { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, RefreshControl, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { auth } from "../../src/services/auth";
import { getGoalById, archiveGoal } from "../../src/storage/goals";
import { getHabitsByGoal } from "../../src/storage/habits";
import { PILLAR_INFO, PRIVACY_INFO } from "../../src/types/goals";
import type { Goal, Habit } from "../../src/types";
import { useTheme, spacing, borderRadius, typography } from "../../src/theme";

export default function GoalDetailScreen() {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const [goalData, habitsData] = await Promise.all([getGoalById(id), getHabitsByGoal(id)]);
      setGoal(goalData);
      setHabits(habitsData);
    } catch {
      Alert.alert("Error", "Failed to load goal");
    }
  }, [id]);

  useEffect(() => {
    async function initialize() {
      const user = await auth.getUser();
      if (user) {
        setUserId(user.id);
        await loadData();
      }
      setIsLoading(false);
    }
    initialize();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    if (!userId) return;
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  }, [userId, loadData]);

  async function handleArchive() {
    if (!goal) return;

    Alert.alert("Archive Goal", "Archive this goal? You can restore it later.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Archive",
        onPress: async () => {
          try {
            await archiveGoal(goal.id);
            router.back();
          } catch {
            Alert.alert("Error", "Failed to archive goal");
          }
        },
      },
    ]);
  }

  function handleAddHabit() {
    if (!id) return;
    router.push(`/habits?goalId=${id}`);
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background.secondary }]}>
        <Text style={[styles.loadingText, { color: theme.text.tertiary }]}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!goal) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background.secondary }]}>
        <View
          style={[
            styles.header,
            { backgroundColor: theme.background.primary, borderBottomColor: theme.border.light },
          ]}
        >
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: theme.semantic.primary }]}>Back</Text>
          </Pressable>
        </View>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: theme.text.tertiary }]}>Goal not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const pillarInfo = PILLAR_INFO[goal.pillar];
  const privacyInfo = PRIVACY_INFO[goal.privacy];

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
        <Pressable onPress={handleArchive} style={styles.archiveButton}>
          <Text style={[styles.archiveButtonText, { color: theme.semantic.danger }]}>Archive</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.text.secondary}
          />
        }
      >
        {/* Goal Info Card */}
        <View
          style={[
            styles.goalCard,
            { backgroundColor: theme.card.background, borderLeftColor: pillarInfo.color },
          ]}
        >
          <View style={styles.goalHeader}>
            <Text style={styles.pillarEmoji}>{pillarInfo.emoji}</Text>
            <View style={styles.goalTitleContainer}>
              <Text style={[styles.goalTitle, { color: theme.text.primary }]}>{goal.title}</Text>
              <Text style={[styles.pillarLabel, { color: theme.text.tertiary }]}>
                {pillarInfo.label}
              </Text>
            </View>
          </View>

          <View style={[styles.metaRow, { borderTopColor: theme.border.light }]}>
            <View style={[styles.privacyBadge, { backgroundColor: theme.background.secondary }]}>
              <Text style={[styles.privacyText, { color: theme.text.tertiary }]}>
                {privacyInfo.label}
              </Text>
            </View>
            <Text style={[styles.createdDate, { color: theme.text.tertiary }]}>
              Created {new Date(goal.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Linked Habits Section */}
        <View style={[styles.habitsSection, { backgroundColor: theme.card.background }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Linked Habits</Text>
            <Pressable
              onPress={handleAddHabit}
              style={[styles.addHabitButton, { backgroundColor: theme.button.primary.background }]}
            >
              <Text style={[styles.addHabitButtonText, { color: theme.button.primary.text }]}>
                + Add Habit
              </Text>
            </Pressable>
          </View>

          {habits.length === 0 ? (
            <View style={styles.noHabits}>
              <Text style={[styles.noHabitsText, { color: theme.text.tertiary }]}>
                No habits linked to this goal yet.
              </Text>
              <Pressable onPress={handleAddHabit} style={styles.linkHabitButton}>
                <Text style={[styles.linkHabitButtonText, { color: theme.semantic.primary }]}>
                  Create a habit
                </Text>
              </Pressable>
            </View>
          ) : (
            habits.map((habit) => (
              <Pressable
                key={habit.id}
                style={[styles.habitCard, { borderBottomColor: theme.border.light }]}
                onPress={() => router.push(`/habits/${habit.id}`)}
              >
                <View style={styles.habitInfo}>
                  <Text style={[styles.habitTitle, { color: theme.text.primary }]}>
                    {habit.title}
                  </Text>
                  <Text style={[styles.habitSchedule, { color: theme.text.tertiary }]}>
                    {habit.schedule.targetCount}x {habit.schedule.frequency}
                  </Text>
                </View>
                {habit.currentStreak > 0 && (
                  <View
                    style={[styles.streakBadge, { backgroundColor: theme.semantic.danger + "20" }]}
                  >
                    <Text style={[styles.streakText, { color: theme.semantic.danger }]}>
                      {habit.currentStreak} day streak
                    </Text>
                  </View>
                )}
              </Pressable>
            ))
          )}
        </View>

        {/* Progress Summary (placeholder for M2-2.7) */}
        <View style={[styles.progressSection, { backgroundColor: theme.card.background }]}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Progress</Text>
          <View style={[styles.progressCard, { backgroundColor: theme.background.secondary }]}>
            <Text style={[styles.progressText, { color: theme.text.primary }]}>
              {habits.length} habit{habits.length !== 1 ? "s" : ""} linked
            </Text>
            <Text style={[styles.progressSubtext, { color: theme.text.tertiary }]}>
              Track your progress towards this goal
            </Text>
          </View>
        </View>
      </ScrollView>
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
  archiveButton: {
    padding: spacing.xs,
  },
  archiveButtonText: {
    fontSize: typography.fontSize.base,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xxl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
  },
  content: {
    flex: 1,
  },
  goalCard: {
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  goalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  pillarEmoji: {
    fontSize: 32,
    marginRight: spacing.sm,
  },
  goalTitleContainer: {
    flex: 1,
  },
  goalTitle: {
    fontSize: typography.heading.h2.fontSize,
    fontWeight: typography.heading.h2.fontWeight,
    marginBottom: spacing.xxs,
  },
  pillarLabel: {
    fontSize: typography.fontSize.sm,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  privacyBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
  privacyText: {
    fontSize: typography.fontSize.xs,
  },
  createdDate: {
    fontSize: typography.fontSize.xs,
  },
  habitsSection: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  addHabitButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
  addHabitButtonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  noHabits: {
    alignItems: "center",
    paddingVertical: spacing.lg,
  },
  noHabitsText: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.sm,
  },
  linkHabitButton: {
    paddingVertical: spacing.xs,
  },
  linkHabitButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  habitCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  habitInfo: {
    flex: 1,
  },
  habitTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xxs,
  },
  habitSchedule: {
    fontSize: typography.fontSize.xs,
  },
  streakBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.full,
  },
  streakText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  progressSection: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xxl,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  progressCard: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  progressText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xxs,
  },
  progressSubtext: {
    fontSize: typography.fontSize.sm,
  },
});
