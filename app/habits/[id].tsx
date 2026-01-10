/**
 * Habit Detail Screen - View habit and log check-ins
 * M2-2.3: Log Check-In feature
 * M2-2.4: Streak Calculation
 * M2-2.5: Streak Recovery & Misses
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
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
import { PILLAR_INFO, PRIVACY_INFO } from "../../src/types/goals";
import type { Habit, HabitCheckIn, Privacy, HabitFrequency } from "../../src/types";
import {
  calculateStreak,
  getCurrentPeriodCount,
  getHabitStatus,
  getStatusMessage,
  calculateRecoveryStatus,
} from "../../src/logic";
import { useTheme } from "../../src/theme";

// Privacy options for editing
const PRIVACY_OPTIONS: Privacy[] = ["SELF", "FRIENDS", "PUBLIC"];

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
        <View style={[styles.header, { borderBottomColor: theme.border.light }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: theme.button.primary.background }]}>
              Back
            </Text>
          </Pressable>
        </View>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>Habit not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const pillarInfo = PILLAR_INFO[habit.pillar];
  const todayCount = todayCheckIns.length;
  const targetMet = todayCount >= habit.schedule.targetCount;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border.light }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: theme.button.primary.background }]}>
            Back
          </Text>
        </Pressable>
        <View style={styles.headerActions}>
          <Pressable onPress={openEditModal} style={styles.editButton}>
            <Text style={[styles.editButtonText, { color: theme.button.primary.background }]}>
              Edit
            </Text>
          </Pressable>
          <Pressable onPress={handleArchive} style={styles.archiveButton}>
            <Text style={[styles.archiveButtonText, { color: theme.text.error }]}>Archive</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        {/* Habit Info Card */}
        <View style={[styles.habitCard, { borderLeftColor: pillarInfo.color }]}>
          <View style={styles.habitHeader}>
            <Text style={styles.pillarEmoji}>{pillarInfo.emoji}</Text>
            <View style={styles.habitTitleContainer}>
              <Text style={styles.habitTitle}>{habit.title}</Text>
              <Text style={styles.pillarLabel}>{pillarInfo.label}</Text>
            </View>
          </View>

          <View style={styles.scheduleInfo}>
            <Text style={styles.scheduleText}>
              {habit.schedule.targetCount}x {habit.schedule.frequency}
            </Text>
          </View>
        </View>

        {/* Status Banner - Shows recovery/at-risk status */}
        {habitStatus !== "on-track" && habitStatus !== "inactive" && (
          <View
            style={[
              styles.statusBanner,
              habitStatus === "recovering" && styles.statusRecovering,
              habitStatus === "at-risk" && styles.statusAtRisk,
              habitStatus === "missed-today" && styles.statusMissedToday,
            ]}
          >
            <Text style={styles.statusBannerText}>{statusMessage}</Text>
          </View>
        )}

        {/* Streak Display - Using real-time calculated data */}
        <View style={styles.streakCard}>
          <View style={styles.streakItem}>
            <Text style={styles.streakNumber}>{streakData.currentStreak}</Text>
            <Text style={styles.streakLabel}>Current Streak</Text>
          </View>
          <View style={styles.streakDivider} />
          <View style={styles.streakItem}>
            <Text style={styles.streakNumber}>{streakData.longestStreak}</Text>
            <Text style={styles.streakLabel}>Best Streak</Text>
          </View>
          {recoveryStatus.isInRecovery && recoveryStatus.recoveryStreak > 0 && (
            <>
              <View style={styles.streakDivider} />
              <View style={styles.streakItem}>
                <Text style={[styles.streakNumber, styles.recoveryNumber]}>
                  {recoveryStatus.recoveryStreak}
                </Text>
                <Text style={styles.streakLabel}>Recovery 🔥</Text>
              </View>
            </>
          )}
        </View>

        {/* Today's/This Week's Progress */}
        <View style={styles.todayCard}>
          <Text style={styles.sectionTitle}>
            {habit.schedule.frequency === "weekly" ? "This Week" : "Today"}&apos;s Progress
          </Text>
          <View style={styles.todayProgress}>
            <View style={styles.progressCircle}>
              <Text
                style={[
                  styles.progressCount,
                  periodProgress.remaining === 0 && styles.progressComplete,
                ]}
              >
                {periodProgress.count}/{periodProgress.target}
              </Text>
            </View>
            <Text style={styles.progressLabel}>
              {periodProgress.remaining === 0
                ? "Target reached!"
                : `${periodProgress.remaining} more to go`}
            </Text>
          </View>

          {/* Quick Check-in Button */}
          <Pressable
            style={[styles.checkInButton, targetMet && styles.checkInButtonComplete]}
            onPress={handleQuickCheckIn}
          >
            <Text style={styles.checkInButtonText}>{targetMet ? "+ Log Another" : "Check In"}</Text>
          </Pressable>

          {/* Add note option */}
          <Pressable style={styles.addNoteButton} onPress={() => setShowCheckInModal(true)}>
            <Text style={styles.addNoteButtonText}>Check in with note</Text>
          </Pressable>
        </View>

        {/* Recent Check-ins */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent Check-ins</Text>
          {checkIns.length === 0 ? (
            <Text style={styles.noCheckIns}>No check-ins yet. Log your first one!</Text>
          ) : (
            checkIns.map((checkIn) => (
              <Pressable
                key={checkIn.id}
                style={styles.checkInRow}
                onLongPress={() => handleDeleteCheckIn(checkIn.id)}
              >
                <View style={styles.checkInInfo}>
                  <Text style={styles.checkInTime}>{formatDate(checkIn.occurredAt)}</Text>
                  {checkIn.note && <Text style={styles.checkInNote}>{checkIn.note}</Text>}
                </View>
                <View style={styles.checkInSource}>
                  <Text style={styles.checkInSourceText}>
                    {checkIn.source === "MANUAL" ? "Manual" : "Auto"}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      {/* Check-in with Note Modal */}
      <Modal
        visible={showCheckInModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCheckInModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowCheckInModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Log Check-in</Text>
            <Pressable onPress={handleCheckIn} disabled={isSubmitting}>
              <Text style={[styles.modalSave, isSubmitting && styles.disabled]}>
                {isSubmitting ? "Saving..." : "Save"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.label}>Add a note (optional)</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="How did it go? Any thoughts?"
              value={checkInNote}
              onChangeText={setCheckInNote}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{checkInNote.length}/500</Text>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Edit Habit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowEditModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Edit Habit</Text>
            <Pressable onPress={handleSaveEdit} disabled={isSubmitting}>
              <Text style={[styles.modalSave, isSubmitting && styles.disabled]}>
                {isSubmitting ? "Saving..." : "Save"}
              </Text>
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Title */}
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.textInput}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Enter habit title"
              maxLength={100}
            />

            {/* Frequency */}
            <Text style={styles.label}>Frequency</Text>
            <View style={styles.frequencyOptions}>
              {(["daily", "weekly"] as const).map((freq) => (
                <Pressable
                  key={freq}
                  style={[
                    styles.frequencyOption,
                    editFrequency === freq && styles.frequencyOptionSelected,
                  ]}
                  onPress={() => setEditFrequency(freq)}
                >
                  <Text
                    style={[
                      styles.frequencyOptionText,
                      editFrequency === freq && styles.frequencyOptionTextSelected,
                    ]}
                  >
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Target Count */}
            <Text style={styles.label}>
              Target (times per {editFrequency === "daily" ? "day" : "week"})
            </Text>
            <TextInput
              style={styles.textInput}
              value={editTargetCount}
              onChangeText={setEditTargetCount}
              keyboardType="number-pad"
              placeholder="1"
            />

            {/* Privacy */}
            <Text style={styles.label}>Privacy</Text>
            <View style={styles.privacyOptions}>
              {PRIVACY_OPTIONS.map((privacy) => (
                <Pressable
                  key={privacy}
                  style={[
                    styles.privacyOption,
                    editPrivacy === privacy && styles.privacyOptionSelected,
                  ]}
                  onPress={() => setEditPrivacy(privacy)}
                >
                  <Text
                    style={[
                      styles.privacyOptionText,
                      editPrivacy === privacy && styles.privacyOptionTextSelected,
                    ]}
                  >
                    {PRIVACY_INFO[privacy].label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.privacyDescription}>{PRIVACY_INFO[editPrivacy].description}</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  headerActions: {
    flexDirection: "row",
    gap: 16,
  },
  editButton: {
    padding: 8,
  },
  editButtonText: {
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
  habitCard: {
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
  habitHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  pillarEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  habitTitleContainer: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  pillarLabel: {
    fontSize: 14,
    color: "#666",
  },
  scheduleInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  scheduleText: {
    fontSize: 16,
    color: "#666",
  },
  // Status banner styles
  statusBanner: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  statusRecovering: {
    backgroundColor: "#E8F5E9",
    borderColor: "#4CAF50",
    borderWidth: 1,
  },
  statusAtRisk: {
    backgroundColor: "#FFEBEE",
    borderColor: "#f44336",
    borderWidth: 1,
  },
  statusMissedToday: {
    backgroundColor: "#FFF3E0",
    borderColor: "#FF9800",
    borderWidth: 1,
  },
  statusBannerText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  streakCard: {
    flexDirection: "row",
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
  streakItem: {
    flex: 1,
    alignItems: "center",
  },
  streakDivider: {
    width: 1,
    backgroundColor: "#f0f0f0",
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FF6B6B",
  },
  recoveryNumber: {
    color: "#4CAF50",
  },
  streakLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  todayCard: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  todayProgress: {
    alignItems: "center",
    marginBottom: 20,
  },
  progressCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  progressCount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  progressComplete: {
    color: "#4CAF50",
  },
  progressLabel: {
    fontSize: 14,
    color: "#666",
  },
  checkInButton: {
    backgroundColor: "#000",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  checkInButtonComplete: {
    backgroundColor: "#4CAF50",
  },
  checkInButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  addNoteButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  addNoteButtonText: {
    color: "#007AFF",
    fontSize: 14,
  },
  historySection: {
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
  noCheckIns: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    paddingVertical: 20,
  },
  checkInRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  checkInInfo: {
    flex: 1,
  },
  checkInTime: {
    fontSize: 14,
    color: "#333",
  },
  checkInNote: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  checkInSource: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  checkInSourceText: {
    fontSize: 11,
    color: "#666",
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  modalCancel: {
    fontSize: 16,
    color: "#666",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalSave: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.5,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  noteInput: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
  },
  charCount: {
    textAlign: "right",
    fontSize: 12,
    color: "#999",
    marginTop: 8,
  },
  // Edit Modal Styles
  textInput: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  frequencyOptions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  frequencyOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  frequencyOptionSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#F0F7FF",
  },
  frequencyOptionText: {
    fontSize: 16,
    color: "#666",
  },
  frequencyOptionTextSelected: {
    color: "#007AFF",
    fontWeight: "600",
  },
  privacyOptions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  privacyOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  privacyOptionSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#F0F7FF",
  },
  privacyOptionText: {
    fontSize: 14,
    color: "#666",
  },
  privacyOptionTextSelected: {
    color: "#007AFF",
    fontWeight: "600",
  },
  privacyDescription: {
    fontSize: 13,
    color: "#999",
    marginBottom: 20,
  },
});
