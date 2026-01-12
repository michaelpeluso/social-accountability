/**
 * DayOfWeekChart - Circular day indicators with counts
 * Reusable across dashboard, profile, and other screens
 */

import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../theme";
import { spacing, borderRadius } from "../../theme/spacing";
import { typography } from "../../theme/typography";

interface DayOfWeekData {
  day: number;
  dayName: string;
  count: number;
}

interface DayOfWeekChartProps {
  data: DayOfWeekData[];
}

export function DayOfWeekChart({ data }: DayOfWeekChartProps) {
  const { theme } = useTheme();

  if (!data.some((d) => d.count > 0)) return null;

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <View style={[styles.card, { backgroundColor: theme.card.background }]}>
      {data.map((dayData, index) => {
        const intensity = dayData.count / maxCount;
        const successColor = theme.text.success;
        return (
          <View key={index} style={styles.item}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor:
                    dayData.count > 0
                      ? `${successColor}${Math.round((0.3 + intensity * 0.7) * 255)
                          .toString(16)
                          .padStart(2, "0")}`
                      : theme.background.tertiary,
                },
              ]}
            >
              <Text style={[styles.count, { color: theme.text.primary }]}>{dayData.count}</Text>
            </View>
            <Text style={[styles.label, { color: theme.text.secondary }]}>{dayData.dayName}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  item: {
    alignItems: "center",
  },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  count: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  label: {
    fontSize: 10,
  },
});
