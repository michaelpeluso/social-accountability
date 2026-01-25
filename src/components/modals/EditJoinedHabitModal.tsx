/**
 * EditJoinedHabitModal Component
 * Simplified modal for users who joined someone else's habit
 * Only allows changing performance privacy (who sees your progress)
 */

import { View, Text, Pressable, Modal, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../theme";
import { spacing, borderRadius } from "../../theme/spacing";
import { typography } from "../../theme/typography";
import type { Privacy } from "../../types";

const PRIVACY_OPTIONS: Privacy[] = ["SELF", "FRIENDS", "PUBLIC"];

const PRIVACY_INFO: Record<Privacy, { label: string; description: string }> = {
  SELF: { label: "Only Me", description: "Only you can see your progress on this habit" },
  CLOSE_FRIENDS: { label: "Close Friends", description: "Close friends can see your progress" },
  FRIENDS: { label: "Friends", description: "Friends can see your streaks and check-ins" },
  PUBLIC: { label: "Public", description: "Anyone can see your progress" },
};

interface EditJoinedHabitModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  habitTitle: string;
  ownerName: string;
  performancePrivacy: Privacy;
  onPerformancePrivacyChange: (privacy: Privacy) => void;
}

export function EditJoinedHabitModal({
  visible,
  onClose,
  onSubmit,
  isSubmitting,
  habitTitle,
  ownerName,
  performancePrivacy,
  onPerformancePrivacyChange,
}: EditJoinedHabitModalProps) {
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
          <Text style={[styles.title, { color: theme.text.primary }]}>Settings</Text>
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

        <View style={styles.content}>
          {/* Habit Info */}
          <View style={[styles.infoCard, { backgroundColor: theme.card.background }]}>
            <Text style={[styles.habitTitle, { color: theme.text.primary }]}>{habitTitle}</Text>
            <Text style={[styles.ownerText, { color: theme.text.secondary }]}>
              Created by {ownerName}
            </Text>
          </View>

          {/* Privacy Setting */}
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
            Your Progress Visibility
          </Text>
          <Text style={[styles.sectionHint, { color: theme.text.secondary }]}>
            Who can see your streaks and check-ins for this habit
          </Text>

          <View style={styles.optionsContainer}>
            {PRIVACY_OPTIONS.map((p) => (
              <Pressable
                key={p}
                style={[
                  styles.option,
                  { borderColor: theme.border.medium, backgroundColor: theme.input.background },
                  performancePrivacy === p && {
                    borderColor: theme.semantic.primary,
                    backgroundColor: theme.semantic.primary + "15",
                  },
                ]}
                onPress={() => onPerformancePrivacyChange(p)}
              >
                <View style={styles.optionContent}>
                  <View
                    style={[
                      styles.radio,
                      { borderColor: theme.border.medium },
                      performancePrivacy === p && { borderColor: theme.semantic.primary },
                    ]}
                  >
                    {performancePrivacy === p && (
                      <View
                        style={[styles.radioDot, { backgroundColor: theme.semantic.primary }]}
                      />
                    )}
                  </View>
                  <View style={styles.optionText}>
                    <Text
                      style={[
                        styles.optionLabel,
                        { color: theme.text.primary },
                        performancePrivacy === p && { color: theme.semantic.primary },
                      ]}
                    >
                      {PRIVACY_INFO[p].label}
                    </Text>
                    <Text style={[styles.optionDescription, { color: theme.text.secondary }]}>
                      {PRIVACY_INFO[p].description}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
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
    padding: spacing.lg,
  },
  infoCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  habitTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  ownerText: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  sectionHint: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  optionsContainer: {
    gap: spacing.sm,
  },
  option: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: spacing.sm,
    marginTop: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  optionDescription: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
});
