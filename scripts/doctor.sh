#!/bin/bash
# Troubleshooting helper script
# Usage: npm run doctor

set -e

echo "🩺 Running diagnostics..."
echo ""

# Check Node version
echo "1️⃣  Node.js version:"
node --version
echo ""

# Check npm version
echo "2️⃣  npm version:"
npm --version
echo ""

# Check if on correct WiFi (for iPhone testing)
echo "3️⃣  Network info:"
if command -v ipconfig &> /dev/null; then
    # Windows
    ipconfig | grep -A 5 "Wireless LAN adapter Wi-Fi" | grep "IPv4" || echo "   Not connected to WiFi"
else
    # macOS/Linux
    ifconfig | grep "inet " | grep -v 127.0.0.1 || echo "   No network found"
fi
echo ""

# Check port 8081
echo "4️⃣  Port 8081 status:"
if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "   ⚠️  Port 8081 is IN USE"
    echo "   Run: npm run kill-port"
else
    echo "   ✅ Port 8081 is available"
fi
echo ""

# Check dependencies
echo "5️⃣  Checking critical dependencies..."
if [ -d "node_modules/expo" ]; then
    echo "   ✅ expo installed"
else
    echo "   ❌ expo missing - run: npm install"
fi

if [ -d "node_modules/expo-router" ]; then
    echo "   ✅ expo-router installed"
else
    echo "   ❌ expo-router missing - run: npm install"
fi

if [ -d "node_modules/react-native" ]; then
    echo "   ✅ react-native installed"
else
    echo "   ❌ react-native missing - run: npm install"
fi
echo ""

# Check .env
echo "6️⃣  Environment configuration:"
if [ -f ".env" ]; then
    echo "   ✅ .env file exists"
else
    echo "   ⚠️  .env file missing"
    echo "   Run: cp .env.example .env"
fi
echo ""

# TypeScript check
echo "7️⃣  TypeScript compilation:"
if npm run type-check --silent 2>&1 | grep -q "error"; then
    echo "   ❌ TypeScript errors found"
    echo "   Run: npm run type-check"
else
    echo "   ✅ No TypeScript errors"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 Common fixes:"
echo "   • Port in use: npm run kill-port"
echo "   • Missing deps: npm install"
echo "   • Broken deps: npm run clean"
echo "   • Can't connect: Check same WiFi network"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
