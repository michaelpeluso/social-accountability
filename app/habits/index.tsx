/**
 * Habits Screen - Display and manage user habits
 * M2-2.2: Create Habit feature
 */

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { auth } from "../../src/services/auth";
import { createHabit, getHabits } from "../../src/storage/habits";
import { getGoals } from "../../src/storage/goals";
import { PILLAR_INFO, ALL_PILLARS, PRIVACY_INFO } from "../../src/types/goals";
import type { Habit, Goal, Pillar, Privacy, HabitSchedule, HabitFrequency } from "../../src/types";

const PRIVACY_OPTIONS: Privacy[] = ["SELF", "FRIENDS", "PUBLIC"];
const FREQUENCY_OPTIONS: { value: HabitFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

export default function HabitsScreen() {
  const params = useLocalSearchParams<{ goalId?: string }>();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Form state
  const [newTitle, setNewTitle] = useState("");
  const [selectedGoalId, setSelectedGoalId] = useState<string | undefined>(params.goalId);
  const [selectedPillar, setSelectedPillar] = useState<Pillar>("BODY");
  const [selectedPrivacy, setSelectedPrivacy] = useState<Privacy>("SELF");
  const [frequency, setFrequency] = useState<HabitFrequency>("daily");
  const [targetCount, setTargetCount] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  async function handleCreateHabit() {
    if (!userId) return;
    if (!newTitle.trim()) {
      Alert.alert("Error", "Please enter a habit title");
      return;
    }

    const count = parseInt(targetCount, 10);
    if (isNaN(count) || count < 1) {
      Alert.alert("Error", "Target count must be at least 1");
      return;
    }

    setIsSubmitting(true);
    try {
      const schedule: HabitSchedule = {
        frequency,
        targetCount: count,
      };

      await createHabit(userId, {
        title: newTitle.trim(),
        goalId: selectedGoalId,
        pillar: selectedPillar,
        schedule,
        privacy: selectedPrivacy,
      });

      setShowCreateModal(false);
      resetForm();
      await loadHabits(userId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create habit";
      Alert.alert("Error", message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setNewTitle("");
    setSelectedGoalId(params.goalId);
    setSelectedPillar("BODY");
    setSelectedPrivacy("SELF");
    setFrequency("daily");
    setTargetCount("1");
  }

  function openCreateModal() {
    resetForm();
    setShowCreateModal(true);
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
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading habits...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Habits</Text>
        <Pressable onPress={openCreateModal} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ New</Text>
        </Pressable>
      </View>

      {/* Habits List */}
      {habits.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🔄</Text>
          <Text style={styles.emptyTitle}>No habits yet</Text>
          <Text style={styles.emptySubtitle}>Create recurring habits to build consistency</Text>
          <Pressable style={styles.createFirstButton} onPress={openCreateModal}>
            <Text style={styles.createFirstButtonText}>Create Habit</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={ALL_PILLARS.filter((p) => habitsByPillar[p]?.length > 0)}
          keyExtractor={(pillar) => pillar}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
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
                <Text style={styles.habitCount}>{habitsByPillar[pillar]?.length || 0}</Text>
              </View>
              {habitsByPillar[pillar]?.map((habit) => (
                <Pressable
                  key={habit.id}
                  style={styles.habitCard}
                  onPress={() => {
                    router.push(`/habits/${habit.id}`);
                  }}
                >
                  <View style={styles.habitHeader}>
                    <Text style={styles.habitTitle}>{habit.title}</Text>
                    {habit.currentStreak > 0 && (
                      <View style={styles.streakBadge}>
                        <Text style={styles.streakText}>{habit.currentStreak} day streak</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.habitMeta}>
                    <Text style={styles.scheduleBadge}>
                      {habit.schedule.targetCount}x {habit.schedule.frequency}
                    </Text>
                    {getGoalTitle(habit.goalId) && (
                      <Text style={styles.goalLink}>{getGoalTitle(habit.goalId)}</Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        />
      )}

      {/* Create Habit Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowCreateModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>New Habit</Text>
            <Pressable onPress={handleCreateHabit} disabled={isSubmitting}>
              <Text style={[styles.modalSave, isSubmitting && styles.disabled]}>
                {isSubmitting ? "Saving..." : "Save"}
              </Text>
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Title Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Habit name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Meditate, Read, Exercise"
                value={newTitle}
                onChangeText={setNewTitle}
                autoFocus
                maxLength={100}
              />
            </View>

            {/* Goal Selector (optional) */}
            {goals.length > 0 && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Link to goal (optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.goalPicker}>
                    <Pressable
                      style={[styles.goalOption, !selectedGoalId && styles.goalOptionSelected]}
                      onPress={() => setSelectedGoalId(undefined)}
                    >
                      <Text
                        style={[
                          styles.goalOptionText,
                          !selectedGoalId && styles.goalOptionTextSelected,
                        ]}
                      >
                        None
                      </Text>
                    </Pressable>
                    {goals.map((goal) => (
                      <Pressable
                        key={goal.id}
                        style={[
                          styles.goalOption,
                          selectedGoalId === goal.id && styles.goalOptionSelected,
                        ]}
                        onPress={() => {
                          setSelectedGoalId(goal.id);
                          setSelectedPillar(goal.pillar);
                        }}
                      >
                        <Text style={styles.goalOptionEmoji}>{PILLAR_INFO[goal.pillar].emoji}</Text>
                        <Text
                          style={[
                            styles.goalOptionText,
                            selectedGoalId === goal.id && styles.goalOptionTextSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {goal.title}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Schedule Section */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Schedule</Text>
              <View style={styles.scheduleRow}>
                <TextInput
                  style={styles.countInput}
                  value={targetCount}
                  onChangeText={setTargetCount}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <Text style={styles.scheduleText}>times per</Text>
                <View style={styles.frequencyPicker}>
                  {FREQUENCY_OPTIONS.map((option) => (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.frequencyOption,
                        frequency === option.value && styles.frequencyOptionSelected,
                      ]}
                      onPress={() => setFrequency(option.value)}
                    >
                      <Text
                        style={[
                          styles.frequencyOptionText,
                          frequency === option.value && styles.frequencyOptionTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            {/* Pillar Selector */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Pillar</Text>
              <View style={styles.pillarPicker}>
                {ALL_PILLARS.map((pillar) => (
                  <Pressable
                    key={pillar}
                    style={[
                      styles.pillarOption,
                      selectedPillar === pillar && {
                        backgroundColor: PILLAR_INFO[pillar].color + "30",
                        borderColor: PILLAR_INFO[pillar].color,
                      },
                    ]}
                    onPress={() => setSelectedPillar(pillar)}
                  >
                    <Text style={styles.pillarOptionEmoji}>{PILLAR_INFO[pillar].emoji}</Text>
                    <Text
                      style={[
                        styles.pillarOptionText,
                        selectedPillar === pillar && { color: PILLAR_INFO[pillar].color },
                      ]}
                    >
                      {PILLAR_INFO[pillar].label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Privacy Selector */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Who can see this habit?</Text>
              <View style={styles.privacyPicker}>
                {PRIVACY_OPTIONS.map((privacy) => (
                  <Pressable
                    key={privacy}
                    style={[
                      styles.privacyOption,
                      selectedPrivacy === privacy && styles.privacyOptionSelected,
                    ]}
                    onPress={() => setSelectedPrivacy(privacy)}
                  >
                    <Text
                      style={[
                        styles.privacyOptionLabel,
                        selectedPrivacy === privacy && styles.privacyOptionLabelSelected,
                      ]}
                    >
                      {PRIVACY_INFO[privacy].label}
                    </Text>
                    <Text style={styles.privacyOptionDesc}>
                      {PRIVACY_INFO[privacy].description}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  addButton: {
    backgroundColor: "#000",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  createFirstButton: {
    backgroundColor: "#000",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  createFirstButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
  },
  pillarSection: {
    marginBottom: 20,
  },
  pillarHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  pillarEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  pillarTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  habitCount: {
    fontSize: 14,
    color: "#999",
    fontWeight: "500",
  },
  habitCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  habitHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
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
  habitMeta: {
    flexDirection: "row",
    gap: 8,
  },
  scheduleBadge: {
    fontSize: 12,
    color: "#666",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  goalLink: {
    fontSize: 12,
    color: "#007AFF",
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
  formGroup: {
    marginBottom: 28,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  textInput: {
    fontSize: 17,
    borderBottomWidth: 2,
    borderBottomColor: "#e5e5e5",
    paddingVertical: 12,
  },
  goalPicker: {
    flexDirection: "row",
    gap: 10,
  },
  goalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#e5e5e5",
    backgroundColor: "#fafafa",
    maxWidth: 150,
  },
  goalOptionSelected: {
    borderColor: "#000",
    backgroundColor: "#f5f5f5",
  },
  goalOptionEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  goalOptionText: {
    fontSize: 14,
    color: "#666",
    flexShrink: 1,
  },
  goalOptionTextSelected: {
    color: "#000",
    fontWeight: "500",
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  countInput: {
    width: 50,
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    borderWidth: 2,
    borderColor: "#e5e5e5",
    borderRadius: 10,
    paddingVertical: 10,
  },
  scheduleText: {
    fontSize: 16,
    color: "#666",
  },
  frequencyPicker: {
    flexDirection: "row",
    gap: 8,
  },
  frequencyOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#e5e5e5",
    backgroundColor: "#fafafa",
  },
  frequencyOptionSelected: {
    borderColor: "#000",
    backgroundColor: "#f5f5f5",
  },
  frequencyOptionText: {
    fontSize: 14,
    color: "#666",
  },
  frequencyOptionTextSelected: {
    color: "#000",
    fontWeight: "600",
  },
  pillarPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  pillarOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#e5e5e5",
    backgroundColor: "#fafafa",
  },
  pillarOptionEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  pillarOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  privacyPicker: {
    gap: 10,
  },
  privacyOption: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#e5e5e5",
    backgroundColor: "#fafafa",
  },
  privacyOptionSelected: {
    borderColor: "#000",
    backgroundColor: "#f5f5f5",
  },
  privacyOptionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
    marginBottom: 2,
  },
  privacyOptionLabelSelected: {
    color: "#000",
  },
  privacyOptionDesc: {
    fontSize: 13,
    color: "#999",
  },
});
