/**
 * NudgePicker Component
 * Modal for selecting and sending a nudge to a friend
 */

import { useState } from "react";
import { View, Text, StyleSheet, Pressable, Modal, Alert } from "react-native";
import { NUDGE_TEMPLATES, type NudgeTemplateId } from "../../types";
import { sendNudge, getNudgeRateLimitStatus } from "../../storage/nudges";
import { spacing, borderRadius } from "../../theme/spacing";
import { typography } from "../../theme/typography";

type NudgePickerProps = {
  visible: boolean;
  onClose: () => void;
  fromUserId: string;
  toUserId: string;
  toUserName: string;
  onNudgeSent?: () => void;
};

const TEMPLATE_IDS = Object.keys(NUDGE_TEMPLATES) as NudgeTemplateId[];

export function NudgePicker({
  visible,
  onClose,
  fromUserId,
  toUserId,
  toUserName,
  onNudgeSent,
}: NudgePickerProps) {
  const [isSending, setIsSending] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    pairRemaining: number;
    totalRemaining: number;
  } | null>(null);

  // Load rate limit status when modal opens
  useState(() => {
    if (visible) {
      getNudgeRateLimitStatus(fromUserId, toUserId).then(setRateLimitInfo);
    }
  });

  const handleSendNudge = async (templateId: NudgeTemplateId) => {
    if (isSending) return;

    setIsSending(true);
    try {
      const result = await sendNudge(fromUserId, { toUserId, templateId });

      if ("error" in result) {
        Alert.alert("Cannot Send", result.error);
        return;
      }

      Alert.alert(
        "Nudge Sent!",
        `You sent "${NUDGE_TEMPLATES[templateId].text}" to ${toUserName}`,
        [{ text: "OK", onPress: onClose }]
      );

      onNudgeSent?.();
    } catch (error) {
      console.error("Failed to send nudge:", error);
      Alert.alert("Error", "Failed to send nudge");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Send Encouragement</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          <Text style={styles.subtitle}>Send a nudge to {toUserName}</Text>

          {/* Rate Limit Info */}
          {rateLimitInfo && (
            <View style={styles.rateLimitInfo}>
              <Text style={styles.rateLimitText}>
                {rateLimitInfo.pairRemaining} nudges left today for {toUserName}
              </Text>
            </View>
          )}

          {/* Template Options */}
          <View style={styles.templates}>
            {TEMPLATE_IDS.map((id) => {
              const template = NUDGE_TEMPLATES[id];
              return (
                <Pressable
                  key={id}
                  style={styles.templateOption}
                  onPress={() => handleSendNudge(id)}
                  disabled={isSending}
                >
                  <Text style={styles.templateEmoji}>{template.emoji}</Text>
                  <Text style={styles.templateText}>{template.text}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Cancel Button */}
          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: borderRadius.xxl,
    paddingBottom: spacing.xxl - 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  closeButton: {
    padding: spacing.sm,
  },
  closeButtonText: {
    fontSize: typography.fontSize.lg,
    color: "#666",
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: "#666",
    marginBottom: spacing.md,
  },
  rateLimitInfo: {
    backgroundColor: "#f5f5f5",
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  rateLimitText: {
    fontSize: typography.fontSize.xs,
    color: "#666",
    textAlign: "center",
  },
  templates: {
    gap: spacing.xmd + 2,
    marginBottom: borderRadius.xxl,
  },
  templateOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: "#f8f8f8",
    borderRadius: borderRadius.lg,
    gap: spacing.xmd + 2,
  },
  templateEmoji: {
    fontSize: typography.fontSize.xxl,
  },
  templateText: {
    fontSize: typography.fontSize.base,
    flex: 1,
  },
  cancelButton: {
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: "#f0f0f0",
    borderRadius: borderRadius.lg,
  },
  cancelButtonText: {
    fontSize: typography.fontSize.base,
    color: "#666",
  },
});
