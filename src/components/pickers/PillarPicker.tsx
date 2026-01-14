/**
 * PillarPicker - Reusable pillar selection component
 * Supports both free selection and locked mode when auto-selected
 */

import { View, Text, Pressable, StyleSheet } from "react-native";
import type { Pillar } from "../../types";
import { PILLAR_INFO, ALL_PILLARS } from "../../types/goals";
import { spacing, borderRadius } from "../../theme/spacing";
import { typography } from "../../theme/typography";

interface PillarPickerProps {
  selected: Pillar;
  onSelect: (pillar: Pillar) => void;
  locked?: boolean;
  lockedReason?: string;
}

export function PillarPicker({
  selected,
  onSelect,
  locked = false,
  lockedReason,
}: PillarPickerProps) {
  if (locked) {
    return (
      <View style={styles.lockedPillarBadge}>
        <Text style={styles.pillarOptionEmoji}>{PILLAR_INFO[selected].emoji}</Text>
        <Text style={styles.lockedPillarText}>
          {PILLAR_INFO[selected].label}
          {lockedReason && ` (${lockedReason})`}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.pillarPicker}>
      {ALL_PILLARS.map((pillar) => (
        <Pressable
          key={pillar}
          style={[
            styles.pillarOption,
            selected === pillar && {
              backgroundColor: PILLAR_INFO[pillar].color + "30",
              borderColor: PILLAR_INFO[pillar].color,
            },
          ]}
          onPress={() => onSelect(pillar)}
        >
          <Text style={styles.pillarOptionEmoji}>{PILLAR_INFO[pillar].emoji}</Text>
          <Text
            style={[
              styles.pillarOptionText,
              selected === pillar && { color: PILLAR_INFO[pillar].color },
            ]}
          >
            {PILLAR_INFO[pillar].label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pillarPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xmd,
  },
  pillarOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.smd,
    paddingVertical: spacing.xmd,
    borderRadius: borderRadius.xmd,
    borderWidth: 2,
    borderColor: "#e5e5e5",
    backgroundColor: "#fafafa",
  },
  pillarOptionEmoji: {
    fontSize: typography.fontSize.lg,
    marginRight: spacing.xs + 2,
  },
  pillarOptionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: "#666",
  },
  lockedPillarBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.smd,
    paddingVertical: spacing.xmd + 2,
    borderRadius: borderRadius.xmd,
    borderWidth: 2,
    borderColor: "#e5e5e5",
    backgroundColor: "#f9f9f9",
  },
  lockedPillarText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: "#666",
    marginLeft: spacing.sm,
  },
});
