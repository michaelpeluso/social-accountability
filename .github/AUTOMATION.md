# Automation Shortcuts

## Overview

This file provides PowerShell functions to automate your GitHub workflow even more.

## Setup (One-Time)

### Option 1: Load on-demand

```powershell
# In VSCode PowerShell terminal
. .\.github\workflow-helpers.ps1
```

### Option 2: Auto-load (Recommended)

Add to your PowerShell profile so it loads in every terminal:

```powershell
# Find your profile location
$PROFILE

# Edit it (creates if doesn't exist)
notepad $PROFILE

# Add this line:
. "C:\Users\HP\OneDrive\Desktop\_\Code\Social Accountability\.github\workflow-helpers.ps1"

# Save and restart terminal
```

---

## Quick Commands

### Ultra-Fast Feature Development

**Start feature (creates issue + branch automatically):**

```powershell
feat "Add habit creation form" -Label M2
# Creates issue #X, creates branch, checks it out, ready to code!
```

**Code, then commit with auto-close:**

```powershell
done "feat: add habit form UI" -Closes 123
# Adds all files, commits with hooks, ready to push
```

**Push and create PR:**

```powershell
git push
ghpr -Fill -AssignMe
# Creates PR with auto-filled title/body
```

**Check CI:**

```powershell
ghst
# Shows all check statuses
```

**Merge when ready:**

```powershell
ghm 123
# Squash merges PR #123, deletes branch, closes issue
```

---

## All Available Commands

### Issue Management

```powershell
# Create issue
ghi "Title" -Body "Description" -Label M2 -AssignMe

# Full syntax
New-GitHubIssue -Title "Add feature" -Body "Details" -Label M2 -AssignMe
```

### PR Management

```powershell
# Create PR (auto-fill from commits)
ghpr -Fill -AssignMe

# Create PR (manual)
New-GitHubPR -AssignMe

# Check PR status
ghst
Get-PRStatus

# Merge PR
ghm 123
Merge-GitHubPR -Number 123 -DeleteBranch
```

### View Your Work

```powershell
work
# Shows: My open issues + My open PRs
```

### Complete Workflow

```powershell
# 1. Start feature
feat "Feature name" -Label M2

# 2. Code...

# 3. Commit
done "feat: description" -Closes 123

# 4. Push & PR
git push
ghpr -Fill -AssignMe

# 5. Check CI
ghst

# 6. Merge
ghm 123
```

---

## Example: M2 Feature in 5 Commands

```powershell
# Start
feat "Add habit creation form" -Label M2
# → Creates issue #42, branch 42-add-habit-creation-form

# Code your feature...

# Commit
done "feat: add habit creation form UI" -Closes 42
# → Runs hooks, commits

# Push & PR
git push && ghpr -Fill -AssignMe
# → Creates PR #43

# Check CI
ghst
# → Shows: ✓ All checks passed

# Merge
ghm 43
# → Merges, deletes branch, closes #42
```

**Total time: 2 minutes instead of 10!** 🚀

---

## Comparison

### Before (Manual)

```powershell
powershell -Command "gh issue create --title 'Add form' --body 'Details' --label M2 --assignee '@me'"
powershell -Command "gh issue develop 42 --checkout"
git checkout 42-add-form
git add .
git commit -m "feat: add form (closes #42)"
git push
powershell -Command "gh pr create --fill --assignee '@me'"
powershell -Command "gh pr checks"
powershell -Command "gh pr merge 43 --squash --delete-branch"
```

### After (Automated)

```powershell
feat "Add form" -Label M2
done "feat: add form" -Closes 42
git push && ghpr -Fill -AssignMe
ghst
ghm 43
```

**90% less typing!** ⚡

---

## Tips

1. **Use tab completion**: Type `feat` then press Tab to see parameters
2. **Check your work anytime**: Just type `work`
3. **Always link issues**: Use `-Closes 123` in commits
4. **Push before PR**: Must push branch before creating PR
5. **Load helpers once**: Add to $PROFILE for auto-load

---

## Troubleshooting

**"Command not found"**

- Run: `. .\.github\workflow-helpers.ps1`
- Or add to your $PROFILE

**"gh not recognized"**

- Use PowerShell terminal (not bash)
- Or run: `powershell -Command "command here"`

**"Permission denied"**

- Run: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`
- Allows local scripts to run

---

## Complete M0 Workflow Example

```powershell
# Load helpers
. .\.github\workflow-helpers.ps1

# Create M0 issues for foundation work
feat "Setup TypeScript types" -Label M0
feat "Add error handling" -Label M0
feat "Enhance logger" -Label M0

# View your work
work

# Work on first issue (let's say it's #5)
# ... code types.ts ...

# Commit and push
done "feat: add complete type definitions" -Closes 5
git push
ghpr -Fill -AssignMe

# Check CI
ghst

# Merge when green
ghm 6  # PR number

# Repeat for next issue!
```

---

**You can now complete an entire feature in ~2 minutes!** 🎉
