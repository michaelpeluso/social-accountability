#!/bin/bash
# Comprehensive quality checks
# Run before commits/PRs
# Usage: npm run check

set -e

echo "Running Quality Checks..."
echo ""

echo "1. Type Check"
npm run type-check
echo "   TypeScript passed"
echo ""

echo "2. Linter"
npm run lint
echo "   Linter passed"
echo ""

echo "3. Tests"
npm test -- --passWithNoTests
echo "   Tests passed"
echo ""

echo "4. Format Check"
npm run format:check
echo "   Formatting passed"
echo ""

echo "----------------------------------------"
echo "All checks passed! Ready to commit."
echo "----------------------------------------"