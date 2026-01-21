/**
 * CheckInList Component
 * Displays list of recent check-ins
 */

import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "../../../theme";
import { spacing, borderRadius } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";
import type { HabitCheckIn } from "../../../types";

interface CheckInListProps {
  checkIns: HabitCheckIn[];
  onDeleteCheckIn?: (id: string) => void;
  formatDate: (dateStr: string) => string;
}

export function CheckInList({ checkIns, onDeleteCheckIn, formatDate }: CheckInListProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.card.background }]}>
      <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Recent Check-ins</Text>
      {checkIns.length === 0 ? (
        <Text style={[styles.emptyText, { color: theme.text.tertiary }]}>
          No check-ins yet. Log your first one!
        </Text>
      ) : (
        checkIns.map((checkIn) => (
          <Pressable
            key={checkIn.id}
            style={[styles.checkInRow, { borderBottomColor: theme.border.light }]}
            onLongPress={onDeleteCheckIn ? () => onDeleteCheckIn(checkIn.id) : undefined}
          >
            <View style={styles.checkInInfo}>
              <Text style={[styles.checkInTime, { color: theme.text.primary }]}>
                {formatDate(checkIn.occurredAt)}
              </Text>
              {checkIn.note && (
                <Text style={[styles.checkInNote, { color: theme.text.secondary }]}>
                  {checkIn.note}
                </Text>
              )}
            </View>
            <View style={[styles.sourceBadge, { backgroundColor: theme.background.secondary }]}>
              <Text style={[styles.sourceText, { color: theme.text.secondary }]}>
                {checkIn.source === "MANUAL" ? "Manual" : "Auto"}
              </Text>
            </View>
          </Pressable>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xl,
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
  emptyText: {
    textAlign: "center",
    fontSize: typography.fontSize.sm,
    paddingVertical: 20,
  },
  checkInRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  checkInInfo: {
    flex: 1,
  },
  checkInTime: {
    fontSize: typography.fontSize.sm,
  },
  checkInNote: {
    fontSize: 13,
    marginTop: spacing.xs,
  },
  sourceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  sourceText: {
    fontSize: 11,
  },
});
