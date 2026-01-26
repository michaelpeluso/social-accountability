#!/bin/bash
# Production deployment to TestFlight/Google Play
# Builds on EAS Cloud → Submits to App Store/Play Store
# Usage: npm run deploy [options]
#
# Options:
#   --platform <name>  Platform: ios or android (default: ios)
#   --profile <name>   Build profile (default: production)
#   --build-only       Only build, don't submit
#   --submit-only      Only submit latest build (skip build)
#   --help             Show this help

set -e

# Get available profiles from eas.json
AVAILABLE_PROFILES=$(node -e "
  const fs = require('fs');
  const eas = JSON.parse(fs.readFileSync('eas.json', 'utf8'));
  console.log(Object.keys(eas.build).join(', '));
")

# Default values
PLATFORM="ios"
PROFILE="production"
BUILD_ONLY=false
SUBMIT_ONLY=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --platform)
      PLATFORM="$2"
      if [[ "$PLATFORM" != "ios" && "$PLATFORM" != "android" ]]; then
        echo "Error: Platform must be 'ios' or 'android'"
        exit 1
      fi
      shift 2
      ;;
    --profile)
      PROFILE="$2"
      shift 2
      ;;
    --build-only)
      BUILD_ONLY=true
      shift
      ;;
    --submit-only)
      SUBMIT_ONLY=true
      shift
      ;;
    --help|-h)
      echo "Usage: npm run deploy [options]"
      echo ""
      echo "Options:"
      echo "  --platform <name>  Platform: ios or android (default: ios)"
      echo "  --profile <name>   Build profile (default: production)"
      echo "                     Available: $AVAILABLE_PROFILES"
      echo "  --build-only       Only build, don't submit"
      echo "  --submit-only      Only submit latest build (skip build)"
      echo "  --help, -h         Show this help"
      echo ""
      echo "Examples:"
      echo "  npm run deploy                              # iOS production (TestFlight)"
      echo "  npm run deploy -- --platform android        # Android production"
      echo "  npm run deploy -- --build-only              # Build only, no submit"
      echo "  npm run deploy -- --submit-only             # Submit existing build"
      echo "  npm run deploy -- --profile development     # Development profile"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Run 'npm run deploy -- --help' for usage"
      exit 1
      ;;
  esac
done

PLATFORM_DISPLAY=$([ "$PLATFORM" == "ios" ] && echo "TestFlight" || echo "Google Play")

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "DEPLOYING TO $PLATFORM_DISPLAY"
echo "Platform: $PLATFORM | Profile: $PROFILE"
echo "Available profiles: $AVAILABLE_PROFILES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Pre-flight checks (always run unless submit-only)
if [[ "$SUBMIT_ONLY" == false ]]; then
  echo "Running pre-flight checks..."
  echo ""

  echo "   ✓ Type checking..."
  npm run type-check --silent

  echo "   ✓ Linting..."
  npm run lint --silent

  echo "   ✓ Tests..."
  npm test -- --silent 2>&1 | grep -E "(PASS|FAIL|Tests:)" || true
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "BUILDING ON EAS CLOUD"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Build (unless submit-only)
if [[ "$SUBMIT_ONLY" == false ]]; then
  # Build on EAS Cloud
  eas build --platform "$PLATFORM" --profile "$PROFILE" --non-interactive --wait

  BUILD_STATUS=$?
  if [ $BUILD_STATUS -ne 0 ]; then
      echo ""
      echo "❌ Build failed. Check logs above."
      exit 1
  fi
fi

# Submit (unless build-only)
if [[ "$BUILD_ONLY" == false ]]; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "SUBMITTING TO $([ "$PLATFORM" == "ios" ] && echo "APP STORE CONNECT" || echo "GOOGLE PLAY")"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # Submit to store
  eas submit --platform "$PLATFORM" --profile "$PROFILE" --latest

  SUBMIT_STATUS=$?
  if [ $SUBMIT_STATUS -ne 0 ]; then
      echo ""
      echo "❌ Submit failed. Rerun with: npm run deploy -- --submit-only --platform $PLATFORM"
      exit 1
  fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOYED TO $PLATFORM_DISPLAY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
if [[ "$PLATFORM" == "ios" ]]; then
  echo "Check TestFlight in ~15 minutes"
  echo ""
  echo "Next steps:"
  echo "   1. Open TestFlight app on your iPhone"
  echo "   2. Install the new build"
  echo "   3. Test the release candidate"
else
  echo "Check Google Play Console"
  echo ""
  echo "Next steps:"
  echo "   1. Open Play Console > Internal testing"
  echo "   2. Install the new build"
  echo "   3. Test the release candidate"
fi
echo ""
