/**
 * IdentityPicker - Reusable identity selection component
 * Used in goals and habits creation flows
 */

import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import type { IdentityPreset, Pillar } from "../../types";

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
    gap: 10,
    paddingVertical: 4,
  },
  identityOption: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e5e5e5",
    backgroundColor: "#fafafa",
    minWidth: 90,
  },
  identityOptionSelected: {
    borderColor: "#000",
    backgroundColor: "#f5f5f5",
  },
  identityIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  identityLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666",
  },
  identityLabelSelected: {
    color: "#000",
  },
});
