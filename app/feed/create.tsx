/**
 * Create Post Screen (M3)
 * Form for creating a new post with text, pillar, and privacy
 * Includes Advanced options: post type tags, linked object, context
 */

import { useState, useEffect } from "react";
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
import { getHabits } from "../../src/storage/habits";
import { getGoals } from "../../src/storage/goals";
import type { Pillar, Privacy, PostTypeTag, LinkedObjectType, Habit, Goal } from "../../src/types";
import { useTheme, spacing, borderRadius, typography } from "../../src/theme";
import {
  ScreenHeader,
  PrivacySelector,
  PillarChips,
  PostTypeTagSelector,
  CustomTagInput,
  ObjectPicker,
} from "../../src/components";

type LinkedObject = {
  id: string;
  title: string;
  type: LinkedObjectType;
};

export default function CreatePostScreen() {
  const { theme } = useTheme();
  const [bodyText, setBodyText] = useState("");
  const [pillar, setPillar] = useState<Pillar>("MIND");
  const [privacy, setPrivacy] = useState<Privacy>("FRIENDS");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [postTypeTags, setPostTypeTags] = useState<PostTypeTag[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [linkedObject, setLinkedObject] = useState<LinkedObject | null>(null);

  // Media upload state (placeholder for future implementation)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [mediaUri, _setMediaUri] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [mediaType, _setMediaType] = useState<"photo" | "video" | null>(null);

  // Available objects to link
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    async function loadData() {
      const user = await auth.getUser();
      if (user) {
        const userHabits = await getHabits(user.id);
        const userGoals = await getGoals(user.id);
        setHabits(userHabits);
        setGoals(userGoals);
      }
    }
    loadData();
  }, []);

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
        mediaUrl: mediaUri ?? undefined,
        mediaType: mediaType ?? undefined,
        postTypeTags: postTypeTags.length > 0 ? postTypeTags : undefined,
        customTags: customTags.length > 0 ? customTags : undefined,
        linkedObjectId: linkedObject?.id,
        linkedObjectType: linkedObject?.type,
        linkedHabitId: linkedObject?.type === "habit" ? linkedObject.id : undefined,
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
        <ScreenHeader
          title="New Post"
          leftAction={
            <Pressable onPress={() => router.back()}>
              <Text style={[styles.cancelButton, { color: theme.text.secondary }]}>Cancel</Text>
            </Pressable>
          }
          rightAction={
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
          }
        />

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

          {/* Privacy Selection */}
          <View style={[styles.section, { borderBottomColor: theme.border.light }]}>
            <PrivacySelector value={privacy} onChange={setPrivacy} />
          </View>

          {/* Advanced Toggle */}
          <Pressable
            style={[styles.advancedToggle, { borderBottomColor: theme.border.light }]}
            onPress={() => setShowAdvanced(!showAdvanced)}
          >
            <Text style={[styles.advancedToggleText, { color: theme.semantic.primary }]}>
              {showAdvanced ? "▼ Hide Advanced Options" : "▶ Show Advanced Options"}
            </Text>
          </Pressable>

          {/* Advanced Options */}
          {showAdvanced && (
            <>
              {/* Category (Pillar) Selection */}
              <View style={[styles.section, { borderBottomColor: theme.border.light }]}>
                <PillarChips value={pillar} onChange={setPillar} />
              </View>

              {/* Post Type Tags */}
              <View style={[styles.section, { borderBottomColor: theme.border.light }]}>
                <PostTypeTagSelector value={postTypeTags} onChange={setPostTypeTags} />
              </View>

              {/* Custom Tags */}
              <View style={[styles.section, { borderBottomColor: theme.border.light }]}>
                <CustomTagInput value={customTags} onChange={setCustomTags} maxTags={5} />
              </View>

              {/* Link to Habit/Goal */}
              <View style={[styles.section, { borderBottomColor: theme.border.light }]}>
                <ObjectPicker
                  value={linkedObject}
                  onChange={setLinkedObject}
                  habits={habits}
                  goals={goals}
                />
              </View>
            </>
          )}
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
  cancelButton: {
    fontSize: typography.fontSize.base,
  },
  postButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  scrollView: {
    flex: 1,
  },
  inputSection: {
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  textInput: {
    fontSize: typography.fontSize.md,
    lineHeight: 24,
    minHeight: 120,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: typography.fontSize.xs,
    textAlign: "right",
    marginTop: spacing.sm,
  },
  section: {
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
  },
  advancedToggle: {
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  advancedToggleText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});
