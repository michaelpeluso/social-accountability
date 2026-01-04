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

export default function GoalDetailScreen() {
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
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!goal) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Goal not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const pillarInfo = PILLAR_INFO[goal.pillar];
  const privacyInfo = PRIVACY_INFO[goal.privacy];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Pressable onPress={handleArchive} style={styles.archiveButton}>
          <Text style={styles.archiveButtonText}>Archive</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        {/* Goal Info Card */}
        <View style={[styles.goalCard, { borderLeftColor: pillarInfo.color }]}>
          <View style={styles.goalHeader}>
            <Text style={styles.pillarEmoji}>{pillarInfo.emoji}</Text>
            <View style={styles.goalTitleContainer}>
              <Text style={styles.goalTitle}>{goal.title}</Text>
              <Text style={styles.pillarLabel}>{pillarInfo.label}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.privacyBadge}>
              <Text style={styles.privacyText}>{privacyInfo.label}</Text>
            </View>
            <Text style={styles.createdDate}>
              Created {new Date(goal.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Linked Habits Section */}
        <View style={styles.habitsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Linked Habits</Text>
            <Pressable onPress={handleAddHabit} style={styles.addHabitButton}>
              <Text style={styles.addHabitButtonText}>+ Add Habit</Text>
            </Pressable>
          </View>

          {habits.length === 0 ? (
            <View style={styles.noHabits}>
              <Text style={styles.noHabitsText}>No habits linked to this goal yet.</Text>
              <Pressable onPress={handleAddHabit} style={styles.linkHabitButton}>
                <Text style={styles.linkHabitButtonText}>Create a habit</Text>
              </Pressable>
            </View>
          ) : (
            habits.map((habit) => (
              <Pressable
                key={habit.id}
                style={styles.habitCard}
                onPress={() => router.push(`/habits/${habit.id}`)}
              >
                <View style={styles.habitInfo}>
                  <Text style={styles.habitTitle}>{habit.title}</Text>
                  <Text style={styles.habitSchedule}>
                    {habit.schedule.targetCount}x {habit.schedule.frequency}
                  </Text>
                </View>
                {habit.currentStreak > 0 && (
                  <View style={styles.streakBadge}>
                    <Text style={styles.streakText}>{habit.currentStreak} day streak</Text>
                  </View>
                )}
              </Pressable>
            ))
          )}
        </View>

        {/* Progress Summary (placeholder for M2-2.7) */}
        <View style={styles.progressSection}>
          <Text style={styles.sectionTitle}>Progress</Text>
          <View style={styles.progressCard}>
            <Text style={styles.progressText}>
              {habits.length} habit{habits.length !== 1 ? "s" : ""} linked
            </Text>
            <Text style={styles.progressSubtext}>Track your progress towards this goal</Text>
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
  loadingText: {
    textAlign: "center",
    marginTop: 100,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: "#007AFF",
  },
  archiveButton: {
    padding: 8,
  },
  archiveButtonText: {
    fontSize: 16,
    color: "#FF6B6B",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    color: "#666",
  },
  content: {
    flex: 1,
  },
  goalCard: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 20,
    borderRadius: 16,
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
    marginBottom: 16,
  },
  pillarEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  goalTitleContainer: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  pillarLabel: {
    fontSize: 14,
    color: "#666",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  privacyBadge: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  privacyText: {
    fontSize: 12,
    color: "#666",
  },
  createdDate: {
    fontSize: 12,
    color: "#999",
  },
  habitsSection: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
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
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  addHabitButton: {
    backgroundColor: "#000",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addHabitButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
  },
  noHabits: {
    alignItems: "center",
    paddingVertical: 20,
  },
  noHabitsText: {
    color: "#999",
    fontSize: 14,
    marginBottom: 12,
  },
  linkHabitButton: {
    paddingVertical: 8,
  },
  linkHabitButtonText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
  },
  habitCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  habitInfo: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  habitSchedule: {
    fontSize: 13,
    color: "#666",
  },
  streakBadge: {
    backgroundColor: "#FF6B6B20",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakText: {
    fontSize: 12,
    color: "#FF6B6B",
    fontWeight: "600",
  },
  progressSection: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  progressCard: {
    marginTop: 12,
    padding: 16,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
  },
  progressText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  progressSubtext: {
    fontSize: 14,
    color: "#666",
  },
});
