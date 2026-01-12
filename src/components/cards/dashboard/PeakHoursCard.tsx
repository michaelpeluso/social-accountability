/**
 * PeakHoursCard - Best check-in times
 */

import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../../theme";
import { spacing, borderRadius } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";

interface PeakHour {
  hour: number;
  count: number;
}

interface PeakHoursCardProps {
  hours: PeakHour[];
}

export function PeakHoursCard({ hours }: PeakHoursCardProps) {
  const { theme } = useTheme();

  if (hours.length === 0) return null;

  const formatHour = (hour: number): string => {
    if (hour === 0) return "12 AM";
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return "12 PM";
    return `${hour - 12} PM`;
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.card.background }]}>
      {hours.map((peak, index) => (
        <View key={peak.hour} style={[styles.item, { borderBottomColor: theme.border.light }]}>
          <Text style={[styles.rank, { color: theme.text.tertiary }]}>#{index + 1}</Text>
          <Text style={[styles.hour, { color: theme.text.primary }]}>{formatHour(peak.hour)}</Text>
          <Text style={[styles.count, { color: theme.text.secondary }]}>
            {peak.count} check-ins
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    marginBottom: spacing.lg,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  rank: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    marginRight: spacing.sm,
    width: 30,
  },
  hour: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  count: {
    fontSize: typography.fontSize.sm,
  },
});
