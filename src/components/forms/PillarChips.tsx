/**
 * PillarChips - Horizontal chips for selecting a pillar
 * Used in create post/habit/goal forms
 */

import { View, Text, StyleSheet, Pressable } from "react-native";
import type { Pillar } from "../../types";
import { useTheme, spacing, borderRadius, typography } from "../../theme";

interface PillarChipsProps {
  /** Currently selected pillar */
  value: Pillar;
  /** Handler for pillar changes */
  onChange: (pillar: Pillar) => void;
  /** Optional label above the chips */
  label?: string;
}

const PILLARS: { value: Pillar; label: string; emoji: string }[] = [
  { value: "MIND", label: "Mind", emoji: "🧠" },
  { value: "BODY", label: "Body", emoji: "💪" },
  { value: "HEART", label: "Heart", emoji: "❤️" },
  { value: "SOUL", label: "Soul", emoji: "🔥" },
];

export function PillarChips({ value, onChange, label = "Category" }: PillarChipsProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: theme.text.secondary }]}>{label}</Text>}
      <View style={styles.chips}>
        {PILLARS.map((pillar) => (
          <Pressable
            key={pillar.value}
            style={[
              styles.chip,
              { backgroundColor: theme.background.secondary },
              value === pillar.value && {
                backgroundColor: theme.semantic.primary + "20",
                borderWidth: 2,
                borderColor: theme.semantic.primary,
              },
            ]}
            onPress={() => onChange(pillar.value)}
          >
            <Text style={styles.emoji}>{pillar.emoji}</Text>
            <Text
              style={[
                styles.chipLabel,
                { color: theme.text.secondary },
                value === pillar.value && {
                  color: theme.semantic.primary,
                  fontWeight: "600",
                },
              ]}
            >
              {pillar.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  chips: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  chip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.xs + 2,
  },
  emoji: {
    fontSize: typography.fontSize.base,
  },
  chipLabel: {
    fontSize: 13,
  },
});
