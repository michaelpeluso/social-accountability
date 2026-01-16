/**
 * FormField - Text input with label, validation, and character counter
 * Used in profile setup and other forms
 */

import { View, Text, StyleSheet, TextInput, TextInputProps } from "react-native";
import { useTheme, spacing, borderRadius, typography } from "../../theme";

interface FormFieldProps extends Omit<TextInputProps, "style"> {
  /** Field label */
  label: string;
  /** Whether the field is required */
  required?: boolean;
  /** Current value */
  value: string;
  /** Handler for value changes */
  onChangeText: (text: string) => void;
  /** Maximum character length */
  maxLength?: number;
  /** Error message to display */
  error?: string | null;
  /** Whether the field has been touched (for showing errors) */
  touched?: boolean;
  /** Whether the field is multiline */
  multiline?: boolean;
  /** Height for multiline fields */
  height?: number;
  /** Threshold for "near limit" warning */
  warnThreshold?: number;
}

export function FormField({
  label,
  required = false,
  value,
  onChangeText,
  maxLength,
  error,
  touched = false,
  multiline = false,
  height = 100,
  warnThreshold = 10,
  ...textInputProps
}: FormFieldProps) {
  const { theme } = useTheme();

  const showError = touched && error;
  const nearLimit = maxLength
    ? maxLength - value.length <= warnThreshold && value.length <= maxLength
    : false;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.text.primary }]}>
        {label}
        {required && " *"}
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            borderColor: theme.input.border,
            backgroundColor: theme.input.background,
            color: theme.text.primary,
          },
          multiline && { height, textAlignVertical: "top" },
          showError && styles.inputError,
        ]}
        value={value}
        onChangeText={onChangeText}
        maxLength={maxLength}
        multiline={multiline}
        placeholderTextColor={theme.text.tertiary}
        {...textInputProps}
      />
      <View style={styles.footer}>
        {showError ? (
          <Text style={[styles.error, { color: theme.semantic.danger }]}>{error}</Text>
        ) : (
          <View />
        )}
        {maxLength && (
          <Text
            style={[
              styles.counter,
              { color: theme.text.tertiary },
              nearLimit && { color: theme.semantic.warning },
            ]}
          >
            {value.length}/{maxLength}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: typography.fontSize.base,
  },
  inputError: {
    borderColor: "#ff3b30",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  error: {
    fontSize: typography.fontSize.xs,
    flex: 1,
    marginRight: spacing.sm,
  },
  counter: {
    fontSize: typography.fontSize.xs,
    textAlign: "right",
  },
});
