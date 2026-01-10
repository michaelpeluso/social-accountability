/**
 * DataSourcePicker - Reusable data source selection component
 * Shows available tracking methods with disabled/coming-soon states
 */

import { View, Text, Pressable, StyleSheet } from "react-native";
import type { GoalDataSource } from "../../types";
import { theme } from "../../theme";

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
    gap: theme.space.componentGap,
  },
  dataSourceOption: {
    padding: theme.input.padding,
    borderRadius: theme.radius.medium,
    borderWidth: theme.input.borderWidth,
    borderColor: theme.interactive.border,
    backgroundColor: theme.interactive.background,
  },
  dataSourceOptionSelected: {
    borderColor: theme.interactive.borderSelected,
    backgroundColor: theme.interactive.backgroundSelected,
  },
  dataSourceOptionDisabled: {
    opacity: 0.5,
  },
  dataSourceLabel: {
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.button.fontWeight,
    color: theme.text.secondary,
    marginBottom: theme.space.inlineGap,
  },
  dataSourceLabelSelected: {
    color: theme.text.primary,
  },
  dataSourceLabelDisabled: {
    color: theme.text.tertiary,
  },
  dataSourceDesc: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.text.tertiary,
  },
  dataSourceDescDisabled: {
    color: theme.border.light,
  },
  comingSoon: {
    fontSize: 10,
    color: theme.text.tertiary,
    fontStyle: "italic",
    marginTop: theme.space.inlineGap,
  },
});
