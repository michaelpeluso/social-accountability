# AI Agent Guide

**How to read and interpret spec files for this project**

---

## Purpose

This guide teaches AI agents how to navigate the documentation, understand metadata, and find information efficiently.

---

## File Organization

### 3 Documentation Categories

1. **spec/** = Product Requirements (WHAT to build)
   - Feature specifications
   - User stories with acceptance criteria
   - API contracts
   - Database schema

2. **rules/** = Code Standards (HOW to build)
   - TypeScript patterns
   - Security requirements
   - Testing rules

3. **.github/copilot-instructions.md** = GitHub Copilot context
   - High-level project overview
   - Critical architecture principles
   - Development workflow

---

## Reading Order for New Agents

### First Time Setup (15 minutes)

1. **[../QUICKSTART.md](../QUICKSTART.md)** (5 min) - Navigation hub
2. **[../spec/vision.md](../spec/vision.md)** (3 min) - Product goals
3. **[../spec/architecture.md](../spec/architecture.md)** (5 min) - Tech patterns
4. **[CODING-STANDARDS.md](CODING-STANDARDS.md)** (2 min) - Code rules

### Before Implementing Features

1. Find milestone file (M0-M4)
2. Read complete user story
3. Check [../spec/data-model.md](../spec/data-model.md) for schema
4. Check [../spec/api-contracts.md](../spec/api-contracts.md) for endpoints
5. Verify security rules in [CODING-STANDARDS.md](CODING-STANDARDS.md)

---

## Metadata Headers

Spec files use YAML frontmatter for machine-readable metadata:

```yaml
---
purpose: Brief description of file's goal
topics: comma, separated, keywords, for, search
dependencies: file1.md, file2.md
---
```

### How to Use Metadata

**Purpose Field:**

- One-sentence summary
- Answers "Why does this file exist?"

**Topics Field:**

- Keywords for semantic search
- Example: `auth, jwt, apple-signin, tokens`

**Dependencies Field:**

- Files you should read BEFORE this one
- Example: `architecture.md, data-model.md`

### Files With Metadata (Always Check)

- spec/architecture.md
- spec/data-model.md
- spec/integrations-guide.md
- spec/dev-tooling.md
- All M0-M4 milestone files

---

## Milestone File Structure

All milestone files follow this pattern:

```markdown
# Milestone X: Title

**Goal:** One-sentence objective
**Timeline:** Duration estimate
**Cost Target:** Monthly cost (v1 = $0)
**Dependencies:** What must be done first

## Overview

High-level description

## User Stories

### X.Y Story Title

**Story:** As a [role], I want [feature] so that [benefit]

**Acceptance Criteria:**

- [ ] Testable requirement 1
- [ ] Testable requirement 2
      ...

**API Contract:**
```

POST /endpoint
Body: { ... }
Response: { ... }

```

**Technical Requirements:**
- Implementation details
- Validation rules
- Edge cases

**Privacy Notes:**
- Privacy implications
- Data handling rules

**Security Notes:**
- Auth requirements
- Rate limits
- Validation

**Cost:** $X/month or $0

**Reference:** Links to related specs
```

### How to Read User Stories

1. **Story** = User's goal in plain English
2. **Acceptance Criteria** = Checklist for "done"
3. **API Contract** = Exact endpoint format
4. **Technical Requirements** = How to implement
5. **Privacy/Security Notes** = CRITICAL - Never skip
6. **Reference** = Where to find more details

---

## Search Keywords

Use these keywords to locate concepts:

### By Feature

- **Authentication**: M1-account-privacy.md, architecture.md
- **Habits**: M2-habits-tracking.md, data-model.md
- **Social**: M3-social.md, data-model.md
- **Analytics**: M4-identity-analytics.md
- **Integrations**: integrations-guide.md, M4-identity-analytics.md

### By Technology

- **SQLite**: architecture.md, data-model.md
- **JWT**: architecture.md, M1-account-privacy.md
- **HealthKit**: M4-identity-analytics.md, integrations-guide.md
- **Expo**: dev-guide.md, M0-foundation.md

### By Concept

- **Privacy Model**: architecture.md, data-model.md
- **Streaks**: M2-habits-tracking.md
- **Feed**: M3-social.md
- **Badges**: M3-social.md
- **Dashboard**: M2-habits-tracking.md
- **Challenges**: M4-identity-analytics.md

---

## Common Patterns to Recognize

### Privacy Enforcement Pattern

Always appears as:

```typescript
// Server-side check (CRITICAL)
function checkPrivacy(object, viewerId) {
  if (object.privacy === "SELF") {
    return object.userId === viewerId;
  }
  if (object.privacy === "FRIENDS") {
    return isFriend(object.userId, viewerId);
  }
  if (object.privacy === "PUBLIC") {
    return true;
  }
  return false;
}
```

**Rule:** NEVER trust client filters. Server MUST validate.

### Device-First Pattern

Always appears as:

```typescript
// 1. Write to SQLite (instant UX)
await db.insert("habits", habit);

// 2. Update UI
setHabits([...habits, habit]);

// 3. Enqueue sync (background)
syncQueue.enqueue({ type: "CREATE", table: "habits", data: habit });
```

**Rule:** Local first, cloud second.

### Error Handling Pattern

Always appears as:

```typescript
import { AppError, ErrorCode } from "@/lib/errors";

if (!user) {
  throw new AppError("User not found", ErrorCode.NOT_FOUND);
}
```

**Rule:** Typed errors, never throw strings.

---

## Cross-Reference Format

Spec files use these reference patterns:

### Internal References

- `[spec/file.md](../spec/file.md)` - Link to another spec
- `spec/file.md#L45` - Reference to specific line
- `See architecture.md#privacy-model` - Section reference

### Milestone References

- `M1-account-privacy.md` - Full milestone
- `M2-habits-tracking.md#2.4` - Specific story
- `(see story 3.2)` - Within same milestone

### Code References

- `rules/CODING-STANDARDS.md#security` - Code standards
- `src/lib/errors.ts` - Implementation file
- `AppError` - Type reference (find in src/types/)

---

## Data Model Cross-References

When implementing features:

1. **Read user story** in milestone file
2. **Check schema** in [../spec/data-model.md](../spec/data-model.md)
3. **Find table definition** (Ctrl+F for table name)
4. **Check relationships** (look for foreign keys)
5. **Verify privacy field** (all objects have privacy)
6. **Check indexes** (performance implications)

### Data Model Sections

- **Enums** (line ~10): Privacy, Pillar, CheckInSource, etc.
- **M1-M3 Tables** (line ~50): Core schema for v1
- **M4 Tables** (line ~600): Analytics, identity system
- **M5 Tables** (line ~800): Future features
- **Relationships Diagram** (line ~900): Visual hierarchy
- **Privacy Enforcement** (line ~950): SQL patterns

---

## API Contract Cross-References

When implementing endpoints:

1. **Read user story** in milestone file
2. **Check API contract** in [../spec/api-contracts.md](../spec/api-contracts.md)
3. **Verify route** (GET/POST/PATCH/DELETE)
4. **Check request body** (required fields)
5. **Check response format** (success/error structure)
6. **Verify auth requirement** (bearer token)

### API Contract Sections

- **Auth Rules** (line ~5): Bearer token requirements
- **Response Format** (line ~8): Success/error structure
- **Endpoints** (line ~12): All routes by category
  - Auth (line ~15)
  - Goals (line ~20)
  - Habits (line ~30)
  - Posts (line ~50)
  - Reactions (line ~65)
  - Nudges (line ~70)
  - Feed (line ~80)

---

## Critical Rules for AI Agents

### ALWAYS DO:

✅ Read complete user story (not just title)
✅ Check data-model.md for schema
✅ Verify privacy enforcement patterns
✅ Check acceptance criteria checklist
✅ Read security notes (never skip)
✅ Validate API contracts match implementation
✅ Cross-reference milestone + data-model + api-contracts

### NEVER DO:

❌ Invent features not in spec
❌ Skip privacy enforcement
❌ Trust client-provided filters
❌ Use `any` type in TypeScript
❌ Implement M5 features (future scope)
❌ Add integrations beyond HealthKit steps (M4)
❌ Bypass auth checks
❌ Log PII (emails, names, content)

---

## Handling Ambiguity

If spec is unclear:

1. **Check cross-references** in the file
2. **Search for keywords** in related files
3. **Read referenced sections** completely
4. **Check data model** for schema truth
5. **Add TODO comment** explaining question
6. **Write failing test** describing expected behavior
7. **Reference specific spec** in question: "According to M2 line 45..."

---

## Spec Update Pattern

When specs change:

1. **Update milestone file** (user story, acceptance criteria)
2. **Update data-model.md** (if schema changes)
3. **Update api-contracts.md** (if endpoints change)
4. **Update QUICKSTART.md** (if organization changes)
5. **Update copilot-instructions.md** (if critical patterns change)

Don't update:

- Rules files (unless code patterns change)
- Dev guide (unless workflow changes)

---

## Testing Against Specs

Every acceptance criterion = one test:

```typescript
// From M2-habits-tracking.md story 2.4
describe("Streak calculation", () => {
  it("calculates daily streak correctly", () => {
    // Test matches acceptance criteria exactly
  });
});
```

---

## Quick Lookup Table

| I Need...          | Search For...                | In File...                     |
| ------------------ | ---------------------------- | ------------------------------ |
| Feature definition | User story title             | Milestone file (M0-M4)         |
| Database schema    | Table name                   | data-model.md                  |
| API endpoint       | Route path                   | api-contracts.md               |
| Privacy rules      | "privacy enforcement"        | architecture.md, data-model.md |
| Code patterns      | Topic keyword                | CODING-STANDARDS.md            |
| Dev workflow       | "setup" or "workflow"        | dev-guide.md                   |
| Integration risks  | "HealthKit" or "Screen Time" | integrations-guide.md          |
| Security rules     | "rate limit" or "auth"       | CODING-STANDARDS.md            |
| Type definitions   | Type name                    | src/types/index.ts             |

---

## AI Agent Workflow

```
Start
  ↓
First time? → Yes → Read QUICKSTART.md
  ↓ No
Implementing feature? → Yes → Find milestone file
  ↓                             ↓
  ↓                         Read complete user story
  ↓                             ↓
  ↓                         Check data-model.md
  ↓                             ↓
  ↓                         Check api-contracts.md
  ↓                             ↓
  ↓                         Verify security rules
  ↓                             ↓
  ↓                         Implement
  ↓ No
Fixing bug? → Yes → Find related story → (continue above)
  ↓ No
Refactoring? → Yes → Check CODING-STANDARDS → Implement
```

---

**Last Updated:** December 31, 2025
