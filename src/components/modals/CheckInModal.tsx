/**
 * CheckInModal Component
 * Modal for logging a check-in with optional note
 */

import { View, Text, TextInput, Pressable, Modal, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../theme";
import { spacing, borderRadius } from "../../theme/spacing";
import { typography } from "../../theme/typography";

interface CheckInModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  note: string;
  onNoteChange: (text: string) => void;
  isSubmitting: boolean;
  maxLength?: number;
}

export function CheckInModal({
  visible,
  onClose,
  onSubmit,
  note,
  onNoteChange,
  isSubmitting,
  maxLength = 500,
}: CheckInModalProps) {
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
          <Text style={[styles.title, { color: theme.text.primary }]}>Log Check-in</Text>
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
          <Text style={[styles.label, { color: theme.text.primary }]}>Add a note (optional)</Text>
          <TextInput
            style={[
              styles.noteInput,
              {
                color: theme.text.primary,
                borderColor: theme.border.medium,
                backgroundColor: theme.input.background,
              },
            ]}
            placeholder="How did it go? Any thoughts?"
            placeholderTextColor={theme.text.tertiary}
            value={note}
            onChangeText={onNoteChange}
            multiline
            maxLength={maxLength}
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, { color: theme.text.tertiary }]}>
            {note.length}/{maxLength}
          </Text>
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
    padding: spacing.lg - 4,
  },
  label: {
    fontSize: 15,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xmd,
  },
  noteInput: {
    fontSize: typography.fontSize.base,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    minHeight: 120,
  },
  charCount: {
    textAlign: "right",
    fontSize: typography.fontSize.xs,
    marginTop: spacing.sm,
  },
});
