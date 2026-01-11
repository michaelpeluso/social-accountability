import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { auth } from "../../src/services/auth";
import { api } from "../../src/services/api";
import { logger } from "../../src/lib/logger";
import type { Privacy, User } from "../../src/types/user";
import { useTheme } from "../../src/theme";
import { spacing, borderRadius } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";

const PRIVACY_OPTIONS: { value: Privacy; label: string; description: string }[] = [
  {
    value: "SELF",
    label: "Only Me",
    description: "Only you can see this content",
  },
  {
    value: "FRIENDS",
    label: "Friends",
    description: "Your friends can see this content",
  },
  {
    value: "PUBLIC",
    label: "Public",
    description: "Anyone can see this content",
  },
];

export default function PrivacySettings() {
  const { theme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [selectedPrivacy, setSelectedPrivacy] = useState<Privacy>("SELF");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const currentUser = await auth.getUser();
      if (currentUser) {
        setUser(currentUser);
        setSelectedPrivacy(currentUser.defaultPrivacy);
      }
    } catch (err) {
      logger.error("PrivacySettings: failed to load", { error: err });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (selectedPrivacy === "PUBLIC" && user?.defaultPrivacy !== "PUBLIC") {
      Alert.alert(
        "Make content public?",
        "New goals and habits will be visible to anyone. Existing content won't change.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Confirm", onPress: savePrivacy },
        ]
      );
    } else {
      await savePrivacy();
    }
  }

  async function savePrivacy() {
    setSaving(true);
    try {
      const response = await api.user.updatePrivacy({ defaultPrivacy: selectedPrivacy });

      if ("error" in response) {
        Alert.alert("Error", response.error.message);
        return;
      }

      await auth.updateUser(response.data);
      setUser(response.data);
      logger.info("PrivacySettings: saved", { privacy: selectedPrivacy });
      router.back();
    } catch (err) {
      logger.error("PrivacySettings: failed to save", { error: err });
      Alert.alert("Error", "Failed to save privacy settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background.primary }]}>
        <ActivityIndicator size="large" color={theme.text.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background.secondary }]}>
      <View style={[styles.section, { backgroundColor: theme.card.background }]}>
        <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Default Privacy</Text>
        <Text style={[styles.sectionDescription, { color: theme.text.secondary }]}>
          New goals and habits will use this privacy level by default. You can still change privacy
          for individual items.
        </Text>

        {PRIVACY_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            style={[
              styles.option,
              { backgroundColor: theme.background.secondary },
              selectedPrivacy === option.value && {
                backgroundColor: theme.semantic.primary + "20",
                borderWidth: 1,
                borderColor: theme.semantic.primary,
              },
            ]}
            onPress={() => setSelectedPrivacy(option.value)}
          >
            <View style={styles.optionContent}>
              <Text style={[styles.optionLabel, { color: theme.text.primary }]}>
                {option.label}
              </Text>
              <Text style={[styles.optionDescription, { color: theme.text.secondary }]}>
                {option.description}
              </Text>
            </View>
            <View
              style={[
                styles.radio,
                { borderColor: theme.border.medium },
                selectedPrivacy === option.value && { borderColor: theme.semantic.primary },
              ]}
            >
              {selectedPrivacy === option.value && (
                <View style={[styles.radioInner, { backgroundColor: theme.semantic.primary }]} />
              )}
            </View>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[
          styles.saveButton,
          { backgroundColor: theme.button.primary.background },
          saving && styles.saveButtonDisabled,
        ]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color={theme.button.primary.text} />
        ) : (
          <Text style={[styles.saveButtonText, { color: theme.button.primary.text }]}>
            Save Changes
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    marginTop: 20,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  sectionDescription: {
    fontSize: typography.fontSize.sm,
    marginBottom: 20,
    lineHeight: 20,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  optionDescription: {
    fontSize: typography.fontSize.sm,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: spacing.xs + 2,
  },
  saveButton: {
    margin: 20,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});
