/**
 * Avatar Component
 * Reusable avatar with image or initials fallback
 */

import { View, Text, Image, StyleSheet, type ViewStyle } from "react-native";
import { useTheme } from "../../theme";
import { typography } from "../../theme/typography";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  /** Image URL for the avatar */
  imageUrl?: string | null;
  /** Name to extract initials from (fallback when no image) */
  name?: string | null;
  /** Size preset */
  size?: AvatarSize;
  /** Custom background color (overrides theme) */
  backgroundColor?: string;
  /** Custom text color for initials */
  textColor?: string;
  /** Additional container style */
  style?: ViewStyle;
}

const SIZE_MAP: Record<AvatarSize, { container: number; fontSize: number }> = {
  xs: { container: 24, fontSize: 10 },
  sm: { container: 32, fontSize: 12 },
  md: { container: 40, fontSize: 16 },
  lg: { container: 56, fontSize: 22 },
  xl: { container: 80, fontSize: 32 },
};

export function Avatar({
  imageUrl,
  name,
  size = "md",
  backgroundColor,
  textColor,
  style,
}: AvatarProps) {
  const { theme } = useTheme();
  const { container: containerSize, fontSize } = SIZE_MAP[size];
  const borderRadius = containerSize / 2;

  const initials = name?.charAt(0)?.toUpperCase() ?? "?";
  const bgColor = backgroundColor ?? theme.semantic.primary;
  const txtColor = textColor ?? "#fff";

  return (
    <View
      style={[
        styles.container,
        {
          width: containerSize,
          height: containerSize,
          borderRadius,
          backgroundColor: bgColor,
        },
        style,
      ]}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={[
            styles.image,
            {
              width: containerSize,
              height: containerSize,
              borderRadius,
            },
          ]}
        />
      ) : (
        <Text
          style={[
            styles.initials,
            {
              fontSize,
              color: txtColor,
            },
          ]}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  image: {
    resizeMode: "cover",
  },
  initials: {
    fontWeight: typography.fontWeight.semibold,
  },
});
