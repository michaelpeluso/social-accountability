# Development Workflow

**Complete guide to contributing code to Social Accountability**

---

## Quick Start

```bash
# Clone & install
git clone <repo>
cd social-accountability
npm install

# Start development
npm run dev           # Starts server with pre-flight checks
```

**On iPhone:**

1. Install Expo Go from App Store
2. Scan QR code from terminal
3. Confirm hot reload works

---

## Essential Scripts

The project uses **5 core scripts** for daily development:

| Script        | Command             | Purpose                      | When to Use                     |
| ------------- | ------------------- | ---------------------------- | ------------------------------- |
| **dev**       | `npm run dev`       | Start dev server with checks | Every morning, daily coding     |
| **clean**     | `npm run clean`     | Nuclear reinstall            | Dependency issues, weird errors |
| **workflow**  | `npm run workflow`  | Interactive menu             | When unsure what to do          |
| **doctor**    | `npm run doctor`    | System diagnostics           | Troubleshooting problems        |
| **kill-port** | `npm run kill-port` | Kill process on 8081         | "Port in use" errors            |

### Script Details

#### `npm run dev` - Daily Development

- ✅ Kills any process on port 8081
- ✅ Runs TypeScript type check
- ✅ Runs ESLint
- ✅ Starts Expo dev server
- ✅ Shows iPhone connection instructions

**Use this every morning to start coding.**

#### Automated Quality Gates

The repository uses Git hooks to provide fast local feedback while avoiding redundant full checks on every commit.

| Hook         | Runs                            | When         | Speed |
| ------------ | ------------------------------- | ------------ | ----- |
| `pre-commit` | Format + lint staged files      | Every commit | ~1-2s |
| `commit-msg` | Conventional Commits validation | Every commit | <1s   |
| `pre-push`   | Type-check + tests + lint       | Every push   | ~10s  |

Run `git commit` to get fast staged-file formatting and linting. Full project checks run on `git push` to avoid repeated expensive runs while you iterate.

#### `npm run clean` - Nuclear Option

- Deletes node_modules/
- Deletes package-lock.json
- Fresh npm install
- Runs post-install checks

**Use when dependencies are broken or npm acting weird.**

#### `npm run workflow` - Interactive Helper

Displays a menu:

1. Start Dev Server
2. Clean Reinstall
3. Run Diagnostics
4. Kill Port 8081
5. Start Story (select & work on GitHub issue)
6. Create PR
7. Generate Issues from Milestones
8. Exit

**Use when you forget commands or want guided workflow.**

#### `npm run doctor` - Diagnostics

Checks:

- Node.js version (≥18)
- npm version
- Network connectivity
- Port 8081 availability
- Dependencies installed
- .env file exists
- TypeScript compiles

**Use when troubleshooting any issues.**

#### `npm run kill-port` - Port Killer

- Finds process on port 8081
- Kills it forcefully
- Confirms port is free

**Use when you see "Port 8081 is already in use".**

---

## Installing Packages

**Always use `npx expo install` instead of `npm install` for Expo-compatible packages.**

```bash
# Correct - installs SDK-compatible version
npx expo install expo-image expo-camera

# Avoid - may install incompatible versions
npm install expo-image expo-camera
```

**Why?** Expo maintains a list of package versions compatible with each SDK version. Using `npx expo install` ensures you get the correct version for your SDK, avoiding version mismatches and native build errors.

**For non-Expo packages** (e.g., lodash, date-fns), regular npm install is fine:

```bash
npm install lodash date-fns
```

---

## Git Workflow Scripts

For working with GitHub issues:

| Script              | Command                               | Purpose                            |
| ------------------- | ------------------------------------- | ---------------------------------- |
| **start-story**     | `bash scripts/start-story.sh <issue>` | Start working on an issue          |
| **create-pr**       | `bash scripts/create-pr.sh`           | Create pull request                |
| **generate-issues** | `node scripts/generate-issues.js`     | Bulk create issues from milestones |

### Example Issue Workflow

```bash
# 1. Start working on issue #42
bash scripts/start-story.sh 42

# Creates branch: 42-add-user-authentication
# Marks issue as "In Progress"
# Checks out the branch

# 2. Write code and commit (hooks run automatically)
git add .
git commit -m "feat: add user authentication"
# pre-commit runs: format + lint staged files (~1-2s)

git commit -m "test: add auth tests"
# Fast commits for quick iteration

# 3. Push when ready (comprehensive checks run)
git push -u origin 42-add-user-authentication
# pre-push runs: type-check + tests + lint (~10s)

# 4. Create PR
bash scripts/create-pr.sh
# CI runs automatically on GitHub
```

---

## Daily Development Cycle

### Your Optimal Workflow

**Goal:** Fast commits for quick iteration, comprehensive validation before push, CI as safety net.

```bash
# Morning: Start coding
npm run dev              # Start server

# Iteration: Fast commits
git add .
git commit -m "feat: xyz"   # ~1-2s (lint-staged auto-fixes)
git commit -m "fix: abc"    # ~1-2s (only checks staged files)
git commit -m "refactor: 123" # ~1-2s

# Ready to share: Push
git push                 # ~10s (type-check + tests + lint)
                        # Aborts if checks fail

# Open PR
gh pr create --fill      # CI runs automatically
```

**What happens automatically:**

- **Every commit:** Format + lint staged files (pre-commit hook)
- **Every commit:** Validate message format (commit-msg hook)
- **Every push:** Type-check + tests + lint full project (pre-push hook)
- **Every PR:** CI runs same checks + build validation

**Result:** You code normally with fast commits. System catches issues before push. No manual script running needed.

### Terminal Two-Command Workflow

For a fast terminal-first workflow (no GitHub UI), use two commands:

- View open stories for a milestone or all:

```bash
# View stories for a specific milestone
bash scripts/list-stories.sh M1

# View all open stories
bash scripts/list-stories.sh --all
```

- Start working on a story (creates branch, sets issue to "In Progress", checks out branch):

```bash
bash scripts/start-story.sh <issue-number>
```

What this does:

- Creates a branch named `<issue-number>-<slug>` (example: `42-add-user-authentication`)
- Adds the label `status: in-progress` to the issue (if label exists)
- Switches your local Git checkout to the new branch

Branch naming convention:

- Format: `<issue-number>-<slug>`
- Keeping the issue number at the front allows automation to detect and update issue state from branch / commit activity

Commit message format and PR practices still follow Conventional Commits (see "Commit Message Format" below).

### 1. Start Feature Branch

```bash
git checkout main
git pull
git checkout -b feature/your-feature-name
```

### 2. Write Code

Write documentation...
Fix bugs...
Add features...

### 3. Commit (Hooks Run Automatically)

```bash
git add .
git commit -m "feat: add habit creation"
# pre-commit hook runs: format + lint staged files (~1-2s)
# commit-msg hook validates: Conventional Commits format
```

**Commit Message Format:**

- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code restructure
- `test:` - Add/update tests
- `docs:` - Documentation
- `chore:` - Config/tooling

**Fast iteration:**

```bash
git commit -m "feat: add UI components"
git commit -m "test: add unit tests"
git commit -m "refactor: extract helper"
# Each commit takes ~1-2s (only checks staged files)
```

### 4. Push (Comprehensive Checks Run)

```bash
git push -u origin feature/your-feature-name
# pre-push hook runs: type-check + tests + lint (~10s)
# Push aborts if any check fails
```

### 5. Create PR

```bash
gh pr create --title "Add habit creation" --body "Implements M2 story 2.2"
# CI runs automatically on GitHub
```

**PR Requirements:**

- [ ] All tests pass
- [ ] TypeScript strict mode (no `any`)
- [ ] Added tests for new features
- [ ] Privacy enforcement verified (if applicable)
- [ ] No PII in logs

---

## Testing Strategy

### Unit Tests (Logic)

```bash
npm test                     # Run all tests
npm run test:watch           # Watch mode
npm test logic/streaks       # Specific file
```

**Pattern:**

```typescript
// tests/logic/streaks.test.ts
describe("calculateStreak", () => {
  it("calculates daily streak correctly", () => {
    const habit = mockHabit({ schedule: { frequency: "daily" } });
    const checkIns = [
      mockCheckIn({ occurredAt: "2024-01-03" }),
      mockCheckIn({ occurredAt: "2024-01-02" }),
    ];
    expect(calculateStreak(habit, checkIns)).toBe(2);
  });
});
```

### Integration Tests (API)

```typescript
// tests/services/auth.test.ts
describe("POST /auth/apple", () => {
  it("returns JWT for valid Apple token", async () => {
    const response = await request(app).post("/auth/apple").send({ appleToken: "valid-token" });

    expect(response.status).toBe(200);
    expect(response.body.data.token).toBeDefined();
  });
});
```

### Manual Testing (iPhone)

1. Kill app completely
2. Relaunch
3. Test feature in airplane mode (offline)
4. Go online, verify sync

---

## Code Standards

### TypeScript

```typescript
// ✅ GOOD: Explicit types
function calculateStreak(habit: Habit, checkIns: CheckIn[]): number {
  return streak;
}

// ❌ BAD: Implicit any
function calculateStreak(habit, checkIns) {
  return streak;
}
```

### Error Handling

```typescript
import { AppError, ErrorCode } from "@/lib/errors";

// ✅ GOOD: Typed errors
throw new AppError("User not found", ErrorCode.NOT_FOUND);

// ❌ BAD: String errors
throw new Error("User not found");
```

### Logging

```typescript
import { logger } from "@/lib/logger";

// ✅ GOOD: Structured, no PII
logger.info("habit_created", { habitId, pillar });

// ❌ BAD: Contains PII
logger.info(`User ${email} created habit`);
```

### Privacy Enforcement

```typescript
// ✅ GOOD: Server-side validation
app.get("/habits", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const habits = await db.query("SELECT * FROM habits WHERE userId = ? OR (privacy = 'PUBLIC')", [
    userId,
  ]);
});

// ❌ BAD: Trusts client filter
app.get("/habits", async (req, res) => {
  const habits = await db.query("SELECT * FROM habits WHERE privacy = ?", [req.query.privacy]);
});
```

---

## Windows + iPhone Workflow

### Development (Windows)

- Write code on Windows (VS Code)
- Run Expo dev server
- Test on iPhone via Expo Go (scans QR)
- Hot reload on save

**Benefits:**

- No Mac needed for daily dev
- Fast iteration
- Real device testing

### Native Integration (Mac - Monthly)

**When Mac is needed:**

- First HealthKit integration (M4)
- App Store builds
- Testing iOS-specific features

**Mac Day Checklist:**

1. Freeze features (no new code)
2. Run `expo prebuild`
3. Open in Xcode
4. Test permissions/native features
5. Fix blockers immediately
6. Commit & tag

**Rule:** Never discover architecture problems on Mac day.

---

## Sensor Abstraction Pattern

All data sources go through `/sensors`:

```typescript
// sensors/health/index.ts
export interface HealthSensor {
  getSteps(date: Date): Promise<number>;
}

// sensors/health/mock.ts
export class MockHealthSensor implements HealthSensor {
  async getSteps(date: Date): Promise<number> {
    return 10000; // Fake data for dev
  }
}

// sensors/health/ios.ts (M4+)
import * as HealthKit from "expo-health-kit";
export class IOSHealthSensor implements HealthSensor {
  async getSteps(date: Date): Promise<number> {
    return await HealthKit.querySteps(date);
  }
}
```

**Use in code:**

```typescript
import { healthSensor } from "@/sensors";

const steps = await healthSensor.getSteps(new Date());
```

---

## Common Commands

```bash
# Core Workflow
npm run dev            # Start dev server (use this daily)
npm run workflow       # Interactive menu

# Development
npm start              # Start without pre-flight checks
npm run type-check     # TypeScript validation
npm run lint           # ESLint
npm run format         # Auto-fix formatting
npm test               # Run tests
npm run test:watch     # Watch mode

# Troubleshooting
npm run doctor         # Run diagnostics
npm run clean          # Nuclear reinstall
npm run kill-port      # Kill process on 8081

# Manual Quality Checks (if needed)
npm run type-check && npm run lint && npm test
# Note: pre-push hook runs these automatically

# Build (future)
npm run prebuild       # Generate native code (Mac)
```

---

## Git Workflow Summary

```bash
# 1. Create branch
git checkout -b feature/name

# 2. Write code and commit (fast iteration)
git add .
git commit -m "feat: add feature"
# pre-commit: format + lint staged files (~1-2s)

git commit -m "test: add tests"
# Fast commits for quick iteration

# 3. Push when ready
git push -u origin feature/name
# pre-push: type-check + tests + lint (~10s)
# Push aborts if checks fail

# 4. Create PR
gh pr create --fill
# CI runs automatically

# 5. Merge (after approval + CI passes)
# PR auto-merges via GitHub
```

---

## PR Checklist

Hooks automatically verify most items, but confirm:

- [ ] All commits follow Conventional Commits format (commit-msg hook)
- [ ] Code formatted and linted (pre-commit hook)
- [ ] Type-check passes (pre-push hook)
- [ ] Tests pass (pre-push hook)
- [ ] Tests added for new features
- [ ] No `any` types (or marked with `// TODO: type this`)
- [ ] No PII in logs (emails, names, content)
- [ ] Privacy checks added (if applicable)
- [ ] Works offline (tested in airplane mode)
- [ ] Hot reload works (tested on iPhone)
- [ ] CI passed (type-check + lint + tests + build)

---

## CI/CD Pipeline

**GitHub Actions run only on PRs and main branch:**

```yaml
1. Install dependencies
2. TypeScript type-check
3. Code quality (ESLint + Prettier)
4. Jest tests (with coverage)
```

**Optimizations:**

- Skips when commits only touch `docs/**` or `design/**`
- Cancels in-progress runs when you push again to the same branch
- Combines related checks to reduce overhead

**Must pass before merge.**

---

## Troubleshooting

### Pre-commit hook failing

```bash
# See what lint-staged is checking
npx lint-staged --debug

# Manually run formatters
npm run format
npm run lint

# Try commit again
git add .
git commit -m "your message"
```

### Pre-push hook failing

```bash
# Run checks manually to see errors
npm run type-check     # See type errors
npm test               # See test failures
npm run lint           # See lint errors

# Fix errors, then push again
git push
```

### Skip hooks (emergency only)

```bash
# Skip pre-commit
git commit --no-verify -m "emergency fix"

# Skip pre-push
git push --no-verify
```

**Use `--no-verify` only for:**

- Hotfix deployments
- Reverting broken commits
- Documentation-only changes (if blocked)

### "Module not found"

```bash
npm install
# or use nuclear option
npm run clean
```

### "Type error" after git pull

```bash
npm run type-check
# Fix reported errors
```

### "Tests failing"

```bash
npm test -- --clearCache
npm test
```

### Expo Go won't connect

1. Ensure phone & computer on same WiFi
2. Restart Expo dev server (`npm run dev`)
3. Rescan QR code

### CI failing but local passes

```bash
# Ensure dependencies match CI
npm ci

# Run same checks as CI
npm run type-check
npm run lint
npm test -- --ci

# Check Node version matches CI (18.x)
node --version
```

---

## When to Move to Dev Build

Stay in **Expo Managed Workflow** until you need:

- HealthKit beyond steps (M4+)
- Background location (M5+)
- Screen Time API (M5+)
- Native modules not supported by Expo

Then transition to **Expo Dev Build** (still Expo, but custom native code).

---

## References

- **README.md**: Project overview & architecture
- **data-model.md**: Database schema
- **api-contracts.md**: API endpoints
- **M0-M5 milestones/**: Feature specifications
- **.github/copilot-instructions.md**: AI agent guide

---

**Last Updated:** December 31, 2025
