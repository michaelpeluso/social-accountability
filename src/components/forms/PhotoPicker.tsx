/**
 * PhotoPicker - Circular photo picker for profile photos
 * Handles permission requests and image selection
 */

import { View, Text, StyleSheet, Pressable, Image, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useTheme, spacing, typography } from "../../theme";
import { logger } from "../../lib/logger";
import { limits } from "../../lib/validation";

const MAX_PHOTO_SIZE_MB = limits.photo.maxSizeBytes / (1024 * 1024);
const MAX_PHOTO_SIZE_BYTES = limits.photo.maxSizeBytes;

interface PhotoPickerProps {
  /** Current photo URI */
  value: string | null;
  /** Handler for photo changes */
  onChange: (uri: string | null) => void;
  /** Size of the photo circle */
  size?: number;
}

export function PhotoPicker({ value, onChange, size = 100 }: PhotoPickerProps) {
  const { theme } = useTheme();

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

    onChange(asset.uri);
    logger.info("PhotoPicker: photo selected", { uri: asset.uri.slice(0, 50) });
  }

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.photoContainer, { width: size, height: size, borderRadius: size / 2 }]}
        onPress={handlePickPhoto}
      >
        {value ? (
          <Image source={{ uri: value }} style={styles.photo} />
        ) : (
          <View
            style={[
              styles.placeholder,
              {
                backgroundColor: theme.background.secondary,
                borderColor: theme.border.medium,
                borderRadius: size / 2,
              },
            ]}
          >
            <Text style={[styles.placeholderText, { color: theme.text.tertiary }]}>+</Text>
          </View>
        )}
      </Pressable>
      <Pressable onPress={handlePickPhoto}>
        <Text style={[styles.label, { color: theme.semantic.primary }]}>
          {value ? "Change Photo" : "Add Photo"}
        </Text>
      </Pressable>
      <Text style={[styles.hint, { color: theme.text.tertiary }]}>
        Max {MAX_PHOTO_SIZE_MB}MB, JPG or PNG
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  photoContainer: {
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderStyle: "dashed",
  },
  placeholderText: {
    fontSize: typography.fontSize.xxxl,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  hint: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },
});
