/**
 * ObjectPicker - Picker for linking habits or goals to a post
 * Displays available habits and goals for selection
 */

import { View, Text, StyleSheet, Pressable } from "react-native";
import { useState } from "react";
import type { LinkedObjectType, Habit, Goal } from "../../types";
import { useTheme, spacing, borderRadius, typography } from "../../theme";

interface LinkedObject {
  id: string;
  title: string;
  type: LinkedObjectType;
}

interface ObjectPickerProps {
  /** Currently selected object */
  value: LinkedObject | null;
  /** Handler for selection changes */
  onChange: (obj: LinkedObject | null) => void;
  /** Available habits to select from */
  habits: Habit[];
  /** Available goals to select from */
  goals: Goal[];
  /** Optional label above the picker */
  label?: string;
}

export function ObjectPicker({
  value,
  onChange,
  habits,
  goals,
  label = "Link to (optional)",
}: ObjectPickerProps) {
  const { theme } = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  const selectObject = (obj: LinkedObject) => {
    onChange(obj);
    setShowPicker(false);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: theme.text.secondary }]}>{label}</Text>}
      {value ? (
        <View style={styles.selectedRow}>
          <View style={[styles.selectedChip, { backgroundColor: theme.semantic.primary + "20" }]}>
            <Text style={[styles.selectedText, { color: theme.semantic.primary }]}>
              {value.type === "habit" ? "🎯" : "🏆"} {value.title}
            </Text>
          </View>
          <Pressable onPress={() => onChange(null)}>
            <Text style={[styles.removeLink, { color: theme.semantic.danger }]}>Remove</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={[styles.selectButton, { borderColor: theme.border.medium }]}
          onPress={() => setShowPicker(!showPicker)}
        >
          <Text style={[styles.selectText, { color: theme.text.secondary }]}>
            Select a habit or goal...
          </Text>
        </Pressable>
      )}

      {showPicker && (
        <View style={[styles.picker, { backgroundColor: theme.background.secondary }]}>
          {habits.length > 0 && (
            <>
              <Text style={[styles.pickerLabel, { color: theme.text.tertiary }]}>Habits</Text>
              {habits.slice(0, 5).map((habit) => (
                <Pressable
                  key={habit.id}
                  style={styles.pickerItem}
                  onPress={() =>
                    selectObject({
                      id: habit.id,
                      title: habit.title,
                      type: "habit",
                    })
                  }
                >
                  <Text style={[styles.pickerItemText, { color: theme.text.primary }]}>
                    🎯 {habit.title}
                  </Text>
                </Pressable>
              ))}
            </>
          )}
          {goals.length > 0 && (
            <>
              <Text style={[styles.pickerLabel, { color: theme.text.tertiary }]}>Goals</Text>
              {goals.slice(0, 5).map((goal) => (
                <Pressable
                  key={goal.id}
                  style={styles.pickerItem}
                  onPress={() => selectObject({ id: goal.id, title: goal.title, type: "goal" })}
                >
                  <Text style={[styles.pickerItemText, { color: theme.text.primary }]}>
                    🏆 {goal.title}
                  </Text>
                </Pressable>
              ))}
            </>
          )}
          {habits.length === 0 && goals.length === 0 && (
            <Text style={[styles.emptyText, { color: theme.text.tertiary }]}>
              No habits or goals yet
            </Text>
          )}
        </View>
      )}
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
  selectedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    flex: 1,
    marginRight: spacing.sm,
  },
  selectedText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  removeLink: {
    fontSize: typography.fontSize.sm,
  },
  selectButton: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  selectText: {
    fontSize: typography.fontSize.sm,
  },
  picker: {
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  pickerLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  pickerItem: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  pickerItemText: {
    fontSize: typography.fontSize.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    fontStyle: "italic",
    padding: spacing.sm,
  },
});
