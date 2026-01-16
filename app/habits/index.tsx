/**
 * Habits Screen - Display and manage user habits
 * M2-2.2: Create Habit feature
 * Refactored to use reusable components for maintainability
 */

import { useState, useEffect, useCallback } from "react";
import { FlatList, RefreshControl, Alert, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { auth } from "../../src/services/auth";
import { createHabit, getHabits } from "../../src/storage/habits";
import { getGoals } from "../../src/storage/goals";
import { ALL_PILLARS } from "../../src/types/goals";
import type { Habit, Goal, Pillar } from "../../src/types";
import { useTheme } from "../../src/theme";
import { spacing } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";
import {
  ScreenHeader,
  EmptyState,
  PillarSection,
  HabitCard,
  CreateHabitModal,
  type CreateHabitData,
} from "../../src/components";

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

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background.secondary }]}>
        <Text style={[styles.loadingText, { color: theme.text.secondary }]}>Loading habits...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.secondary }]}>
      <ScreenHeader
        title="Habits"
        rightButton={{
          label: "+ New",
          onPress: () => setShowCreateModal(true),
          variant: "primary",
        }}
      />

      {habits.length === 0 ? (
        <EmptyState
          emoji="🔄"
          title="No habits yet"
          subtitle="Create recurring habits to build consistency"
          ctaLabel="Create Habit"
          onCtaPress={() => setShowCreateModal(true)}
        />
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
            <PillarSection pillar={pillar} count={habitsByPillar[pillar]?.length || 0}>
              {habitsByPillar[pillar]?.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  linkedGoal={goals.find((g) => g.id === habit.goalId)}
                  onPress={() => router.push(`/habits/${habit.id}`)}
                />
              ))}
            </PillarSection>
          )}
        />
      )}

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
  listContent: {
    padding: spacing.md,
  },
});
