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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Default Privacy</Text>
        <Text style={styles.sectionDescription}>
          New goals and habits will use this privacy level by default. You can still change privacy
          for individual items.
        </Text>

        {PRIVACY_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            style={[styles.option, selectedPrivacy === option.value && styles.optionSelected]}
            onPress={() => setSelectedPrivacy(option.value)}
          >
            <View style={styles.optionContent}>
              <Text style={styles.optionLabel}>{option.label}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </View>
            <View style={[styles.radio, selectedPrivacy === option.value && styles.radioSelected]}>
              {selectedPrivacy === option.value && <View style={styles.radioInner} />}
            </View>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Changes</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    backgroundColor: "#fff",
    marginTop: 20,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    lineHeight: 20,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    marginBottom: 12,
  },
  optionSelected: {
    backgroundColor: "#e8f4ff",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: "#666",
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  radioSelected: {
    borderColor: "#007AFF",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#007AFF",
  },
  saveButton: {
    backgroundColor: "#000",
    margin: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#666",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
