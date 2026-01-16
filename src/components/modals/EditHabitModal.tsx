/**
 * EditHabitModal Component
 * Modal for editing habit title, frequency, target, and privacy
 */

import { View, Text, TextInput, Pressable, Modal, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../theme";
import { spacing, borderRadius } from "../../theme/spacing";
import { typography } from "../../theme/typography";
import { PRIVACY_INFO } from "../../types/goals";
import type { Privacy, HabitFrequency } from "../../types";

const PRIVACY_OPTIONS: Privacy[] = ["SELF", "FRIENDS", "PUBLIC"];
const FREQUENCY_OPTIONS: HabitFrequency[] = ["daily", "weekly"];

interface EditHabitModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  title: string;
  onTitleChange: (text: string) => void;
  frequency: HabitFrequency;
  onFrequencyChange: (freq: HabitFrequency) => void;
  targetCount: string;
  onTargetCountChange: (count: string) => void;
  privacy: Privacy;
  onPrivacyChange: (privacy: Privacy) => void;
}

export function EditHabitModal({
  visible,
  onClose,
  onSubmit,
  isSubmitting,
  title,
  onTitleChange,
  frequency,
  onFrequencyChange,
  targetCount,
  onTargetCountChange,
  privacy,
  onPrivacyChange,
}: EditHabitModalProps) {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
        <View style={[styles.header, { borderBottomColor: theme.border.light }]}>
          <Pressable onPress={onClose}>
            <Text style={[styles.cancelButton, { color: theme.text.secondary }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.title, { color: theme.text.primary }]}>Edit Habit</Text>
          <Pressable onPress={onSubmit} disabled={isSubmitting}>
            <Text
              style={[
                styles.saveButton,
                { color: theme.semantic.primary },
                isSubmitting && styles.disabled,
              ]}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Text>
          </Pressable>
        </View>

        <ScrollView style={styles.content}>
          {/* Title */}
          <Text style={[styles.label, { color: theme.text.primary }]}>Title</Text>
          <TextInput
            style={[
              styles.textInput,
              {
                color: theme.text.primary,
                borderColor: theme.border.medium,
                backgroundColor: theme.input.background,
              },
            ]}
            value={title}
            onChangeText={onTitleChange}
            placeholder="Enter habit title"
            placeholderTextColor={theme.text.tertiary}
            maxLength={100}
          />

          {/* Frequency */}
          <Text style={[styles.label, { color: theme.text.primary }]}>Frequency</Text>
          <View style={styles.optionsRow}>
            {FREQUENCY_OPTIONS.map((freq) => (
              <Pressable
                key={freq}
                style={[
                  styles.option,
                  { borderColor: theme.border.medium, backgroundColor: theme.input.background },
                  frequency === freq && {
                    borderColor: theme.semantic.primary,
                    backgroundColor: theme.semantic.primary + "15",
                  },
                ]}
                onPress={() => onFrequencyChange(freq)}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: theme.text.secondary },
                    frequency === freq && { color: theme.semantic.primary },
                  ]}
                >
                  {freq.charAt(0).toUpperCase() + freq.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Target Count */}
          <Text style={[styles.label, { color: theme.text.primary }]}>
            Target (times per {frequency === "daily" ? "day" : "week"})
          </Text>
          <TextInput
            style={[
              styles.textInput,
              {
                color: theme.text.primary,
                borderColor: theme.border.medium,
                backgroundColor: theme.input.background,
              },
            ]}
            value={targetCount}
            onChangeText={onTargetCountChange}
            keyboardType="number-pad"
            placeholder="1"
            placeholderTextColor={theme.text.tertiary}
          />

          {/* Privacy */}
          <Text style={[styles.label, { color: theme.text.primary }]}>Privacy</Text>
          <View style={styles.optionsRow}>
            {PRIVACY_OPTIONS.map((p) => (
              <Pressable
                key={p}
                style={[
                  styles.option,
                  { borderColor: theme.border.medium, backgroundColor: theme.input.background },
                  privacy === p && {
                    borderColor: theme.semantic.primary,
                    backgroundColor: theme.semantic.primary + "15",
                  },
                ]}
                onPress={() => onPrivacyChange(p)}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: theme.text.secondary },
                    privacy === p && { color: theme.semantic.primary },
                  ]}
                >
                  {PRIVACY_INFO[p].label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.privacyDescription, { color: theme.text.tertiary }]}>
            {PRIVACY_INFO[privacy].description}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  cancelButton: {
    fontSize: typography.fontSize.base,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  saveButton: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    padding: spacing.lg - 4,
  },
  label: {
    fontSize: 15,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xmd,
  },
  textInput: {
    fontSize: typography.fontSize.base,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg - 4,
  },
  optionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg - 4,
  },
  option: {
    flex: 1,
    paddingVertical: spacing.smd,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: "center",
  },
  optionText: {
    fontSize: typography.fontSize.base,
  },
  privacyDescription: {
    fontSize: 13,
    marginBottom: spacing.lg - 4,
  },
});
