// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(path.resolve(__dirname, '..'));

// Add wasm support for web (expo-sqlite web support)
config.resolver.assetExts = config.resolver.assetExts || [];
config.resolver.assetExts.push('wasm');

// Add platform-specific extensions for database
config.resolver.sourceExts = config.resolver.sourceExts || [];
if (!config.resolver.sourceExts.includes('web.ts')) {
  config.resolver.sourceExts.push('web.ts');
}
if (!config.resolver.sourceExts.includes('web.tsx')) {
  config.resolver.sourceExts.push('web.tsx');
}

module.exports = config;
