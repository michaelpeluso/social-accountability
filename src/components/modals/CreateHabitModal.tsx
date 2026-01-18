/**
 * CreateHabitModal - Modal for creating new habits
 * Extracted from habits/index.tsx for maintainability
 */

import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PILLAR_INFO, ALL_PILLARS, PRIVACY_INFO } from "../../types/goals";
import type {
  Goal,
  Pillar,
  Privacy,
  HabitSchedule,
  HabitFrequency,
  HabitType,
  CompletionType,
} from "../../types";
import { useTheme } from "../../theme";
import { spacing, borderRadius } from "../../theme/spacing";
import { typography } from "../../theme/typography";

// Form options
const PRIVACY_OPTIONS: Privacy[] = ["SELF", "FRIENDS", "PUBLIC"];
const FREQUENCY_OPTIONS: { value: HabitFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];
const HABIT_TYPE_OPTIONS: { value: HabitType; label: string; desc: string }[] = [
  { value: "BUILD", label: "Build", desc: "A habit to develop" },
  { value: "BREAK", label: "Break", desc: "A habit to break" },
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

export interface CreateHabitData {
  title: string;
  goalId?: string;
  pillar: Pillar;
  schedule: HabitSchedule;
  privacy: Privacy;
  description?: string;
  habitType: HabitType;
  completionType: CompletionType;
  targetValue?: number;
  unit?: string;
  icon: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  miniVersion?: string;
  graceDays: number;
}

interface CreateHabitModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateHabitData) => Promise<void>;
  goals: Goal[];
  initialGoalId?: string;
}

export function CreateHabitModal({
  visible,
  onClose,
  onSubmit,
  goals,
  initialGoalId,
}: CreateHabitModalProps) {
  const { theme } = useTheme();

  // Form state - Basic
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [selectedGoalId, setSelectedGoalId] = useState<string | undefined>(initialGoalId);
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

  function resetForm() {
    setNewTitle("");
    setNewDescription("");
    setSelectedGoalId(initialGoalId);
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

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit() {
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
        const hours = parseInt(durationHours, 10) || 0;
        const minutes = parseInt(durationMinutes, 10) || 0;
        const seconds = parseInt(durationSeconds, 10) || 0;
        finalTargetValue = hours * 3600 + minutes * 60 + seconds;
        finalUnit = "seconds";
      }

      await onSubmit({
        title: newTitle.trim(),
        goalId: selectedGoalId,
        pillar: effectivePillar,
        schedule,
        privacy: selectedPrivacy,
        description: newDescription.trim() || undefined,
        habitType,
        completionType,
        targetValue: finalTargetValue,
        unit: finalUnit,
        icon,
        difficulty,
        miniVersion: miniVersion.trim() || undefined,
        graceDays: parseInt(graceDays, 10) || 0,
      });

      handleClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create habit";
      Alert.alert("Error", message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background.primary }]}>
        {/* Header */}
        <View style={[styles.modalHeader, { borderBottomColor: theme.border.light }]}>
          <Pressable onPress={handleClose}>
            <Text style={[styles.modalCancel, { color: theme.text.tertiary }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.modalTitle, { color: theme.text.primary }]}>New Habit</Text>
          <Pressable onPress={handleSubmit} disabled={isSubmitting}>
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

        <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
          {/* Title Input */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.text.primary }]}>Name your habit</Text>
            <TextInput
              style={[
                styles.textInput,
                { borderBottomColor: theme.border.light, color: theme.text.primary },
              ]}
              placeholder="e.g., Morning meditation"
              placeholderTextColor={theme.text.tertiary}
              value={newTitle}
              onChangeText={setNewTitle}
              returnKeyType="next"
              maxLength={100}
            />
          </View>

          {/* Icon Picker */}
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
              placeholder="Why is this habit important to you?"
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

          {/* Link to Goal */}
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
              <Text style={[styles.scheduleText, { color: theme.text.secondary }]}>times per</Text>
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
              <Text style={[styles.label, { color: theme.text.primary }]}>Pillar (from goal)</Text>
              <View
                style={[
                  styles.lockedPillarBadge,
                  { borderColor: theme.border.light, backgroundColor: theme.background.secondary },
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
            <Text style={[styles.label, { color: theme.text.primary }]}>Difficulty</Text>
            <View style={styles.difficultyRow}>
              {DIFFICULTY_OPTIONS.map((d) => (
                <Pressable
                  key={d}
                  style={[
                    styles.difficultyOption,
                    {
                      borderColor: theme.border.light,
                      backgroundColor: theme.background.secondary,
                    },
                    difficulty === d && {
                      borderColor: theme.text.primary,
                      backgroundColor: theme.semantic.primary + "20",
                    },
                  ]}
                  onPress={() => setDifficulty(d)}
                >
                  <Text
                    style={[
                      styles.difficultyText,
                      { color: theme.text.secondary },
                      difficulty === d && { color: theme.text.primary },
                    ]}
                  >
                    {d}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={[styles.difficultyHint, { color: theme.text.tertiary }]}>
              1 = Easy, 5 = Very Hard
            </Text>
          </View>

          {/* Mini Version */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.text.primary }]}>
              Mini version (optional)
            </Text>
            <TextInput
              style={[
                styles.textInput,
                { borderBottomColor: theme.border.light, color: theme.text.primary },
              ]}
              placeholder="e.g., 1 push-up, read 1 page"
              placeholderTextColor={theme.text.tertiary}
              value={miniVersion}
              onChangeText={setMiniVersion}
              maxLength={100}
            />
            <Text style={[styles.miniHint, { color: theme.text.tertiary }]}>
              What is the smallest version of this habit?
            </Text>
          </View>

          {/* Grace Days */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.text.primary }]}>Grace days</Text>
            <View style={styles.graceRow}>
              {["0", "1", "2", "3"].map((g) => (
                <Pressable
                  key={g}
                  style={[
                    styles.graceOption,
                    {
                      borderColor: theme.border.light,
                      backgroundColor: theme.background.secondary,
                    },
                    graceDays === g && {
                      borderColor: theme.text.primary,
                      backgroundColor: theme.semantic.primary + "20",
                    },
                  ]}
                  onPress={() => setGraceDays(g)}
                >
                  <Text
                    style={[
                      styles.graceText,
                      { color: theme.text.secondary },
                      graceDays === g && { color: theme.text.primary },
                    ]}
                  >
                    {g}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={[styles.graceHint, { color: theme.text.tertiary }]}>
              Days you can miss without breaking your streak
            </Text>
          </View>

          {/* Bottom padding */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xmd,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: typography.fontSize.base,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  modalSave: {
    fontSize: typography.fontSize.base,
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
  },
  textInput: {
    fontSize: typography.fontSize.md,
    borderBottomWidth: 2,
    paddingVertical: spacing.xmd,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
    paddingTop: spacing.smd,
  },
  charCount: {
    fontSize: typography.fontSize.xs,
    textAlign: "right",
    marginTop: spacing.xs,
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
    justifyContent: "center",
    alignItems: "center",
  },
  emojiOptionSelected: {},
  emojiText: {
    fontSize: typography.fontSize.xxl,
  },
  // Goal picker
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
    maxWidth: 150,
  },
  goalOptionSelected: {},
  goalOptionEmoji: {
    fontSize: typography.fontSize.base,
    marginRight: spacing.xs,
  },
  goalOptionText: {
    fontSize: typography.fontSize.sm,
    flexShrink: 1,
  },
  goalOptionTextSelected: {
    fontWeight: typography.fontWeight.medium,
  },
  // Pillar picker
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
  },
  pillarEmoji: {
    fontSize: typography.fontSize.lg,
    marginRight: spacing.xs,
  },
  pillarOptionEmoji: {
    fontSize: typography.fontSize.lg,
    marginRight: spacing.xs,
  },
  pillarOptionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  // Type picker
  typeRow: {
    flexDirection: "row",
    gap: spacing.xmd,
  },
  typeOption: {
    flex: 1,
    padding: spacing.smd,
    borderRadius: borderRadius.xmd,
    borderWidth: 2,
  },
  typeOptionSelected: {},
  typeLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  typeLabelSelected: {},
  typeDesc: {
    fontSize: typography.fontSize.xs,
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
    alignItems: "center",
  },
  completionOptionSelected: {},
  completionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  completionLabelSelected: {},
  // Target count
  targetRow: {
    flexDirection: "row",
    gap: spacing.xmd,
  },
  targetInput: {
    flex: 1,
    fontSize: typography.fontSize.md,
    borderWidth: 2,
    borderRadius: borderRadius.xmd,
    paddingHorizontal: spacing.smd,
    paddingVertical: spacing.xmd,
  },
  unitInput: {
    flex: 2,
    fontSize: typography.fontSize.md,
    borderWidth: 2,
    borderRadius: borderRadius.xmd,
    paddingHorizontal: spacing.smd,
    paddingVertical: spacing.xmd,
  },
  // Duration timer
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
    borderRadius: borderRadius.xmd,
  },
  durationLabel: {
    fontSize: typography.fontSize.xxs,
    marginTop: spacing.xs,
    textTransform: "uppercase",
  },
  durationSeparator: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.semibold,
    marginHorizontal: spacing.xxs,
    marginBottom: spacing.md,
  },
  durationHint: {
    fontSize: typography.fontSize.xs,
    textAlign: "center",
    marginTop: spacing.xmd,
  },
  // Schedule
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
    borderRadius: borderRadius.xmd,
    paddingVertical: spacing.xmd,
  },
  scheduleText: {
    fontSize: typography.fontSize.base,
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
  },
  frequencyOptionSelected: {},
  frequencyOptionText: {
    fontSize: typography.fontSize.sm,
  },
  frequencyOptionTextSelected: {
    fontWeight: typography.fontWeight.semibold,
  },
  // Locked pillar
  lockedPillarBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.smd,
    paddingVertical: spacing.xmd,
    borderRadius: borderRadius.xmd,
    borderWidth: 2,
    alignSelf: "flex-start",
  },
  lockedPillarText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  // Privacy picker
  privacyPicker: {
    gap: spacing.xmd,
  },
  privacyOption: {
    padding: spacing.smd,
    borderRadius: borderRadius.xmd,
    borderWidth: 2,
  },
  privacyOptionSelected: {},
  privacyOptionLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xxs,
  },
  privacyOptionLabelSelected: {},
  privacyOptionDesc: {
    fontSize: typography.fontSize.xs,
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
    justifyContent: "center",
    alignItems: "center",
  },
  difficultyText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  difficultyHint: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.sm,
  },
  // Mini version
  miniHint: {
    fontSize: typography.fontSize.xs,
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
    justifyContent: "center",
    alignItems: "center",
  },
  graceText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  graceHint: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.sm,
  },
});
