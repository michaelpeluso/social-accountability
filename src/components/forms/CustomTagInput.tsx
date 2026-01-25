/**
 * CustomTagInput - Input for adding custom hashtags
 * Used in create post forms
 */

import { View, Text, StyleSheet, TextInput, Pressable } from "react-native";
import { useState } from "react";
import { useTheme, spacing, borderRadius, typography } from "../../theme";

interface CustomTagInputProps {
  /** Current list of custom tags */
  value: string[];
  /** Handler for tag list changes */
  onChange: (tags: string[]) => void;
  /** Maximum number of tags allowed */
  maxTags?: number;
  /** Optional label above the input */
  label?: string;
}

export function CustomTagInput({
  value,
  onChange,
  maxTags = 5,
  label = "Custom Tags (must start with #)",
}: CustomTagInputProps) {
  const { theme } = useTheme();
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const addTag = () => {
    const input = inputValue.trim();

    if (!input.startsWith("#")) {
      setError("Tags must start with #");
      return;
    }

    const tag = input.slice(1).trim();

    if (!tag) {
      setError("Enter a tag after #");
      return;
    }

    if (value.includes(tag)) {
      setError("Tag already added");
      return;
    }

    if (value.length >= maxTags) {
      setError(`Maximum ${maxTags} tags allowed`);
      return;
    }

    onChange([...value, tag]);
    setInputValue("");
    setError(null);
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: theme.text.secondary }]}>
          {label} (max {maxTags})
        </Text>
      )}
      <View style={styles.tagsRow}>
        {value.map((tag) => (
          <Pressable
            key={tag}
            style={[styles.tagChip, { backgroundColor: theme.semantic.primary + "20" }]}
            onPress={() => removeTag(tag)}
          >
            <Text style={[styles.tagText, { color: theme.semantic.primary }]}>#{tag} ×</Text>
          </Pressable>
        ))}
      </View>
      {value.length < maxTags && (
        <View style={styles.inputRow}>
          <TextInput
            style={[
              styles.input,
              {
                color: theme.text.primary,
                borderColor: error ? theme.semantic.danger : theme.border.medium,
              },
            ]}
            placeholder="#your-tag"
            placeholderTextColor={theme.text.tertiary}
            value={inputValue}
            onChangeText={(text) => {
              setInputValue(text);
              setError(null);
            }}
            onSubmitEditing={addTag}
            maxLength={25}
          />
          <Pressable
            style={[styles.addButton, { backgroundColor: theme.semantic.primary }]}
            onPress={addTag}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>
      )}
      {error && <Text style={[styles.errorText, { color: theme.semantic.danger }]}>{error}</Text>}
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
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  tagChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  tagText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  inputRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: typography.fontSize.sm,
  },
  addButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    justifyContent: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },
});
