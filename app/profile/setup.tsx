import { useState, useEffect, useCallback } from "react";
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

const MAX_BIO_LENGTH = 280;
const MAX_DISPLAY_NAME_LENGTH = 50;
const MAX_PHOTO_SIZE_MB = 5;
const MAX_PHOTO_SIZE_BYTES = MAX_PHOTO_SIZE_MB * 1024 * 1024;

export default function ProfileSetup() {
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!displayName.trim()) {
      setError("Display name is required");
      return;
    }

    if (displayName.length > MAX_DISPLAY_NAME_LENGTH) {
      setError(`Display name must be ${MAX_DISPLAY_NAME_LENGTH} characters or less`);
      return;
    }

    if (bio.length > MAX_BIO_LENGTH) {
      setError(`Bio must be ${MAX_BIO_LENGTH} characters or less`);
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
  }, [displayName, bio, photoUri]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Set Up Your Profile</Text>
          <Text style={styles.subtitle}>Tell us a bit about yourself</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.photoSection}>
            <Pressable style={styles.photoContainer} onPress={handlePickPhoto}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderText}>+</Text>
                </View>
              )}
            </Pressable>
            <Pressable onPress={handlePickPhoto}>
              <Text style={styles.photoLabel}>{photoUri ? "Change Photo" : "Add Photo"}</Text>
            </Pressable>
            <Text style={styles.photoHint}>Max {MAX_PHOTO_SIZE_MB}MB, JPG or PNG</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Display Name *</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              maxLength={MAX_DISPLAY_NAME_LENGTH}
              autoCapitalize="words"
              autoCorrect={false}
            />
            <Text style={styles.counter}>
              {displayName.length}/{MAX_DISPLAY_NAME_LENGTH}
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Bio (optional)</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="A few words about yourself..."
              maxLength={MAX_BIO_LENGTH}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Text style={styles.counter}>
              {bio.length}/{MAX_BIO_LENGTH}
            </Text>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            style={[styles.button, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save Profile</Text>
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
    backgroundColor: "#fff",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    marginTop: 40,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  form: {
    flex: 1,
  },
  photoSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  photoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
    marginBottom: 8,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ddd",
    borderStyle: "dashed",
    borderRadius: 50,
  },
  photoPlaceholderText: {
    fontSize: 32,
    color: "#999",
  },
  photoLabel: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
  },
  photoHint: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  bioInput: {
    height: 100,
  },
  counter: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 4,
  },
  error: {
    color: "red",
    marginBottom: 16,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#000",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: "#666",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
