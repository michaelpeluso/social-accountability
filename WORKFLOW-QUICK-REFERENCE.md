# Workflow Quick Reference

## Daily Development Workflow

### 1. View Open Stories

```bash
# View stories for a specific milestone
bash scripts/list-stories.sh M1
bash scripts/list-stories.sh M2

# View all open stories
bash scripts/list-stories.sh --all
```

### 2. Start Working on a Story

```bash
# Start story #42
bash scripts/start-story.sh 42
```

This will:

- ✅ Create branch: `42-story-title-slug`
- ✅ Set issue status to "In Progress"
- ✅ Switch to the new branch

### 3. Make Changes & Commit

```bash
git add .
git commit -m "feat: implement feature for #42"
```

### 4. Push & Create PR

```bash
# First push (sets upstream)
git push -u origin 42-story-title-slug

# Create PR (include "closes #42" in description)
gh pr create --title "feat: implement feature" --body "closes #42"
```

### 5. Merge PR

When PR merges:

- ✅ Issue automatically moves to "Done"
- ✅ Issue automatically closes
- ✅ Branch can be deleted

---

## Branch Naming Convention

**Format:** `<issue-number>-<slug>`

**Examples:**

- `42-add-user-authentication`
- `78-fix-login-bug`
- `5-m0-01-project-setup`

**No prefix required** - The issue number is sufficient for tracking.

---

## Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <description>

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples:**

```bash
git commit -m "feat: add login form"
git commit -m "fix: resolve authentication bug #42"
git commit -m "docs: update API documentation"
```

---

## Issue Management

### View Issue Details

```bash
gh issue view 42
```

### Comment on Issue

```bash
gh issue comment 42 --body "Working on this now"
```

### Close Issue Manually

```bash
gh issue close 42 --comment "Completed"
```

### Reopen Issue

```bash
gh issue reopen 42
```

---

## Project Board

Issues automatically sync with GitHub Projects:

- New issues → "Backlog"
- Branch created → "In Progress"
- PR merged → "Done"

View board: https://github.com/michaelpeluso/social-accountability/projects/3
