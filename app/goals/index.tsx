/**
 * Goals Screen - Display and manage user goals
 * M2-2.1: Create Goal feature with comprehensive goal setup
 * Refactored to use reusable components for maintainability
 */

import { useState, useEffect, useCallback } from "react";
import { FlatList, RefreshControl, Alert, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { auth } from "../../src/services/auth";
import { createGoal, getGoals, archiveGoal } from "../../src/storage/goals";
import { ALL_PILLARS } from "../../src/types/goals";
import type { Goal, Pillar } from "../../src/types";
import {
  ScreenHeader,
  EmptyState,
  PillarSection,
  GoalCard,
  CreateGoalModal,
  type CreateGoalData,
} from "../../src/components";
import { useTheme } from "../../src/theme";
import { spacing } from "../../src/theme/spacing";
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
      <ScreenHeader
        title="Goals"
        rightButton={{
          label: "+ New",
          onPress: () => setShowCreateModal(true),
          variant: "primary",
        }}
      />

      {goals.length === 0 ? (
        <EmptyState
          emoji="🎯"
          title="No goals yet"
          subtitle="Create your first goal to start tracking your progress"
          ctaLabel="Create Goal"
          onCtaPress={() => setShowCreateModal(true)}
          size="large"
        />
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
            <PillarSection pillar={pillar} count={goalsByPillar[pillar]?.length || 0}>
              {goalsByPillar[pillar]?.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onPress={() => router.push(`/goals/${goal.id}`)}
                  onLongPress={() => handleArchiveGoal(goal.id, goal.title)}
                />
              ))}
            </PillarSection>
          )}
        />
      )}

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
  listContent: {
    padding: spacing.md,
  },
});
