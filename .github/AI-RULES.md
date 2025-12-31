# AI Agent Rules

## Documentation Policy

**CRITICAL: Minimize new documentation files**

### When to Create New MD Files

✅ **Only create if:**

- Core architectural decisions (like architecture.md, data-model.md)
- Critical security/privacy rules (like CODING-STANDARDS.md)
- Essential workflow guides (like QUICKSTART.md, dev-guide.md)
- Milestone specifications (M0-M5)

❌ **Do NOT create:**

- Status updates (use comments in code or git commit messages)
- Setup summaries (already covered in existing docs)
- Quick reference guides (cheatsheet already exists)
- Temporary documentation
- Duplicate information

### Existing Documentation is Comprehensive

The project already has:

- `/docs/QUICKSTART.md` - Navigation hub
- `/docs/CHEATSHEET.md` - Quick reference
- `/docs/spec/` - Complete feature specifications
- `/docs/rules/` - Coding standards
- `/.github/copilot-instructions.md` - AI context
- `README.md` - Project overview

**Before creating a new MD file, ask: "Could this go in an existing file or git commit message?"**

---

## Automation Status

### ✅ Fully Automated (No Manual Action)

1. **Pre-commit hooks** - Run automatically when you `git commit`
   - Lints changed files
   - Formats changed files
   - No need to run `npm run lint` or `npm run format` manually

2. **Commit message validation** - Runs automatically on `git commit`
   - Enforces conventional commit format
   - Rejects invalid messages

3. **Pre-push type-check** - Runs automatically on `git push`
   - Checks TypeScript types
   - No need to run `npm run type-check` manually

4. **GitHub Actions CI** - Runs automatically on PR/push to main
   - Full test suite
   - Lint, format, type-check validation
   - Coverage reporting

### 🔧 Manual Commands (Only When Needed)

- `npm test` - Run tests locally before committing (optional)
- `npm run lint -- --fix` - Manually fix all lint issues (if many errors)
- `npm run format` - Format all files (if you want to clean up everything)

### Workflow Example

```bash
# 1. Make code changes
vim src/lib/logger.ts

# 2. Commit (hooks run automatically)
git add .
git commit -m "feat: improve logger"
# ✅ Pre-commit hook: lints + formats changed files
# ✅ Commit-msg hook: validates message format

# 3. Push (hook runs automatically)
git push
# ✅ Pre-push hook: type-checks entire project
# ✅ GitHub Actions: full CI pipeline

# You never manually ran lint/format/type-check! 🎉
```

---

## Config File Organization

### Root Directory Files Are Standard

JavaScript/TypeScript projects have many root config files. This is **normal and expected**:

**Build/Runtime:**

- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript config
- `jest.config.js` - Test config

**Code Quality:**

- `.eslintrc.js` - Linting rules
- `.prettierrc.json` - Formatting rules
- `commitlint.config.js` - Commit message rules

**Tooling:**

- `.lintstagedrc.json` - Pre-commit file processor
- `.gitignore` - Git ignore patterns
- `.env` - Environment variables (not committed)

**Hidden Folders:**

- `.github/` - GitHub Actions and config
- `.husky/` - Git hooks
- `node_modules/` - Dependencies (not committed)

### ✅ This is Industry Standard

All major projects have 10-15 config files in root:

- React: 12 config files
- Next.js: 14 config files
- Expo: 10 config files
- Your project: 11 config files ✅

### ❌ Don't Move Config Files to Subdirectories

Tools expect config files in root:

- ESLint looks for `.eslintrc.js` in root
- Prettier looks for `.prettierrc.json` in root
- TypeScript looks for `tsconfig.json` in root

**Moving them breaks the toolchain.**

---

## Deprecation Warnings

### ✅ Safe to Ignore (For Now)

The npm deprecation warnings you see are:

- `inflight@1.0.6` - Used by old dependencies
- `rimraf@3.0.2` - Used by build tools
- `glob@7.2.3` - Used by various tools
- Babel plugin warnings - Used by Expo/React Native

### Why They're Not Critical

1. **Transitive dependencies** - You don't directly use these
2. **Expo/React Native ecosystem** - They control the versions
3. **No security vulnerabilities** - Just old packages
4. **Will be fixed upstream** - When Expo/RN update

### When to Act

- ⚠️ **Security vulnerabilities** - Run `npm audit fix`
- ⚠️ **Your direct dependencies** - Upgrade in package.json
- ✅ **Transitive deprecations** - Wait for upstream fixes

### Your Current Status

```
3 low severity vulnerabilities
```

These are in transitive dependencies (not your code). Can be ignored for M0 development.

---

## Summary for AI Agents

1. **Documentation:** Only create MD files for critical architecture/specs
2. **Automation:** Hooks run automatically - no manual commands needed
3. **Deprecations:** Safe to ignore - focus on building M0 features
4. **Root files:** Standard JavaScript project structure - don't reorganize

**Focus on building features, not managing tooling.**
