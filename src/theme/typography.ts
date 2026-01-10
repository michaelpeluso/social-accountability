/**
 * Typography
 * Font sizes, weights, line heights
 */

export const typography = {
  fontSize: {
    xxs: 10,
    xs: 12,
    sm: 14,
    base: 16,
    md: 17,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40,
    hero: 64,
  },

  fontWeight: {
    normal: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Semantic text styles
  heading: {
    h1: {
      fontSize: 32,
      fontWeight: "700" as const,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: 24,
      fontWeight: "600" as const,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: 20,
      fontWeight: "600" as const,
      lineHeight: 1.4,
    },
  },

  body: {
    large: {
      fontSize: 18,
      fontWeight: "400" as const,
      lineHeight: 1.5,
    },
    base: {
      fontSize: 16,
      fontWeight: "400" as const,
      lineHeight: 1.5,
    },
    small: {
      fontSize: 14,
      fontWeight: "400" as const,
      lineHeight: 1.5,
    },
  },

  caption: {
    fontSize: 12,
    fontWeight: "400" as const,
    lineHeight: 1.4,
  },

  button: {
    fontSize: 16,
    fontWeight: "600" as const,
    lineHeight: 1.2,
  },
} as const;

export type FontSize = keyof typeof typography.fontSize;
export type FontWeight = keyof typeof typography.fontWeight;
