/**
 * Spacing Scale
 * Consistent spacing values for margins, padding, gaps
 */

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  xmd: 10,
  smd: 14,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export type Spacing = keyof typeof spacing;

// Layout-specific spacing
export const layout = {
  screenPadding: spacing.md, // 16px
  sectionGap: spacing.lg, // 24px
  cardPadding: spacing.md, // 16px
  listItemPadding: spacing.sm, // 8px
  buttonPadding: {
    vertical: spacing.sm, // 8px
    horizontal: spacing.md, // 16px
  },
} as const;

// Border radii
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  xmd: 10,
  lg: 12,
  xlg: 14,
  xl: 16,
  xxl: 20,
  xxxl: 24,
  full: 9999,
} as const;

export type BorderRadius = keyof typeof borderRadius;

// Border widths
export const borderWidth = {
  thin: 0.5,
  normal: 1,
  thick: 2,
} as const;

// Shadow presets
export const shadow = {
  small: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  large: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;
