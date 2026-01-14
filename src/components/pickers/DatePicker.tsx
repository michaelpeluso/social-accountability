import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, Modal, Pressable } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { openPicker, closePicker } from "./pickerManager";
import { colors, spacing, borderRadius, borderWidth, typography } from "../../theme";

interface DatePickerProps {
  label: string;
  value: Date | undefined;
  onChange: (date: Date) => void;
  error?: string;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
}

/**
 * DatePicker - Reusable date selection component with native iOS/Android pickers
 *
 * Follows Input System Specification:
 * - Mode: draft (requires explicit Cancel/Done)
 * - Presentation: always via modal (centered)
 * - Backdrop tap: cancel (no commit)
 * - Single active input enforced via pickerManager
 *
 * @param label - Label text displayed above the date input
 * @param value - Currently selected date (undefined shows placeholder)
 * @param onChange - Callback when date is selected
 * @param error - Optional error message displayed below input
 * @param placeholder - Placeholder text when no date selected
 * @param minimumDate - Optional minimum selectable date
 * @param maximumDate - Optional maximum selectable date
 */
export function DatePicker({
  label,
  value,
  onChange,
  error,
  placeholder = "Select date",
  minimumDate,
  maximumDate,
}: DatePickerProps) {
  const [pickerVisible, setPickerVisible] = useState(false);
  // Draft value for explicit commit model
  const [draftDate, setDraftDate] = useState<Date>(value || new Date());

  const getDisplayMode = (): "spinner" | "inline" | "default" => {
    if (Platform.OS === "android") {
      return "default";
    }
    const iosVersion = parseInt(Platform.Version as string, 10);
    return iosVersion >= 14 ? "inline" : "spinner";
  };

  const openModal = () => {
    // Sync draft with current value when opening
    setDraftDate(value || new Date());
    openPicker(() => {
      setPickerVisible(false);
    });
    setPickerVisible(true);
  };

  const handleCancel = () => {
    setPickerVisible(false);
    closePicker();
  };

  const handleDone = () => {
    onChange(draftDate);
    setPickerVisible(false);
    closePicker();
  };

  const handleDateChange = (_event: unknown, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      // Android picker auto-dismisses on selection
      if (selectedDate) {
        onChange(selectedDate);
      }
      setPickerVisible(false);
      closePicker();
      return;
    }
    // iOS: update draft value (commit on Done)
    if (selectedDate) {
      setDraftDate(selectedDate);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.dateInput, error && styles.dateInputError]}
        onPress={openModal}
        accessibilityLabel={`${label} date picker`}
        accessibilityHint="Opens date selection calendar"
      >
        <Text style={[styles.dateInputText, !value && styles.placeholderText]}>
          {value ? formatDate(value) : placeholder}
        </Text>
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* iOS: Always render in centered modal */}
      {Platform.OS === "ios" && pickerVisible && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={pickerVisible}
          onRequestClose={handleCancel}
        >
          <Pressable style={styles.modalOverlay} onPress={handleCancel}>
            <Pressable style={styles.pickerModal} onPress={(e) => e.stopPropagation()}>
              {/* Header with Cancel / Done */}
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>{label}</Text>
                <TouchableOpacity onPress={handleDone} style={styles.headerButton}>
                  <Text style={styles.doneText}>Done</Text>
                </TouchableOpacity>
              </View>
              {/* Picker */}
              <DateTimePicker
                value={draftDate}
                mode="date"
                display={getDisplayMode()}
                onChange={handleDateChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                themeVariant="light"
                textColor="#000000"
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* Android: Native picker modal (auto-dismiss on selection) */}
      {Platform.OS === "android" && pickerVisible && (
        <DateTimePicker
          value={draftDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: typography.fontSize.xs,
    color: colors.darkGray,
    marginBottom: spacing.xs,
    fontWeight: typography.fontWeight.medium,
  },
  dateInput: {
    borderWidth: borderWidth.thick,
    borderColor: colors.borderMedium,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg - spacing.sm, // 12px
    paddingHorizontal: spacing.lg - spacing.sm,
    backgroundColor: colors.white,
    minHeight: 44,
    justifyContent: "center",
  },
  dateInputError: {
    borderColor: colors.danger,
  },
  dateInputText: {
    fontSize: typography.fontSize.base,
    color: colors.black,
    fontWeight: typography.fontWeight.normal,
  },
  placeholderText: {
    color: colors.mediumGray,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerModal: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xlg,
    width: "90%",
    maxWidth: 360,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg - spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray[300],
    backgroundColor: colors.gray[50],
  },
  headerButton: {
    minWidth: 60,
  },
  modalTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.black,
  },
  cancelText: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
  },
  doneText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    textAlign: "right",
  },
});
