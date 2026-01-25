import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { auth } from "../../src/services/auth";
import { api } from "../../src/services/api";
import { logger } from "../../src/lib/logger";
import { validateDisplayName, validateBio, limits } from "../../src/lib/validation";
import { useTheme, spacing, borderRadius, typography } from "../../src/theme";
import { PhotoPicker, FormField } from "../../src/components";

const MAX_BIO_LENGTH = limits.bio.max;
const MAX_DISPLAY_NAME_LENGTH = limits.displayName.max;

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

  const handleSave = useCallback(async () => {
    setTouched({ displayName: true, bio: true });

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
          <PhotoPicker value={photoUri} onChange={setPhotoUri} />

          <FormField
            label="Display Name"
            required
            value={displayName}
            onChangeText={setDisplayName}
            onBlur={() => setTouched((t) => ({ ...t, displayName: true }))}
            placeholder="Your name"
            maxLength={MAX_DISPLAY_NAME_LENGTH}
            error={displayNameValidation.error}
            touched={touched.displayName}
            autoCapitalize="words"
            autoCorrect={false}
            warnThreshold={10}
          />

          <FormField
            label="Bio (optional)"
            value={bio}
            onChangeText={setBio}
            onBlur={() => setTouched((t) => ({ ...t, bio: true }))}
            placeholder="A few words about yourself..."
            maxLength={MAX_BIO_LENGTH}
            error={bioValidation.error}
            touched={touched.bio}
            multiline
            height={100}
            warnThreshold={30}
          />

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
