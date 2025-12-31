# Branch Protection Setup

Since branch protection rules require GitHub Pro or a public repository, here's how to set up basic protections:

## Current Status

✅ **main** is now the default branch
✅ **master** branch deleted
✅ CI workflows run on all pushes (lightweight checks: type-check, lint)
✅ **branch-protection.yml** workflow runs heavy checks (format, tests) on PRs and provides the merge gate

## Manual Branch Protection Setup

### Option 1: Make Repository Public (Recommended for Open Source)

```bash
gh repo edit --visibility public
```

Then enable branch protection at:
https://github.com/michaelpeluso/social-accountability/settings/branches

Settings to enable:

- ✅ Require status checks to pass before merging
  - ✅ type-check
  - ✅ lint
  - ✅ format-check
  - ✅ test
- ✅ Require branches to be up to date before merging

### Option 2: Use Repository Rulesets (Free)

Go to: https://github.com/michaelpeluso/social-accountability/settings/rules

Create a new ruleset:

- Target: `main` branch
- Rules:
  - ✅ Restrict deletions
  - ✅ Require status checks to pass
  - ✅ Block force pushes

### Option 3: Workflow-Based Protection ✅ (Current Setup)

**Already implemented**: `.github/workflows/branch-protection.yml`

This workflow now:

- ✅ Runs lightweight checks on **every push** (type-check, lint) for fast feedback (~30s)
- ✅ Runs heavier checks on **PRs to main** (format, test) to keep push CI fast
- ✅ Creates a single "All checks must pass" gate status on PRs
- ✅ Blocks direct pushes to main in CI (pushes show failure if you bypass PRs)

**How to use**:

```bash
# 1. Create feature branch
git checkout -b feat/my-feature

# 2. Make changes
git add .
git commit -m "feat: add feature"

# 3. Push and create PR
git push -u origin feat/my-feature
gh pr create --fill

# 4. Wait for "All checks must pass" ✅
# 5. Merge when green
```

**Note**: This gives you visibility but doesn't physically block merges. You need GitHub Pro or public repo for true enforcement.

Your pre-commit hooks also enforce locally:

- ✅ TypeScript type checking
- ✅ Linting
- ✅ Formatting
- ✅ Tests

## Current Safeguards

✅ **Implemented**: Workflow-based protection (`.github/workflows/branch-protection.yml`)

You have multiple layers of protection:

1. **Pre-commit hooks** - Blocks bad commits locally before they reach GitHub
2. **Branch protection workflow** - Runs all checks on PRs, shows "All checks must pass" status
3. **CI on push** - Double-checks everything on GitHub servers
4. **PR checks** - Semantic titles, size labels, status indicators

**What works now**:

- All PRs show clear pass/fail status before merge (gate job)
- Feature-branch pushes get early warnings via type-check + lint
- Direct pushes to main fail the "Block Direct Push to Main" job
- Pre-commit hooks catch most issues before push

**What needs GitHub Pro or public repo**:

- Physically blocking merges when checks fail
- Preventing force pushes
- Requiring PR reviews

## Recommended Workflow

**Always use branches + PRs** (even solo development):

```bash
# Start new feature
git checkout -b feat/habit-form

# Make changes, commit with pre-commit checks
git add .
git commit -m "feat: add habit creation form"

# Push and create PR
git push -u origin feat/habit-form
gh pr create --title "feat: add habit creation form" --body "Implements M2 story 2.2"

# Wait for checks ✅ (branch-protection workflow shows "All checks must pass")
# Review changes on GitHub
# Merge when ready

gh pr merge --squash --delete-branch
```

**What happens**:

1. Pre-commit hooks validate locally before commit
2. Push triggers CI checks
3. `branch-protection.yml` runs all checks, shows single gate status
4. You see clear ✅ or ❌ before merging
5. Manual discipline: only merge when green!

**For true enforcement**: Make repo public or upgrade to Pro ($4/mo)
