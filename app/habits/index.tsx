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
import type {
  Habit,
  Goal,
  Pillar,
  Privacy,
  HabitSchedule,
  HabitFrequency,
  HabitType,
  CompletionType,
} from "../../src/types";

const PRIVACY_OPTIONS: Privacy[] = ["SELF", "FRIENDS", "PUBLIC"];
const FREQUENCY_OPTIONS: { value: HabitFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];
const HABIT_TYPE_OPTIONS: { value: HabitType; label: string; desc: string }[] = [
  { value: "BUILD", label: "Build", desc: "A habit to develop" },
  { value: "QUIT", label: "Quit", desc: "A habit to break" },
];
const COMPLETION_TYPE_OPTIONS: { value: CompletionType; label: string; desc: string }[] = [
  { value: "BINARY", label: "Yes/No", desc: "Did you do it?" },
  { value: "COUNT", label: "Count", desc: "How many?" },
  { value: "DURATION", label: "Duration", desc: "How long?" },
];
const DIFFICULTY_OPTIONS = [1, 2, 3, 4, 5] as const;
const EMOJI_OPTIONS = [
  "💪",
  "🏃",
  "📚",
  "🧘",
  "💤",
  "💧",
  "🥗",
  "✍️",
  "🎯",
  "⭐",
  "🔥",
  "💡",
  "🌱",
  "🧠",
  "❤️",
  "🙏",
];

export default function HabitsScreen() {
  const params = useLocalSearchParams<{ goalId?: string }>();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Form state - Basic
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [selectedGoalId, setSelectedGoalId] = useState<string | undefined>(params.goalId);
  const [selectedPillar, setSelectedPillar] = useState<Pillar>("BODY");
  const [selectedPrivacy, setSelectedPrivacy] = useState<Privacy>("SELF");

  // Form state - Type & Measurement
  const [habitType, setHabitType] = useState<HabitType>("BUILD");
  const [completionType, setCompletionType] = useState<CompletionType>("BINARY");
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState("");

  // Form state - Visual
  const [icon, setIcon] = useState("💪");

  // Form state - Schedule
  const [frequency, setFrequency] = useState<HabitFrequency>("daily");
  const [targetCount, setTargetCount] = useState("1");

  // Form state - Flexibility
  const [difficulty, setDifficulty] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [miniVersion, setMiniVersion] = useState("");
  const [graceDays, setGraceDays] = useState("0");

  // Form state - Duration timer (HH:MM:SS)
  const [durationHours, setDurationHours] = useState("0");
  const [durationMinutes, setDurationMinutes] = useState("0");
  const [durationSeconds, setDurationSeconds] = useState("0");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get pillar from selected goal (to lock pillar selection)
  const selectedGoal = goals.find((g) => g.id === selectedGoalId);
  const effectivePillar = selectedGoal ? selectedGoal.pillar : selectedPillar;

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

      // Calculate target value based on completion type
      let finalTargetValue: number | undefined;
      let finalUnit: string | undefined;

      if (completionType === "COUNT" && targetValue) {
        finalTargetValue = parseFloat(targetValue);
        finalUnit = unit.trim() || undefined;
      } else if (completionType === "DURATION") {
        // Convert HH:MM:SS to total seconds
        const hours = parseInt(durationHours, 10) || 0;
        const minutes = parseInt(durationMinutes, 10) || 0;
        const seconds = parseInt(durationSeconds, 10) || 0;
        finalTargetValue = hours * 3600 + minutes * 60 + seconds;
        finalUnit = "seconds"; // Always store as seconds internally
      }

      await createHabit(userId, {
        title: newTitle.trim(),
        goalId: selectedGoalId,
        pillar: effectivePillar,
        schedule,
        privacy: selectedPrivacy,
        description: newDescription.trim() || undefined,
        // New fields
        habitType,
        completionType,
        targetValue: finalTargetValue,
        unit: finalUnit,
        icon,
        difficulty,
        miniVersion: miniVersion.trim() || undefined,
        graceDays: parseInt(graceDays, 10) || 0,
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
    setNewDescription("");
    setSelectedGoalId(params.goalId);
    setSelectedPillar("BODY");
    setSelectedPrivacy("SELF");
    setHabitType("BUILD");
    setCompletionType("BINARY");
    setTargetValue("");
    setUnit("");
    setIcon("💪");
    setFrequency("daily");
    setTargetCount("1");
    setDifficulty(3);
    setMiniVersion("");
    setGraceDays("0");
    setDurationHours("0");
    setDurationMinutes("0");
    setDurationSeconds("0");
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

            {/* Description Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description (optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="What do you need to do?"
                value={newDescription}
                onChangeText={setNewDescription}
                multiline
                numberOfLines={3}
                maxLength={500}
              />
              <Text style={styles.charCount}>{newDescription.length}/500</Text>
            </View>

            {/* Icon Selector */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Icon</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.emojiPicker}>
                  {EMOJI_OPTIONS.map((emoji) => (
                    <Pressable
                      key={emoji}
                      style={[styles.emojiOption, icon === emoji && styles.emojiOptionSelected]}
                      onPress={() => setIcon(emoji)}
                    >
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
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

            {/* Pillar Selector - only show if no goal selected */}
            {!selectedGoalId && (
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
                      <Text style={styles.pillarEmoji}>{PILLAR_INFO[pillar].emoji}</Text>
                      <Text style={styles.pillarOptionText}>{PILLAR_INFO[pillar].label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Habit Type: Build or Quit */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Habit type</Text>
              <View style={styles.typeRow}>
                {HABIT_TYPE_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.typeOption,
                      habitType === option.value && styles.typeOptionSelected,
                    ]}
                    onPress={() => setHabitType(option.value)}
                  >
                    <Text
                      style={[
                        styles.typeLabel,
                        habitType === option.value && styles.typeLabelSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text style={styles.typeDesc}>{option.desc}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Completion Type */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>How to measure</Text>
              <View style={styles.completionRow}>
                {COMPLETION_TYPE_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.completionOption,
                      completionType === option.value && styles.completionOptionSelected,
                    ]}
                    onPress={() => setCompletionType(option.value)}
                  >
                    <Text
                      style={[
                        styles.completionLabel,
                        completionType === option.value && styles.completionLabelSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Target Value - COUNT */}
            {completionType === "COUNT" && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Target count</Text>
                <View style={styles.targetRow}>
                  <TextInput
                    style={styles.targetInput}
                    value={targetValue}
                    onChangeText={setTargetValue}
                    keyboardType="numeric"
                    placeholder="e.g., 30"
                    maxLength={5}
                  />
                  <TextInput
                    style={styles.unitInput}
                    value={unit}
                    onChangeText={setUnit}
                    placeholder="reps, pages, etc."
                    maxLength={20}
                  />
                </View>
              </View>
            )}

            {/* Target Duration - Timer style HH:MM:SS */}
            {completionType === "DURATION" && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Target duration</Text>
                <View style={styles.durationRow}>
                  <View style={styles.durationInputGroup}>
                    <TextInput
                      style={styles.durationInput}
                      value={durationHours}
                      onChangeText={(v) => setDurationHours(v.replace(/[^0-9]/g, ""))}
                      keyboardType="numeric"
                      placeholder="0"
                      maxLength={2}
                    />
                    <Text style={styles.durationLabel}>hr</Text>
                  </View>
                  <Text style={styles.durationSeparator}>:</Text>
                  <View style={styles.durationInputGroup}>
                    <TextInput
                      style={styles.durationInput}
                      value={durationMinutes}
                      onChangeText={(v) => setDurationMinutes(v.replace(/[^0-9]/g, ""))}
                      keyboardType="numeric"
                      placeholder="0"
                      maxLength={2}
                    />
                    <Text style={styles.durationLabel}>min</Text>
                  </View>
                  <Text style={styles.durationSeparator}>:</Text>
                  <View style={styles.durationInputGroup}>
                    <TextInput
                      style={styles.durationInput}
                      value={durationSeconds}
                      onChangeText={(v) => setDurationSeconds(v.replace(/[^0-9]/g, ""))}
                      keyboardType="numeric"
                      placeholder="0"
                      maxLength={2}
                    />
                    <Text style={styles.durationLabel}>sec</Text>
                  </View>
                </View>
                <Text style={styles.durationHint}>
                  {(() => {
                    const h = parseInt(durationHours, 10) || 0;
                    const m = parseInt(durationMinutes, 10) || 0;
                    const s = parseInt(durationSeconds, 10) || 0;
                    if (h === 0 && m === 0 && s === 0) return "Set a target duration";
                    const parts = [];
                    if (h > 0) parts.push(`${h} hour${h !== 1 ? "s" : ""}`);
                    if (m > 0) parts.push(`${m} minute${m !== 1 ? "s" : ""}`);
                    if (s > 0) parts.push(`${s} second${s !== 1 ? "s" : ""}`);
                    return parts.join(", ");
                  })()}
                </Text>
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

            {/* Show selected pillar from goal */}
            {selectedGoalId && selectedGoal && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Pillar (from goal)</Text>
                <View style={styles.lockedPillarBadge}>
                  <Text style={styles.pillarOptionEmoji}>
                    {PILLAR_INFO[selectedGoal.pillar].emoji}
                  </Text>
                  <Text
                    style={[
                      styles.lockedPillarText,
                      { color: PILLAR_INFO[selectedGoal.pillar].color },
                    ]}
                  >
                    {PILLAR_INFO[selectedGoal.pillar].label}
                  </Text>
                </View>
              </View>
            )}

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

            {/* Difficulty Rating */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Difficulty</Text>
              <View style={styles.difficultyRow}>
                {DIFFICULTY_OPTIONS.map((d) => (
                  <Pressable
                    key={d}
                    style={[
                      styles.difficultyOption,
                      difficulty === d && styles.difficultyOptionSelected,
                    ]}
                    onPress={() => setDifficulty(d)}
                  >
                    <Text
                      style={[
                        styles.difficultyText,
                        difficulty === d && styles.difficultyTextSelected,
                      ]}
                    >
                      {d}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.difficultyHint}>1 = Easy, 5 = Very Hard</Text>
            </View>

            {/* Mini Version */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Mini version (optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., 1 push-up, read 1 page"
                value={miniVersion}
                onChangeText={setMiniVersion}
                maxLength={100}
              />
              <Text style={styles.miniHint}>What is the smallest version of this habit?</Text>
            </View>

            {/* Grace Days */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Grace days</Text>
              <View style={styles.graceRow}>
                {["0", "1", "2", "3"].map((g) => (
                  <Pressable
                    key={g}
                    style={[styles.graceOption, graceDays === g && styles.graceOptionSelected]}
                    onPress={() => setGraceDays(g)}
                  >
                    <Text style={[styles.graceText, graceDays === g && styles.graceTextSelected]}>
                      {g}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.graceHint}>Days you can miss without breaking your streak</Text>
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
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
    paddingTop: 14,
  },
  charCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 4,
  },
  lockedPillarBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#e5e5e5",
    backgroundColor: "#f5f5f5",
    alignSelf: "flex-start",
  },
  lockedPillarText: {
    fontSize: 14,
    fontWeight: "500",
  },
  // Emoji picker
  emojiPicker: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  emojiOption: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#e5e5e5",
    backgroundColor: "#fafafa",
    justifyContent: "center",
    alignItems: "center",
  },
  emojiOptionSelected: {
    borderColor: "#000",
    backgroundColor: "#f0f0f0",
  },
  emojiText: {
    fontSize: 22,
  },
  // Habit type
  typeRow: {
    flexDirection: "row",
    gap: 12,
  },
  typeOption: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#e5e5e5",
    backgroundColor: "#fafafa",
  },
  typeOptionSelected: {
    borderColor: "#000",
    backgroundColor: "#f5f5f5",
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
  },
  typeLabelSelected: {
    color: "#000",
  },
  typeDesc: {
    fontSize: 13,
    color: "#999",
  },
  // Completion type
  completionRow: {
    flexDirection: "row",
    gap: 8,
  },
  completionOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#e5e5e5",
    backgroundColor: "#fafafa",
    alignItems: "center",
  },
  completionOptionSelected: {
    borderColor: "#000",
    backgroundColor: "#f5f5f5",
  },
  completionLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  completionLabelSelected: {
    color: "#000",
  },
  // Target value & unit
  targetRow: {
    flexDirection: "row",
    gap: 12,
  },
  targetInput: {
    flex: 1,
    fontSize: 17,
    borderWidth: 2,
    borderColor: "#e5e5e5",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  unitInput: {
    flex: 2,
    fontSize: 17,
    borderWidth: 2,
    borderColor: "#e5e5e5",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  // Duration timer input
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  durationInputGroup: {
    alignItems: "center",
  },
  durationInput: {
    width: 56,
    height: 56,
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    borderWidth: 2,
    borderColor: "#e5e5e5",
    borderRadius: 10,
    backgroundColor: "#fafafa",
  },
  durationLabel: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
    textTransform: "uppercase",
  },
  durationSeparator: {
    fontSize: 28,
    fontWeight: "600",
    color: "#666",
    marginHorizontal: 2,
    marginBottom: 16,
  },
  durationHint: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
  },
  // Difficulty
  difficultyRow: {
    flexDirection: "row",
    gap: 10,
  },
  difficultyOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#e5e5e5",
    backgroundColor: "#fafafa",
    justifyContent: "center",
    alignItems: "center",
  },
  difficultyOptionSelected: {
    borderColor: "#000",
    backgroundColor: "#000",
  },
  difficultyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  difficultyTextSelected: {
    color: "#fff",
  },
  difficultyHint: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
  },
  // Mini version
  miniHint: {
    fontSize: 12,
    color: "#999",
    marginTop: 6,
  },
  // Grace days
  graceRow: {
    flexDirection: "row",
    gap: 10,
  },
  graceOption: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#e5e5e5",
    backgroundColor: "#fafafa",
    justifyContent: "center",
    alignItems: "center",
  },
  graceOptionSelected: {
    borderColor: "#000",
    backgroundColor: "#f5f5f5",
  },
  graceText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  graceTextSelected: {
    color: "#000",
  },
  graceHint: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
  },
});
