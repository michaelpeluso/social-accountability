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

The project uses **6 core scripts** for daily development:

| Script        | Command             | Purpose                      | When to Use                     |
| ------------- | ------------------- | ---------------------------- | ------------------------------- |
| **dev**       | `npm run dev`       | Start dev server with checks | Every morning, daily coding     |
| **check**     | `npm run check`     | Run all quality gates        | Before committing code          |
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

#### `npm run check` - Pre-Commit Quality

- ✅ TypeScript strict check
- ✅ ESLint (must pass)
- ✅ Jest tests
- ✅ Prettier format check

**Run before every `git commit`.**

#### `npm run clean` - Nuclear Option

- 🗑️ Deletes node_modules/
- 🗑️ Deletes package-lock.json
- 🔄 Fresh npm install
- ✅ Runs post-install checks

**Use when dependencies are broken or npm acting weird.**

#### `npm run workflow` - Interactive Helper

Displays a menu:

1. 🚀 Start Dev Server
2. ✅ Quality Checks
3. 🧹 Clean Reinstall
4. 🩺 Run Diagnostics
5. 🔪 Kill Port 8081
6. ❌ Exit

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

# 2. Write code...
# ... make changes ...

# 3. Check quality before commit
npm run check

# 4. Commit
git add .
git commit -m "feat: add user authentication"

# 5. Push and create PR
git push -u origin 42-add-user-authentication
bash scripts/create-pr.sh
```

---

## Daily Development Cycle

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

**Pattern:**

```
1. Update types (src/types/index.ts)
2. Write logic (logic/ or services/)
3. Add UI (app/ or components/)
4. Write tests (tests/)
5. Test on iPhone (npm start)
```

**File by Feature:**

- Auth → `services/auth.ts`, `tests/services/auth.test.ts`
- Habits → `storage/habits.ts`, `logic/streaks.ts`
- UI → `components/habit-card.tsx`

### 3. Test Before Commit

```bash
npm run type-check     # TypeScript validation
npm run lint           # ESLint (must pass)
npm test               # Jest tests
npm run format         # Auto-fix formatting
```

**All checks MUST pass before commit.**

### 4. Commit

```bash
git add .
git commit -m "feat: add habit creation"
```

**Commit Message Format:**

- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code restructure
- `test:` - Add/update tests
- `docs:` - Documentation
- `chore:` - Config/tooling

### 5. Push & Open PR

```bash
git push -u origin feature/your-feature-name
gh pr create --title "Add habit creation" --body "Implements M2 story 2.2"
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
npm run check          # Quality checks before commit
npm run workflow       # Interactive menu

# Development
npm start              # Start without pre-flight checks
npm run type-check     # TypeScript only
npm run lint           # ESLint only
npm run format         # Auto-fix formatting
npm test               # Run tests
npm run test:watch     # Watch mode

# Troubleshooting
npm run doctor         # Run diagnostics
npm run clean          # Nuclear reinstall
npm run kill-port      # Kill process on 8081

# Build (future)
npm run prebuild       # Generate native code (Mac)
```

---

## Git Workflow Summary

```bash
# 1. Create branch
git checkout -b feature/name

# 2. Make changes
# ... write code ...

# 3. Check quality
npm run type-check && npm run lint && npm test

# 4. Commit
git add .
git commit -m "feat: description"

# 5. Push & PR
git push -u origin feature/name
gh pr create

# 6. Merge (after approval)
# PR auto-merges via GitHub
```

---

## PR Checklist

Before requesting review:

- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes (no warnings)
- [ ] `npm test` passes
- [ ] Tests added for new features
- [ ] No `any` types (or marked with `// TODO: type this`)
- [ ] No PII in logs (emails, names, content)
- [ ] Privacy checks added (if applicable)
- [ ] Works offline (tested in airplane mode)
- [ ] Hot reload works (tested on iPhone)

---

## CI/CD Pipeline

**GitHub Actions (runs on every PR):**

```yaml
1. Install dependencies
2. TypeScript type-check
3. ESLint
4. Jest tests
5. Build check
```

**Must pass before merge.**

---

## Troubleshooting

### "Module not found"

```bash
npm install
rm -rf node_modules
npm install
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
2. Restart Expo dev server
3. Rescan QR code

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
