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
import { useTheme } from "../../src/theme";
import { spacing, borderRadius } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";

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
  const { theme } = useTheme();
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
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background.secondary }]}>
        <Text style={[styles.loadingText, { color: theme.text.secondary }]}>Loading habits...</Text>
      </SafeAreaView>
    );
  }

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
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Habits</Text>
        <Pressable
          onPress={openCreateModal}
          style={[styles.addButton, { backgroundColor: theme.button.primary.background }]}
        >
          <Text style={[styles.addButtonText, { color: theme.button.primary.text }]}>+ New</Text>
        </Pressable>
      </View>

      {/* Habits List */}
      {habits.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🔄</Text>
          <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>No habits yet</Text>
          <Text style={[styles.emptySubtitle, { color: theme.text.secondary }]}>
            Create recurring habits to build consistency
          </Text>
          <Pressable
            style={[styles.createFirstButton, { backgroundColor: theme.button.primary.background }]}
            onPress={openCreateModal}
          >
            <Text style={[styles.createFirstButtonText, { color: theme.button.primary.text }]}>
              Create Habit
            </Text>
          </Pressable>
        </View>
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
            <View style={styles.pillarSection}>
              <View
                style={[styles.pillarHeader, { backgroundColor: PILLAR_INFO[pillar].color + "20" }]}
              >
                <Text style={styles.pillarEmoji}>{PILLAR_INFO[pillar].emoji}</Text>
                <Text style={[styles.pillarTitle, { color: PILLAR_INFO[pillar].color }]}>
                  {PILLAR_INFO[pillar].label}
                </Text>
                <Text style={[styles.habitCount, { color: theme.text.tertiary }]}>
                  {habitsByPillar[pillar]?.length || 0}
                </Text>
              </View>
              {habitsByPillar[pillar]?.map((habit) => (
                <Pressable
                  key={habit.id}
                  style={[styles.habitCard, { backgroundColor: theme.card.background }]}
                  onPress={() => {
                    router.push(`/habits/${habit.id}`);
                  }}
                >
                  <View style={styles.habitHeader}>
                    <Text style={[styles.habitTitle, { color: theme.text.primary }]}>
                      {habit.title}
                    </Text>
                    {habit.currentStreak > 0 && (
                      <View
                        style={[
                          styles.streakBadge,
                          { backgroundColor: theme.semantic.danger + "20" },
                        ]}
                      >
                        <Text style={[styles.streakText, { color: theme.semantic.danger }]}>
                          {habit.currentStreak} day streak
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.habitMeta}>
                    <Text
                      style={[
                        styles.scheduleBadge,
                        {
                          color: theme.text.secondary,
                          backgroundColor: theme.background.secondary,
                        },
                      ]}
                    >
                      {habit.schedule.targetCount}x {habit.schedule.frequency}
                    </Text>
                    {getGoalTitle(habit.goalId) && (
                      <Text style={[styles.goalLink, { color: theme.semantic.primary }]}>
                        {getGoalTitle(habit.goalId)}
                      </Text>
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
        <SafeAreaView
          style={[styles.modalContainer, { backgroundColor: theme.background.primary }]}
        >
          <View style={[styles.modalHeader, { borderBottomColor: theme.border.light }]}>
            <Pressable onPress={() => setShowCreateModal(false)}>
              <Text style={[styles.modalCancel, { color: theme.text.secondary }]}>Cancel</Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: theme.text.primary }]}>New Habit</Text>
            <Pressable onPress={handleCreateHabit} disabled={isSubmitting}>
              <Text
                style={[
                  styles.modalSave,
                  { color: theme.semantic.primary },
                  isSubmitting && styles.disabled,
                ]}
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Text>
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Title Input */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text.primary }]}>Habit name</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { borderBottomColor: theme.border.light, color: theme.text.primary },
                ]}
                placeholder="e.g., Meditate, Read, Exercise"
                placeholderTextColor={theme.text.tertiary}
                value={newTitle}
                onChangeText={setNewTitle}
                autoFocus
                maxLength={100}
              />
            </View>

            {/* Description Input */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text.primary }]}>
                Description (optional)
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  styles.textArea,
                  { borderBottomColor: theme.border.light, color: theme.text.primary },
                ]}
                placeholder="What do you need to do?"
                placeholderTextColor={theme.text.tertiary}
                value={newDescription}
                onChangeText={setNewDescription}
                multiline
                numberOfLines={3}
                maxLength={500}
              />
              <Text style={[styles.charCount, { color: theme.text.tertiary }]}>
                {newDescription.length}/500
              </Text>
            </View>

            {/* Icon Selector */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text.primary }]}>Icon</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.emojiPicker}>
                  {EMOJI_OPTIONS.map((emoji) => (
                    <Pressable
                      key={emoji}
                      style={[
                        styles.emojiOption,
                        {
                          borderColor: theme.border.light,
                          backgroundColor: theme.background.secondary,
                        },
                        icon === emoji && [
                          styles.emojiOptionSelected,
                          { borderColor: theme.text.primary },
                        ],
                      ]}
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
                <Text style={[styles.label, { color: theme.text.primary }]}>
                  Link to goal (optional)
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.goalPicker}>
                    <Pressable
                      style={[
                        styles.goalOption,
                        {
                          borderColor: theme.border.light,
                          backgroundColor: theme.background.secondary,
                        },
                        !selectedGoalId && [
                          styles.goalOptionSelected,
                          { borderColor: theme.text.primary },
                        ],
                      ]}
                      onPress={() => setSelectedGoalId(undefined)}
                    >
                      <Text
                        style={[
                          styles.goalOptionText,
                          { color: theme.text.secondary },
                          !selectedGoalId && [
                            styles.goalOptionTextSelected,
                            { color: theme.text.primary },
                          ],
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
                          {
                            borderColor: theme.border.light,
                            backgroundColor: theme.background.secondary,
                          },
                          selectedGoalId === goal.id && [
                            styles.goalOptionSelected,
                            { borderColor: theme.text.primary },
                          ],
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
                            { color: theme.text.secondary },
                            selectedGoalId === goal.id && [
                              styles.goalOptionTextSelected,
                              { color: theme.text.primary },
                            ],
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
                <Text style={[styles.label, { color: theme.text.primary }]}>Pillar</Text>
                <View style={styles.pillarPicker}>
                  {ALL_PILLARS.map((pillar) => (
                    <Pressable
                      key={pillar}
                      style={[
                        styles.pillarOption,
                        {
                          borderColor: theme.border.light,
                          backgroundColor: theme.background.secondary,
                        },
                        selectedPillar === pillar && {
                          backgroundColor: PILLAR_INFO[pillar].color + "30",
                          borderColor: PILLAR_INFO[pillar].color,
                        },
                      ]}
                      onPress={() => setSelectedPillar(pillar)}
                    >
                      <Text style={styles.pillarEmoji}>{PILLAR_INFO[pillar].emoji}</Text>
                      <Text style={[styles.pillarOptionText, { color: theme.text.secondary }]}>
                        {PILLAR_INFO[pillar].label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Habit Type: Build or Quit */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text.primary }]}>Habit type</Text>
              <View style={styles.typeRow}>
                {HABIT_TYPE_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.typeOption,
                      {
                        borderColor: theme.border.light,
                        backgroundColor: theme.background.secondary,
                      },
                      habitType === option.value && [
                        styles.typeOptionSelected,
                        { borderColor: theme.text.primary },
                      ],
                    ]}
                    onPress={() => setHabitType(option.value)}
                  >
                    <Text
                      style={[
                        styles.typeLabel,
                        { color: theme.text.secondary },
                        habitType === option.value && [
                          styles.typeLabelSelected,
                          { color: theme.text.primary },
                        ],
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text style={[styles.typeDesc, { color: theme.text.tertiary }]}>
                      {option.desc}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Completion Type */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text.primary }]}>How to measure</Text>
              <View style={styles.completionRow}>
                {COMPLETION_TYPE_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.completionOption,
                      {
                        borderColor: theme.border.light,
                        backgroundColor: theme.background.secondary,
                      },
                      completionType === option.value && [
                        styles.completionOptionSelected,
                        { borderColor: theme.text.primary },
                      ],
                    ]}
                    onPress={() => setCompletionType(option.value)}
                  >
                    <Text
                      style={[
                        styles.completionLabel,
                        { color: theme.text.secondary },
                        completionType === option.value && [
                          styles.completionLabelSelected,
                          { color: theme.text.primary },
                        ],
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
                <Text style={[styles.label, { color: theme.text.primary }]}>Target count</Text>
                <View style={styles.targetRow}>
                  <TextInput
                    style={[
                      styles.targetInput,
                      { borderColor: theme.border.light, color: theme.text.primary },
                    ]}
                    value={targetValue}
                    onChangeText={setTargetValue}
                    keyboardType="numeric"
                    placeholder="e.g., 30"
                    placeholderTextColor={theme.text.tertiary}
                    maxLength={5}
                  />
                  <TextInput
                    style={[
                      styles.unitInput,
                      { borderColor: theme.border.light, color: theme.text.primary },
                    ]}
                    value={unit}
                    onChangeText={setUnit}
                    placeholder="reps, pages, etc."
                    placeholderTextColor={theme.text.tertiary}
                    maxLength={20}
                  />
                </View>
              </View>
            )}

            {/* Target Duration - Timer style HH:MM:SS */}
            {completionType === "DURATION" && (
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.text.primary }]}>Target duration</Text>
                <View style={styles.durationRow}>
                  <View style={styles.durationInputGroup}>
                    <TextInput
                      style={[
                        styles.durationInput,
                        {
                          borderColor: theme.border.light,
                          backgroundColor: theme.background.secondary,
                          color: theme.text.primary,
                        },
                      ]}
                      value={durationHours}
                      onChangeText={(v) => setDurationHours(v.replace(/[^0-9]/g, ""))}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={theme.text.tertiary}
                      maxLength={2}
                    />
                    <Text style={[styles.durationLabel, { color: theme.text.tertiary }]}>hr</Text>
                  </View>
                  <Text style={[styles.durationSeparator, { color: theme.text.secondary }]}>:</Text>
                  <View style={styles.durationInputGroup}>
                    <TextInput
                      style={[
                        styles.durationInput,
                        {
                          borderColor: theme.border.light,
                          backgroundColor: theme.background.secondary,
                          color: theme.text.primary,
                        },
                      ]}
                      value={durationMinutes}
                      onChangeText={(v) => setDurationMinutes(v.replace(/[^0-9]/g, ""))}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={theme.text.tertiary}
                      maxLength={2}
                    />
                    <Text style={[styles.durationLabel, { color: theme.text.tertiary }]}>min</Text>
                  </View>
                  <Text style={[styles.durationSeparator, { color: theme.text.secondary }]}>:</Text>
                  <View style={styles.durationInputGroup}>
                    <TextInput
                      style={[
                        styles.durationInput,
                        {
                          borderColor: theme.border.light,
                          backgroundColor: theme.background.secondary,
                          color: theme.text.primary,
                        },
                      ]}
                      value={durationSeconds}
                      onChangeText={(v) => setDurationSeconds(v.replace(/[^0-9]/g, ""))}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={theme.text.tertiary}
                      maxLength={2}
                    />
                    <Text style={[styles.durationLabel, { color: theme.text.tertiary }]}>sec</Text>
                  </View>
                </View>
                <Text style={[styles.durationHint, { color: theme.text.secondary }]}>
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
              <Text style={[styles.label, { color: theme.text.primary }]}>Schedule</Text>
              <View style={styles.scheduleRow}>
                <TextInput
                  style={[
                    styles.countInput,
                    { borderColor: theme.border.light, color: theme.text.primary },
                  ]}
                  value={targetCount}
                  onChangeText={setTargetCount}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <Text style={[styles.scheduleText, { color: theme.text.secondary }]}>
                  times per
                </Text>
                <View style={styles.frequencyPicker}>
                  {FREQUENCY_OPTIONS.map((option) => (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.frequencyOption,
                        {
                          borderColor: theme.border.light,
                          backgroundColor: theme.background.secondary,
                        },
                        frequency === option.value && [
                          styles.frequencyOptionSelected,
                          { borderColor: theme.text.primary },
                        ],
                      ]}
                      onPress={() => setFrequency(option.value)}
                    >
                      <Text
                        style={[
                          styles.frequencyOptionText,
                          { color: theme.text.secondary },
                          frequency === option.value && [
                            styles.frequencyOptionTextSelected,
                            { color: theme.text.primary },
                          ],
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
                <Text style={[styles.label, { color: theme.text.primary }]}>
                  Pillar (from goal)
                </Text>
                <View
                  style={[
                    styles.lockedPillarBadge,
                    {
                      borderColor: theme.border.light,
                      backgroundColor: theme.background.secondary,
                    },
                  ]}
                >
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
              <Text style={[styles.label, { color: theme.text.primary }]}>
                Who can see this habit?
              </Text>
              <View style={styles.privacyPicker}>
                {PRIVACY_OPTIONS.map((privacy) => (
                  <Pressable
                    key={privacy}
                    style={[
                      styles.privacyOption,
                      {
                        borderColor: theme.border.light,
                        backgroundColor: theme.background.secondary,
                      },
                      selectedPrivacy === privacy && [
                        styles.privacyOptionSelected,
                        { borderColor: theme.text.primary },
                      ],
                    ]}
                    onPress={() => setSelectedPrivacy(privacy)}
                  >
                    <Text
                      style={[
                        styles.privacyOptionLabel,
                        { color: theme.text.secondary },
                        selectedPrivacy === privacy && [
                          styles.privacyOptionLabelSelected,
                          { color: theme.text.primary },
                        ],
                      ]}
                    >
                      {PRIVACY_INFO[privacy].label}
                    </Text>
                    <Text style={[styles.privacyOptionDesc, { color: theme.text.tertiary }]}>
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
    fontSize: typography.fontSize.base,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xmd,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  backButton: {
    padding: spacing.sm,
  },
  backButtonText: {
    fontSize: typography.fontSize.base,
    color: "#007AFF",
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  addButton: {
    backgroundColor: "#000",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  addButtonText: {
    color: "#fff",
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xxl,
  },
  emptyEmoji: {
    fontSize: typography.fontSize.hero,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.base,
    color: "#666",
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  createFirstButton: {
    backgroundColor: "#000",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.smd,
    borderRadius: borderRadius.lg,
  },
  createFirstButtonText: {
    color: "#fff",
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  listContent: {
    padding: spacing.md,
  },
  pillarSection: {
    marginBottom: spacing.lg,
  },
  pillarHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xmd,
    paddingVertical: spacing.xmd,
    borderRadius: borderRadius.xmd,
    marginBottom: spacing.sm,
  },
  pillarEmoji: {
    fontSize: typography.fontSize.xl,
    marginRight: spacing.sm,
  },
  pillarTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    flex: 1,
  },
  habitCount: {
    fontSize: typography.fontSize.sm,
    color: "#999",
    fontWeight: typography.fontWeight.medium,
  },
  habitCard: {
    backgroundColor: "#fff",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: borderRadius.sm,
    elevation: 2,
  },
  habitHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  habitTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    flex: 1,
  },
  streakBadge: {
    backgroundColor: "#FF6B6B20",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
  },
  streakText: {
    fontSize: typography.fontSize.xs,
    color: "#FF6B6B",
    fontWeight: typography.fontWeight.semibold,
  },
  habitMeta: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  scheduleBadge: {
    fontSize: typography.fontSize.xs,
    color: "#666",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  goalLink: {
    fontSize: typography.fontSize.xs,
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xmd,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  modalCancel: {
    fontSize: typography.fontSize.base,
    color: "#666",
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  modalSave: {
    fontSize: typography.fontSize.base,
    color: "#007AFF",
    fontWeight: typography.fontWeight.semibold,
  },
  disabled: {
    opacity: 0.5,
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  formGroup: {
    marginBottom: spacing.lg + spacing.xs,
  },
  label: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xmd,
    color: "#333",
  },
  textInput: {
    fontSize: typography.fontSize.md,
    borderBottomWidth: 2,
    borderBottomColor: "#e5e5e5",
    paddingVertical: spacing.xmd,
  },
  goalPicker: {
    flexDirection: "row",
    gap: spacing.xmd,
  },
  goalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.smd,
    paddingVertical: spacing.xmd,
    borderRadius: borderRadius.xmd,
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
    fontSize: typography.fontSize.base,
    marginRight: spacing.xs,
  },
  goalOptionText: {
    fontSize: typography.fontSize.sm,
    color: "#666",
    flexShrink: 1,
  },
  goalOptionTextSelected: {
    color: "#000",
    fontWeight: typography.fontWeight.medium,
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xmd,
  },
  countInput: {
    width: 50,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    textAlign: "center",
    borderWidth: 2,
    borderColor: "#e5e5e5",
    borderRadius: borderRadius.xmd,
    paddingVertical: spacing.xmd,
  },
  scheduleText: {
    fontSize: typography.fontSize.base,
    color: "#666",
  },
  frequencyPicker: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  frequencyOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xmd,
    borderRadius: borderRadius.xmd,
    borderWidth: 2,
    borderColor: "#e5e5e5",
    backgroundColor: "#fafafa",
  },
  frequencyOptionSelected: {
    borderColor: "#000",
    backgroundColor: "#f5f5f5",
  },
  frequencyOptionText: {
    fontSize: typography.fontSize.sm,
    color: "#666",
  },
  frequencyOptionTextSelected: {
    color: "#000",
    fontWeight: typography.fontWeight.semibold,
  },
  pillarPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xmd,
  },
  pillarOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.smd,
    paddingVertical: spacing.xmd,
    borderRadius: borderRadius.xmd,
    borderWidth: 2,
    borderColor: "#e5e5e5",
    backgroundColor: "#fafafa",
  },
  pillarOptionEmoji: {
    fontSize: typography.fontSize.lg,
    marginRight: spacing.xs,
  },
  pillarOptionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: "#666",
  },
  privacyPicker: {
    gap: spacing.xmd,
  },
  privacyOption: {
    padding: spacing.smd,
    borderRadius: borderRadius.xmd,
    borderWidth: 2,
    borderColor: "#e5e5e5",
    backgroundColor: "#fafafa",
  },
  privacyOptionSelected: {
    borderColor: "#000",
    backgroundColor: "#f5f5f5",
  },
  privacyOptionLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: "#666",
    marginBottom: spacing.xxs,
  },
  privacyOptionLabelSelected: {
    color: "#000",
  },
  privacyOptionDesc: {
    fontSize: typography.fontSize.xs,
    color: "#999",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
    paddingTop: spacing.smd,
  },
  charCount: {
    fontSize: typography.fontSize.xs,
    color: "#999",
    textAlign: "right",
    marginTop: spacing.xs,
  },
  lockedPillarBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.smd,
    paddingVertical: spacing.xmd,
    borderRadius: borderRadius.xmd,
    borderWidth: 2,
    borderColor: "#e5e5e5",
    backgroundColor: "#f5f5f5",
    alignSelf: "flex-start",
  },
  lockedPillarText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  // Emoji picker
  emojiPicker: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  emojiOption: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.xmd,
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
    fontSize: typography.fontSize.xxl,
  },
  // Habit type
  typeRow: {
    flexDirection: "row",
    gap: spacing.xmd,
  },
  typeOption: {
    flex: 1,
    padding: spacing.smd,
    borderRadius: borderRadius.xmd,
    borderWidth: 2,
    borderColor: "#e5e5e5",
    backgroundColor: "#fafafa",
  },
  typeOptionSelected: {
    borderColor: "#000",
    backgroundColor: "#f5f5f5",
  },
  typeLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: "#666",
    marginBottom: spacing.xs,
  },
  typeLabelSelected: {
    color: "#000",
  },
  typeDesc: {
    fontSize: typography.fontSize.xs,
    color: "#999",
  },
  // Completion type
  completionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  completionOption: {
    flex: 1,
    paddingVertical: spacing.xmd,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.xmd,
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
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: "#666",
  },
  completionLabelSelected: {
    color: "#000",
  },
  // Target value & unit
  targetRow: {
    flexDirection: "row",
    gap: spacing.xmd,
  },
  targetInput: {
    flex: 1,
    fontSize: typography.fontSize.md,
    borderWidth: 2,
    borderColor: "#e5e5e5",
    borderRadius: borderRadius.xmd,
    paddingHorizontal: spacing.smd,
    paddingVertical: spacing.xmd,
  },
  unitInput: {
    flex: 2,
    fontSize: typography.fontSize.md,
    borderWidth: 2,
    borderColor: "#e5e5e5",
    borderRadius: borderRadius.xmd,
    paddingHorizontal: spacing.smd,
    paddingVertical: spacing.xmd,
  },
  // Duration timer input
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  durationInputGroup: {
    alignItems: "center",
  },
  durationInput: {
    width: 56,
    height: 56,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.semibold,
    textAlign: "center",
    borderWidth: 2,
    borderColor: "#e5e5e5",
    borderRadius: borderRadius.xmd,
    backgroundColor: "#fafafa",
  },
  durationLabel: {
    fontSize: typography.fontSize.xxs,
    color: "#999",
    marginTop: spacing.xs,
    textTransform: "uppercase",
  },
  durationSeparator: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.semibold,
    color: "#666",
    marginHorizontal: spacing.xxs,
    marginBottom: spacing.md,
  },
  durationHint: {
    fontSize: typography.fontSize.xs,
    color: "#666",
    textAlign: "center",
    marginTop: spacing.xmd,
  },
  // Difficulty
  difficultyRow: {
    flexDirection: "row",
    gap: spacing.xmd,
  },
  difficultyOption: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
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
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: "#666",
  },
  difficultyTextSelected: {
    color: "#fff",
  },
  difficultyHint: {
    fontSize: typography.fontSize.xs,
    color: "#999",
    marginTop: spacing.sm,
  },
  // Mini version
  miniHint: {
    fontSize: typography.fontSize.xs,
    color: "#999",
    marginTop: spacing.xs,
  },
  // Grace days
  graceRow: {
    flexDirection: "row",
    gap: spacing.xmd,
  },
  graceOption: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.xmd,
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
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: "#666",
  },
  graceTextSelected: {
    color: "#000",
  },
  graceHint: {
    fontSize: typography.fontSize.xs,
    color: "#999",
    marginTop: spacing.sm,
  },
});
