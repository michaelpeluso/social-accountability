# AI Agent Instructions

**Self-contained guide for GitHub Copilot to assist with Social Accountability development**

---

## Project Overview

**Social Accountability** is an automation-first iOS habit tracker merging social accountability with self-improvement. Minimizes user interaction through automated 3rd party integrations (HealthKit, location, Screen Time), generating visual insights and enabling friend accountability.

**Stack:** React Native + Expo (iOS-first), SQLite (local-first), Postgres (cloud sync), Apple Sign-In, TypeScript strict mode.

**Current Status:** M0 (Foundation) - types, routing, error handling

---

## Documentation Structure

```
docs/
├── README.md                  # Project overview, features
├── WORKFLOW.md                # Dev workflow, commands, PR process
├── architecture.md            # Technical architecture & patterns
├── data-model.md              # Complete database schema
├── api-contracts.md           # REST API endpoints
└── milestones/
    ├── M0-foundation.md       # Current: Setup, types, errors
    ├── M1-account-privacy.md  # Next: Auth, friends, privacy
    ├── M2-habits-tracking.md  # Goals, habits, streaks
    ├── M3-social.md           # Posts, reactions, nudges
    ├── M4-identity-analytics.md  # Identities, journal, HealthKit
    └── M5-future.md           # Future features
```

**Essential Files:**

- `docs/README.md` - Start here for project overview
- `docs/architecture.md` - Technical architecture & sync patterns
- `docs/WORKFLOW.md` - Dev setup, commands, testing
- `docs/data-model.md` - Complete schema (source of truth)
- `docs/milestones/M*.md` - Feature specifications

**⚠️ CRITICAL: Do NOT Create New Documentation Files**

This structure is **complete and sufficient**. Before creating any new `.md` file:

1. **STOP** - Ask the user first
2. Consider if it belongs in an existing file
3. Use code comments (`// TODO:`, `/** @docs */`) instead
4. Update existing docs rather than creating new ones

**Never create:** Status updates, setup summaries, change logs, quick references, duplicates

---

## Critical Architecture Principles

### 1. Device-First, Offline-First

- **SQLite = Source of Truth** - All writes go to local DB first for instant UX
- Server is sync replica, not primary database
- User actions never block on network calls
- Background sync queue handles eventual consistency
- Pattern: `[User Action] → [SQLite Write] → [UI Update] → [Sync Queue]`

### 2. Privacy Model (Enforced Server-Side)

- Every object has privacy: `SELF` | `FRIENDS` | `PUBLIC`
- **Never trust client filters** - server must re-validate every query
- Check viewer's relationship to owner (friend status, privacy level)
- See [../docs/spec/product/architecture.md](../docs/spec/product/architecture.md#privacy-enforcement) for query patterns

### 3. Identity → Goal → Habit Hierarchy

- **Identity** (M2): "Who I want to be" - Athlete, Student, Parent (preset list)
- **Goal** (M2/M3): "Proof I'm that person" - quantitative targets (Run 5K under 30min)
- **Habit** (M2): "What I do daily" - recurring actions (Run 4x/month)
- Goals CAN complete, Habits NEVER complete (recurring forever)
- See [../docs/spec/product/data-model.md](../docs/spec/product/data-model.md#relationships-diagram)

### 4. Post vs Story Decoupling

- **Post**: Permanent, 500 char text, supports comments (50 words), rich discussion
- **Story**: 24h TTL, 280 char caption, reactions only, quick sharing with badges
- Both can link to HabitCheckIn (atomic post + check-in)
- Stories auto-deleted after `expiresAt`

---

## Development Workflow

### Commands (package.json)

```bash
npm start              # Expo dev server (scan QR with Expo Go)
npm run type-check     # TypeScript validation
npm run lint           # ESLint
npm run format         # Prettier
npm test               # Jest tests
npm run test:watch     # Jest watch mode
```

### Milestones

- ✅ **M0** (Foundation) - Types, routing, error handling
- 📋 **M1** (Account & Privacy) - Apple Sign-In, friends, privacy controls
- 🔜 **M2** (Goals & Habits) - Manual tracking, streaks, dashboard
- 🔜 **M3** (Social) - Posts, stories, reactions, nudges, badges
- 🔜 **M4** (Identity & Analytics) - Identities, journal, HealthKit steps
- 💡 **M5+** (Future) - Full automation, ML, Screen Time, location

---

## Code Patterns & Conventions

### TypeScript Patterns

- **Strict mode** enabled - no implicit any
- **Typed errors**: Use `AppError` from `src/lib/errors.ts` (never throw strings)
- **Enums over unions**: `enum Privacy { SELF, FRIENDS, PUBLIC }` (see [data-model.md](../docs/spec/product/data-model.md))
- If `any` needed, add `// TODO: type this` comment

### Code Examples

**Privacy Enforcement (CRITICAL):**

```typescript
// ❌ WRONG - trusts client filter
const habits = await db.query("SELECT * FROM habits WHERE privacy = ?", ["PUBLIC"]);

// ✅ RIGHT - server validates
function getHabits(viewerId: string, scope: "mine" | "friends" | "public") {
  let query = "SELECT * FROM habits WHERE ";
  if (scope === "mine") {
    query += "userId = ?";
  } else if (scope === "friends") {
    query += `(privacy = 'PUBLIC' OR 
               (privacy = 'FRIENDS' AND userId IN (
                 SELECT friendId FROM friendships 
                 WHERE userId = ? AND status = 'ACCEPTED'
               )))`;
  }
  return db.query(query, params);
}
```

**Logging (No PII):**

```typescript
import { logger } from "@/lib/logger";

logger.info("habit_created", { habitId, pillar }); // ✅
logger.info(`User ${email} signed in`); // ❌ Contains PII
```

**Error Handling:**

```typescript
import { AppError, ErrorCode } from "@/lib/errors";

throw new AppError("User not found", ErrorCode.NOT_FOUND); // ✅
throw new Error("Something went wrong"); // ❌ Not typed
```

**Device-First Sync:**

```typescript
// 1. Write to SQLite (instant)
await db.insert("habits", habit);
// 2. Update UI
setHabits([...habits, habit]);
// 3. Enqueue sync
syncQueue.enqueue({ type: "CREATE", table: "habits", data: habit });
```

---

## Finding Information

### When Implementing Features

**For architecture/sync:** → `docs/architecture.md`
**For schema/database:** → `docs/data-model.md`
**For API endpoints:** → `docs/api-contracts.md`
**For authentication:** → `docs/milestones/M1-account-privacy.md`
**For habits/goals:** → `docs/milestones/M2-habits-tracking.md`
**For social/feed:** → `docs/milestones/M3-social.md`
**For analytics:** → `docs/milestones/M4-identity-analytics.md`
**For dev workflow:** → `docs/WORKFLOW.md`

### Each Milestone File Contains

- User stories ("As a [role], I want [feature]")
- Acceptance criteria (testable checklist)
- Technical requirements
- API contracts (request/response)
- Privacy/security notes
- "What NOT to Build" (scope boundaries)

---

## TypeScript Standards

**Strict Mode (Required):**

- No implicit `any`
- Explicit return types on functions
- Use enums for fixed sets: `enum Privacy { SELF, FRIENDS, PUBLIC }`
- If `any` needed, add `// TODO: type this`

**Examples:**

```typescript
// ✅ GOOD
function calculateStreak(habit: Habit, checkIns: CheckIn[]): number {
  return streak;
}

// ❌ BAD
function calculateStreak(habit, checkIns) {
  return streak;
}
```

---

## Testing Requirements

**Before Every PR:**

- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes (no warnings)
- [ ] `npm test` passes
- [ ] Added tests for new features
- [ ] No `any` types (or marked with TODO)
- [ ] No PII in logs
- [ ] Privacy enforcement verified

**Test Pattern:**

```typescript
describe("calculateStreak", () => {
  it("calculates daily streak correctly", () => {
    const habit = mockHabit({ schedule: { frequency: "daily" } });
    const checkIns = [mockCheckIn({ occurredAt: "2024-01-03" })];
    expect(calculateStreak(habit, checkIns)).toBe(1);
  });
});
```

---

## Critical Rules

1. **Privacy first** - All queries must validate viewer permissions server-side (NEVER trust client)
2. **Device-first** - Write to SQLite first, sync to cloud in background
3. **Typed errors** - Use `AppError` from `src/lib/errors.ts` (never throw strings)
4. **No PII in logs** - Never log emails, names, or content
5. **Test coverage** - Add tests for new features, update for changes
6. **TypeScript strict** - No `any` without `// TODO: type this` comment
7. **M0-M3 scope** - Don't implement M4/M5 features yet
8. **No new docs** - NEVER create new `.md` files without explicit user permission

---

## When Uncertain

- Check `docs/data-model.md` for schema
- Check milestone files for requirements
- Leave `// TODO:` comment explaining question
- Write failing test describing expected behavior
- **NEVER create new documentation files** - Ask user or use existing docs/code comments
- Reference specific files: "According to M2-habits-tracking.md story 2.4..."

---

## File Locations

overview:** `docs/README.md`
**Architecture:** `docs/architecture.md`
**Dev workflow:** `docs/WORKFLOW.md`
**Database schema:** `docs/data-model.md`
**API endpoints:** `docs/api-contracts.md`
**Milestone specs:** `docs/milestones/M0-M5.md
**Milestone specs:** `docs/milestones/M0-M5/`
**Types:** `src/types/index.ts`
**Errors:** `src/lib/errors.ts`
**Logger:\*\* `src/lib/logger.ts`

---

**Last Updated:** December 31, 2025
