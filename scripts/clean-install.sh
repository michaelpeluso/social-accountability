#!/bin/bash
# Clean installation script - removes all caches and reinstalls dependencies

set -e

echo "Cleaning project..."
rm -rf node_modules
rm -rf package-lock.json
rm -rf .expo
rm -rf node_modules/.cache

echo "Installing dependencies with legacy peer deps..."
npm install --legacy-peer-deps

echo "Clean install complete!"
echo "Run 'npm start' to start the dev server"
