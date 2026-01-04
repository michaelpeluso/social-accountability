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
  const [isIndefinite, setIsIndefinite] = useState(false);
  const [startValue, setStartValue] = useState("");
  const [targetValue, setTargetValue] = useState("");

  // Form state - Timeframe
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");

  // Form state - Data Source
  const [dataSource, setDataSource] = useState<GoalDataSource>("MANUAL");

  const [isSubmitting, setIsSubmitting] = useState(false);

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

    // Validate target value for non-indefinite goals
    if (!isIndefinite && !targetValue.trim()) {
      Alert.alert("Error", "Please enter a target value or mark as indefinite");
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
        isIndefinite,
        startValue: startValue ? parseFloat(startValue) : undefined,
        targetValue: !isIndefinite && targetValue ? parseFloat(targetValue) : undefined,
        // Timeframe
        startDate: startDate || undefined,
        deadline: deadline || undefined,
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
    setIsIndefinite(false);
    setStartValue("");
    setTargetValue("");
    setStartDate("");
    setDeadline("");
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

          <ScrollView style={styles.modalContent}>
            {/* Title Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>What&apos;s your goal?</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Lose 10 pounds, Run a marathon"
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
                placeholder="Add more details about this goal"
                value={newDescription}
                onChangeText={setNewDescription}
                multiline
                numberOfLines={3}
                maxLength={500}
              />
              <Text style={styles.charCount}>{newDescription.length}/500</Text>
            </View>

            {/* Identity Selector */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>What identity does this goal support?</Text>
              <Text style={styles.hint}>
                Choose an identity or None to select a pillar directly
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.identityRow}>
                  <Pressable
                    style={[
                      styles.identityOption,
                      selectedIdentity === undefined && styles.identityOptionSelected,
                    ]}
                    onPress={() => setSelectedIdentity(undefined)}
                  >
                    <Text style={styles.identityIcon}>❌</Text>
                    <Text
                      style={[
                        styles.identityLabel,
                        selectedIdentity === undefined && styles.identityLabelSelected,
                      ]}
                    >
                      None
                    </Text>
                  </Pressable>
                  {IDENTITY_PRESETS.map((identity) => (
                    <Pressable
                      key={identity.value}
                      style={[
                        styles.identityOption,
                        selectedIdentity === identity.value && styles.identityOptionSelected,
                      ]}
                      onPress={() => setSelectedIdentity(identity.value)}
                    >
                      <Text style={styles.identityIcon}>{identity.icon}</Text>
                      <Text
                        style={[
                          styles.identityLabel,
                          selectedIdentity === identity.value && styles.identityLabelSelected,
                        ]}
                      >
                        {identity.value}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Pillar Selector (conditional) */}
            {selectedIdentity ? (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Pillar</Text>
                <View style={styles.lockedPillarBadge}>
                  <Text style={styles.pillarOptionEmoji}>{PILLAR_INFO[effectivePillar].emoji}</Text>
                  <Text style={styles.lockedPillarText}>
                    {PILLAR_INFO[effectivePillar].label} (auto-selected from {selectedIdentity})
                  </Text>
                </View>
              </View>
            ) : (
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
            )}

            {/* Indefinite Toggle */}
            <View style={styles.formGroup}>
              <Pressable style={styles.toggleRow} onPress={() => setIsIndefinite(!isIndefinite)}>
                <View>
                  <Text style={styles.toggleLabel}>Indefinite goal</Text>
                  <Text style={styles.toggleHint}>No specific target value (ongoing)</Text>
                </View>
                <View style={[styles.toggle, isIndefinite && styles.toggleActive]}>
                  <View style={[styles.toggleThumb, isIndefinite && styles.toggleThumbActive]} />
                </View>
              </Pressable>
            </View>

            {/* Start & Target Values */}
            {!isIndefinite && (
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
                    />
                  </View>
                </View>
                <Text style={styles.hint}>
                  Unit of measurement will be selected from tracked data sources in future
                  milestones
                </Text>
              </View>
            )}

            {/* Timeline */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Timeline</Text>
              <View style={styles.datesRow}>
                <View style={styles.dateInputGroup}>
                  <Text style={styles.dateLabel}>Start date</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="YYYY-MM-DD"
                    value={startDate}
                    onChangeText={setStartDate}
                    maxLength={10}
                  />
                </View>
                <View style={styles.dateInputGroup}>
                  <Text style={styles.dateLabel}>Deadline</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="YYYY-MM-DD"
                    value={deadline}
                    onChangeText={setDeadline}
                    maxLength={10}
                  />
                </View>
              </View>
              <Text style={styles.hint}>Leave deadline empty for no time limit</Text>
            </View>

            {/* Data Source */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>How will you track progress?</Text>
              <View style={styles.dataSourceRow}>
                {DATA_SOURCE_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.dataSourceOption,
                      dataSource === option.value && styles.dataSourceOptionSelected,
                      !option.enabled && styles.dataSourceOptionDisabled,
                    ]}
                    onPress={() => option.enabled && setDataSource(option.value)}
                    disabled={!option.enabled}
                  >
                    <Text
                      style={[
                        styles.dataSourceLabel,
                        dataSource === option.value && styles.dataSourceLabelSelected,
                        !option.enabled && styles.dataSourceLabelDisabled,
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text
                      style={[
                        styles.dataSourceDesc,
                        !option.enabled && styles.dataSourceDescDisabled,
                      ]}
                    >
                      {option.desc}
                    </Text>
                    {!option.enabled && <Text style={styles.comingSoon}>Coming soon</Text>}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Privacy Selector */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Who can see this goal?</Text>
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
  // Identity
  identityRow: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 4,
  },
  identityOption: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e5e5e5",
    backgroundColor: "#fafafa",
    minWidth: 90,
  },
  identityOptionSelected: {
    borderColor: "#000",
    backgroundColor: "#f5f5f5",
  },
  identityIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  identityLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666",
  },
  identityLabelSelected: {
    color: "#000",
  },
  lockedPillarBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#e5e5e5",
    backgroundColor: "#f9f9f9",
  },
  lockedPillarText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginLeft: 8,
  },
  // Toggle
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  toggleHint: {
    fontSize: 13,
    color: "#999",
    marginTop: 2,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#e5e5e5",
    padding: 2,
  },
  toggleActive: {
    backgroundColor: "#000",
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#fff",
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
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
  dateInput: {
    fontSize: 15,
    borderWidth: 2,
    borderColor: "#e5e5e5",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  // Data Source
  dataSourceRow: {
    gap: 10,
  },
  dataSourceOption: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#e5e5e5",
    backgroundColor: "#fafafa",
  },
  dataSourceOptionSelected: {
    borderColor: "#000",
    backgroundColor: "#f5f5f5",
  },
  dataSourceOptionDisabled: {
    opacity: 0.5,
  },
  dataSourceLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 2,
  },
  dataSourceLabelSelected: {
    color: "#000",
  },
  dataSourceLabelDisabled: {
    color: "#999",
  },
  dataSourceDesc: {
    fontSize: 12,
    color: "#999",
  },
  dataSourceDescDisabled: {
    color: "#ccc",
  },
  comingSoon: {
    fontSize: 10,
    color: "#999",
    fontStyle: "italic",
    marginTop: 4,
  },
});
