/**
 * Habit Detail Screen - View habit and log check-ins
 * M2-2.3: Log Check-In feature
 * M2-2.4: Streak Calculation
 * M2-2.5: Streak Recovery & Misses
 * Refactored to use reusable components for maintainability
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, Pressable, StyleSheet, RefreshControl, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { auth } from "../../src/services/auth";
import { getHabitById, updateHabit } from "../../src/storage/habits";
import {
  createCheckIn,
  getCheckIns,
  getTodayCheckIns,
  deleteCheckIn,
} from "../../src/storage/checkIns";
import type { Habit, HabitCheckIn, Privacy, HabitFrequency } from "../../src/types";
import {
  calculateStreak,
  getCurrentPeriodCount,
  getHabitStatus,
  getStatusMessage,
  calculateRecoveryStatus,
} from "../../src/logic";
import { useTheme } from "../../src/theme";
import { spacing } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";
import {
  ScreenHeader,
  EmptyState,
  HabitDetailCard,
  StatusBanner,
  StreakDisplay,
  TodayProgress,
  CheckInList,
  CheckInModal,
  EditHabitModal,
} from "../../src/components";

export default function HabitDetailScreen() {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [habit, setHabit] = useState<Habit | null>(null);
  const [checkIns, setCheckIns] = useState<HabitCheckIn[]>([]);
  const [todayCheckIns, setTodayCheckIns] = useState<HabitCheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Check-in form state
  const [checkInNote, setCheckInNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editPrivacy, setEditPrivacy] = useState<Privacy>("SELF");
  const [editFrequency, setEditFrequency] = useState<HabitFrequency>("daily");
  const [editTargetCount, setEditTargetCount] = useState("1");

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const [habitData, checkInsData, todayData] = await Promise.all([
        getHabitById(id),
        getCheckIns(id, { limit: 20 }),
        getTodayCheckIns(id),
      ]);
      setHabit(habitData);
      setCheckIns(checkInsData);
      setTodayCheckIns(todayData);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load habit";
      console.error("Error loading habit:", error);
      Alert.alert("Error", message);
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

  async function handleCheckIn() {
    if (!userId || !id) return;

    setIsSubmitting(true);
    try {
      await createCheckIn(id, userId, {
        note: checkInNote.trim() || undefined,
      });

      setShowCheckInModal(false);
      setCheckInNote("");
      await loadData();

      // Show success feedback
      Alert.alert("Check-in logged", "Great job keeping up with your habit!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to log check-in";
      Alert.alert("Error", message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleQuickCheckIn() {
    if (!userId || !id) return;

    try {
      await createCheckIn(id, userId, {});
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to log check-in";
      Alert.alert("Error", message);
    }
  }

  async function handleDeleteCheckIn(checkInId: string) {
    if (!userId) return;

    Alert.alert("Delete Check-in", "Are you sure you want to delete this check-in?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteCheckIn(checkInId, userId);
            await loadData();
          } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to delete";
            Alert.alert("Error", message);
          }
        },
      },
    ]);
  }

  async function handleArchive() {
    if (!habit || !userId) return;

    Alert.alert("Archive Habit", "Archive this habit? You can restore it later.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Archive",
        onPress: async () => {
          try {
            await updateHabit(habit.id, { isArchived: true });
            router.back();
          } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to archive";
            Alert.alert("Error", message);
          }
        },
      },
    ]);
  }

  function openEditModal() {
    if (!habit) return;
    setEditTitle(habit.title);
    setEditPrivacy(habit.privacy);
    setEditFrequency(habit.schedule.frequency);
    setEditTargetCount(habit.schedule.targetCount.toString());
    setShowEditModal(true);
  }

  async function handleSaveEdit() {
    if (!habit || !userId) return;
    if (!editTitle.trim()) {
      Alert.alert("Error", "Title is required");
      return;
    }

    const targetCount = parseInt(editTargetCount, 10);
    if (isNaN(targetCount) || targetCount < 1) {
      Alert.alert("Error", "Target count must be at least 1");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateHabit(habit.id, {
        title: editTitle.trim(),
        privacy: editPrivacy,
        schedule: {
          ...habit.schedule,
          frequency: editFrequency,
          targetCount,
        },
      });

      setShowEditModal(false);
      await loadData();
      Alert.alert("Success", "Habit updated successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update habit";
      Alert.alert("Error", message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const checkInDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((today.getTime() - checkInDay.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  // Calculate real-time streak using pure logic functions
  // These must be called unconditionally before any early returns
  const streakCheckIns = useMemo(
    () => checkIns.map((c) => ({ occurredAt: c.occurredAt })),
    [checkIns]
  );

  const streakHabit = useMemo(
    () =>
      habit
        ? {
            frequency: habit.schedule.frequency,
            targetCount: habit.schedule.targetCount,
          }
        : { frequency: "daily" as const, targetCount: 1 },
    [habit]
  );

  const streakData = useMemo(
    () => calculateStreak(streakHabit, streakCheckIns),
    [streakHabit, streakCheckIns]
  );

  const periodProgress = useMemo(
    () => getCurrentPeriodCount(streakHabit, streakCheckIns),
    [streakHabit, streakCheckIns]
  );

  const habitStatus = useMemo(
    () => getHabitStatus(streakHabit, streakCheckIns),
    [streakHabit, streakCheckIns]
  );

  // Calculate recovery status
  const recoveryStatus = useMemo(
    () => calculateRecoveryStatus(streakHabit, streakCheckIns),
    [streakHabit, streakCheckIns]
  );

  const statusMessage = useMemo(
    () => getStatusMessage(habitStatus, recoveryStatus.recoveryStreak),
    [habitStatus, recoveryStatus.recoveryStreak]
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
        <Text style={[styles.loadingText, { color: theme.text.secondary }]}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!habit) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
        <ScreenHeader title="" />
        <EmptyState emoji="🔍" title="Habit not found" />
      </SafeAreaView>
    );
  }

  const todayCount = todayCheckIns.length;
  const targetMet = todayCount >= habit.schedule.targetCount;
  const progressTitle = `${habit.schedule.frequency === "weekly" ? "This Week" : "Today"}'s Progress`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
      <ScreenHeader
        title=""
        rightAction={
          <View style={styles.headerActions}>
            <Pressable onPress={openEditModal} style={styles.actionButton}>
              <Text style={[styles.editText, { color: theme.semantic.primary }]}>Edit</Text>
            </Pressable>
            <Pressable onPress={handleArchive} style={styles.actionButton}>
              <Text style={[styles.archiveText, { color: theme.text.error }]}>Archive</Text>
            </Pressable>
          </View>
        }
      />

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        <HabitDetailCard habit={habit} />

        <StatusBanner status={habitStatus} message={statusMessage} />

        <StreakDisplay
          currentStreak={streakData.currentStreak}
          longestStreak={streakData.longestStreak}
          recoveryStreak={recoveryStatus.recoveryStreak}
          isInRecovery={recoveryStatus.isInRecovery}
        />

        <TodayProgress
          title={progressTitle}
          count={periodProgress.count}
          target={periodProgress.target}
          remaining={periodProgress.remaining}
          targetMet={targetMet}
          onQuickCheckIn={handleQuickCheckIn}
          onCheckInWithNote={() => setShowCheckInModal(true)}
        />

        <CheckInList
          checkIns={checkIns}
          onDeleteCheckIn={handleDeleteCheckIn}
          formatDate={formatDate}
        />
      </ScrollView>

      <CheckInModal
        visible={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        onSubmit={handleCheckIn}
        note={checkInNote}
        onNoteChange={setCheckInNote}
        isSubmitting={isSubmitting}
      />

      <EditHabitModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleSaveEdit}
        isSubmitting={isSubmitting}
        title={editTitle}
        onTitleChange={setEditTitle}
        frequency={editFrequency}
        onFrequencyChange={setEditFrequency}
        targetCount={editTargetCount}
        onTargetCountChange={setEditTargetCount}
        privacy={editPrivacy}
        onPrivacyChange={setEditPrivacy}
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
  content: {
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  actionButton: {
    padding: spacing.sm,
  },
  editText: {
    fontSize: typography.fontSize.base,
  },
  archiveText: {
    fontSize: typography.fontSize.base,
  },
});
