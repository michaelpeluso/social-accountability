/**
 * SearchBar Component
 * Text input with search button and optional loading state
 */

import { View, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme";
import { spacing, borderRadius } from "../../theme/spacing";
import { typography } from "../../theme/typography";

interface SearchBarProps {
  /** Current search value */
  value: string;
  /** Called when text changes */
  onChangeText: (text: string) => void;
  /** Called when search is submitted */
  onSubmit?: () => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether search is in progress */
  loading?: boolean;
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** Minimum characters before allowing submit */
  minLength?: number;
}

export function SearchBar({
  value,
  onChangeText,
  onSubmit,
  placeholder = "Search...",
  loading = false,
  autoFocus = false,
  minLength = 1,
}: SearchBarProps) {
  const { theme } = useTheme();

  const canSubmit = value.trim().length >= minLength && !loading;

  const handleSubmit = () => {
    if (canSubmit && onSubmit) {
      onSubmit();
    }
  };

  const handleClear = () => {
    onChangeText("");
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background.secondary }]}>
      <Ionicons name="search" size={20} color={theme.text.secondary} style={styles.searchIcon} />

      <TextInput
        style={[
          styles.input,
          {
            color: theme.text.primary,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.text.secondary}
        autoFocus={autoFocus}
        returnKeyType="search"
        onSubmitEditing={handleSubmit}
        editable={!loading}
      />

      {loading ? (
        <ActivityIndicator size="small" color={theme.semantic.primary} style={styles.endIcon} />
      ) : value.length > 0 ? (
        <Pressable onPress={handleClear} style={styles.endIcon}>
          <Ionicons name="close-circle" size={20} color={theme.text.secondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.sm,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: typography.fontSize.md,
  },
  endIcon: {
    marginLeft: spacing.xs,
    padding: spacing.xxs,
  },
});
