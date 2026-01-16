/**
 * PostTypeTagSelector - Toggle chips for post type tags
 * Used in create post forms
 */

import { View, Text, StyleSheet, Pressable } from "react-native";
import type { PostTypeTag } from "../../types";
import { useTheme, spacing, borderRadius, typography } from "../../theme";

interface PostTypeTagSelectorProps {
  /** Currently selected tags */
  value: PostTypeTag[];
  /** Handler for tag changes */
  onChange: (tags: PostTypeTag[]) => void;
  /** Optional label above the chips */
  label?: string;
}

const POST_TYPE_TAGS: { value: PostTypeTag; label: string; emoji: string }[] = [
  { value: "win", label: "Win", emoji: "🏆" },
  { value: "struggle", label: "Struggle", emoji: "💭" },
  { value: "question", label: "Question", emoji: "❓" },
  { value: "reflection", label: "Reflection", emoji: "🪞" },
];

export function PostTypeTagSelector({
  value,
  onChange,
  label = "Suggested Tags (optional)",
}: PostTypeTagSelectorProps) {
  const { theme } = useTheme();

  const toggleTag = (tag: PostTypeTag) => {
    const newTags = value.includes(tag) ? value.filter((t) => t !== tag) : [...value, tag];
    onChange(newTags);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: theme.text.secondary }]}>{label}</Text>}
      <View style={styles.tags}>
        {POST_TYPE_TAGS.map((tag) => (
          <Pressable
            key={tag.value}
            style={[
              styles.tag,
              { backgroundColor: theme.background.secondary },
              value.includes(tag.value) && {
                backgroundColor: theme.semantic.primary + "20",
                borderWidth: 2,
                borderColor: theme.semantic.primary,
              },
            ]}
            onPress={() => toggleTag(tag.value)}
          >
            <Text style={styles.emoji}>{tag.emoji}</Text>
            <Text
              style={[
                styles.tagLabel,
                { color: theme.text.secondary },
                value.includes(tag.value) && { color: theme.semantic.primary },
              ]}
            >
              {tag.label}
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
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  emoji: {
    fontSize: typography.fontSize.sm,
  },
  tagLabel: {
    fontSize: typography.fontSize.sm,
  },
});
