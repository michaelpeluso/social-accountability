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
npm start              # Expo dev server (scan QR with Expo Go)
```

**On iPhone:**

1. Install Expo Go from App Store
2. Scan QR code from terminal
3. Confirm hot reload works

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
# Development
npm start              # Expo dev server
npm run ios            # iOS simulator (Mac only)
npm run android        # Android emulator

# Quality Checks
npm run type-check     # TypeScript
npm run lint           # ESLint
npm run lint:fix       # Auto-fix linting
npm run format         # Prettier auto-fix
npm run format:check   # Check formatting

# Testing
npm test               # Run all tests
npm run test:watch     # Watch mode
npm test -- --coverage # Coverage report

# Build
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
