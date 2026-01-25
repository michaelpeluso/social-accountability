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
  type ViewStyle,
} from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { useTheme, spacing, typography, borderRadius } from "../../theme";
import {
  pickPhoto,
  pickMedia,
  takePhoto,
  recordVideo,
  type MediaAsset,
  type MediaAspectRatio,
  MEDIA_CONFIG,
} from "../../services/media";

/** Helper component for video preview using expo-video */
function VideoPreview({ uri, style }: { uri: string; style: ViewStyle }) {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = false;
    player.muted = true;
  });

  return <VideoView player={player} style={style} contentFit="cover" nativeControls={false} />;
}

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
  /** Whether picker is disabled */
  disabled?: boolean;
  /** Optional error message to display */
  error?: string;
  /** Compact mode - shows small button when empty (default: false) */
  compact?: boolean;
}

export function MediaPicker({
  value,
  onChange,
  allowVideo = true,
  allowCamera = true,
  placeholder = "Add photo or video",
  disabled = false,
  error,
  compact = false,
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

  // Aspect ratio options
  const ASPECT_RATIO_OPTIONS: { value: MediaAspectRatio; label: string; ratio: number }[] = [
    { value: "3:2", label: "Horizontal", ratio: 3 / 2 },
    { value: "1:1", label: "Square", ratio: 1 },
    { value: "2:3", label: "Vertical", ratio: 2 / 3 },
  ];

  function handleAspectRatioChange(ratio: MediaAspectRatio) {
    if (value) {
      onChange({ ...value, aspectRatio: ratio });
    }
  }

  return (
    <View style={styles.container}>
      {value ? (
        // Show full preview when media selected
        <>
          {/* Aspect Ratio Selector */}
          <View style={styles.aspectRatioSelector}>
            {ASPECT_RATIO_OPTIONS.map((option) => {
              const isSelected = value.aspectRatio === option.value;
              return (
                <Pressable
                  key={option.value}
                  style={[
                    styles.aspectRatioOption,
                    {
                      backgroundColor: theme.background.secondary,
                      borderColor: theme.border.light,
                    },
                    isSelected && {
                      backgroundColor: `${theme.semantic.primary}20`,
                      borderColor: theme.semantic.primary,
                    },
                  ]}
                  onPress={() => handleAspectRatioChange(option.value)}
                >
                  <View
                    style={[
                      styles.aspectRatioIcon,
                      {
                        aspectRatio: option.ratio,
                        backgroundColor: isSelected ? theme.semantic.primary : theme.text.tertiary,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.aspectRatioLabel,
                      { color: isSelected ? theme.semantic.primary : theme.text.secondary },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Preview with selected aspect ratio */}
          <View
            style={[
              styles.previewContainer,
              {
                backgroundColor: theme.background.secondary,
                borderColor: error ? theme.text.error : theme.border.light,
                aspectRatio:
                  value.aspectRatio === "3:2"
                    ? 3 / 2
                    : value.aspectRatio === "2:3"
                      ? 2 / 3
                      : value.aspectRatio === "1:1"
                        ? 1
                        : 3 / 2, // default to horizontal
              },
            ]}
          >
            <View style={styles.preview}>
              {value.type === "photo" ? (
                <Image source={{ uri: value.uri }} style={styles.media} resizeMode="cover" />
              ) : (
                <VideoPreview uri={value.uri} style={styles.media} />
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
                disabled={disabled}
              >
                <Text style={[styles.changeButtonText, { color: theme.text.primary }]}>Change</Text>
              </Pressable>
            </View>
          </View>

          {/* File info */}
          {value.fileSize && (
            <Text style={[styles.fileInfo, { color: theme.text.tertiary }]}>
              {formatFileSize(value.fileSize)}
              {value.width && value.height && ` · ${value.width}×${value.height}`}
            </Text>
          )}
        </>
      ) : compact ? (
        // Compact mode: small horizontal button when empty
        <Pressable
          style={[
            styles.compactPickerButton,
            {
              backgroundColor: theme.background.secondary,
              borderColor: error ? theme.text.error : theme.border.light,
            },
            disabled && styles.disabled,
          ]}
          onPress={handlePress}
          disabled={disabled}
        >
          <View style={styles.compactPlaceholder}>
            <Text style={{ fontSize: 20 }}>{allowVideo ? "📷" : "📷"}</Text>
            <Text style={[styles.placeholderText, { color: theme.text.secondary }]}>
              {placeholder}
            </Text>
          </View>
        </Pressable>
      ) : (
        // Regular mode: large placeholder area when empty
        <Pressable
          style={[
            styles.pickerArea,
            {
              backgroundColor: theme.background.secondary,
              borderColor: error ? theme.text.error : theme.border.light,
            },
            disabled && styles.disabled,
          ]}
          onPress={handlePress}
          disabled={disabled}
        >
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
        </Pressable>
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
  aspectRatioSelector: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  aspectRatioOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  aspectRatioIcon: {
    width: 16,
    height: 20,
    borderRadius: 2,
  },
  aspectRatioLabel: {
    ...typography.caption,
    fontWeight: "600",
  },
  pickerArea: {
    width: "100%",
    minHeight: 200,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderStyle: "dashed",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  compactPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  previewContainer: {
    width: "100%",
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  disabled: {
    opacity: 0.5,
  },
  placeholder: {
    alignItems: "center",
    padding: spacing.lg,
  },
  compactPlaceholder: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
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
    minHeight: 200,
  },
  media: {
    width: "100%",
    height: "100%",
    minHeight: 200,
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
