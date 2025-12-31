# AI Agent Instructions

## 🎯 Start Here

**New to this project?** Read [../docs/QUICKSTART.md](../docs/QUICKSTART.md) for complete navigation.

**This file provides:** Critical architecture patterns and development workflow context for GitHub Copilot.

---

## Project Overview

**Social Accountability** is an automation-first iOS habit tracker that merges social accountability with self-improvement. The app minimizes user interaction by automatically gathering data through 3rd party integrations, generating visual insights, and sharing progress with friends.

**Stack:** React Native + Expo (iOS-first), SQLite (local-first), Postgres (cloud sync), Apple Sign-In, TypeScript strict mode.

**Current Status:** M0 (Foundation) - In progress: types, routing, auth stubs

---

## Documentation Structure

```
docs/
├── QUICKSTART.md              # Start here (AI-optimized navigation)
├── CHEATSHEET.md              # One-page quick reference
├── spec/
│   ├── product/               # Core docs (vision, architecture, data-model, api-contracts, permissions)
│   ├── milestones/            # M0-M5 feature specs
│   ├── development/           # dev-guide, dev-tooling, integrations-guide
│   └── INDEX.md
└── rules/
    ├── CODING-STANDARDS.md    # TypeScript + security patterns
    ├── AI-AGENT-GUIDE.md      # How to read specs
    └── INDEX.md
```

**All documentation lives in `docs/`** - Root only contains README.md

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

### Milestone Status

- ✅ **M0** (Foundation) - In progress: types, routing, auth stubs
- 📋 **M1** (Account & Privacy) - Next: Apple Sign-In, friends
- 🔜 **M2** (Goals & Habits) - Manual tracking, streaks
- 🔜 **M3** (Social) - Posts, stories, reactions, nudges
- 🔜 **M4** (Identity & Analytics) - Identities, journal, HealthKit proof-of-concept
- 💡 **M5+** (Future) - Full automation, ML, location triggers

### Key Files for Each Milestone

- **M0**: `src/types/`, `app/`, `.eslintrc.js`, `tsconfig.json`
- **M1**: `services/auth.ts`, `storage/users.ts`, `docs/spec/milestones/M1-account-privacy.md`
- **M2**: `storage/habits.ts`, `logic/streaks.ts`, `docs/spec/milestones/M2-habits-tracking.md`
- **M3**: `storage/posts.ts`, `storage/stories.ts`, `docs/spec/milestones/M3-social.md`

---

## Code Patterns & Conventions

### TypeScript Patterns

- **Strict mode** enabled - no implicit any
- **Typed errors**: Use `AppError` from `src/lib/errors.ts` (never throw strings)
- **Enums over unions**: `enum Privacy { SELF, FRIENDS, PUBLIC }` (see [data-model.md](../docs/spec/product/data-model.md))
- If `any` needed, add `// TODO: type this` comment

### Privacy Enforcement Example

```typescript
// WRONG - trusts client filter
const habits = await db.query("SELECT * FROM habits WHERE privacy = ?", ["PUBLIC"]);

// RIGHT - server validates viewer relationship
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
  // Always server-side enforcement
}
```

### Logging Pattern

```typescript
import { logger } from "@/lib/logger";

// Structured logging, no PII
logger.info("habit_created", { habitId, pillar, privacy }); // ✅
logger.error("sync_failed", { error: err.message }); // ✅
logger.debug("User john@example.com signed in"); // ❌ Contains PII
```

### Error Handling

```typescript
import { AppError, ErrorCode } from "@/lib/errors";

throw new AppError("User not found", ErrorCode.NOT_FOUND); // ✅
throw new Error("Something went wrong"); // ❌ Not typed
```

---

## Spec Navigation (Source of Truth)

### Read First

1. [../docs/QUICKSTART.md](../docs/QUICKSTART.md) - Master navigation
2. [../docs/spec/product/vision.md](../docs/spec/product/vision.md) - Product goals
3. [../docs/spec/product/architecture.md](../docs/spec/product/architecture.md) - Technical patterns
4. [../docs/spec/product/data-model.md](../docs/spec/product/data-model.md) - Complete schema

### When Implementing Features

- **Authentication?** → [../docs/spec/milestones/M1-account-privacy.md](../docs/spec/milestones/M1-account-privacy.md)
- **Habits/Goals?** → [../docs/spec/milestones/M2-habits-tracking.md](../docs/spec/milestones/M2-habits-tracking.md)
- **Social/Feed?** → [../docs/spec/milestones/M3-social.md](../docs/spec/milestones/M3-social.md)
- **Analytics?** → [../docs/spec/milestones/M4-identity-analytics.md](../docs/spec/milestones/M4-identity-analytics.md)
- **API endpoints?** → [../docs/spec/product/api-contracts.md](../docs/spec/product/api-contracts.md)

### Each Milestone File Contains

- User stories ("As a [role], I want [feature]")
- Acceptance criteria (checklist)
- Technical requirements
- API contracts (request/response examples)
- "What NOT to Build" (scope boundaries)

---

## Quick Reference

**For fast lookups:** [../docs/CHEATSHEET.md](../docs/CHEATSHEET.md)

**Common patterns:**

- Privacy enforcement → [CODING-STANDARDS.md](../docs/rules/CODING-STANDARDS.md#security)
- Error handling → [CODING-STANDARDS.md](../docs/rules/CODING-STANDARDS.md#error-handling)
- Logging → [CODING-STANDARDS.md](../docs/rules/CODING-STANDARDS.md#logging)
- Device-first sync → [architecture.md](../docs/spec/product/architecture.md#device-first-offline-first)

---

## Critical Rules

1. **Treat `/docs/spec` as source of truth** - Never invent new features, endpoints, or fields
2. **Privacy first** - All queries must validate viewer permissions server-side
3. **Device-first** - Write to SQLite first, sync to cloud in background
4. **Small diffs** - Prefer reviewable changes over large refactors
5. **Test coverage** - Add/update tests for changed behavior
6. **No bypassing auth/privacy** - Never skip security checks for convenience
7. **M1-M3 only** - Don't implement M4/M5 features yet (see [../docs/spec/milestones/M5-future.md](../docs/spec/milestones/M5-future.md))

---

## When Uncertain

- Leave `// TODO:` comment explaining the question
- Write a failing test describing expected behavior
- Reference specific spec files in questions: "According to M2-habits-tracking.md line 45..."
- Check [../docs/rules/AI-AGENT-GUIDE.md](../docs/rules/AI-AGENT-GUIDE.md) for how to read specs
- Use [../docs/QUICKSTART.md](../docs/QUICKSTART.md) to find what you need

---

## File Locations Quick Map

| I Need...          | File Path                                                                      |
| ------------------ | ------------------------------------------------------------------------------ |
| Navigation hub     | [../docs/QUICKSTART.md](../docs/QUICKSTART.md)                                 |
| Quick reference    | [../docs/CHEATSHEET.md](../docs/CHEATSHEET.md)                                 |
| Product vision     | [../docs/spec/product/vision.md](../docs/spec/product/vision.md)               |
| Tech architecture  | [../docs/spec/product/architecture.md](../docs/spec/product/architecture.md)   |
| Database schema    | [../docs/spec/product/data-model.md](../docs/spec/product/data-model.md)       |
| API contracts      | [../docs/spec/product/api-contracts.md](../docs/spec/product/api-contracts.md) |
| Milestone specs    | [../docs/spec/milestones/](../docs/spec/milestones/)                           |
| Dev workflow       | [../docs/spec/development/dev-guide.md](../docs/spec/development/dev-guide.md) |
| Coding standards   | [../docs/rules/CODING-STANDARDS.md](../docs/rules/CODING-STANDARDS.md)         |
| Spec reading guide | [../docs/rules/AI-AGENT-GUIDE.md](../docs/rules/AI-AGENT-GUIDE.md)             |

---

**Last Updated:** December 31, 2025
