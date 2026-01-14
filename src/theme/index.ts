/**
 * Theme System
 * Centralized export for all theme modules
 *
 * Recommended usage (semantic tokens):
 * import { theme } from '@/theme';
 *
 * <View style={{
 *   backgroundColor: theme.card.background,
 *   borderColor: theme.card.border,
 *   borderRadius: theme.card.borderRadius,
 *   padding: theme.card.padding,
 * }}>
 *   <Text style={{
 *     fontSize: theme.typography.h2.fontSize,
 *     color: theme.text.primary
 *   }}>Title</Text>
 * </View>
 *
 * Alternative (direct primitives):
 * import { colors, spacing, typography } from '@/theme';
 */

import { colors as themeColors } from "./colors";

// Semantic theme tokens (recommended for components)
export { theme } from "./tokens.light"; // Change to "./tokens.dark" for dark theme
export type { Theme } from "./tokens.light";

// Theme context and provider for dynamic theme switching
export { ThemeProvider, useTheme } from "./ThemeContext";

// Design primitives (use when semantic tokens don't fit)
export { colors } from "./colors";
export type { Color, PillarColor, BadgeRarity } from "./colors";

export { spacing, layout, borderRadius, borderWidth, shadow } from "./spacing";
export type { Spacing, BorderRadius } from "./spacing";

export { typography } from "./typography";
export type { FontSize, FontWeight } from "./typography";

export { componentStyles } from "./components";

// Theme helper functions
export function getPillarColor(pillar: "MIND" | "BODY" | "HEART" | "SOUL"): string {
  return themeColors.pillars[pillar];
}

export function getBadgeRarityColor(rarity: "common" | "rare" | "epic" | "legendary"): string {
  return themeColors.badges[rarity];
}
