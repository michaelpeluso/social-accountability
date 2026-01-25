/**
 * Media Service
 * Handles media upload from device (photos and videos) for posts and stories
 *
 * Media types are mutually exclusive in posts:
 *   - photo/video: User uploads image/video (requires mediaUrl)
 *   - chart: Auto-generated graph/badge/visualization (replaces user media)
 */

import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Alert } from "react-native";
import { logger } from "../lib/logger";
import type { MediaType } from "../types";

// Media configuration
export const MEDIA_CONFIG = {
  photo: {
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    maxSizeMB: 10,
    allowedExtensions: ["jpg", "jpeg", "png", "heic", "webp"],
    quality: 0.85,
  },
  video: {
    maxSizeBytes: 50 * 1024 * 1024, // 50MB
    maxSizeMB: 50,
    allowedExtensions: ["mp4", "mov", "m4v"],
    maxDurationSeconds: 60, // 1 minute max
  },
};

export type MediaAspectRatio = "3:2" | "2:3" | "1:1";

export interface MediaAsset {
  uri: string;
  type: "photo" | "video";
  width?: number;
  height?: number;
  duration?: number; // for videos, in seconds
  fileSize?: number;
  fileName?: string;
  aspectRatio?: MediaAspectRatio; // User-selected aspect ratio (horizontal 3:2, vertical 2:3, or square 1:1)
}

export interface MediaPickerResult {
  success: boolean;
  asset?: MediaAsset;
  error?: string;
}

/**
 * Request permission to access media library
 */
export async function requestMediaPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (status !== "granted") {
    Alert.alert(
      "Permission Required",
      "Please allow access to your photo library to upload media.",
      [{ text: "OK" }]
    );
    return false;
  }

  return true;
}

/**
 * Request permission to access camera
 */
export async function requestCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();

  if (status !== "granted") {
    Alert.alert(
      "Permission Required",
      "Please allow access to your camera to take photos or videos.",
      [{ text: "OK" }]
    );
    return false;
  }

  return true;
}

/**
 * Validate a selected media file
 */
async function validateMedia(
  asset: ImagePicker.ImagePickerAsset,
  mediaType: "photo" | "video"
): Promise<{ valid: boolean; error?: string }> {
  const config = MEDIA_CONFIG[mediaType];

  // Check file size
  if (asset.fileSize && asset.fileSize > config.maxSizeBytes) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${config.maxSizeMB}MB.`,
    };
  }

  // Check file extension
  const extension = asset.uri.split(".").pop()?.toLowerCase();
  if (extension && !config.allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `Invalid file format. Allowed: ${config.allowedExtensions.join(", ").toUpperCase()}`,
    };
  }

  // Check video duration
  if (mediaType === "video" && asset.duration) {
    const durationSeconds = asset.duration / 1000; // ImagePicker returns ms
    if (durationSeconds > MEDIA_CONFIG.video.maxDurationSeconds) {
      return {
        valid: false,
        error: `Video too long. Maximum duration is ${MEDIA_CONFIG.video.maxDurationSeconds} seconds.`,
      };
    }
  }

  return { valid: true };
}

/**
 * Pick a photo from the device library
 */
export async function pickPhoto(options?: {
  allowsEditing?: boolean;
  aspect?: [number, number];
}): Promise<MediaPickerResult> {
  const hasPermission = await requestMediaPermission();
  if (!hasPermission) {
    return { success: false, error: "Permission denied" };
  }

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: options?.allowsEditing ?? false,
      aspect: options?.aspect,
      quality: MEDIA_CONFIG.photo.quality,
    });

    if (result.canceled || !result.assets.length) {
      return { success: false, error: "Selection cancelled" };
    }

    const asset = result.assets[0];
    const validation = await validateMedia(asset, "photo");

    if (!validation.valid) {
      Alert.alert("Invalid Photo", validation.error);
      return { success: false, error: validation.error };
    }

    logger.info("Photo picked", {
      width: asset.width,
      height: asset.height,
      fileSize: asset.fileSize,
    });

    return {
      success: true,
      asset: {
        uri: asset.uri,
        type: "photo",
        width: asset.width,
        height: asset.height,
        fileSize: asset.fileSize,
        fileName: asset.fileName ?? undefined,
      },
    };
  } catch (error) {
    logger.error("Failed to pick photo", { error });
    return { success: false, error: "Failed to select photo" };
  }
}

/**
 * Pick a video from the device library
 */
export async function pickVideo(): Promise<MediaPickerResult> {
  const hasPermission = await requestMediaPermission();
  if (!hasPermission) {
    return { success: false, error: "Permission denied" };
  }

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "videos",
      allowsEditing: false,
      videoMaxDuration: MEDIA_CONFIG.video.maxDurationSeconds,
    });

    if (result.canceled || !result.assets.length) {
      return { success: false, error: "Selection cancelled" };
    }

    const asset = result.assets[0];
    const validation = await validateMedia(asset, "video");

    if (!validation.valid) {
      Alert.alert("Invalid Video", validation.error);
      return { success: false, error: validation.error };
    }

    logger.info("Video picked", {
      width: asset.width,
      height: asset.height,
      duration: asset.duration,
      fileSize: asset.fileSize,
    });

    return {
      success: true,
      asset: {
        uri: asset.uri,
        type: "video",
        width: asset.width,
        height: asset.height,
        duration: asset.duration ? asset.duration / 1000 : undefined,
        fileSize: asset.fileSize,
        fileName: asset.fileName ?? undefined,
      },
    };
  } catch (error) {
    logger.error("Failed to pick video", { error });
    return { success: false, error: "Failed to select video" };
  }
}

/**
 * Pick either photo or video from library
 */
export async function pickMedia(): Promise<MediaPickerResult> {
  const hasPermission = await requestMediaPermission();
  if (!hasPermission) {
    return { success: false, error: "Permission denied" };
  }

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsEditing: false,
      videoMaxDuration: MEDIA_CONFIG.video.maxDurationSeconds,
      quality: MEDIA_CONFIG.photo.quality,
    });

    if (result.canceled || !result.assets.length) {
      return { success: false, error: "Selection cancelled" };
    }

    const asset = result.assets[0];
    const isVideo = asset.type === "video";
    const mediaType = isVideo ? "video" : "photo";

    const validation = await validateMedia(asset, mediaType);

    if (!validation.valid) {
      Alert.alert(`Invalid ${mediaType}`, validation.error);
      return { success: false, error: validation.error };
    }

    logger.info("Media picked", {
      type: mediaType,
      width: asset.width,
      height: asset.height,
      duration: asset.duration,
      fileSize: asset.fileSize,
    });

    return {
      success: true,
      asset: {
        uri: asset.uri,
        type: mediaType,
        width: asset.width,
        height: asset.height,
        duration: isVideo && asset.duration ? asset.duration / 1000 : undefined,
        fileSize: asset.fileSize,
        fileName: asset.fileName ?? undefined,
      },
    };
  } catch (error) {
    logger.error("Failed to pick media", { error });
    return { success: false, error: "Failed to select media" };
  }
}

/**
 * Take a photo with the camera
 */
export async function takePhoto(): Promise<MediaPickerResult> {
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) {
    return { success: false, error: "Permission denied" };
  }

  try {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      allowsEditing: false,
      quality: MEDIA_CONFIG.photo.quality,
    });

    if (result.canceled || !result.assets.length) {
      return { success: false, error: "Capture cancelled" };
    }

    const asset = result.assets[0];

    logger.info("Photo captured", {
      width: asset.width,
      height: asset.height,
    });

    return {
      success: true,
      asset: {
        uri: asset.uri,
        type: "photo",
        width: asset.width,
        height: asset.height,
        fileSize: asset.fileSize,
        fileName: asset.fileName ?? undefined,
      },
    };
  } catch (error) {
    logger.error("Failed to take photo", { error });
    return { success: false, error: "Failed to capture photo" };
  }
}

/**
 * Record a video with the camera
 */
export async function recordVideo(): Promise<MediaPickerResult> {
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) {
    return { success: false, error: "Permission denied" };
  }

  try {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "videos",
      allowsEditing: false,
      videoMaxDuration: MEDIA_CONFIG.video.maxDurationSeconds,
    });

    if (result.canceled || !result.assets.length) {
      return { success: false, error: "Recording cancelled" };
    }

    const asset = result.assets[0];

    logger.info("Video recorded", {
      width: asset.width,
      height: asset.height,
      duration: asset.duration,
    });

    return {
      success: true,
      asset: {
        uri: asset.uri,
        type: "video",
        width: asset.width,
        height: asset.height,
        duration: asset.duration ? asset.duration / 1000 : undefined,
        fileSize: asset.fileSize,
        fileName: asset.fileName ?? undefined,
      },
    };
  } catch (error) {
    logger.error("Failed to record video", { error });
    return { success: false, error: "Failed to record video" };
  }
}

/**
 * Get file info for a local media file
 */
export async function getMediaInfo(uri: string): Promise<{
  exists: boolean;
  size?: number;
  modificationTime?: number;
}> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return {
      exists: info.exists,
      size: info.exists ? (info as FileSystem.FileInfo).size : undefined,
      modificationTime: info.exists ? (info as FileSystem.FileInfo).modificationTime : undefined,
    };
  } catch (error) {
    logger.error("Failed to get media info", { error, uri });
    return { exists: false };
  }
}

/**
 * Delete a local media file (for cleanup)
 */
export async function deleteLocalMedia(uri: string): Promise<boolean> {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
    logger.info("Local media deleted", { uri: uri.slice(0, 50) });
    return true;
  } catch (error) {
    logger.error("Failed to delete local media", { error, uri });
    return false;
  }
}

/**
 * Get the appropriate MediaType for post creation based on media asset
 */
export function getMediaTypeForPost(asset: MediaAsset): MediaType {
  return asset.type === "video" ? "video" : "photo";
}
