/**
 * CreateGoalModal - Modal for creating new goals
 * Extracted from goals/index.tsx for maintainability
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
import type { Pillar, Privacy, GoalDataSource, IdentityPreset } from "../../types";
import {
  DatePicker,
  IdentityPicker,
  PillarPicker,
  PrivacyPicker,
  DataSourcePicker,
} from "../pickers";
import { useTheme } from "../../theme";
import { spacing, borderRadius } from "../../theme/spacing";
import { typography } from "../../theme/typography";

// Privacy options for goal creation
const PRIVACY_OPTIONS: Privacy[] = ["SELF", "FRIENDS", "PUBLIC"];

// Identity presets (M4 will expand this with full identity system)
const IDENTITY_PRESETS: { value: IdentityPreset; pillar: Pillar; icon: string }[] = [
  { value: "Student", pillar: "MIND", icon: "📚" },
  { value: "Athlete", pillar: "BODY", icon: "🏃" },
  { value: "Parent", pillar: "HEART", icon: "👨‍👩‍👧" },
  { value: "Friend", pillar: "HEART", icon: "🤝" },
  { value: "Partner", pillar: "HEART", icon: "💑" },
  { value: "Professional", pillar: "MIND", icon: "💼" },
  { value: "Artist", pillar: "SOUL", icon: "🎨" },
];

// Data source options (M2: only MANUAL, M5+: others)
const DATA_SOURCE_OPTIONS: {
  value: GoalDataSource;
  label: string;
  desc: string;
  enabled: boolean;
}[] = [
  { value: "MANUAL", label: "Manual", desc: "Log progress yourself", enabled: true },
  {
    value: "HABIT_DERIVED",
    label: "From Habits",
    desc: "Calculate from linked habits",
    enabled: false,
  },
  { value: "INTEGRATION", label: "Auto-sync", desc: "From health/data apps", enabled: false },
];

export interface CreateGoalData {
  title: string;
  pillar: Pillar;
  privacy: Privacy;
  description?: string;
  identityId?: IdentityPreset;
  isIndefinite: boolean;
  startValue?: number;
  targetValue?: number;
  startDate: string;
  deadline?: string;
  dataSource: GoalDataSource;
}

interface CreateGoalModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateGoalData) => Promise<void>;
}

export function CreateGoalModal({ visible, onClose, onSubmit }: CreateGoalModalProps) {
  const { theme } = useTheme();

  // Form state - Basic
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [selectedIdentity, setSelectedIdentity] = useState<IdentityPreset | undefined>(undefined);
  const [selectedPillar, setSelectedPillar] = useState<Pillar>("BODY");
  const [selectedPrivacy, setSelectedPrivacy] = useState<Privacy>("SELF");

  // Form state - Values
  const [startValue, setStartValue] = useState("");
  const [targetValue, setTargetValue] = useState("");

  // Form state - Timeframe (use Date objects in UI)
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);

  // Form state - Data Source
  const [dataSource, setDataSource] = useState<GoalDataSource>("MANUAL");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline validation messages
  const [startDateError, setStartDateError] = useState<string | undefined>(undefined);
  const [deadlineDateError, setDeadlineDateError] = useState<string | undefined>(undefined);

  // When identity is selected, set pillar automatically
  const effectivePillar = selectedIdentity
    ? IDENTITY_PRESETS.find((p) => p.value === selectedIdentity)?.pillar || selectedPillar
    : selectedPillar;

  function resetForm() {
    setNewTitle("");
    setNewDescription("");
    setSelectedIdentity(undefined);
    setSelectedPillar("BODY");
    setSelectedPrivacy("SELF");
    setStartValue("");
    setTargetValue("");
    setStartDate(undefined);
    setDeadline(undefined);
    setStartDateError(undefined);
    setDeadlineDateError(undefined);
    setDataSource("MANUAL");
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit() {
    if (!newTitle.trim()) {
      Alert.alert("Error", "Please enter a goal title");
      return;
    }

    if (!targetValue.trim()) {
      Alert.alert("Error", "Please enter a target value");
      return;
    }

    if (startDateError || deadlineDateError) {
      Alert.alert("Error", "Please fix invalid date fields before saving");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: newTitle.trim(),
        pillar: effectivePillar,
        privacy: selectedPrivacy,
        description: newDescription.trim() || undefined,
        identityId: selectedIdentity,
        isIndefinite: !deadline,
        startValue: startValue ? parseFloat(startValue) : undefined,
        targetValue: targetValue ? parseFloat(targetValue) : undefined,
        startDate: startDate
          ? startDate.toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        deadline: deadline ? deadline.toISOString().split("T")[0] : undefined,
        dataSource,
      });

      handleClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create goal";
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
          <Text style={[styles.modalTitle, { color: theme.text.primary }]}>New Goal</Text>
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
            <Text style={[styles.label, { color: theme.text.secondary }]}>
              What&apos;s your goal?
            </Text>
            <TextInput
              style={[
                styles.textInput,
                { borderBottomColor: theme.border.light, color: theme.text.primary },
              ]}
              placeholder="e.g., Lose 10 pounds, Run a marathon"
              placeholderTextColor={theme.text.tertiary}
              value={newTitle}
              onChangeText={setNewTitle}
              returnKeyType="next"
              maxLength={100}
            />
          </View>

          {/* Description Input */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.text.secondary }]}>
              Description (optional)
            </Text>
            <TextInput
              style={[
                styles.textInput,
                styles.textArea,
                { borderBottomColor: theme.border.light, color: theme.text.primary },
              ]}
              placeholder="Add more details about this goal"
              placeholderTextColor={theme.text.tertiary}
              value={newDescription}
              onChangeText={setNewDescription}
              multiline
              numberOfLines={3}
              maxLength={500}
              returnKeyType="done"
              blurOnSubmit={true}
            />
            <Text style={[styles.charCount, { color: theme.text.tertiary }]}>
              {newDescription.length}/500
            </Text>
          </View>

          {/* Identity Selector */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.text.secondary }]}>
              What identity does this goal support?
            </Text>
            <Text style={[styles.hint, { color: theme.text.tertiary }]}>
              Choose an identity or None to select a pillar directly
            </Text>
            <IdentityPicker
              options={IDENTITY_PRESETS}
              selected={selectedIdentity}
              onSelect={setSelectedIdentity}
            />
          </View>

          {/* Pillar Selector */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.text.secondary }]}>Pillar</Text>
            <PillarPicker
              selected={effectivePillar}
              onSelect={setSelectedPillar}
              locked={!!selectedIdentity}
              lockedReason={selectedIdentity ? `auto-selected from ${selectedIdentity}` : undefined}
            />
          </View>

          {/* Start & Target Values */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.text.secondary }]}>Values</Text>
            <View style={styles.valuesRow}>
              <View style={styles.valueInputGroup}>
                <Text style={[styles.valueLabel, { color: theme.text.tertiary }]}>Start</Text>
                <TextInput
                  style={[
                    styles.valueInput,
                    { borderColor: theme.border.light, color: theme.text.primary },
                  ]}
                  value={startValue}
                  onChangeText={setStartValue}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.text.tertiary}
                  maxLength={10}
                  returnKeyType="next"
                />
              </View>
              <Text style={[styles.valueArrow, { color: theme.text.tertiary }]}>→</Text>
              <View style={styles.valueInputGroup}>
                <Text style={[styles.valueLabel, { color: theme.text.tertiary }]}>Target</Text>
                <TextInput
                  style={[
                    styles.valueInput,
                    { borderColor: theme.border.light, color: theme.text.primary },
                  ]}
                  value={targetValue}
                  onChangeText={setTargetValue}
                  keyboardType="numeric"
                  placeholder="100"
                  placeholderTextColor={theme.text.tertiary}
                  maxLength={10}
                  returnKeyType="done"
                />
              </View>
            </View>
            <Text style={[styles.hint, { color: theme.text.tertiary }]}>
              Unit of measurement will be selected from tracked data sources in future milestones
            </Text>
          </View>

          {/* Timeline */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.text.secondary }]}>Timeline</Text>
            <View style={styles.datesRow}>
              <View style={styles.dateInputGroup}>
                <DatePicker
                  label="Start date"
                  value={startDate}
                  onChange={(date) => {
                    setStartDate(date);
                    setStartDateError(undefined);
                  }}
                  error={startDateError}
                  placeholder="Tap to choose"
                />
              </View>
              <View style={styles.dateInputGroup}>
                <DatePicker
                  label="Deadline"
                  value={deadline}
                  onChange={(date) => {
                    if (startDate && date < startDate) {
                      setDeadline(date);
                      setDeadlineDateError("Deadline must be after start date");
                    } else {
                      setDeadline(date);
                      setDeadlineDateError(undefined);
                    }
                  }}
                  error={deadlineDateError}
                  placeholder="Tap to choose (indefinite)"
                  minimumDate={startDate}
                />
              </View>
            </View>
            <Text style={[styles.hint, { color: theme.text.tertiary }]}>
              Start date defaults to today if not set. Leave deadline empty for an indefinite goal.
            </Text>
          </View>

          {/* Data Source */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.text.secondary }]}>
              How will you track progress?
            </Text>
            <DataSourcePicker
              options={DATA_SOURCE_OPTIONS}
              selected={dataSource}
              onSelect={setDataSource}
            />
          </View>

          {/* Privacy Selector */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.text.secondary }]}>
              Who can see this goal?
            </Text>
            <PrivacyPicker
              options={PRIVACY_OPTIONS}
              selected={selectedPrivacy}
              onSelect={setSelectedPrivacy}
            />
          </View>

          {/* Bottom spacing for scroll */}
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
    paddingVertical: spacing.sm,
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 0,
  },
  formGroup: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  textInput: {
    fontSize: typography.fontSize.lg,
    borderBottomWidth: 2,
    paddingVertical: spacing.sm,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
    paddingTop: spacing.sm,
  },
  charCount: {
    fontSize: typography.fontSize.xs,
    textAlign: "right",
    marginTop: spacing.xxs,
  },
  hint: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xxs,
    marginBottom: spacing.xs,
  },
  // Values
  valuesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  valueInputGroup: {
    flex: 1,
  },
  valueLabel: {
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.xxs,
  },
  valueInput: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    textAlign: "center",
    borderWidth: 2,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  valueArrow: {
    fontSize: 20,
  },
  // Dates
  datesRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  dateInputGroup: {
    flex: 1,
  },
});
