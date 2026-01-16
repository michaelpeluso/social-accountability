/**
 * CommentInput Component
 * Text input with send button for adding comments
 */

import { useState } from "react";
import { View, TextInput, Pressable, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useTheme } from "../../../theme";
import { spacing, borderRadius } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";

interface CommentInputProps {
  /** Placeholder text */
  placeholder?: string;
  /** Maximum character limit */
  maxLength?: number;
  /** Whether submission is in progress */
  loading?: boolean;
  /** Called when user submits a comment */
  onSubmit: (text: string) => void;
}

const DEFAULT_MAX_LENGTH = 200;

export function CommentInput({
  placeholder = "Add a comment...",
  maxLength = DEFAULT_MAX_LENGTH,
  loading = false,
  onSubmit,
}: CommentInputProps) {
  const { theme } = useTheme();
  const [text, setText] = useState("");

  const trimmedText = text.trim();
  const canSubmit = trimmedText.length > 0 && !loading;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(trimmedText);
    setText("");
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background.secondary }]}>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.background.primary,
            color: theme.text.primary,
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.text.secondary}
        value={text}
        onChangeText={setText}
        maxLength={maxLength}
        multiline
        editable={!loading}
        returnKeyType="send"
        blurOnSubmit
        onSubmitEditing={handleSubmit}
      />

      <Pressable
        style={[
          styles.sendButton,
          {
            backgroundColor: canSubmit ? theme.semantic.primary : theme.background.tertiary,
            opacity: canSubmit ? 1 : 0.5,
          },
        ]}
        onPress={handleSubmit}
        disabled={!canSubmit}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.sendText}>Send</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: spacing.sm,
    gap: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    fontSize: typography.fontSize.md,
  },
  sendButton: {
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  sendText: {
    color: "#fff",
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
});
