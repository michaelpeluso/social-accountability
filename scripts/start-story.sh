#!/bin/bash

# Interactive script to select and start working on a user story
# Usage: bash scripts/work-on-story.sh

# Prompt for milestone
echo "Enter milestone (e.g., M0, M1, M2) or 'all' for all stories:"
read -r MILESTONE

if [ -z "$MILESTONE" ]; then
  echo "Error: Milestone is required"
  exit 1
fi

# Convert to uppercase
MILESTONE=$(echo "$MILESTONE" | tr '[:lower:]' '[:upper:]')

echo ""
echo "Fetching stories for $MILESTONE..."
echo ""

# Fetch stories based on milestone
if [ "$MILESTONE" == "ALL" ]; then
  STORIES=$(gh issue list \
    --search "is:issue is:open \[M" \
    --state open \
    --json number,title \
    --jq '.[] | "\(.number)|\(.title)"' | sort -t'|' -k2)
else
  SEARCH_PATTERN="is:issue is:open \"[${MILESTONE}-\" in:title"
  STORIES=$(gh issue list \
    --search "$SEARCH_PATTERN" \
    --state open \
    --json number,title \
    --jq '.[] | "\(.number)|\(.title)"' | sort -t'|' -k2)
fi

if [ -z "$STORIES" ]; then
  echo "No open stories found for $MILESTONE"
  exit 0
fi

# Display stories with numbers
echo "Available stories:"
echo ""
COUNTER=1
declare -A STORY_MAP

while IFS='|' read -r ISSUE_NUMBER TITLE; do
  # Extract story ID from title
  STORY_ID=$(echo "$TITLE" | sed -n 's/^\[\(M[0-9]\+-[0-9]\+\.[0-9]\+\)\].*/\1/p')
  
  if [ -n "$STORY_ID" ]; then
    echo "  $COUNTER) $STORY_ID - $TITLE"
    STORY_MAP[$COUNTER]="$ISSUE_NUMBER|$TITLE"
    COUNTER=$((COUNTER + 1))
  fi
done <<< "$STORIES"

if [ $COUNTER -eq 1 ]; then
  echo "No stories found"
  exit 0
fi

echo ""
echo "Select a story (enter number):"
read -r SELECTION

# Validate selection
if ! [[ "$SELECTION" =~ ^[0-9]+$ ]] || [ -z "${STORY_MAP[$SELECTION]}" ]; then
  echo "Error: Invalid selection"
  exit 1
fi

# Get selected issue
SELECTED="${STORY_MAP[$SELECTION]}"
ISSUE_NUMBER=$(echo "$SELECTED" | cut -d'|' -f1)
ISSUE_TITLE=$(echo "$SELECTED" | cut -d'|' -f2-)

echo ""
echo "Starting work on issue #$ISSUE_NUMBER: $ISSUE_TITLE"
echo ""

# Fetch full issue details
ISSUE_STATE=$(gh issue view "$ISSUE_NUMBER" --json state --jq '.state' 2>/dev/null)
if [ "$ISSUE_STATE" == "closed" ]; then
  echo "Warning: Issue #$ISSUE_NUMBER is closed"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
  fi
fi

# Extract story ID from title (e.g., [M0-0.6] -> M0-0.6)
STORY_ID=$(echo "$ISSUE_TITLE" | sed -n 's/^\[\(M[0-9]\+-[0-9]\+\.[0-9]\+\)\].*/\1/p')

if [ -z "$STORY_ID" ]; then
  # Fallback to issue number if no story ID found
  BRANCH_PREFIX="$ISSUE_NUMBER"
  SLUG=$(echo "$ISSUE_TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//' | cut -c1-50)
else
  # Use story ID as prefix
  BRANCH_PREFIX="$STORY_ID"
  # Remove [M*-*.*] prefix from title for slug
  SLUG=$(echo "$ISSUE_TITLE" | sed 's/^\[.*\] //' | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//' | cut -c1-50)
fi

BRANCH_NAME="${BRANCH_PREFIX}-${SLUG}"

echo "Creating branch: $BRANCH_NAME"

# Check if branch already exists
if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
  echo "Branch already exists, switching to it..."
  git checkout "$BRANCH_NAME"
else
  git checkout -b "$BRANCH_NAME"
fi

# Link branch to issue using gh issue develop (creates linked branch on GitHub)
echo "Linking branch to issue #$ISSUE_NUMBER..."
gh issue develop "$ISSUE_NUMBER" --checkout --name "$BRANCH_NAME" 2>/dev/null || echo "Note: Branch already linked or linking not available"

# Update issue status in GitHub Project to "In Progress"
echo "Setting issue #$ISSUE_NUMBER to 'In Progress' in project..."

# Get the project item ID for this issue
PROJECT_ID="PVT_kwHOBZ18Zs4BLqdH"
STATUS_FIELD_ID="PVTSSF_lAHOBZ18Zs4BLqdHzg7K3SQ"
IN_PROGRESS_OPTION_ID="47fc9ee4"

ITEM_ID=$(gh api graphql -f query='
  query {
    node(id: "PVT_kwHOBZ18Zs4BLqdH") {
      ... on ProjectV2 {
        items(first: 100) {
          nodes {
            id
            content {
              ... on Issue {
                number
              }
            }
          }
        }
      }
    }
  }' --jq ".data.node.items.nodes[] | select(.content.number == $ISSUE_NUMBER) | .id" 2>/dev/null)

if [ -n "$ITEM_ID" ]; then
  gh project item-edit --project-id "$PROJECT_ID" --id "$ITEM_ID" --field-id "$STATUS_FIELD_ID" --single-select-option-id "$IN_PROGRESS_OPTION_ID" 2>/dev/null && echo "Updated to 'In Progress'" || echo "Note: Could not update project status"
else
  echo "Note: Issue not found in project (will be added on first push)"
fi

echo ""
echo "Ready to work on issue #$ISSUE_NUMBER"
echo "   Branch: $BRANCH_NAME"
echo "   Issue: https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/issues/$ISSUE_NUMBER"
echo ""
echo "When done:"
echo "   1. Commit your changes"
echo "   2. Push: git push -u origin $BRANCH_NAME"
echo "   3. Create PR with 'closes #$ISSUE_NUMBER' in description"
