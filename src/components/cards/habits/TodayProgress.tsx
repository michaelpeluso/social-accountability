/**
 * TodayProgress Component
 * Shows today's/this week's progress with check-in buttons
 */

import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "../../../theme";
import { spacing, borderRadius } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";

interface TodayProgressProps {
  title: string;
  count: number;
  target: number;
  remaining: number;
  targetMet: boolean;
  onQuickCheckIn: () => void;
  onCheckInWithNote: () => void;
}

export function TodayProgress({
  title,
  count,
  target,
  remaining,
  targetMet,
  onQuickCheckIn,
  onCheckInWithNote,
}: TodayProgressProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.card.background }]}>
      <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>{title}</Text>
      <View style={styles.progressContainer}>
        <View style={[styles.progressCircle, { backgroundColor: theme.background.secondary }]}>
          <Text
            style={[
              styles.progressCount,
              { color: theme.text.primary },
              remaining === 0 && { color: theme.text.success },
            ]}
          >
            {count}/{target}
          </Text>
        </View>
        <Text style={[styles.progressLabel, { color: theme.text.secondary }]}>
          {remaining === 0 ? "Target reached!" : `${remaining} more to go`}
        </Text>
      </View>

      <Pressable
        style={[
          styles.checkInButton,
          { backgroundColor: theme.text.primary },
          targetMet && { backgroundColor: theme.text.success },
        ]}
        onPress={onQuickCheckIn}
      >
        <Text style={[styles.checkInButtonText, { color: theme.background.primary }]}>
          {targetMet ? "+ Log Another" : "Check In"}
        </Text>
      </Pressable>

      <Pressable style={styles.noteButton} onPress={onCheckInWithNote}>
        <Text style={[styles.noteButtonText, { color: theme.semantic.primary }]}>
          Check in with note
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg - 4,
    borderRadius: borderRadius.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.md,
  },
  progressContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  progressCircle: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  progressCount: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
  },
  progressLabel: {
    fontSize: typography.fontSize.sm,
  },
  checkInButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  checkInButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  noteButton: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  noteButtonText: {
    fontSize: typography.fontSize.sm,
  },
});
