# Scripts Directory

Automation scripts for Social Accountability development workflow.

<<<<<<< HEAD
## Essential Scripts (5 total)
=======
## Essential Scripts (6 total)
>>>>>>> c7e6178 (feat: can open app on phone)

### Daily Development

#### `dev.sh`

**Command:** `npm run dev`

Unified development server startup with pre-flight checks:

- Kills any process on port 8081
- Runs TypeScript type check
- Runs ESLint (warnings non-blocking)
- Starts Expo dev server
- Shows iPhone connection instructions

Use this every morning and after breaks.

---

<<<<<<< HEAD
=======
### Quality & Testing

#### `check.sh`

**Command:** `npm run check`

Comprehensive quality gates before committing:

1. TypeScript type check
2. ESLint
3. Jest tests
4. Prettier format check

All must pass. Run before every commit.

---

>>>>>>> c7e6178 (feat: can open app on phone)
### Maintenance

#### `clean-install.sh`

**Command:** `npm run clean`

Nuclear reinstall for dependency issues:

1. Deletes `node_modules/`
2. Deletes `package-lock.json`
3. Fresh `npm install`
4. Post-install verification

Use when npm is acting weird or dependencies are broken.

---

### Utilities

#### `workflow.sh`

**Command:** `npm run workflow`

Interactive menu system:

<<<<<<< HEAD
1. Start Dev Server
2. Clean Reinstall
3. Run Diagnostics
4. Kill Port 8081
5. Start Story (select & work on GitHub issue)
6. Create PR
7. Generate Issues from Milestones
8. Exit
=======
1. 🚀 Start Dev Server
2. ✅ Quality Checks
3. 🧹 Clean Reinstall
4. 🩺 Run Diagnostics
5. 🔪 Kill Port 8081
6. ❌ Exit
>>>>>>> c7e6178 (feat: can open app on phone)

Use when you forget commands or want guided workflow.

#### `doctor.sh`

**Command:** `npm run doctor`

System diagnostics (7 checks):

1. Node.js version (≥18 required)
2. npm version
3. Network connectivity
4. Port 8081 availability
5. Dependencies installed
6. .env file exists
7. TypeScript compiles

Use when troubleshooting any issues.

#### `kill-port.sh`

**Command:** `npm run kill-port`

Forcefully kills process on port 8081.

Use when dev server won't start due to "port in use" error.

---

## Git Workflow Scripts (3 total)

### `start-story.sh <issue-number>`

**Command:** `bash scripts/start-story.sh 42`

Starts working on a GitHub issue:

- Creates branch: `42-issue-title-slug`
- Marks issue as "In Progress" (adds label)
- Checks out the branch

### `create-pr.sh`

**Command:** `bash scripts/create-pr.sh`

Creates pull request from current branch.

### `generate-issues.js`

**Command:** `node scripts/generate-issues.js`

Bulk creates GitHub issues from milestone files.

---

<<<<<<< HEAD
## Usage Patterns

### 1. Starting Development
=======
## Removed Scripts (Consolidated)

These were removed to simplify the workflow:

- ❌ `dev-start.sh` → Merged into `dev.sh`
- ❌ `quick-start.sh` → Merged into `dev.sh`
- ❌ `test-all.sh` → Now `check.sh`
- ❌ `prod-test.sh` → Use `check.sh` + `expo export`
- ❌ `setup-dev.sh` → Use `npm install` + `workflow.sh`
- ❌ `fix-deps.sh` → Use `clean.sh` instead

---

## Usage Patterns

### Morning Routine
>>>>>>> c7e6178 (feat: can open app on phone)

```bash
cd "c:/path/to/Social Accountability"
npm run dev
# Scan QR code on iPhone
```

<<<<<<< HEAD
### 2. Search/Start New Issue

```bash
./scripts/start-story.sh
```

### 3. Committing/Pushing

```bash
git add .
git commit -m "feat: description"
git push
```

### 4. Create PR

```bash
./scripts/create-pr.sh
=======
### Before Committing

```bash
npm run check
git add .
git commit -m "feat: description"
>>>>>>> c7e6178 (feat: can open app on phone)
```

### When Stuck

```bash
npm run workflow
# Choose option from menu
```

### Troubleshooting

```bash
npm run doctor
# Follow diagnostic recommendations
```

### Dependency Issues

```bash
npm run clean
# Wait for reinstall to complete
npm run dev
```

---

## Design Philosophy

**Principles:**

1. **Single purpose** - Each script does one thing well
2. **Interactive when uncertain** - `workflow.sh` provides guidance
3. **Diagnostic over guessing** - `doctor.sh` shows exactly what's wrong
4. **Safe defaults** - Scripts fail fast and explain errors
5. **No redundancy** - Removed duplicate/overlapping scripts

<<<<<<< HEAD
**Why only 5 core scripts?**

- Most workflows covered by `dev` and hooks (pre-commit, pre-push)
=======
**Why only 6 core scripts?**

- Most workflows covered by `dev` + `check`
>>>>>>> c7e6178 (feat: can open app on phone)
- `workflow` menu handles edge cases
- `doctor` replaces trial-and-error debugging
- Fewer scripts = less cognitive load

---

## Making Scripts Executable

If scripts aren't executable:

```bash
chmod +x scripts/*.sh
```

This is automatic on Unix-like systems but may need manual run on Windows (Git Bash).

---

## Terminal Requirements

**Windows:** Use Git Bash (comes with Git for Windows)

**Mac/Linux:** Default terminal works

**Why Bash?** Cross-platform consistency and better error handling than npm scripts alone.

---

## Contributing New Scripts

Before adding a new script, ask:

1. Can `workflow.sh` menu handle this?
2. Is this a one-time task? (Don't script it)
3. Does it duplicate existing functionality?
4. Will it be used weekly or more?

If yes to #4 and no to #1-3, then add it.

**Naming convention:**

- Verb-noun: `check.sh`, `kill-port.sh`
- No redundant prefixes: `dev.sh` not `dev-start.sh`
- Hyphens for multi-word: `clean-install.sh`
<<<<<<< HEAD
=======

---

Last Updated: January 3, 2026

- Installs missing peer dependencies

### `test-all.sh`

**Run all quality checks before committing**

```bash
./scripts/test-all.sh
```

- Type checking (TypeScript)
- Unit tests (Jest)
- Linting (ESLint)
- Format checking (Prettier)

### `kill-port.sh`

**Kill process on Metro bundler port**

```bash
./scripts/kill-port.sh [port]
```

Default port: 8081

## 🔧 Making Scripts Executable

On macOS/Linux/WSL:

```bash
chmod +x scripts/*.sh
```

On Windows (Git Bash), scripts are executable by default.

## 🚨 Troubleshooting

### "Port 8081 is already in use"

```bash
./scripts/kill-port.sh
npm start
```

### "Module not found" or dependency errors

```bash
./scripts/fix-deps.sh
```

### Persistent errors

```bash
./scripts/clean-install.sh
```

### Fresh start for new developer

```bash
./scripts/setup-dev.sh
```

## 📦 npm scripts (Alternative)

You can also use npm scripts directly:

```bash
npm start              # Start dev server
npm run type-check     # TypeScript check
npm run lint           # ESLint
npm run format         # Prettier format
npm run format:check   # Prettier check
npm test               # Run tests
npm run test:watch     # Tests in watch mode
```

## 🔄 Recommended Workflow

### Daily Development

1. `./scripts/dev-start.sh` - Start with checks
2. Make your changes
3. `npm test` - Test as you go
4. `./scripts/test-all.sh` - Before committing

### When Things Break

1. `./scripts/kill-port.sh` - Clear port if needed
2. `./scripts/fix-deps.sh` - Fix dependencies
3. If still broken: `./scripts/clean-install.sh`

### Onboarding New Developer

```bash
git clone <repo>
cd social-accountability
./scripts/setup-dev.sh
```

## 💡 Tips

- Run `dev-start.sh` instead of `npm start` to catch errors early
- Use `test-all.sh` before opening PRs
- Keep scripts executable: `chmod +x scripts/*.sh`
- Scripts are safe to run multiple times
>>>>>>> c7e6178 (feat: can open app on phone)
