/**
 * Goal Detail Screen - View goal and its linked habits
 * M2-2.5: Archive Goal feature
 */

import { useState, useEffect, useCallback } from "react";
import { Text, StyleSheet, Pressable, RefreshControl, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { auth } from "../../src/services/auth";
import { getGoalById, archiveGoal } from "../../src/storage/goals";
import { getHabitsByGoal } from "../../src/storage/habits";
import type { Goal, Habit } from "../../src/types";
import { useTheme, spacing, typography } from "../../src/theme";
import {
  ScreenHeader,
  EmptyState,
  GoalDetailCard,
  LinkedHabitsList,
  ProgressSummary,
} from "../../src/components";

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
        <ScreenHeader title="" />
        <EmptyState emoji="🔍" title="Goal not found" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.secondary }]}>
      <ScreenHeader
        title=""
        rightAction={
          <Pressable onPress={handleArchive} style={styles.archiveButton}>
            <Text style={[styles.archiveButtonText, { color: theme.semantic.danger }]}>
              Archive
            </Text>
          </Pressable>
        }
      />

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
        <GoalDetailCard goal={goal} />
        <LinkedHabitsList habits={habits} onAddHabit={handleAddHabit} />
        <ProgressSummary habitCount={habits.length} />
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
  content: {
    flex: 1,
  },
  archiveButton: {
    padding: spacing.xs,
  },
  archiveButtonText: {
    fontSize: typography.fontSize.base,
  },
});
