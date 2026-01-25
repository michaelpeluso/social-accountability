/**
 * StatusBanner Component
 * Displays habit status: recovering, at-risk, missed-today
 */

import { View, Text, StyleSheet } from "react-native";
import { spacing, borderRadius } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";

type HabitStatus = "on-track" | "at-risk" | "missed-today" | "recovering" | "inactive";

interface StatusBannerProps {
  status: HabitStatus;
  message: string;
}

export function StatusBanner({ status, message }: StatusBannerProps) {
  // Don't show banner for on-track or inactive
  if (status === "on-track" || status === "inactive") {
    return null;
  }

  const getStatusStyles = () => {
    switch (status) {
      case "recovering":
        return styles.recovering;
      case "at-risk":
        return styles.atRisk;
      case "missed-today":
        return styles.missedToday;
      default:
        return {};
    }
  };

  return (
    <View style={[styles.container, getStatusStyles()]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    alignItems: "center",
  },
  recovering: {
    backgroundColor: "#E8F5E9",
    borderColor: "#4CAF50",
    borderWidth: 1,
  },
  atRisk: {
    backgroundColor: "#FFEBEE",
    borderColor: "#f44336",
    borderWidth: 1,
  },
  missedToday: {
    backgroundColor: "#FFF3E0",
    borderColor: "#FF9800",
    borderWidth: 1,
  },
  text: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: "#333",
  },
});
