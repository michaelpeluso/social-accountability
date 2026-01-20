/**
 * PrivacySelector - Radio group for selecting privacy level
 * Used in create post/story forms
 */

import { View, Text, StyleSheet, Pressable } from "react-native";
import type { Privacy } from "../../types";
import { useTheme, spacing, borderRadius, typography } from "../../theme";

interface PrivacySelectorProps {
  /** Currently selected privacy level */
  value: Privacy;
  /** Handler for privacy changes */
  onChange: (privacy: Privacy) => void;
  /** Optional label above the selector */
  label?: string;
  /** Exclude SELF option (for posts - posts must be shared) */
  excludeSelf?: boolean;
}

const ALL_PRIVACY_OPTIONS: { value: Privacy; label: string; description: string }[] = [
  { value: "FRIENDS", label: "Friends", description: "Visible to friends only" },
  { value: "PUBLIC", label: "Public", description: "Visible to everyone" },
  { value: "SELF", label: "Only Me", description: "Private, just for you" },
];

export function PrivacySelector({
  value,
  onChange,
  label = "Who can see this?",
  excludeSelf = false,
}: PrivacySelectorProps) {
  const { theme } = useTheme();

  const options = excludeSelf
    ? ALL_PRIVACY_OPTIONS.filter((opt) => opt.value !== "SELF")
    : ALL_PRIVACY_OPTIONS;

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: theme.text.secondary }]}>{label}</Text>}
      <View style={styles.options}>
        {options.map((option) => (
          <Pressable
            key={option.value}
            style={[
              styles.option,
              { backgroundColor: theme.background.secondary },
              value === option.value && {
                backgroundColor: theme.semantic.primary + "20",
                borderColor: theme.semantic.primary,
              },
            ]}
            onPress={() => onChange(option.value)}
          >
            <View style={styles.header}>
              <View
                style={[
                  styles.radio,
                  { borderColor: theme.border.medium },
                  value === option.value && { borderColor: theme.semantic.primary },
                ]}
              >
                {value === option.value && (
                  <View style={[styles.radioDot, { backgroundColor: theme.semantic.primary }]} />
                )}
              </View>
              <Text style={[styles.optionLabel, { color: theme.text.primary }]}>
                {option.label}
              </Text>
            </View>
            <Text style={[styles.description, { color: theme.text.secondary }]}>
              {option.description}
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
  options: {
    gap: spacing.sm,
  },
  option: {
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: "transparent",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  description: {
    fontSize: 13,
    marginLeft: 32,
  },
});
