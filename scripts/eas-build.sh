#!/bin/bash
# ============================================================================
# EAS Build Script - Run from anywhere (Windows or Mac)
# ============================================================================
# Triggers cloud builds on EAS. No Mac required.

set -e

PROFILE=${1:-development}
PLATFORM=${2:-ios}

echo "   Building Social Accountability..."
echo "   Profile: $PROFILE"
echo "   Platform: $PLATFORM"
echo ""

# Validate profile
if [[ ! "$PROFILE" =~ ^(development|preview|production)$ ]]; then
    echo "Invalid profile. Use: development, preview, or production"
    exit 1
fi

# Validate platform
if [[ ! "$PLATFORM" =~ ^(ios|android|all)$ ]]; then
    echo "Invalid platform. Use: ios, android, or all"
    exit 1
fi

echo "Starting EAS build..."
echo "   This runs in the cloud - no Mac needed!"
echo ""

if [ "$PLATFORM" == "all" ]; then
    npx eas-cli build --profile $PROFILE --platform all --non-interactive
else
    npx eas-cli build --profile $PROFILE --platform $PLATFORM --non-interactive
fi

echo ""
echo "Build submitted!"
echo ""
echo "Check status at: https://expo.dev/accounts/pelsos-org/projects/social-accountability/builds"
echo ""
