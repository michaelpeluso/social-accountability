/**
 * PillarDetailModal - Modal showing detailed pillar information
 * Extracted from dashboard/index.tsx for maintainability
 */

import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { PILLAR_INFO } from "../../types/goals";
import type { Habit, HabitCheckIn } from "../../types";
import { useTheme } from "../../theme";
import { spacing, borderRadius } from "../../theme/spacing";
import { typography } from "../../theme/typography";
import { getScoreColor, getTrendColor, getTrendArrow, type PillarScore } from "../../logic";

function isThisWeek(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return date >= startOfWeek;
}

interface PillarDetailModalProps {
  visible: boolean;
  onClose: () => void;
  pillarScore: PillarScore | null;
  habits: Habit[];
  checkIns: HabitCheckIn[];
}

export function PillarDetailModal({
  visible,
  onClose,
  pillarScore,
  habits,
  checkIns,
}: PillarDetailModalProps) {
  const { theme } = useTheme();

  if (!pillarScore) return null;

  const pillarHabits = habits.filter((h) => h.pillar === pillarScore.pillar && !h.isArchived);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background.primary }]}>
        <View style={[styles.modalHeader, { borderBottomColor: theme.border.light }]}>
          <Pressable onPress={onClose} style={styles.modalClose}>
            <Text style={[styles.modalCloseText, { color: theme.button.primary.background }]}>
              Close
            </Text>
          </Pressable>
          <Text style={[styles.modalTitle, { color: theme.text.primary }]}>
            {PILLAR_INFO[pillarScore.pillar].emoji} {PILLAR_INFO[pillarScore.pillar].label}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Pillar Score Summary */}
          <View style={[styles.modalScoreCard, { backgroundColor: theme.background.tertiary }]}>
            <Text style={[styles.modalScoreValue, { color: getScoreColor(pillarScore.score) }]}>
              {pillarScore.score}%
            </Text>
            <Text style={[styles.modalTrend, { color: getTrendColor(pillarScore.trend) }]}>
              {getTrendArrow(pillarScore.trend)}{" "}
              {pillarScore.trend === "up"
                ? "Improving"
                : pillarScore.trend === "down"
                  ? "Declining"
                  : "Stable"}
            </Text>
            <Text style={[styles.modalScoreMeta, { color: theme.text.secondary }]}>
              {pillarScore.habitCount} habit{pillarScore.habitCount !== 1 ? "s" : ""} in this pillar
            </Text>
          </View>

          {/* Habits in this Pillar */}
          <Text style={[styles.modalSectionTitle, { color: theme.text.primary }]}>Habits</Text>
          {pillarHabits.length > 0 ? (
            <View style={[styles.modalHabitsList, { backgroundColor: theme.card.background }]}>
              {pillarHabits.map((habit) => {
                const habitCheckIns = checkIns.filter((c) => c.habitId === habit.id);
                const recentCheckIns = habitCheckIns.filter((c) => isThisWeek(c.occurredAt));
                return (
                  <Pressable
                    key={habit.id}
                    style={[styles.modalHabitItem, { borderBottomColor: theme.border.light }]}
                    onPress={() => {
                      onClose();
                      router.push(`/habits/${habit.id}`);
                    }}
                  >
                    <View style={styles.modalHabitInfo}>
                      <Text style={[styles.modalHabitTitle, { color: theme.text.primary }]}>
                        {habit.title}
                      </Text>
                      <Text style={[styles.modalHabitMeta, { color: theme.text.secondary }]}>
                        {recentCheckIns.length} this week | {habit.currentStreak} day streak
                      </Text>
                    </View>
                    <Text style={[styles.modalHabitArrow, { color: theme.text.tertiary }]}>→</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Text style={[styles.modalEmptyText, { color: theme.text.secondary }]}>
              No habits in this pillar yet
            </Text>
          )}
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
  modalClose: {
    padding: spacing.sm,
  },
  modalCloseText: {
    fontSize: typography.fontSize.base,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  placeholder: {
    width: 50,
  },
  modalContent: {
    flex: 1,
    padding: spacing.md,
  },
  modalScoreCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  modalScoreValue: {
    fontSize: 48,
    fontWeight: typography.fontWeight.bold,
  },
  modalTrend: {
    fontSize: typography.fontSize.base,
    marginTop: spacing.sm,
  },
  modalScoreMeta: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.sm,
  },
  modalSectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  modalHabitsList: {
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
  },
  modalHabitItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  modalHabitInfo: {
    flex: 1,
  },
  modalHabitTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  modalHabitMeta: {
    fontSize: typography.fontSize.xs,
  },
  modalHabitArrow: {
    fontSize: typography.fontSize.lg,
  },
  modalEmptyText: {
    fontSize: typography.fontSize.sm,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
});
