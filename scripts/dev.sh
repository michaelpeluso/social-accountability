#!/bin/bash
# Unified development server script
# Combines pre-flight checks with quick start instructions
# Usage: npm run dev

set -e

echo "Social Accountability - Dev Mode"
echo ""

# Check if server is already running on 8081
if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "Port 8081 is in use. Killing existing process..."
    lsof -ti:8081 | xargs kill -9 2>/dev/null || true
    sleep 1
    echo "Port cleared"
    echo ""
fi

echo "Pre-flight checks..."
echo ""

# Type check (fast, catches most issues)
echo "   ✓ Type checking..."
npm run type-check --silent

# Lint (warnings non-blocking)
echo "   ✓ Linting..."
npm run lint --silent || echo "     (warnings detected but non-blocking)"

echo ""
echo "Ready to start!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "CONNECT YOUR IPHONE:"
echo "   1. Open Expo Go app"
echo "   2. Tap 'Scan QR code'"
echo "   3. Scan QR that appears below"
echo "   4. Wait 10-20 seconds for first load"
echo ""
echo "KEYBOARD SHORTCUTS (once connected):"
echo "   r  - Reload app"
echo "   j  - Open debugger"
echo "   m  - Toggle menu"
echo "   c  - Clear cache"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npx expo start