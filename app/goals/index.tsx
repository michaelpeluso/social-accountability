/**
 * Goals Screen - Display and manage user goals
 * M2-2.1: Create Goal feature
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { auth } from "../../src/services/auth";
import { createGoal, getGoals } from "../../src/storage/goals";
import { PILLAR_INFO, ALL_PILLARS, PRIVACY_INFO } from "../../src/types/goals";
import type { Goal, Pillar, Privacy } from "../../src/types";

// Privacy options for goal creation
const PRIVACY_OPTIONS: Privacy[] = ["SELF", "FRIENDS", "PUBLIC"];

export default function GoalsScreen() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Form state
  const [newTitle, setNewTitle] = useState("");
  const [selectedPillar, setSelectedPillar] = useState<Pillar>("BODY");
  const [selectedPrivacy, setSelectedPrivacy] = useState<Privacy>("SELF");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    setIsSubmitting(true);
    try {
      await createGoal(userId, {
        title: newTitle.trim(),
        pillar: selectedPillar,
        privacy: selectedPrivacy,
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
    setSelectedPillar("BODY");
    setSelectedPrivacy("SELF");
  }

  function openCreateModal() {
    resetForm();
    setShowCreateModal(true);
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
                    // TODO: Navigate to goal detail screen
                  }}
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

          <View style={styles.modalContent}>
            {/* Title Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>What&apos;s your goal?</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Run a 5K, Read 20 books"
                value={newTitle}
                onChangeText={setNewTitle}
                autoFocus
                maxLength={100}
              />
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
          </View>
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
});
