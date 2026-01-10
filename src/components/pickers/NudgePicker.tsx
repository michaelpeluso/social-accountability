/**
 * NudgePicker Component
 * Modal for selecting and sending a nudge to a friend
 */

import { useState } from "react";
import { View, Text, StyleSheet, Pressable, Modal, Alert } from "react-native";
import { NUDGE_TEMPLATES, type NudgeTemplateId } from "../../types";
import { sendNudge, getNudgeRateLimitStatus } from "../../storage/nudges";

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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: "#666",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  rateLimitInfo: {
    backgroundColor: "#f5f5f5",
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  rateLimitText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  templates: {
    gap: 12,
    marginBottom: 20,
  },
  templateOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    gap: 12,
  },
  templateEmoji: {
    fontSize: 24,
  },
  templateText: {
    fontSize: 16,
    flex: 1,
  },
  cancelButton: {
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#666",
  },
});
