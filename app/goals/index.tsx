/**
 * Goals Screen - Display and manage user goals
 * M2-2.1: Create Goal feature with comprehensive goal setup
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
import { router } from "expo-router";
import { auth } from "../../src/services/auth";
import { createGoal, getGoals, archiveGoal } from "../../src/storage/goals";
import { PILLAR_INFO, ALL_PILLARS, PRIVACY_INFO } from "../../src/types/goals";
import type { Goal, Pillar, Privacy, GoalDataSource, IdentityPreset } from "../../src/types";
import {
  DatePicker,
  IdentityPicker,
  PillarPicker,
  PrivacyPicker,
  DataSourcePicker,
} from "../../src/components";
import { useTheme, spacing, borderRadius, typography } from "../../src/theme";

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

export default function GoalsScreen() {
  const { theme } = useTheme();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

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

  async function handleCreateGoal() {
    if (!userId) return;
    if (!newTitle.trim()) {
      Alert.alert("Error", "Please enter a goal title");
      return;
    }

    // Validate target value is provided
    if (!targetValue.trim()) {
      Alert.alert("Error", "Please enter a target value");
      return;
    }

    // Prevent saving when there are validation errors
    if (startDateError || deadlineDateError) {
      Alert.alert("Error", "Please fix invalid date fields before saving");
      return;
    }

    setIsSubmitting(true);
    try {
      await createGoal(userId, {
        title: newTitle.trim(),
        pillar: effectivePillar,
        privacy: selectedPrivacy,
        description: newDescription.trim() || undefined,
        identityId: selectedIdentity, // Store identity name as ID for now (M4 will use real IDs)
        // Values
        isIndefinite: !deadline, // Indefinite if no deadline provided
        startValue: startValue ? parseFloat(startValue) : undefined,
        targetValue: targetValue ? parseFloat(targetValue) : undefined,
        // Timeframe (startDate defaults to today if not provided)
        startDate: startDate
          ? startDate.toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        deadline: deadline ? deadline.toISOString().split("T")[0] : undefined,
        // Data Source
        dataSource,
      });

      setShowCreateModal(false);
      resetForm();
      await loadGoals(userId);
    } catch {
      Alert.alert("Error", "Failed to create goal");
    } finally {
      setIsSubmitting(false);
    }
  }

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

  function openCreateModal() {
    resetForm();
    setShowCreateModal(true);
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
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Goals</Text>
        <Pressable
          onPress={openCreateModal}
          style={[styles.addButton, { backgroundColor: theme.button.primary.background }]}
        >
          <Text style={[styles.addButtonText, { color: theme.button.primary.text }]}>+ New</Text>
        </Pressable>
      </View>

      {/* Goals List */}
      {goals.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🎯</Text>
          <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>No goals yet</Text>
          <Text style={[styles.emptySubtitle, { color: theme.text.tertiary }]}>
            Create your first goal to start tracking your progress
          </Text>
          <Pressable
            style={[styles.createFirstButton, { backgroundColor: theme.button.primary.background }]}
            onPress={openCreateModal}
          >
            <Text style={[styles.createFirstButtonText, { color: theme.button.primary.text }]}>
              Create Goal
            </Text>
          </Pressable>
        </View>
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
            <View style={styles.pillarSection}>
              <View
                style={[styles.pillarHeader, { backgroundColor: PILLAR_INFO[pillar].color + "20" }]}
              >
                <Text style={styles.pillarEmoji}>{PILLAR_INFO[pillar].emoji}</Text>
                <Text style={[styles.pillarTitle, { color: PILLAR_INFO[pillar].color }]}>
                  {PILLAR_INFO[pillar].label}
                </Text>
                <Text style={[styles.goalCount, { color: theme.text.tertiary }]}>
                  {goalsByPillar[pillar]?.length || 0}
                </Text>
              </View>
              {goalsByPillar[pillar]?.map((goal) => (
                <Pressable
                  key={goal.id}
                  style={[styles.goalCard, { backgroundColor: theme.card.background }]}
                  onPress={() => {
                    router.push(`/goals/${goal.id}`);
                  }}
                  onLongPress={() => handleArchiveGoal(goal.id, goal.title)}
                >
                  <Text style={[styles.goalTitle, { color: theme.text.primary }]}>
                    {goal.title}
                  </Text>
                  <View style={styles.goalMeta}>
                    <Text
                      style={[
                        styles.privacyBadge,
                        { color: theme.text.tertiary, backgroundColor: theme.background.secondary },
                      ]}
                    >
                      {PRIVACY_INFO[goal.privacy].label}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        />
      )}

      {/* Create Goal Modal */}
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
              <Text style={[styles.modalCancel, { color: theme.text.tertiary }]}>Cancel</Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: theme.text.primary }]}>New Goal</Text>
            <Pressable onPress={handleCreateGoal} disabled={isSubmitting}>
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
                lockedReason={
                  selectedIdentity ? `auto-selected from ${selectedIdentity}` : undefined
                }
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
                Start date defaults to today if not set. Leave deadline empty for an indefinite
                goal.
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing.xs,
  },
  backButtonText: {
    fontSize: typography.fontSize.base,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  addButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  addButtonText: {
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
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.heading.h2.fontSize,
    fontWeight: typography.heading.h2.fontWeight,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.base,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  createFirstButton: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  createFirstButtonText: {
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
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  pillarEmoji: {
    fontSize: 20,
    marginRight: spacing.xs,
  },
  pillarTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    flex: 1,
  },
  goalCount: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  goalCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xs,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  goalTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  goalMeta: {
    flexDirection: "row",
  },
  privacyBadge: {
    fontSize: typography.fontSize.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
  // Modal styles
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
  dateLabel: {
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.xxs,
  },
});
