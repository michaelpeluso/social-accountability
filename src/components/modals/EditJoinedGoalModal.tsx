/**
 * EditJoinedGoalModal - Edit settings for a goal user has joined (not owned)
 *
 * For joined goals, users can only change their performancePrivacy setting.
 * Goal details are read-only (managed by owner).
 */

import { View, Text, Modal, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { useTheme, spacing, borderRadius, typography } from "../../theme";
import type { Privacy } from "../../types";

const PERFORMANCE_PRIVACY_OPTIONS: Privacy[] = ["SELF", "FRIENDS", "PUBLIC"];

const PRIVACY_LABELS: Record<Privacy, string> = {
  SELF: "Only Me",
  CLOSE_FRIENDS: "Close Friends",
  FRIENDS: "Friends",
  PUBLIC: "Public",
};

const PRIVACY_DESCRIPTIONS: Record<Privacy, string> = {
  SELF: "Only you can see your progress on this goal",
  CLOSE_FRIENDS: "Your close friends can see your progress",
  FRIENDS: "All your friends can see your progress",
  PUBLIC: "Anyone can see your progress on this goal",
};

interface EditJoinedGoalModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  goalTitle: string;
  ownerName: string;
  performancePrivacy: Privacy;
  onPerformancePrivacyChange: (privacy: Privacy) => void;
}

export function EditJoinedGoalModal({
  visible,
  onClose,
  onSubmit,
  isSubmitting,
  goalTitle,
  ownerName,
  performancePrivacy,
  onPerformancePrivacyChange,
}: EditJoinedGoalModalProps) {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.background.secondary }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border.medium }]}>
          <Pressable onPress={onClose} style={styles.headerButton}>
            <Text style={[styles.headerButtonText, { color: theme.semantic.danger }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Goal Settings</Text>
          <Pressable onPress={onSubmit} disabled={isSubmitting} style={styles.headerButton}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color={theme.semantic.primary} />
            ) : (
              <Text style={[styles.headerButtonText, { color: theme.semantic.primary }]}>Save</Text>
            )}
          </Pressable>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Goal Info (read-only) */}
          <View style={[styles.goalInfo, { backgroundColor: theme.background.tertiary }]}>
            <Text style={[styles.goalTitle, { color: theme.text.primary }]} numberOfLines={2}>
              {goalTitle}
            </Text>
            <Text style={[styles.ownerLabel, { color: theme.text.tertiary }]}>
              Owned by {ownerName}
            </Text>
          </View>

          {/* Performance Privacy Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
              Your Progress Visibility
            </Text>
            <Text style={[styles.sectionDescription, { color: theme.text.tertiary }]}>
              Choose who can see your progress on this goal
            </Text>

            <View style={styles.optionsContainer}>
              {PERFORMANCE_PRIVACY_OPTIONS.map((option) => {
                const isSelected = performancePrivacy === option;
                return (
                  <Pressable
                    key={option}
                    style={[
                      styles.optionRow,
                      { borderColor: theme.border.medium },
                      isSelected && {
                        borderColor: theme.semantic.primary,
                        backgroundColor: theme.background.tertiary,
                      },
                    ]}
                    onPress={() => onPerformancePrivacyChange(option)}
                  >
                    <View style={styles.optionContent}>
                      <Text style={[styles.optionLabel, { color: theme.text.primary }]}>
                        {PRIVACY_LABELS[option]}
                      </Text>
                      <Text style={[styles.optionDescription, { color: theme.text.tertiary }]}>
                        {PRIVACY_DESCRIPTIONS[option]}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.radio,
                        { borderColor: isSelected ? theme.semantic.primary : theme.border.dark },
                        isSelected && { backgroundColor: theme.semantic.primary },
                      ]}
                    >
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </View>
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
  headerButton: {
    minWidth: 60,
  },
  headerButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  goalInfo: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  goalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  ownerLabel: {
    fontSize: typography.fontSize.sm,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  optionsContainer: {
    gap: spacing.sm,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  optionContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  optionLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: "500",
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: typography.fontSize.sm,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
  },
});
