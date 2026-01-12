/**
 * CompletionTrendChart - Weekly completion rate bars
 * Reusable across dashboard, profile, and other screens
 */

import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../theme";
import { spacing, borderRadius } from "../../theme/spacing";
import { typography } from "../../theme/typography";
import { getScoreColor } from "../../logic";

interface WeekData {
  weekStart: Date;
  completionRate: number;
}

interface CompletionTrendChartProps {
  data: WeekData[];
}

export function CompletionTrendChart({ data }: CompletionTrendChartProps) {
  const { theme } = useTheme();

  if (data.length === 0) return null;

  return (
    <View style={[styles.card, { backgroundColor: theme.card.background }]}>
      <View style={styles.chart}>
        {data.map((week, index) => {
          const maxRate = 100;
          const height = (week.completionRate / maxRate) * 60 + 4;
          return (
            <View key={index} style={styles.bar}>
              <View
                style={[
                  styles.barFill,
                  { height, backgroundColor: getScoreColor(week.completionRate) },
                ]}
              />
              <Text style={[styles.label, { color: theme.text.tertiary }]}>W{index + 1}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.legend}>
        <Text style={[styles.legendText, { color: theme.text.secondary }]}>
          Last {data.length} weeks
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  chart: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 80,
  },
  bar: {
    alignItems: "center",
    flex: 1,
  },
  barFill: {
    width: 24,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 10,
  },
  legend: {
    marginTop: spacing.sm,
    alignItems: "center",
  },
  legendText: {
    fontSize: typography.fontSize.xs,
  },
});
