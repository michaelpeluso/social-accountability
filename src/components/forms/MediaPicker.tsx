/**
 * MediaPicker - Multi-purpose media picker for posts and stories
 * Handles both photo and video selection from device or camera
 *
 * Note: Media types are mutually exclusive in posts:
 *   - photo/video: User-uploaded media (this component)
 *   - chart: Auto-generated visualization (replaces user media)
 */

import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ActionSheetIOS,
  Platform,
  Alert,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { useTheme, spacing, typography, borderRadius } from "../../theme";
import {
  pickPhoto,
  pickMedia,
  takePhoto,
  recordVideo,
  type MediaAsset,
  MEDIA_CONFIG,
} from "../../services/media";

interface MediaPickerProps {
  /** Current selected media */
  value: MediaAsset | null;
  /** Handler for media changes */
  onChange: (asset: MediaAsset | null) => void;
  /** Whether to allow video selection (default: true) */
  allowVideo?: boolean;
  /** Whether to show camera option (default: true) */
  allowCamera?: boolean;
  /** Custom placeholder text */
  placeholder?: string;
  /** Aspect ratio for image preview (default: 16:9) */
  aspectRatio?: number;
  /** Whether picker is disabled */
  disabled?: boolean;
  /** Optional error message to display */
  error?: string;
}

export function MediaPicker({
  value,
  onChange,
  allowVideo = true,
  allowCamera = true,
  placeholder = "Add photo or video",
  aspectRatio = 16 / 9,
  disabled = false,
  error,
}: MediaPickerProps) {
  const { theme } = useTheme();

  async function handlePress() {
    if (disabled) return;

    if (Platform.OS === "ios") {
      showIOSActionSheet();
    } else {
      showAndroidOptions();
    }
  }

  function showIOSActionSheet() {
    const options = ["Cancel"];
    const cancelButtonIndex = 0;

    if (allowVideo) {
      options.push("Choose Photo or Video");
    } else {
      options.push("Choose Photo");
    }

    if (allowCamera) {
      options.push("Take Photo");
      if (allowVideo) {
        options.push("Record Video");
      }
    }

    if (value) {
      options.push("Remove Media");
    }

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButtonIndex: value ? options.length - 1 : undefined,
      },
      async (buttonIndex) => {
        if (buttonIndex === 0) return; // Cancel

        let optionIndex = 1;

        // Choose media option
        if (buttonIndex === optionIndex) {
          const result = allowVideo ? await pickMedia() : await pickPhoto();
          if (result.success && result.asset) {
            onChange(result.asset);
          }
          return;
        }
        optionIndex++;

        // Take photo option
        if (allowCamera && buttonIndex === optionIndex) {
          const result = await takePhoto();
          if (result.success && result.asset) {
            onChange(result.asset);
          }
          return;
        }
        if (allowCamera) optionIndex++;

        // Record video option
        if (allowCamera && allowVideo && buttonIndex === optionIndex) {
          const result = await recordVideo();
          if (result.success && result.asset) {
            onChange(result.asset);
          }
          return;
        }
        if (allowCamera && allowVideo) optionIndex++;

        // Remove media option
        if (value && buttonIndex === optionIndex) {
          onChange(null);
        }
      }
    );
  }

  function showAndroidOptions() {
    const options: { text: string; onPress: () => void; style?: "cancel" | "destructive" }[] = [];

    options.push({
      text: allowVideo ? "Choose Photo or Video" : "Choose Photo",
      onPress: async () => {
        const result = allowVideo ? await pickMedia() : await pickPhoto();
        if (result.success && result.asset) {
          onChange(result.asset);
        }
      },
    });

    if (allowCamera) {
      options.push({
        text: "Take Photo",
        onPress: async () => {
          const result = await takePhoto();
          if (result.success && result.asset) {
            onChange(result.asset);
          }
        },
      });

      if (allowVideo) {
        options.push({
          text: "Record Video",
          onPress: async () => {
            const result = await recordVideo();
            if (result.success && result.asset) {
              onChange(result.asset);
            }
          },
        });
      }
    }

    if (value) {
      options.push({
        text: "Remove Media",
        style: "destructive",
        onPress: () => onChange(null),
      });
    }

    options.push({ text: "Cancel", style: "cancel", onPress: () => {} });

    Alert.alert("Select Media", undefined, options);
  }

  function formatFileSize(bytes?: number): string {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDuration(seconds?: number): string {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  return (
    <View style={styles.container}>
      <Pressable
        style={[
          styles.pickerArea,
          {
            aspectRatio,
            backgroundColor: theme.background.secondary,
            borderColor: error ? theme.text.error : theme.border.light,
          },
          disabled && styles.disabled,
        ]}
        onPress={handlePress}
        disabled={disabled}
      >
        {value ? (
          <View style={styles.preview}>
            {value.type === "photo" ? (
              <Image source={{ uri: value.uri }} style={styles.media} resizeMode="cover" />
            ) : (
              <Video
                source={{ uri: value.uri }}
                style={styles.media}
                resizeMode={ResizeMode.COVER}
                shouldPlay={false}
                isLooping={false}
              />
            )}

            {/* Media type badge */}
            <View style={[styles.typeBadge, { backgroundColor: theme.background.primary }]}>
              <Text style={[styles.typeBadgeText, { color: theme.text.secondary }]}>
                {value.type === "video" ? "🎬" : "📷"} {value.type.toUpperCase()}
              </Text>
            </View>

            {/* Duration badge for videos */}
            {value.type === "video" && value.duration && (
              <View style={[styles.durationBadge, { backgroundColor: "rgba(0,0,0,0.7)" }]}>
                <Text style={styles.durationText}>{formatDuration(value.duration)}</Text>
              </View>
            )}

            {/* Change button */}
            <Pressable
              style={[styles.changeButton, { backgroundColor: theme.background.primary }]}
              onPress={handlePress}
            >
              <Text style={[styles.changeButtonText, { color: theme.text.primary }]}>Change</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Text style={[styles.placeholderIcon, { color: theme.text.tertiary }]}>
              {allowVideo ? "📷 🎬" : "📷"}
            </Text>
            <Text style={[styles.placeholderText, { color: theme.text.tertiary }]}>
              {placeholder}
            </Text>
            <Text style={[styles.placeholderHint, { color: theme.text.secondary }]}>
              {allowVideo
                ? `Photo: max ${MEDIA_CONFIG.photo.maxSizeMB}MB · Video: max ${MEDIA_CONFIG.video.maxSizeMB}MB, ${MEDIA_CONFIG.video.maxDurationSeconds}s`
                : `Max ${MEDIA_CONFIG.photo.maxSizeMB}MB · JPG, PNG`}
            </Text>
          </View>
        )}
      </Pressable>

      {/* File info */}
      {value && value.fileSize && (
        <Text style={[styles.fileInfo, { color: theme.text.tertiary }]}>
          {formatFileSize(value.fileSize)}
          {value.width && value.height && ` · ${value.width}×${value.height}`}
        </Text>
      )}

      {/* Error message */}
      {error && <Text style={[styles.error, { color: theme.text.error }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  pickerArea: {
    width: "100%",
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderStyle: "dashed",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  disabled: {
    opacity: 0.5,
  },
  placeholder: {
    alignItems: "center",
    padding: spacing.lg,
  },
  placeholderIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  placeholderText: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
  placeholderHint: {
    ...typography.caption,
    textAlign: "center",
  },
  preview: {
    width: "100%",
    height: "100%",
  },
  media: {
    width: "100%",
    height: "100%",
  },
  typeBadge: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  typeBadgeText: {
    ...typography.caption,
    fontWeight: "600",
  },
  durationBadge: {
    position: "absolute",
    bottom: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  durationText: {
    ...typography.caption,
    color: "#fff",
    fontWeight: "600",
  },
  changeButton: {
    position: "absolute",
    bottom: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  changeButtonText: {
    ...typography.body,
    fontWeight: "600",
  },
  fileInfo: {
    ...typography.caption,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  error: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
});
