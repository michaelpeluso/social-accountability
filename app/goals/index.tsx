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
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading goals...</Text>
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
        <Text style={styles.headerTitle}>Goals</Text>
        <Pressable onPress={openCreateModal} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ New</Text>
        </Pressable>
      </View>

      {/* Goals List */}
      {goals.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🎯</Text>
          <Text style={styles.emptyTitle}>No goals yet</Text>
          <Text style={styles.emptySubtitle}>
            Create your first goal to start tracking your progress
          </Text>
          <Pressable style={styles.createFirstButton} onPress={openCreateModal}>
            <Text style={styles.createFirstButtonText}>Create Goal</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={ALL_PILLARS.filter((p) => goalsByPillar[p]?.length > 0)}
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
                <Text style={styles.goalCount}>{goalsByPillar[pillar]?.length || 0}</Text>
              </View>
              {goalsByPillar[pillar]?.map((goal) => (
                <Pressable
                  key={goal.id}
                  style={styles.goalCard}
                  onPress={() => {
                    router.push(`/goals/${goal.id}`);
                  }}
                  onLongPress={() => handleArchiveGoal(goal.id, goal.title)}
                >
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                  <View style={styles.goalMeta}>
                    <Text style={styles.privacyBadge}>{PRIVACY_INFO[goal.privacy].label}</Text>
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
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowCreateModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>New Goal</Text>
            <Pressable onPress={handleCreateGoal} disabled={isSubmitting}>
              <Text style={[styles.modalSave, isSubmitting && styles.disabled]}>
                {isSubmitting ? "Saving..." : "Save"}
              </Text>
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            {/* Title Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>What&apos;s your goal?</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Lose 10 pounds, Run a marathon"
                value={newTitle}
                onChangeText={setNewTitle}
                returnKeyType="next"
                maxLength={100}
              />
            </View>

            {/* Description Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description (optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Add more details about this goal"
                value={newDescription}
                onChangeText={setNewDescription}
                multiline
                numberOfLines={3}
                maxLength={500}
                returnKeyType="done"
                blurOnSubmit={true}
              />
              <Text style={styles.charCount}>{newDescription.length}/500</Text>
            </View>

            {/* Identity Selector */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>What identity does this goal support?</Text>
              <Text style={styles.hint}>
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
              <Text style={styles.label}>Pillar</Text>
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
              <Text style={styles.label}>Values</Text>
              <View style={styles.valuesRow}>
                <View style={styles.valueInputGroup}>
                  <Text style={styles.valueLabel}>Start</Text>
                  <TextInput
                    style={styles.valueInput}
                    value={startValue}
                    onChangeText={setStartValue}
                    keyboardType="numeric"
                    placeholder="0"
                    maxLength={10}
                    returnKeyType="next"
                  />
                </View>
                <Text style={styles.valueArrow}>→</Text>
                <View style={styles.valueInputGroup}>
                  <Text style={styles.valueLabel}>Target</Text>
                  <TextInput
                    style={styles.valueInput}
                    value={targetValue}
                    onChangeText={setTargetValue}
                    keyboardType="numeric"
                    placeholder="100"
                    maxLength={10}
                    returnKeyType="done"
                  />
                </View>
              </View>
              <Text style={styles.hint}>
                Unit of measurement will be selected from tracked data sources in future milestones
              </Text>
            </View>

            {/* Timeline */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Timeline</Text>
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
              <Text style={styles.hint}>
                Start date defaults to today if not set. Leave deadline empty for an indefinite
                goal.
              </Text>
            </View>

            {/* Data Source */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>How will you track progress?</Text>
              <DataSourcePicker
                options={DATA_SOURCE_OPTIONS}
                selected={dataSource}
                onSelect={setDataSource}
              />
            </View>

            {/* Privacy Selector */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Who can see this goal?</Text>
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
  goalCount: {
    fontSize: 14,
    color: "#999",
    fontWeight: "500",
  },
  goalCard: {
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
  goalTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  goalMeta: {
    flexDirection: "row",
  },
  privacyBadge: {
    fontSize: 12,
    color: "#666",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 0,
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
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  charCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
    marginBottom: 8,
  },
  // Values
  valuesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  valueInputGroup: {
    flex: 1,
  },
  valueLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  valueInput: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    borderWidth: 2,
    borderColor: "#e5e5e5",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  valueArrow: {
    fontSize: 20,
    color: "#999",
  },
  // Dates
  datesRow: {
    flexDirection: "row",
    gap: 12,
  },
  dateInputGroup: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
});
