/**
 * IdentityPicker - Reusable identity selection component
 * Used in goals and habits creation flows
 */

import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import type { IdentityPreset, Pillar } from "../../types";
import { colors, spacing, borderRadius, borderWidth, typography } from "../../theme";

export interface IdentityOption {
  value: IdentityPreset;
  pillar: Pillar;
  icon: string;
}

interface IdentityPickerProps {
  options: IdentityOption[];
  selected: IdentityPreset | undefined;
  onSelect: (identity: IdentityPreset | undefined) => void;
  showNone?: boolean;
}

export function IdentityPicker({
  options,
  selected,
  onSelect,
  showNone = true,
}: IdentityPickerProps) {
  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.identityRow}>
          {showNone && (
            <Pressable
              style={[
                styles.identityOption,
                selected === undefined && styles.identityOptionSelected,
              ]}
              onPress={() => onSelect(undefined)}
            >
              <Text style={styles.identityIcon}>❌</Text>
              <Text
                style={[
                  styles.identityLabel,
                  selected === undefined && styles.identityLabelSelected,
                ]}
              >
                None
              </Text>
            </Pressable>
          )}
          {options.map((identity) => (
            <Pressable
              key={identity.value}
              style={[
                styles.identityOption,
                selected === identity.value && styles.identityOptionSelected,
              ]}
              onPress={() => onSelect(identity.value)}
            >
              <Text style={styles.identityIcon}>{identity.icon}</Text>
              <Text
                style={[
                  styles.identityLabel,
                  selected === identity.value && styles.identityLabelSelected,
                ]}
              >
                {identity.value}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  identityRow: {
    flexDirection: "row",
    gap: spacing.xmd,
    paddingVertical: spacing.xs,
  },
  identityOption: {
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg - spacing.sm, // 12px
    borderRadius: borderRadius.lg,
    borderWidth: borderWidth.thick,
    borderColor: colors.borderMedium,
    backgroundColor: colors.backgroundLight,
    minWidth: 90,
  },
  identityOptionSelected: {
    borderColor: colors.black,
    backgroundColor: colors.backgroundMedium,
  },
  identityIcon: {
    fontSize: typography.fontSize.xxl,
    marginBottom: spacing.xs,
  },
  identityLabel: {
    fontSize: 13,
    fontWeight: typography.fontWeight.medium,
    color: colors.darkGray,
  },
  identityLabelSelected: {
    color: colors.black,
  },
});
