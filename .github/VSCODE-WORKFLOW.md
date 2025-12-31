# VSCode + GitHub CLI Workflow Guide

## Setup (One-Time)

### 1. Install GitHub CLI

```bash
# Windows (Chocolatey)
choco install gh

# Or download from: https://cli.github.com/
```

### 2. Authenticate

```bash
gh auth login
# Follow prompts to authenticate with GitHub
```

### 3. Install VSCode GitHub Extension

- Install: "GitHub Pull Requests and Issues" (ID: GitHub.vscode-pull-request-github)
- Authenticates automatically with gh CLI

---

## Daily Workflow (Never Leave VSCode)

### Create Issue (VSCode)

```
1. Ctrl+Shift+P → "GitHub Issues: Create Issue"
2. Title: "Add habit creation form"
3. Body: Details
4. Assign to yourself
5. Add milestone: M2
6. Create
```

**Or via terminal in VSCode:**

```bash
gh issue create --title "Add habit creation form" --body "Implement M2 story 2.2" --label M2 --assignee @me
```

### View Issues (VSCode Sidebar)

```
1. Click GitHub icon in sidebar
2. See: My Issues, All Issues, PRs
3. Click issue to view/edit
4. Start working → auto-moves to "In Progress" (if project set up)
```

### Create Branch from Issue (VSCode Terminal)

```bash
# Creates branch named: feature/123-add-habit-form
gh issue develop 123 --checkout

# Or manual:
git checkout -b feat/habit-creation
```

### Commit and Push (Automatic Hooks)

```bash
git add .
git commit -m "feat: add habit creation form (closes #123)"
# ✅ Pre-commit hook: formats + lints
# ✅ Commit-msg hook: validates format
git push

# ✅ Pre-push hook: type-checks
```

### Create PR (VSCode)

```
1. Ctrl+Shift+P → "GitHub Pull Requests: Create Pull Request"
2. Title: Auto-filled from commit
3. Description: Auto-links issue if "closes #123" in commits
4. Create
```

**Or via terminal:**

```bash
gh pr create --title "feat: add habit creation form" --body "Closes #123" --assignee @me
```

### View CI Status (VSCode)

```
1. GitHub sidebar → Pull Requests
2. Click your PR
3. See CI checks in real-time
4. Click failed check → see logs
```

### Merge PR (VSCode or CLI)

```bash
# Check status
gh pr status

# Merge when ready
gh pr merge --squash --delete-branch

# ✅ Automation: Issue auto-moves to "Done"
# ✅ Automation: Issue auto-closes
```

---

## GitHub Projects Integration

### Setup Project (One-Time, in Browser)

```
1. Go to: https://github.com/users/YOUR_USERNAME/projects
2. New project → Board
3. Name: "Social Accountability"
4. Columns: Backlog, M0, M1, M2, M3, M4, In Progress, Review, Done
5. Settings → Workflows → Enable automation
```

### Automation Flow (Automatic)

```
Issue created → Backlog
Issue assigned → In Progress
PR opened → Review (linked issues)
PR merged → Done (linked issues + auto-close)
```

### View Project in VSCode

```bash
# View issues by milestone
gh issue list --label M2

# View PRs
gh pr list

# View project status
gh project list
gh project view 1
```

---

## Common Commands (VSCode Terminal)

### Issues

```bash
# Create
gh issue create --title "..." --body "..." --label M2 --assignee @me

# List
gh issue list
gh issue list --label M2 --state open
gh issue list --assignee @me

# View
gh issue view 123

# Close
gh issue close 123

# Reopen
gh issue reopen 123
```

### Pull Requests

```bash
# Create
gh pr create --fill  # Uses commits for title/body

# List
gh pr list
gh pr list --author @me

# View
gh pr view 456

# Check CI status
gh pr checks

# Review
gh pr review 456 --approve
gh pr review 456 --comment --body "LGTM"

# Merge
gh pr merge 456 --squash --delete-branch
```

### Workflow

```bash
# View recent workflow runs
gh run list

# Watch CI run
gh run watch

# View logs
gh run view --log
```

---

## VSCode Extensions (Recommended)

1. **GitHub Pull Requests and Issues** (GitHub.vscode-pull-request-github)
   - Manage issues/PRs from sidebar
   - Review PRs inline
   - Create issues with templates

2. **GitLens** (eamodio.gitlens)
   - Git blame inline
   - Commit history
   - Branch management

3. **GitHub Actions** (github.vscode-github-actions)
   - View workflow runs
   - See CI status
   - Trigger workflows

---

## Example: Complete Feature Flow (Never Leave VSCode)

### 1. Start Work

```bash
# In VSCode terminal
gh issue create --title "Add habit creation form" --body "M2 story 2.2" --label M2 --assignee @me
# Returns: Created issue #123

gh issue develop 123 --checkout
# Creates branch: feature/123-add-habit-creation-form
```

### 2. Code

```typescript
// Edit files in VSCode
// Save → auto-format on save (if configured)
```

### 3. Commit

```bash
git add .
git commit -m "feat: add habit creation form UI (closes #123)"
# ✅ Hooks run automatically
git push
```

### 4. Create PR

```bash
gh pr create --fill --assignee @me
# Auto-fills from commits, auto-links #123
```

### 5. Monitor CI

```
- GitHub sidebar → PRs → Click yours
- Watch checks in real-time
- If failure: click check → view logs
```

### 6. Merge

```bash
gh pr merge --squash --delete-branch
# ✅ Issue #123 auto-moves to Done
# ✅ Issue #123 auto-closes
# ✅ Branch deleted
```

### 7. Done! 🎉

```bash
git checkout main
git pull
# Ready for next feature
```

**Total context switches: 0** - Everything in VSCode!

---

## Project Management from VSCode

### View Kanban Board

```bash
# View all issues grouped by milestone
gh issue list --label M0
gh issue list --label M1
gh issue list --label M2

# View by status
gh issue list --state open --assignee @me
gh pr list --state open
```

### Track Progress

```bash
# See what's in progress
gh issue list --label M2 --state open

# See what needs review
gh pr list --state open

# See completed work
gh issue list --state closed --label M2
```

### Plan Sprint (Milestones)

```bash
# Create milestone
gh api repos/:owner/:repo/milestones -f title="M2 Sprint 1" -f due_on="2025-02-01T00:00:00Z"

# Add issues to milestone
gh issue create --title "..." --milestone "M2 Sprint 1"

# View milestone progress
gh issue list --milestone "M2 Sprint 1"
```

---

## Keyboard Shortcuts (VSCode)

```
Ctrl+Shift+P → Command palette (all GitHub commands)
Ctrl+Shift+G → Source control (Git)
Ctrl+` → Terminal
Ctrl+B → Toggle sidebar

# With GitHub extension:
Alt+I → Create issue
Alt+P → Create PR
Alt+V → View PR
```

---

## Tips

1. **Use `gh` CLI** - Faster than clicking in browser
2. **Link issues in commits** - Use "closes #123" for auto-close
3. **Watch CI in VSCode** - No need to open browser
4. **Use conventional commits** - Hooks enforce this
5. **Squash merge** - Keeps history clean
6. **Delete branches** - Keep repo tidy (auto-deleted on merge)

---

## Result

**100% VSCode workflow:**

- Create issues → VSCode
- Create branches → VSCode terminal
- Code → VSCode editor
- Commit → VSCode terminal (hooks auto-run)
- Create PR → VSCode
- Review CI → VSCode sidebar
- Merge → VSCode terminal
- View project status → VSCode terminal

**Zero browser context switches needed!** 🎉
