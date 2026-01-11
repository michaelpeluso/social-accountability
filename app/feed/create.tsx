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
import { useTheme } from "../../src/theme";
import { spacing, borderRadius } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";

const PILLARS: { value: Pillar; label: string; emoji: string }[] = [
  { value: "MIND", label: "Mind", emoji: "🧠" },
  { value: "BODY", label: "Body", emoji: "💪" },
  { value: "HEART", label: "Heart", emoji: "❤️" },
  { value: "SOUL", label: "Soul", emoji: "🔥" },
];

const PRIVACY_OPTIONS: { value: Privacy; label: string; description: string }[] = [
  { value: "FRIENDS", label: "Friends", description: "Visible to friends only" },
  { value: "PUBLIC", label: "Public", description: "Visible to everyone" },
  { value: "SELF", label: "Only Me", description: "Private, just for you" },
];

const POST_TYPE_TAGS: { value: PostTypeTag; label: string; emoji: string }[] = [
  { value: "win", label: "Win", emoji: "🏆" },
  { value: "struggle", label: "Struggle", emoji: "💭" },
  { value: "question", label: "Question", emoji: "❓" },
  { value: "reflection", label: "Reflection", emoji: "🪞" },
];

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
  const [customTagInput, setCustomTagInput] = useState("");
  const [customTagError, setCustomTagError] = useState<string | null>(null);
  const [linkedObject, setLinkedObject] = useState<LinkedObject | null>(null);
  const [showObjectPicker, setShowObjectPicker] = useState(false);

  // Media upload state (placeholder for future implementation - use _ prefix to suppress warnings)
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

  const togglePostTypeTag = (tag: PostTypeTag) => {
    setPostTypeTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const input = customTagInput.trim();

    // Require # prefix
    if (!input.startsWith("#")) {
      setCustomTagError("Tags must start with #");
      return;
    }

    const tag = input.slice(1).trim(); // Remove # prefix for storage

    if (!tag) {
      setCustomTagError("Enter a tag after #");
      return;
    }

    if (customTags.includes(tag)) {
      setCustomTagError("Tag already added");
      return;
    }

    if (customTags.length >= 5) {
      setCustomTagError("Maximum 5 tags allowed");
      return;
    }

    setCustomTags((prev) => [...prev, tag]);
    setCustomTagInput("");
    setCustomTagError(null);
  };

  const removeCustomTag = (tag: string) => {
    setCustomTags((prev) => prev.filter((t) => t !== tag));
  };

  const selectLinkedObject = (obj: LinkedObject) => {
    setLinkedObject(obj);
    setShowObjectPicker(false);
  };

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
        // Media (when available)
        mediaUrl: mediaUri ?? undefined,
        mediaType: mediaType ?? undefined,
        // Advanced options
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
                          pillar === p.value && {
                            color: theme.semantic.primary,
                            fontWeight: "600",
                          },
                        ]}
                      >
                        {p.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Post Type Tags (Suggested) */}
              <View style={[styles.section, { borderBottomColor: theme.border.light }]}>
                <Text style={[styles.sectionLabel, { color: theme.text.secondary }]}>
                  Suggested Tags (optional)
                </Text>
                <View style={styles.tagsRow}>
                  {POST_TYPE_TAGS.map((tag) => (
                    <Pressable
                      key={tag.value}
                      style={[
                        styles.tagChip,
                        { backgroundColor: theme.background.secondary },
                        postTypeTags.includes(tag.value) && {
                          backgroundColor: theme.semantic.primary + "20",
                          borderWidth: 2,
                          borderColor: theme.semantic.primary,
                        },
                      ]}
                      onPress={() => togglePostTypeTag(tag.value)}
                    >
                      <Text style={styles.tagEmoji}>{tag.emoji}</Text>
                      <Text
                        style={[
                          styles.tagLabel,
                          { color: theme.text.secondary },
                          postTypeTags.includes(tag.value) && { color: theme.semantic.primary },
                        ]}
                      >
                        {tag.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Custom Tags */}
              <View style={[styles.section, { borderBottomColor: theme.border.light }]}>
                <Text style={[styles.sectionLabel, { color: theme.text.secondary }]}>
                  Custom Tags (max 5, must start with #)
                </Text>
                <View style={styles.customTagsRow}>
                  {customTags.map((tag) => (
                    <Pressable
                      key={tag}
                      style={[
                        styles.customTagChip,
                        { backgroundColor: theme.semantic.primary + "20" },
                      ]}
                      onPress={() => removeCustomTag(tag)}
                    >
                      <Text style={[styles.customTagText, { color: theme.semantic.primary }]}>
                        #{tag} ×
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {customTags.length < 5 && (
                  <View style={styles.customTagInputRow}>
                    <TextInput
                      style={[
                        styles.customTagInput,
                        {
                          color: theme.text.primary,
                          borderColor: customTagError ? theme.semantic.danger : theme.border.medium,
                        },
                      ]}
                      placeholder="#your-tag"
                      placeholderTextColor={theme.text.tertiary}
                      value={customTagInput}
                      onChangeText={(text) => {
                        setCustomTagInput(text);
                        setCustomTagError(null);
                      }}
                      onSubmitEditing={addCustomTag}
                      maxLength={25}
                    />
                    <Pressable
                      style={[styles.addTagButton, { backgroundColor: theme.semantic.primary }]}
                      onPress={addCustomTag}
                    >
                      <Text style={styles.addTagButtonText}>Add</Text>
                    </Pressable>
                  </View>
                )}
                {customTagError && (
                  <Text style={[styles.errorText, { color: theme.semantic.danger }]}>
                    {customTagError}
                  </Text>
                )}
              </View>

              {/* Link to Habit/Goal */}
              <View style={[styles.section, { borderBottomColor: theme.border.light }]}>
                <Text style={[styles.sectionLabel, { color: theme.text.secondary }]}>
                  Link to (optional)
                </Text>
                {linkedObject ? (
                  <View style={styles.linkedObjectRow}>
                    <View
                      style={[
                        styles.linkedObjectChip,
                        { backgroundColor: theme.semantic.primary + "20" },
                      ]}
                    >
                      <Text style={[styles.linkedObjectText, { color: theme.semantic.primary }]}>
                        {linkedObject.type === "habit" ? "🎯" : "🏆"} {linkedObject.title}
                      </Text>
                    </View>
                    <Pressable onPress={() => setLinkedObject(null)}>
                      <Text style={[styles.removeLink, { color: theme.semantic.danger }]}>
                        Remove
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    style={[styles.selectObjectButton, { borderColor: theme.border.medium }]}
                    onPress={() => setShowObjectPicker(!showObjectPicker)}
                  >
                    <Text style={[styles.selectObjectText, { color: theme.text.secondary }]}>
                      Select a habit or goal...
                    </Text>
                  </Pressable>
                )}

                {/* Object Picker */}
                {showObjectPicker && (
                  <View
                    style={[styles.objectPicker, { backgroundColor: theme.background.secondary }]}
                  >
                    {habits.length > 0 && (
                      <>
                        <Text style={[styles.objectPickerLabel, { color: theme.text.tertiary }]}>
                          Habits
                        </Text>
                        {habits.slice(0, 5).map((habit) => (
                          <Pressable
                            key={habit.id}
                            style={styles.objectPickerItem}
                            onPress={() =>
                              selectLinkedObject({
                                id: habit.id,
                                title: habit.title,
                                type: "habit",
                              })
                            }
                          >
                            <Text
                              style={[styles.objectPickerItemText, { color: theme.text.primary }]}
                            >
                              🎯 {habit.title}
                            </Text>
                          </Pressable>
                        ))}
                      </>
                    )}
                    {goals.length > 0 && (
                      <>
                        <Text style={[styles.objectPickerLabel, { color: theme.text.tertiary }]}>
                          Goals
                        </Text>
                        {goals.slice(0, 5).map((goal) => (
                          <Pressable
                            key={goal.id}
                            style={styles.objectPickerItem}
                            onPress={() =>
                              selectLinkedObject({ id: goal.id, title: goal.title, type: "goal" })
                            }
                          >
                            <Text
                              style={[styles.objectPickerItemText, { color: theme.text.primary }]}
                            >
                              🏆 {goal.title}
                            </Text>
                          </Pressable>
                        ))}
                      </>
                    )}
                    {habits.length === 0 && goals.length === 0 && (
                      <Text style={[styles.noObjectsText, { color: theme.text.tertiary }]}>
                        No habits or goals yet
                      </Text>
                    )}
                  </View>
                )}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  cancelButton: {
    fontSize: typography.fontSize.base,
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
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
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  sectionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  pillarsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  pillarChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.xs + 2,
  },
  pillarEmoji: {
    fontSize: typography.fontSize.base,
  },
  pillarLabel: {
    fontSize: 13,
  },
  privacyOptions: {
    gap: spacing.sm,
  },
  privacyOption: {
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: "transparent",
  },
  privacyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
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
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  privacyDescription: {
    fontSize: 13,
    marginLeft: 32,
  },
  advancedToggle: {
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  advancedToggleText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  tagEmoji: {
    fontSize: typography.fontSize.sm,
  },
  tagLabel: {
    fontSize: typography.fontSize.sm,
  },
  customTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  customTagChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  customTagText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  customTagInputRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  customTagInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: typography.fontSize.sm,
  },
  addTagButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    justifyContent: "center",
  },
  addTagButtonText: {
    color: "#fff",
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  linkedObjectRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  linkedObjectChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    flex: 1,
    marginRight: spacing.sm,
  },
  linkedObjectText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  removeLink: {
    fontSize: typography.fontSize.sm,
  },
  selectObjectButton: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  selectObjectText: {
    fontSize: typography.fontSize.sm,
  },
  objectPicker: {
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  objectPickerLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  objectPickerItem: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  objectPickerItemText: {
    fontSize: typography.fontSize.sm,
  },
  noObjectsText: {
    fontSize: typography.fontSize.sm,
    fontStyle: "italic",
    padding: spacing.sm,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },
});
