/**
 * ActivityChart - Daily activity bar chart
 * Reusable across dashboard, profile, and other screens
 */

import { View, Text, StyleSheet, Pressable } from "react-native";
import { useTheme } from "../../theme";
import { spacing, borderRadius } from "../../theme/spacing";
import { typography } from "../../theme/typography";

interface DayCount {
  date: Date;
  count: number;
}

interface ActivityChartProps {
  data: DayCount[];
  days: 7 | 30 | 90;
  onDaysChange: (days: 7 | 30 | 90) => void;
}

export function ActivityChart({ data, days, onDaysChange }: ActivityChartProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.card.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text.primary }]}>Activity</Text>
        <View style={styles.selector}>
          {([7, 30, 90] as const).map((d) => (
            <Pressable
              key={d}
              style={[
                styles.selectorButton,
                { backgroundColor: theme.background.tertiary },
                days === d && { backgroundColor: theme.button.primary.background },
              ]}
              onPress={() => onDaysChange(d)}
            >
              <Text
                style={[
                  styles.selectorText,
                  { color: theme.text.secondary },
                  days === d && { color: theme.button.primary.text },
                ]}
              >
                {d}d
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.chart}>
        {data.slice(-Math.min(data.length, 14)).map((day, index) => {
          const maxCount = Math.max(...data.map((d) => d.count), 1);
          const height = (day.count / maxCount) * 60 + 4;
          const dayName = day.date.toLocaleDateString("en-US", { weekday: "short" });

          return (
            <View key={index} style={styles.day}>
              <View
                style={[
                  styles.bar,
                  {
                    height,
                    backgroundColor: day.count > 0 ? theme.text.success : theme.background.tertiary,
                  },
                ]}
              />
              <Text style={[styles.label, { color: theme.text.tertiary }]}>{dayName[0]}</Text>
            </View>
          );
        })}
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
  title: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  selector: {
    flexDirection: "row",
    borderRadius: borderRadius.md,
    padding: 2,
  },
  selectorButton: {
    paddingHorizontal: spacing.xmd,
    paddingVertical: spacing.xs,
    borderRadius: spacing.xs + 2,
  },
  selectorText: {
    fontSize: typography.fontSize.xs,
  },
  chart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 80,
  },
  day: {
    alignItems: "center",
    flex: 1,
  },
  bar: {
    width: 24,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 10,
  },
});
