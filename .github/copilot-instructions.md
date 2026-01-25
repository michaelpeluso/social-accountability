# AI Agent Instructions

## Project Overview

**Social Accountability** is an automation-first iOS habit tracker that merges social accountability with self-improvement. The app minimizes user interaction by automatically gathering data through 3rd party integrations, generating visual insights, and sharing progress with friends.

**Stack:** React Native + Expo (iOS-first), SQLite (local-first), Postgres (cloud sync), Apple Sign-In, TypeScript strict mode.

---

## Critical Architecture Principles

### 1. Device-First, Offline-First

- **SQLite = Source of Truth** - All writes go to local DB first for instant UX
- Cloud (Supabase) is sync replica, not primary database
- User actions never block on network calls
- Background sync queue handles eventual consistency
- Pattern: `[User Action] → [SQLite Write] → [UI Update] → [Sync Queue]`
- **Cloud Status**: Not yet deployed - coming in M1 with Supabase

### 2. Privacy Model (Enforced Server-Side)

- Every object has privacy: `SELF` | `FRIENDS` | `PUBLIC`
- **Never trust client filters** - server must re-validate every query
- Check viewer's relationship to owner (friend status, privacy level)
- Server-side enforcement critical when cloud API is deployed (M1)

### 3. Identity → Goal → Habit Hierarchy

- **Identity** (M2): "Who I want to be" - Athlete, Student, Parent (preset list)
- **Goal** (M2/M3): "Proof I'm that person" - quantitative targets (Run 5K under 30min)
- **Habit** (M2): "What I do daily" - recurring actions (Run 4x/month)
- Goals CAN complete, Habits NEVER complete (recurring forever)
- Database tables defined in `src/storage/database.ts`

### 4. Post vs Story Decoupling

- **Post**: Permanent, 500 char text, supports comments (50 words), rich discussion
- **Story**: 24h TTL, 280 char caption, reactions only, quick sharing with badges
- Both can link to HabitCheckIn (atomic post + check-in)
- Stories auto-deleted after `expiresAt`

### 5. Social-First Philosophy

- **Core principle:** Users should never feel like they're working on themselves alone
- Friends are involved in both wins AND struggles (with user consent)
- Behavioral patterns (momentum loss, overconsumption) are shareable states, not shameful secrets
- Auto-posts describe user state qualitatively: "I slowed down this week", "Working through a rough patch"
- Social features prioritize **supportive presence** over performance metrics
- Visual analytics show patterns to user AND optionally to close friends (transparency builds accountability)

### 6. Data Model & Cloud Sync: Ephemeral 3rd Party, Persistent App Data

- **3rd party data (ScreenTime, Location, Calendar) is EPHEMERAL**: Query → Process → Delete immediately
- **App data (habits, metrics, patterns) is PERSISTENT**: All synced to cloud replica (when deployed)
- Pattern: `[Query iOS API] → [Calculate Aggregate] → [Delete Raw Data] → [Sync Processed Metric]`
- Example: ScreenTime returns app usage → Calculate "social media: 90 min" → Delete app-specific logs → Sync aggregate
- **Never store raw sensor data** - only user-meaningful aggregates (steps count, usage minutes, visit boolean)
- **Zero additional personal data** - cloud only receives what user explicitly created or app calculated
- Coordinates encrypted at rest if stored, never in posts/stories (M7 feature)

### 7. Component Modularity & Reusability (CRITICAL)

- **NEVER inline UI patterns directly in screen files** - always extract to reusable components
- **Component directory structure**: `/src/components/[category]/ComponentName.tsx`
  - `pickers/` - Selection/input components (DatePicker, IdentityPicker, etc.)
  - `forms/` - Form elements and validation wrappers
  - `cards/` - List items and content cards
  - `modals/` - Modal dialogs and sheets
- **Every component must**:
  - Be a controlled component (parent manages state via props)
  - Include TypeScript interface for props
  - Have self-contained styles using StyleSheet.create()
  - Export from category's index.ts and main src/components/index.ts
  - Be documented in src/components/README.md with usage example
- **Platform-specific behavior** (iOS/Android) must be handled INSIDE components, not in consuming screens
- **Theme handling** (light/dark mode) must be handled INSIDE components with proper color/theming
- **Validation and error states** handled inside components via error prop
- **When to extract**: If UI pattern appears twice OR could reasonably be used elsewhere, extract immediately
- **Example**: DatePicker component handles iOS version detection, platform differences, theming, and modal presentation - screens just pass value/onChange
- See [src/components/README.md](../src/components/README.md) for architecture details
- **Single active input rule**: Only one input modal or picker may be open at a time. Components that present native pickers must register with the centralized picker manager (`src/components/pickers/pickerManager.ts`) so other open pickers are automatically closed before opening a new one.

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

- **M0** (Foundation) - In progress: types, routing, auth stubs
- **M1** (Account & Privacy) - Next: Apple Sign-In, friends
- **M2** (Goals & Habits) - Manual tracking, streaks
- **M3** (Social) - Posts, stories, reactions, nudges
- **M4** (Identity & Analytics) - Identities, journal, HealthKit proof-of-concept
- 💡 **M5+** (Future) - Full automation, ML, location triggers

### Key Files for Each Milestone

- **M0**: `src/types/`, `app/`, `.eslintrc.js`, `tsconfig.json`
- **M1**: `services/auth.ts`, `storage/users.ts`, `spec/M1-account-privacy.md`
- **M2**: `storage/habits.ts`, `logic/streaks.ts`, `spec/M2-habits-tracking.md`
- **M3**: `storage/posts.ts`, `storage/stories.ts`, `spec/M3-social.md`

---

## Code Patterns & Conventions

### TypeScript Patterns

- **Strict mode** enabled - no implicit any
- **Typed errors**: Use `AppError` from `src/lib/errors.ts` (never throw strings)
- **Enums over unions**: `enum Privacy { SELF, FRIENDS, PUBLIC }` (see data-model.md)
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

### Commenting Style

- **DO NOT use emojis in comments or terminal logs**
- Use standard prefixes (`// TODO:`, `// FIXME:`, `// NOTE:`) only when they add clarity; prefer self-documenting code
- No comments for self-explanatory obvious code
- Do not use block comments for large explanations; keep comments concise
- Keep comments up-to-date with code changes
- Don't overuse or oversaturate with comments; prefer clear code

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

### Dynamic Styles

Instead of hardcoded values, use theme tokens that update when the theme changes:

```tsx
// ❌ Old way (hardcoded)
<View style={{
  backgroundColor: "#fff",
  padding: 16,
  borderRadius: 8,
}}>

// ✅ New way (dynamic)
const { theme } = useTheme();
<View style={{
  backgroundColor: theme.card.background,
  padding: theme.card.padding,
  borderRadius: theme.card.borderRadius,
}}>
```

---

## Documentation Structure

### Primary Sources of Truth

1. **Database Schema**: `src/storage/database.ts` - Current schema v3 with 38 tables
2. **Milestone Specs**: `docs/milestones/M*.md` - Feature specifications and acceptance criteria
3. **API Contracts**: `docs/api-contracts.md` - REST endpoint definitions for cloud sync
4. **Component Docs**: `src/components/README.md` - Component architecture and usage

### Milestone Documents Location

- Milestones and milestone docs: `docs/milestones/` (files like `M0-foundation.md`, `M1-account-privacy.md`)
- Core docs: `docs/README.md`, `docs/api-contracts.md`, `docs/WORKFLOW.md`, `docs/user-interface.md`
- Implementation notes and specs live under `docs/` — prefer these paths when opening issues or drafting PR descriptions.

### When Implementing Features

- **Authentication?** → [docs/milestones/M1-account-privacy.md](../docs/milestones/M1-account-privacy.md)
- **Habits/Goals?** → [docs/milestones/M2-habits-tracking.md](../docs/milestones/M2-habits-tracking.md)
- **Social/Feed?** → [docs/milestones/M3-social.md](../docs/milestones/M3-social.md)
- **Analytics?** → [docs/milestones/M4-identity-analytics.md](../docs/milestones/M4-identity-analytics.md)
- **API endpoints?** → [docs/api-contracts.md](../docs/api-contracts.md)
- **Database schema?** → [src/storage/database.ts](../src/storage/database.ts)

### Each Milestone File Contains

- User stories ("As a [role], I want [feature]")
- Acceptance criteria (checklist)
- Technical requirements
- API contracts (request/response examples)
- "What NOT to Build" (scope boundaries)

---

## Critical Rules

1. **Treat milestone docs as source of truth** - Never invent new features, endpoints, or fields
2. **Privacy first** - All queries must validate viewer permissions server-side (when cloud deployed)
3. **Device-first** - Write to SQLite first, sync to cloud in background
4. **Small diffs** - Prefer reviewable changes over large refactors
5. **Test coverage** - Add/update tests for changed behavior
6. **No bypassing auth/privacy** - Never skip security checks for convenience
7. **M0 complete, M1-M3 in progress** - Don't implement M4/M5 features yet

---

## When Uncertain

- Leave `// TODO:` comment explaining the question
- Write a failing test describing expected behavior
- Reference specific milestone files in questions: "According to M2-habits-tracking.md line 45..."
- Check [docs/README.md](../docs/README.md) for AI-specific guidance
- Check [rules/ai-agent-guide.md](../rules/ai-agent-guide.md) for AI-specific guidance

---

## AI Agent / Autonomous Developer Guidelines

These rules are for any autonomous or assistant agent (including CI bots or LLM-based coders like Claude Sonnet and Opus) that will work on this repository. Agents must follow the project's milestones, privacy rules and the owner's approval process.

- **Follow the milestone plan:** Always implement features aligned to M0→M5 and treat `/spec` as the single source of truth. Do not add or change feature scope without opening an issue and getting owner approval.
- **Maintain a TODO list:** Use the repository's task/tracking mechanism (or the provided manage_todo_list tool) to create, update and complete small, reviewable steps. Mark tasks complete before opening a PR.
- **Never spend or enroll without explicit approval:** Do not enroll accounts (Apple Developer purchase) or procure paid services without explicit owner confirmation. Ask for approval first and provide cost and impact summary.
- **Use mocks & feature flags for native integrations:** Keep `ENABLE_APPLE_AUTH=false` and `ENABLE_HEALTHKIT=false` until the owner authorizes native testing. Prefer mocked implementations in `services/` for early milestones.
- **Use automation scripts:** The `scripts/` directory contains automation helpers (issue generation, PR creation). Use these when available instead of reinventing workflows.
- **Run checks before commits/PRs:** Run `npm run type-check`, `npm test`, `npm run lint` and fix failures. Include test results or CI links in the PR description.
- **Small, reviewable diffs:** Keep changes focused and limited in scope; prefer multiple small PRs to one large change. Add or update tests for behaviour changes.
- **Add tests for new implementations:** When adding a new feature or changing behavior, add unit and/or integration tests that cover expected behavior and edge cases before opening a PR.
- **Secrets handling:** Never write secrets or `.p8` keys into the repo. Use CI secret stores (GitHub Actions secrets, EAS env vars) and document required secret names in `docs/`.
- **Environment configuration:** This project uses **cloud-only environment variables** via EAS. There are NO `.env` files. All configuration is managed through:
  - **EAS env vars** (`npx eas-cli env:create`) for build-time config
  - **GitHub Secrets** for CI/CD workflows
  - When proposing changes to environment variables, reference `docs/env-troubleshooting.md` for the current approach. Never suggest creating `.env` files.
- **Progress updates & cadence:** After significant work (3–5 tool calls or editing/creating >3 files), post a concise progress update summarizing completed steps, remaining tasks, and the next action.
- **Ask clarifying questions:** If a requirement is ambiguous, leave a `// TODO:` and ask the owner rather than guessing. Create a failing test that codifies the assumption when helpful.
- **PR policy:** Open feature branches and create PRs against `main` (or the repo's default). Do not merge to `main` without owner approval and passing CI.
- **Privacy-first:** Enforce privacy rules in code and tests; never bypass server-side validation for convenience.

These guidelines are mandatory for any automated contributor; failure to follow them should be considered a blocker for merging changes.

---

## Milestone Implementation Workflow

When the owner asks to "start development on milestone X" or "implement M0", follow this workflow:

### 1. Fetch Open Stories

```bash
# Fetch all open issues for milestone (e.g., M0)
gh issue list --search 'is:issue is:open "[M0-" in:title' --state open --json number,title,body --jq '.[] | "\(.number)|\(.title)"'
```

### 2. For Each Story

1. **Read acceptance criteria** from the issue body
2. **Check if already implemented** - look for existing files, run tests
3. **Implement if missing** - create files, write code, add tests
4. **Verify implementation:**
   - Run `npm run type-check` - must pass
   - Run `npm test` - all tests must pass
   - Run `npm run lint` - no errors
   - For UI stories: start Expo and verify on device
5. **Close the issue** with verification comment:
   ```bash
   gh issue close <number> --comment "Verified complete:
   - [List each acceptance criterion checked]
   - Tests: X passing in tests/path/file.test.ts"
   ```

### 3. Verification Requirements

- **Code stories**: Must have passing tests
- **UI stories**: Must verify app loads and screens render (start Expo in background, continue other work while user tests)
- **Config stories**: Must verify files exist and validation works
- **Never close without verification** - run the actual checks

**Testing Workflow for UI Stories:**

- Start Expo in background: `npm start 2>&1 &`
- Continue with other stories/implementation
- When ready for user verification, leave a note that Expo is running with QR code
- User will test asynchronously and report back results
- Do not block agent progress waiting for user device testing

### 4. Progress Reporting

After completing each story, update the TODO list and report progress:

- Stories verified and closed
- Stories remaining
- Any blockers encountered

### 5. Final Milestone Validation

Before declaring milestone complete:

```bash
npm run type-check && npm test && npm run lint
# All must pass with zero errors
```
