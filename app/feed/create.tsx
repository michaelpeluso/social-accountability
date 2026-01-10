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
import { useTheme } from "../../src/theme";

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
  const { theme } = useTheme();
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border.light }]}>
          <Pressable onPress={() => router.back()}>
            <Text style={[styles.cancelButton, { color: theme.text.secondary }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.title, { color: theme.text.primary }]}>New Post</Text>
          <Pressable
            onPress={handleSubmit}
            disabled={isSubmitting || !bodyText.trim()}
            style={[
              styles.postButton,
              { backgroundColor: theme.button.primary.background },
              (!bodyText.trim() || isSubmitting) && styles.postButtonDisabled,
            ]}
          >
            <Text
              style={[
                styles.postButtonText,
                { color: theme.button.primary.text },
                (!bodyText.trim() || isSubmitting) && { color: theme.text.tertiary },
              ]}
            >
              {isSubmitting ? "Posting..." : "Post"}
            </Text>
          </Pressable>
        </View>

        <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
          {/* Post Text */}
          <View style={[styles.inputSection, { borderBottomColor: theme.border.light }]}>
            <TextInput
              style={[styles.textInput, { color: theme.text.primary }]}
              placeholder="What's on your mind? Share your progress, wins, or struggles..."
              placeholderTextColor={theme.text.tertiary}
              multiline
              maxLength={500}
              value={bodyText}
              onChangeText={setBodyText}
              autoFocus
            />
            <Text style={[styles.charCount, { color: theme.text.tertiary }]}>
              {bodyText.length}/500
            </Text>
          </View>

          {/* Pillar Selection */}
          <View style={[styles.section, { borderBottomColor: theme.border.light }]}>
            <Text style={[styles.sectionLabel, { color: theme.text.secondary }]}>Category</Text>
            <View style={styles.pillarsRow}>
              {PILLARS.map((p) => (
                <Pressable
                  key={p.value}
                  style={[
                    styles.pillarChip,
                    { backgroundColor: theme.background.secondary },
                    pillar === p.value && {
                      backgroundColor: theme.semantic.primary + "20",
                      borderWidth: 2,
                      borderColor: theme.semantic.primary,
                    },
                  ]}
                  onPress={() => setPillar(p.value)}
                >
                  <Text style={styles.pillarEmoji}>{p.emoji}</Text>
                  <Text
                    style={[
                      styles.pillarLabel,
                      { color: theme.text.secondary },
                      pillar === p.value && { color: theme.semantic.primary, fontWeight: "600" },
                    ]}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Privacy Selection */}
          <View style={[styles.section, { borderBottomColor: theme.border.light }]}>
            <Text style={[styles.sectionLabel, { color: theme.text.secondary }]}>
              Who can see this?
            </Text>
            <View style={styles.privacyOptions}>
              {PRIVACY_OPTIONS.map((p) => (
                <Pressable
                  key={p.value}
                  style={[
                    styles.privacyOption,
                    { backgroundColor: theme.background.secondary },
                    privacy === p.value && {
                      backgroundColor: theme.semantic.primary + "20",
                      borderColor: theme.semantic.primary,
                    },
                  ]}
                  onPress={() => setPrivacy(p.value)}
                >
                  <View style={styles.privacyHeader}>
                    <View
                      style={[
                        styles.radio,
                        { borderColor: theme.border.medium },
                        privacy === p.value && { borderColor: theme.semantic.primary },
                      ]}
                    >
                      {privacy === p.value && (
                        <View
                          style={[styles.radioDot, { backgroundColor: theme.semantic.primary }]}
                        />
                      )}
                    </View>
                    <Text style={[styles.privacyLabel, { color: theme.text.primary }]}>
                      {p.label}
                    </Text>
                  </View>
                  <Text style={[styles.privacyDescription, { color: theme.text.secondary }]}>
                    {p.description}
                  </Text>
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
  },
  cancelButton: {
    fontSize: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
  },
  postButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  inputSection: {
    padding: 16,
    borderBottomWidth: 1,
  },
  textInput: {
    fontSize: 17,
    lineHeight: 24,
    minHeight: 120,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 12,
    textAlign: "right",
    marginTop: 8,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
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
    padding: 12,
    borderRadius: 12,
    gap: 6,
  },
  pillarEmoji: {
    fontSize: 16,
  },
  pillarLabel: {
    fontSize: 13,
  },
  privacyOptions: {
    gap: 12,
  },
  privacyOption: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
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
    justifyContent: "center",
    alignItems: "center",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  privacyLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  privacyDescription: {
    fontSize: 13,
    marginLeft: 32,
  },
});
