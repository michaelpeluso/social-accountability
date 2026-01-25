/**
 * Goal Detail Screen - View goal and its linked habits
 * M2-2.5: Archive Goal feature
 * M5: Goal joining feature
 */

import { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, RefreshControl, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { auth } from "../../src/services/auth";
import { getGoalById, archiveGoal } from "../../src/storage/goals";
import { getHabitsWithMeta } from "../../src/storage/habits";
import {
  joinGoal,
  leaveGoal,
  isGoalParticipant,
  getGoalParticipant,
  getGoalParticipantCount,
  updateGoalParticipantPerformancePrivacy,
} from "../../src/storage/goalParticipants";
import { getUserById } from "../../src/storage/user";
import type { Goal, HabitWithMeta, Privacy, GoalParticipant } from "../../src/types";
import { useTheme, spacing, borderRadius, typography } from "../../src/theme";
import {
  ScreenHeader,
  EmptyState,
  GoalDetailCard,
  LinkedHabitsList,
  ProgressSummary,
  EditJoinedGoalModal,
  Avatar,
} from "../../src/components";

export default function GoalDetailScreen() {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [habits, setHabits] = useState<HabitWithMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");

  // Joining state
  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [participant, setParticipant] = useState<GoalParticipant | null>(null);
  const [ownerInfo, setOwnerInfo] = useState<{ name: string; photoUrl?: string } | null>(null);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPerformancePrivacy, setEditPerformancePrivacy] = useState<Privacy>("FRIENDS");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOwner = goal?.userId === userId;

  const loadData = useCallback(async () => {
    if (!id || !userId) return;
    try {
      const [goalData, count] = await Promise.all([getGoalById(id), getGoalParticipantCount(id)]);
      setGoal(goalData);
      setParticipantCount(count);

      if (goalData) {
        // Get habits for this goal
        const habitsData = await getHabitsWithMeta(goalData.userId, { goalId: id });
        setHabits(habitsData);

        // Check if current user is a participant
        const isParticipantResult = await isGoalParticipant(id, userId);
        setIsJoined(isParticipantResult);

        if (isParticipantResult) {
          const participantData = await getGoalParticipant(id, userId);
          setParticipant(participantData);
          if (participantData) {
            setEditPerformancePrivacy(participantData.performancePrivacy);
          }
        }

        // Get owner info if viewing someone else's goal
        if (goalData.userId !== userId) {
          const owner = await getUserById(goalData.userId);
          if (owner) {
            setOwnerInfo({ name: owner.displayName, photoUrl: owner.photoUrl });
          }
        }
      }
    } catch {
      Alert.alert("Error", "Failed to load goal");
    }
  }, [id, userId]);

  useEffect(() => {
    async function initialize() {
      const user = await auth.getUser();
      if (user) {
        setUserId(user.id);
        setUserName(user.displayName);
      }
      setIsLoading(false);
    }
    initialize();
  }, []);

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId, loadData]);

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

  async function handleJoin() {
    if (!goal || !userId) return;
    setIsJoining(true);
    try {
      await joinGoal(goal.id, userId, userName);
      setIsJoined(true);
      setParticipantCount((prev) => prev + 1);
      const participantData = await getGoalParticipant(goal.id, userId);
      setParticipant(participantData);
      if (participantData) {
        setEditPerformancePrivacy(participantData.performancePrivacy);
      }
      // Reload habits to show joined habits
      await loadData();
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to join goal");
    } finally {
      setIsJoining(false);
    }
  }

  async function handleLeave() {
    if (!goal || !userId) return;

    // Check if goal has linked habits
    let hasLinkedHabits = false;
    try {
      if (goal.linkedHabitIds && typeof goal.linkedHabitIds === "string") {
        const habitIds = JSON.parse(goal.linkedHabitIds) as string[];
        hasLinkedHabits = habitIds.length > 0;
      }
    } catch {
      hasLinkedHabits = false;
    }

    if (hasLinkedHabits) {
      // Show options dialog if there are linked habits
      Alert.alert("Leave Goal", "Do you also want to leave all linked habits?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Keep Habits",
          onPress: async () => {
            try {
              await leaveGoal(goal.id, userId, false);
              setIsJoined(false);
              setParticipant(null);
              setParticipantCount((prev) => Math.max(0, prev - 1));
              await loadData();
            } catch (err) {
              Alert.alert("Error", err instanceof Error ? err.message : "Failed to leave goal");
            }
          },
        },
        {
          text: "Leave All",
          style: "destructive",
          onPress: async () => {
            try {
              await leaveGoal(goal.id, userId, true);
              setIsJoined(false);
              setParticipant(null);
              setParticipantCount((prev) => Math.max(0, prev - 1));
              await loadData();
            } catch (err) {
              Alert.alert("Error", err instanceof Error ? err.message : "Failed to leave goal");
            }
          },
        },
      ]);
    } else {
      // No linked habits, simple confirmation
      Alert.alert("Leave Goal", "Leave this goal?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              await leaveGoal(goal.id, userId, false);
              setIsJoined(false);
              setParticipant(null);
              setParticipantCount((prev) => Math.max(0, prev - 1));
              await loadData();
            } catch (err) {
              Alert.alert("Error", err instanceof Error ? err.message : "Failed to leave goal");
            }
          },
        },
      ]);
    }
  }

  function handleAddHabit() {
    if (!id) return;
    router.push(`/habits?goalId=${id}`);
  }

  function openEditModal() {
    if (participant) {
      setEditPerformancePrivacy(participant.performancePrivacy);
    }
    setShowEditModal(true);
  }

  async function handleSaveEdit() {
    if (!goal || !userId || !participant) return;
    setIsSubmitting(true);
    try {
      await updateGoalParticipantPerformancePrivacy(goal.id, userId, editPerformancePrivacy);
      setParticipant({ ...participant, performancePrivacy: editPerformancePrivacy });
      setShowEditModal(false);
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to update settings");
    } finally {
      setIsSubmitting(false);
    }
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
          isOwner ? (
            <Pressable onPress={handleArchive} style={styles.headerButton}>
              <Text style={[styles.headerButtonText, { color: theme.semantic.danger }]}>
                Archive
              </Text>
            </Pressable>
          ) : isJoined ? (
            <Pressable onPress={openEditModal} style={styles.headerButton}>
              <Text style={[styles.headerButtonText, { color: theme.semantic.primary }]}>Edit</Text>
            </Pressable>
          ) : null
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
        {/* Owner Info (for non-owned goals) */}
        {!isOwner && ownerInfo && (
          <View style={[styles.ownerSection, { backgroundColor: theme.background.primary }]}>
            <Avatar name={ownerInfo.name} imageUrl={ownerInfo.photoUrl} size="sm" />
            <Text style={[styles.ownerName, { color: theme.text.secondary }]}>
              {ownerInfo.name}&apos;s Goal
            </Text>
          </View>
        )}

        <GoalDetailCard goal={goal} />

        {/* Participant count */}
        {participantCount > 0 && (
          <View style={[styles.participantBadge, { backgroundColor: theme.background.primary }]}>
            <Text style={[styles.participantText, { color: theme.text.secondary }]}>
              👥 {participantCount} {participantCount === 1 ? "person" : "people"} joined
            </Text>
          </View>
        )}

        {/* Join/Leave button for non-owned goals */}
        {!isOwner && (
          <View style={styles.actionSection}>
            {isJoined ? (
              <Pressable
                onPress={handleLeave}
                style={[styles.leaveButton, { borderColor: theme.semantic.danger }]}
              >
                <Text style={[styles.leaveButtonText, { color: theme.semantic.danger }]}>
                  Leave Goal
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleJoin}
                disabled={isJoining}
                style={[styles.joinButton, { backgroundColor: theme.semantic.primary }]}
              >
                <Text style={styles.joinButtonText}>{isJoining ? "Joining..." : "Join Goal"}</Text>
              </Pressable>
            )}
          </View>
        )}

        <LinkedHabitsList habits={habits} onAddHabit={isOwner ? handleAddHabit : undefined} />
        <ProgressSummary habitCount={habits.length} />
      </ScrollView>

      {/* Edit modal for joined goals */}
      {!isOwner && ownerInfo && (
        <EditJoinedGoalModal
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleSaveEdit}
          isSubmitting={isSubmitting}
          goalTitle={goal.title}
          ownerName={ownerInfo.name}
          performancePrivacy={editPerformancePrivacy}
          onPerformancePrivacyChange={setEditPerformancePrivacy}
        />
      )}
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
  headerButton: {
    padding: spacing.xs,
  },
  headerButtonText: {
    fontSize: typography.fontSize.base,
  },
  ownerSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  ownerName: {
    fontSize: typography.fontSize.sm,
  },
  participantBadge: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  participantText: {
    fontSize: typography.fontSize.sm,
  },
  actionSection: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  joinButton: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: "center",
  },
  joinButtonText: {
    color: "#fff",
    fontSize: typography.fontSize.base,
    fontWeight: "600",
  },
  leaveButton: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    borderWidth: 1,
  },
  leaveButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
  },
});
