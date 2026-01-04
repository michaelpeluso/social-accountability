/**
 * DataSourcePicker - Reusable data source selection component
 * Shows available tracking methods with disabled/coming-soon states
 */

import { View, Text, Pressable, StyleSheet } from "react-native";
import type { GoalDataSource } from "../../types";

export interface DataSourceOption {
  value: GoalDataSource;
  label: string;
  desc: string;
  enabled: boolean;
}

interface DataSourcePickerProps {
  options: DataSourceOption[];
  selected: GoalDataSource;
  onSelect: (source: GoalDataSource) => void;
}

export function DataSourcePicker({ options, selected, onSelect }: DataSourcePickerProps) {
  return (
    <View style={styles.dataSourceRow}>
      {options.map((option) => (
        <Pressable
          key={option.value}
          style={[
            styles.dataSourceOption,
            selected === option.value && styles.dataSourceOptionSelected,
            !option.enabled && styles.dataSourceOptionDisabled,
          ]}
          onPress={() => option.enabled && onSelect(option.value)}
          disabled={!option.enabled}
        >
          <Text
            style={[
              styles.dataSourceLabel,
              selected === option.value && styles.dataSourceLabelSelected,
              !option.enabled && styles.dataSourceLabelDisabled,
            ]}
          >
            {option.label}
          </Text>
          <Text style={[styles.dataSourceDesc, !option.enabled && styles.dataSourceDescDisabled]}>
            {option.desc}
          </Text>
          {!option.enabled && <Text style={styles.comingSoon}>Coming soon</Text>}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dataSourceRow: {
    gap: 10,
  },
  dataSourceOption: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#e5e5e5",
    backgroundColor: "#fafafa",
  },
  dataSourceOptionSelected: {
    borderColor: "#000",
    backgroundColor: "#f5f5f5",
  },
  dataSourceOptionDisabled: {
    opacity: 0.5,
  },
  dataSourceLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 2,
  },
  dataSourceLabelSelected: {
    color: "#000",
  },
  dataSourceLabelDisabled: {
    color: "#999",
  },
  dataSourceDesc: {
    fontSize: 12,
    color: "#999",
  },
  dataSourceDescDisabled: {
    color: "#ccc",
  },
  comingSoon: {
    fontSize: 10,
    color: "#999",
    fontStyle: "italic",
    marginTop: 4,
  },
});
