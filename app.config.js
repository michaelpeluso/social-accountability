/**
 * Dynamic Expo Configuration
 *
 * This replaces app.json for dynamic configuration based on APP_VARIANT.
 * Environment-specific values are set in eas.json build profiles.
 *
 * Pattern:
 * - .env files: LOCAL DEVELOPMENT ONLY (not committed)
 * - eas.json env: API endpoints per build profile (committed)
 * - EAS Secrets: Sensitive values like SUPABASE keys (never in code)
 *
 * Bundle IDs (so both can be installed on same device):
 * - development: com.social.accountability.dev
 * - production:  com.social.accountability
 */

// Get variant from EAS build or default to development
const APP_VARIANT = process.env.APP_VARIANT || "development";

// Variant-specific configuration
const variantConfig = {
  development: {
    name: "Social (Dev)",
    bundleIdentifier: "com.social.accountability.dev",
    package: "com.social.accountability.dev",
    icon: "./assets/icon-dev.png",
  },
  production: {
    name: "Social Accountability",
    bundleIdentifier: "com.social.accountability",
    package: "com.social.accountability",
    icon: "./assets/icon.png",
  },
};

const config = variantConfig[APP_VARIANT] || variantConfig.development;

export default {
  expo: {
    name: config.name,
    slug: "social-accountability",
    version: "0.1.0",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    scheme: "social-accountability",
    jsEngine: "hermes",

    // Use default icon if variant-specific doesn't exist
    icon: "./assets/icon.png",

    ios: {
      supportsTablet: true,
      bundleIdentifier: config.bundleIdentifier,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },

    android: {
      package: config.package,
    },

    extra: {
      // Expose variant to app code via Constants.expoConfig.extra
      appVariant: APP_VARIANT,

      // API endpoints set via eas.json env (non-sensitive, per-environment)
      apiUrl: process.env.EXPO_PUBLIC_API_URL,

      // Supabase values from EAS Secrets (sensitive)
      // These are injected at build time, not in code
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,

      eas: {
        projectId: "b9365fb4-3622-4bb0-b44d-6e99eb17f996",
      },
    },

    owner: "pelsos-org",

    plugins: [
      "expo-router",
      "expo-secure-store",
      "expo-sqlite",
      "expo-video",
      "@react-native-community/datetimepicker",
    ],
  },
};
