#!/bin/bash
# Reset Database - Forces complete schema rebuild
# Use this when migrations fail or schema gets corrupted
# WARNING: This will delete all local data

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "DATABASE RESET UTILITY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  WARNING: This will delete all local data"
echo ""
echo "Common scenarios:"
echo "  • Migration failed or stuck"
echo "  • 'no such table' errors"
echo "  • Schema mismatch after pull"
echo ""
read -p "Continue? (type 'yes' to confirm): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "Resetting database..."

# The database file location varies by platform:
# iOS Simulator: ~/Library/Developer/CoreSimulator/Devices/[UUID]/data/Containers/Data/Application/[UUID]/Library/LocalDatabase/
# Android Emulator: ~/Library/Android/sdk/platform-tools/adb shell "run-as [package] rm databases/*"
# Physical device: Managed by Expo - need to clear app data manually

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "MANUAL STEPS REQUIRED:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "On your iOS device/simulator:"
echo "  1. Close the app completely"
echo "  2. Delete the app from your device"
echo "  3. Reinstall via Expo Go"
echo "  4. Or: In Expo Go, shake device → 'Reload' → Clear cache"
echo ""
echo "On Android device/emulator:"
echo "  1. Settings → Apps → Expo Go"
echo "  2. Storage → Clear data"
echo "  3. Or: Long press app → App info → Storage → Clear data"
echo ""
echo "After clearing:"
echo "  npm run dev"
echo ""
echo "Database will be recreated with latest schema (v8)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
