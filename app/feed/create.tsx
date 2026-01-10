/**
 * Create Post Screen (M3)
 * Form for creating a new post with text, pillar, and privacy
 */

import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../../src/services/auth";
import { createPost } from "../../src/storage/posts";
import type { Pillar, Privacy } from "../../src/types";

const PILLARS: { value: Pillar; label: string; emoji: string }[] = [
  { value: "MIND", label: "Mind", emoji: "🧠" },
  { value: "BODY", label: "Body", emoji: "💪" },
  { value: "HEART", label: "Heart", emoji: "❤️" },
  { value: "SOUL", label: "Soul", emoji: "✨" },
];

const PRIVACY_OPTIONS: { value: Privacy; label: string; description: string }[] = [
  { value: "FRIENDS", label: "Friends", description: "Visible to friends only" },
  { value: "PUBLIC", label: "Public", description: "Visible to everyone" },
  { value: "SELF", label: "Only Me", description: "Private, just for you" },
];

export default function CreatePostScreen() {
  const [bodyText, setBodyText] = useState("");
  const [pillar, setPillar] = useState<Pillar>("MIND");
  const [privacy, setPrivacy] = useState<Privacy>("FRIENDS");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!bodyText.trim()) {
      Alert.alert("Error", "Please write something to share");
      return;
    }

    if (bodyText.length > 500) {
      Alert.alert("Error", "Post text must be 500 characters or less");
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await auth.getUser();
      if (!user) {
        Alert.alert("Error", "Please sign in to post");
        return;
      }

      const result = await createPost(user.id, {
        bodyText: bodyText.trim(),
        pillar,
        privacy,
      });

      if ("error" in result) {
        Alert.alert("Error", result.error);
        return;
      }

      Alert.alert("Success", "Post created!", [{ text: "OK", onPress: () => router.back() }]);
    } catch (error) {
      console.error("Failed to create post:", error);
      Alert.alert("Error", "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </Pressable>
          <Text style={styles.title}>New Post</Text>
          <Pressable
            onPress={handleSubmit}
            disabled={isSubmitting || !bodyText.trim()}
            style={[
              styles.postButton,
              (!bodyText.trim() || isSubmitting) && styles.postButtonDisabled,
            ]}
          >
            <Text
              style={[
                styles.postButtonText,
                (!bodyText.trim() || isSubmitting) && styles.postButtonTextDisabled,
              ]}
            >
              {isSubmitting ? "Posting..." : "Post"}
            </Text>
          </Pressable>
        </View>

        <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
          {/* Post Text */}
          <View style={styles.inputSection}>
            <TextInput
              style={styles.textInput}
              placeholder="What's on your mind? Share your progress, wins, or struggles..."
              placeholderTextColor="#999"
              multiline
              maxLength={500}
              value={bodyText}
              onChangeText={setBodyText}
              autoFocus
            />
            <Text style={styles.charCount}>{bodyText.length}/500</Text>
          </View>

          {/* Pillar Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Category</Text>
            <View style={styles.pillarsRow}>
              {PILLARS.map((p) => (
                <Pressable
                  key={p.value}
                  style={[styles.pillarChip, pillar === p.value && styles.pillarChipActive]}
                  onPress={() => setPillar(p.value)}
                >
                  <Text style={styles.pillarEmoji}>{p.emoji}</Text>
                  <Text
                    style={[styles.pillarLabel, pillar === p.value && styles.pillarLabelActive]}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Privacy Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Who can see this?</Text>
            <View style={styles.privacyOptions}>
              {PRIVACY_OPTIONS.map((p) => (
                <Pressable
                  key={p.value}
                  style={[styles.privacyOption, privacy === p.value && styles.privacyOptionActive]}
                  onPress={() => setPrivacy(p.value)}
                >
                  <View style={styles.privacyHeader}>
                    <View style={[styles.radio, privacy === p.value && styles.radioActive]}>
                      {privacy === p.value && <View style={styles.radioDot} />}
                    </View>
                    <Text style={styles.privacyLabel}>{p.label}</Text>
                  </View>
                  <Text style={styles.privacyDescription}>{p.description}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  cancelButton: {
    fontSize: 16,
    color: "#666",
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
  },
  postButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  postButtonDisabled: {
    backgroundColor: "#ccc",
  },
  postButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  postButtonTextDisabled: {
    color: "#999",
  },
  scrollView: {
    flex: 1,
  },
  inputSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  textInput: {
    fontSize: 17,
    lineHeight: 24,
    minHeight: 120,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 8,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 12,
  },
  pillarsRow: {
    flexDirection: "row",
    gap: 8,
  },
  pillarChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 12,
    gap: 6,
  },
  pillarChipActive: {
    backgroundColor: "#e3f2fd",
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  pillarEmoji: {
    fontSize: 16,
  },
  pillarLabel: {
    fontSize: 13,
    color: "#666",
  },
  pillarLabelActive: {
    color: "#007AFF",
    fontWeight: "600",
  },
  privacyOptions: {
    gap: 12,
  },
  privacyOption: {
    padding: 12,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  privacyOptionActive: {
    backgroundColor: "#e3f2fd",
    borderColor: "#007AFF",
  },
  privacyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  radioActive: {
    borderColor: "#007AFF",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#007AFF",
  },
  privacyLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  privacyDescription: {
    fontSize: 13,
    color: "#666",
    marginLeft: 32,
  },
});
