/**
 * PrivacyPicker - Reusable privacy level selection component
 */

import { View, Text, Pressable, StyleSheet } from "react-native";
import type { Privacy } from "../../types";
import { PRIVACY_INFO } from "../../types/goals";
import { spacing, borderRadius } from "../../theme/spacing";
import { typography } from "../../theme/typography";

interface PrivacyPickerProps {
  options: Privacy[];
  selected: Privacy;
  onSelect: (privacy: Privacy) => void;
}

export function PrivacyPicker({ options, selected, onSelect }: PrivacyPickerProps) {
  return (
    <View style={styles.privacyPicker}>
      {options.map((privacy) => (
        <Pressable
          key={privacy}
          style={[styles.privacyOption, selected === privacy && styles.privacyOptionSelected]}
          onPress={() => onSelect(privacy)}
        >
          <Text
            style={[
              styles.privacyOptionLabel,
              selected === privacy && styles.privacyOptionLabelSelected,
            ]}
          >
            {PRIVACY_INFO[privacy].label}
          </Text>
          <Text style={styles.privacyOptionDesc}>{PRIVACY_INFO[privacy].description}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  privacyPicker: {
    gap: spacing.xmd,
  },
  privacyOption: {
    padding: spacing.smd,
    borderRadius: borderRadius.xmd,
    borderWidth: 2,
    borderColor: "#e5e5e5",
    backgroundColor: "#fafafa",
  },
  privacyOptionSelected: {
    borderColor: "#000",
    backgroundColor: "#f5f5f5",
  },
  privacyOptionLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: "#666",
    marginBottom: spacing.xxs,
  },
  privacyOptionLabelSelected: {
    color: "#000",
  },
  privacyOptionDesc: {
    fontSize: typography.fontSize.sm,
    color: "#999",
  },
});
