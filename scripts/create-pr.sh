#!/bin/bash

# Create a pull request with validation checks
# Usage: bash scripts/create-pr.sh

set -e

echo "=== PR Creation Validator ==="
echo ""

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

if [ "$CURRENT_BRANCH" == "main" ] || [ "$CURRENT_BRANCH" == "master" ]; then
  echo "Error: Cannot create PR from main/master branch"
  exit 1
fi

echo "Current branch: $CURRENT_BRANCH"
echo ""

# Check if working directory is clean
echo "Checking working directory status..."
if ! git diff-index --quiet HEAD --; then
  echo "Error: Working directory is not clean. Please commit or stash changes."
  git status --short
  exit 1
fi
echo "  Working directory is clean"

# Check if there are unpushed commits
echo ""
echo "Checking for unpushed commits..."
UNPUSHED=$(git log @{u}.. --oneline 2>/dev/null | wc -l || echo "0")

if [ "$UNPUSHED" -gt 0 ]; then
  echo "Error: You have $UNPUSHED unpushed commit(s). Please push first."
  git log @{u}.. --oneline
  echo ""
  echo "Run: git push -u origin $CURRENT_BRANCH"
  exit 1
fi
echo "  All commits are pushed"

# Check for merge conflicts with main
echo ""
echo "Checking for merge conflicts with main..."
git fetch origin main --quiet 2>/dev/null || git fetch origin master --quiet 2>/dev/null || true

# Try a test merge
MAIN_BRANCH="main"
git show-ref --verify --quiet refs/remotes/origin/main || MAIN_BRANCH="master"

if ! git merge-tree "$(git merge-base HEAD origin/$MAIN_BRANCH)" HEAD origin/$MAIN_BRANCH | grep -q '<<<<<<<'; then
  echo "  No merge conflicts detected"
else
  echo "Error: Merge conflicts detected with $MAIN_BRANCH"
  echo "Please merge $MAIN_BRANCH into your branch and resolve conflicts first:"
  echo "  git merge origin/$MAIN_BRANCH"
  exit 1
fi

# Extract issue number from branch name
echo ""
echo "Extracting issue information..."
ISSUE_NUMBER=$(echo "$CURRENT_BRANCH" | grep -oE "^M[0-9]+-[0-9]+\.[0-9]+" | sed 's/M[0-9]\+-//' | sed 's/\.//' || echo "")

if [ -z "$ISSUE_NUMBER" ]; then
  # Fallback: try numeric prefix
  ISSUE_NUMBER=$(echo "$CURRENT_BRANCH" | grep -oE "^[0-9]+" || echo "")
fi

if [ -z "$ISSUE_NUMBER" ]; then
  echo "Warning: Could not extract issue number from branch name"
  echo "Branch format should be: M0-0.1-description or 123-description"
  read -p "Continue without linking to issue? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
  fi
  ISSUE_NUMBER=""
else
  echo "  Detected issue #$ISSUE_NUMBER"
fi

# Get PR title from latest commit
echo ""
echo "Generating PR details..."
COMMIT_TITLE=$(git log -1 --pretty=%s)
PR_TITLE="$COMMIT_TITLE"

# Get PR body from commit messages
COMMIT_BODY=$(git log origin/$MAIN_BRANCH..HEAD --pretty=%B)

if [ -n "$ISSUE_NUMBER" ]; then
  # Link to issue
  PR_BODY="$COMMIT_BODY

---

Linked to issue #$ISSUE_NUMBER"
else
  PR_BODY="$COMMIT_BODY"
fi

echo "  Title: $PR_TITLE"
echo ""

# Create PR
echo "Creating pull request..."
PR_URL=$(printf "%s" "$PR_BODY" | gh pr create --title "$PR_TITLE" --body-file - --base "$MAIN_BRANCH")

echo ""
echo "Pull request created successfully!"
echo "  $PR_URL"
echo ""
echo "The PR will auto-merge when approved and checks pass."
