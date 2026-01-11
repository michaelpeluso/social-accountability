import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { auth } from "../../src/services/auth";
import { api } from "../../src/services/api";
import { logger } from "../../src/lib/logger";
import { validateDisplayName, validateBio, limits, isNearLimit } from "../../src/lib/validation";
import { useTheme } from "../../src/theme";
import { spacing, borderRadius } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";

const MAX_BIO_LENGTH = limits.bio.max;
const MAX_DISPLAY_NAME_LENGTH = limits.displayName.max;
const MAX_PHOTO_SIZE_MB = limits.photo.maxSizeBytes / (1024 * 1024);
const MAX_PHOTO_SIZE_BYTES = limits.photo.maxSizeBytes;

export default function ProfileSetup() {
  const { theme } = useTheme();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState({ displayName: false, bio: false });

  // Real-time validation
  const displayNameValidation = useMemo(() => validateDisplayName(displayName), [displayName]);
  const bioValidation = useMemo(() => validateBio(bio), [bio]);

  // Check if form is valid
  const isFormValid = displayNameValidation.valid && bioValidation.valid;

  // Character count styles
  const displayNameNearLimit = isNearLimit(displayName, MAX_DISPLAY_NAME_LENGTH, 10);
  const bioNearLimit = isNearLimit(bio, MAX_BIO_LENGTH, 30);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const currentUser = await auth.getUser();
      if (currentUser) {
        setDisplayName(currentUser.displayName || "");
        setBio(currentUser.bio || "");
        setPhotoUri(currentUser.photoUrl || null);
      }
    } catch (err) {
      logger.error("ProfileSetup: failed to load profile", { error: err });
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  async function handlePickPhoto() {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photo library to upload a profile photo."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];

    if (asset.fileSize && asset.fileSize > MAX_PHOTO_SIZE_BYTES) {
      Alert.alert("Photo Too Large", `Please select a photo smaller than ${MAX_PHOTO_SIZE_MB}MB.`);
      return;
    }

    const extension = asset.uri.split(".").pop()?.toLowerCase();
    if (extension && !["jpg", "jpeg", "png"].includes(extension)) {
      Alert.alert("Invalid Format", "Please select a JPG or PNG image.");
      return;
    }

    setPhotoUri(asset.uri);
    logger.info("ProfileSetup: photo selected", { uri: asset.uri.slice(0, 50) });
  }

  const handleSave = useCallback(async () => {
    // Mark all fields as touched
    setTouched({ displayName: true, bio: true });

    // Validate using the utility functions
    if (!displayNameValidation.valid) {
      setError(displayNameValidation.error || "Invalid display name");
      return;
    }

    if (!bioValidation.valid) {
      setError(bioValidation.error || "Invalid bio");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await api.user.updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim() || undefined,
        photoUrl: photoUri || undefined,
      });

      if ("error" in response) {
        setError(response.error.message);
        return;
      }

      await auth.updateUser(response.data);
      logger.info("ProfileSetup: profile saved", { userId: response.data.id });
      router.replace("/");
    } catch (err) {
      logger.error("ProfileSetup: failed to save profile", { error: err });
      setError("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }, [displayName, bio, photoUri, displayNameValidation, bioValidation]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background.primary }]}>
        <ActivityIndicator size="large" color={theme.text.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background.primary }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text.primary }]}>Set Up Your Profile</Text>
          <Text style={[styles.subtitle, { color: theme.text.secondary }]}>
            Tell us a bit about yourself
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.photoSection}>
            <Pressable style={styles.photoContainer} onPress={handlePickPhoto}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photo} />
              ) : (
                <View
                  style={[
                    styles.photoPlaceholder,
                    {
                      backgroundColor: theme.background.secondary,
                      borderColor: theme.border.medium,
                    },
                  ]}
                >
                  <Text style={[styles.photoPlaceholderText, { color: theme.text.tertiary }]}>
                    +
                  </Text>
                </View>
              )}
            </Pressable>
            <Pressable onPress={handlePickPhoto}>
              <Text style={[styles.photoLabel, { color: theme.semantic.primary }]}>
                {photoUri ? "Change Photo" : "Add Photo"}
              </Text>
            </Pressable>
            <Text style={[styles.photoHint, { color: theme.text.tertiary }]}>
              Max {MAX_PHOTO_SIZE_MB}MB, JPG or PNG
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.text.primary }]}>Display Name *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: theme.input.border,
                  backgroundColor: theme.input.background,
                  color: theme.text.primary,
                },
                touched.displayName && !displayNameValidation.valid && styles.inputError,
              ]}
              value={displayName}
              onChangeText={setDisplayName}
              onBlur={() => setTouched((t) => ({ ...t, displayName: true }))}
              placeholder="Your name"
              placeholderTextColor={theme.text.tertiary}
              maxLength={MAX_DISPLAY_NAME_LENGTH}
              autoCapitalize="words"
              autoCorrect={false}
            />
            <View style={styles.fieldFooter}>
              {touched.displayName && !displayNameValidation.valid ? (
                <Text style={[styles.fieldError, { color: theme.semantic.danger }]}>
                  {displayNameValidation.error}
                </Text>
              ) : (
                <View />
              )}
              <Text
                style={[
                  styles.counter,
                  { color: theme.text.tertiary },
                  displayNameNearLimit && { color: theme.semantic.warning },
                ]}
              >
                {displayName.length}/{MAX_DISPLAY_NAME_LENGTH}
              </Text>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.text.primary }]}>Bio (optional)</Text>
            <TextInput
              style={[
                styles.input,
                styles.bioInput,
                {
                  borderColor: theme.input.border,
                  backgroundColor: theme.input.background,
                  color: theme.text.primary,
                },
                touched.bio && !bioValidation.valid && styles.inputError,
              ]}
              value={bio}
              onChangeText={setBio}
              onBlur={() => setTouched((t) => ({ ...t, bio: true }))}
              placeholder="A few words about yourself..."
              placeholderTextColor={theme.text.tertiary}
              maxLength={MAX_BIO_LENGTH}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.fieldFooter}>
              {touched.bio && !bioValidation.valid ? (
                <Text style={[styles.fieldError, { color: theme.semantic.danger }]}>
                  {bioValidation.error}
                </Text>
              ) : (
                <View />
              )}
              <Text
                style={[
                  styles.counter,
                  { color: theme.text.tertiary },
                  bioNearLimit && { color: theme.semantic.warning },
                ]}
              >
                {bio.length}/{MAX_BIO_LENGTH}
              </Text>
            </View>
          </View>

          {error && <Text style={[styles.error, { color: theme.semantic.danger }]}>{error}</Text>}

          <Pressable
            style={[
              styles.button,
              { backgroundColor: theme.button.primary.background },
              (saving || !isFormValid) && styles.buttonDisabled,
            ]}
            onPress={handleSave}
            disabled={saving || !isFormValid}
          >
            {saving ? (
              <ActivityIndicator color={theme.button.primary.text} />
            ) : (
              <Text style={[styles.buttonText, { color: theme.button.primary.text }]}>
                Save Profile
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  header: {
    marginTop: 40,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
  },
  form: {
    flex: 1,
  },
  photoSection: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  photoContainer: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.full,
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: borderRadius.full,
  },
  photoPlaceholderText: {
    fontSize: typography.fontSize.xxxl,
  },
  photoLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  photoHint: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },
  field: {
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
  bioInput: {
    height: 100,
  },
  fieldFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  fieldError: {
    fontSize: typography.fontSize.xs,
    flex: 1,
    marginRight: spacing.sm,
  },
  counter: {
    fontSize: typography.fontSize.xs,
    textAlign: "right",
  },
  error: {
    marginBottom: spacing.md,
    textAlign: "center",
  },
  button: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: "center",
    marginTop: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});
