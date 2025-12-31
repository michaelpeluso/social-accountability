# Milestone 0: Foundation (Frontend-Only)

**Goal:** Establish development infrastructure and core patterns before feature work.
**Timeline:** 1 week
**Cost Target:** $0 (no cloud deployment yet)

---

## Overview

M0 is infrastructure-only. NO user-facing features, NO backend deployment, NO database setup, NO ML. This milestone proves the development workflow works and establishes patterns for M1-M3.

---

## User Stories

### 0.1 Project Setup

**Story:** As a developer, I want a fully configured TypeScript project so that I can write type-safe code with automated quality checks.

**Acceptance Criteria:**

- [ ] `npm install` completes without errors
- [ ] `npm run type-check` passes with strict mode enabled
- [ ] `npm run lint` passes with no warnings (enforces no `any` types)
- [ ] `npm run format:check` passes
- [ ] `npm test` runs and passes (even if just placeholder tests)
- [ ] GitHub Actions CI runs all checks on PR

**Technical Requirements:**

- TypeScript strict mode: true, noImplicitAny: true
- ESLint rule: `@typescript-eslint/no-explicit-any: error`
- Prettier formatting enforced
- Jest configured for React Native testing

**Files to Create:**

- [x] `package.json` - dependencies and scripts
- [x] `tsconfig.json` - strict TypeScript config
- [x] `.eslintrc.js` - linting rules
- [x] `.prettierrc.json` - formatting rules
- [x] `jest.config.js` + `jest.setup.js` - testing config
- [x] `.github/workflows/ci.yml` - CI pipeline
- [x] `.gitignore` - proper exclusions
- [x] `.env.example` - all env vars documented

**Privacy Note:** N/A (no user data yet)
**Cost Note:** CI runs free on GitHub Actions

---

### 0.2 Directory Structure

**Story:** As a developer, I want an organized directory structure following the startup guide so that code is easy to find and follows established patterns.

**Acceptance Criteria:**

- [ ] All directories from startup_guide.md exist
- [ ] Each directory has a .gitkeep or README explaining its purpose
- [ ] Import paths work with @ alias (e.g., `import { logger } from "@/lib/logger"`)

**Directories Required:**

```
/app              - Screens + navigation (Expo Router)
/components       - Reusable UI components
/state            - App state management (Zustand/Redux)
/storage          - SQLite models + migrations
/services         - API clients, auth, sync
/sensors          - Data source abstractions
  /mock           - Mock implementations for dev
  /ios            - iOS native implementations
/logic            - Business logic (streaks, scoring)
/src
  /config         - Env vars, feature flags
  /lib            - Utilities (logger, errors)
  /types          - TypeScript types
/tests            - Unit + integration tests
```

**Technical Requirements:**

- Expo Router for navigation (file-based routing)
- Path alias `@/*` maps to `src/*` in tsconfig
- Sensor pattern: interface → mock → ios (implemented later)

**Privacy Note:** Sensor abstraction critical for consent management
**Cost Note:** $0

---

### 0.3 Core Type Definitions

**Story:** As a developer, I want all domain types defined upfront so that I can build features with type safety and avoid schema drift.

**Acceptance Criteria:**

- [ ] All types from data-model.md exist in src/types/
- [ ] Types are organized by category (models, api, enums)
- [ ] No `any` types anywhere
- [ ] Types export from single index.ts
- [ ] Request/response types defined for all API endpoints

**Types to Define:**

```typescript
// Enums
Privacy: "SELF" | "CIRCLE" | "PUBLIC"
Pillar: "MIND" | "BODY" | "HEART" | "SOUL"
HabitFrequency: "daily" | "weekly"
CheckInSource: "MANUAL" | "INTEGRATION"
CircleRole: "OWNER" | "MEMBER"

// Domain Models
User, Goal, Habit, HabitCheckIn, Post, Reaction, Nudge, Circle, CircleMember

// API Types
ApiResponse<T>, ApiError, PaginatedResponse<T>

// Request/Response Types
CreateGoalRequest, CreateHabitRequest, CreateCheckInRequest, etc.
```

**Technical Requirements:**

- Reference spec/data-model.md as source of truth
- HabitSchedule type: `{ frequency, targetCount, daysOfWeek? }`
- All timestamps as ISO 8601 strings
- IDs as UUIDs (string type)

**Privacy Note:** Privacy enum enforced at type level
**Cost Note:** $0

---

### 0.4 Error Handling Pattern

**Story:** As a developer, I want a consistent error handling pattern so that all errors are typed, logged safely, and converted to API responses correctly.

**Acceptance Criteria:**

- [ ] AppError class with code, message, status
- [ ] toApiResponse() method returns { error: { code, message } }
- [ ] All error codes defined: UNAUTHORIZED, FORBIDDEN, NOT_FOUND, BAD_REQUEST, RATE_LIMITED, VALIDATION_FAILED, CONFLICT, SERVICE_UNAVAILABLE
- [ ] Helper functions for each error type
- [ ] Tests verify error structure

**Technical Requirements:**

- Extends Error with additional properties
- HTTP status codes match standard (401, 403, 404, 400, 429, 409, 503)
- Never expose stack traces to clients in production

**Privacy Note:** Error messages must NOT contain PII
**Cost Note:** $0

**Reference:** rules/code-style.md#L6 (errors are typed)

---

### 0.5 Logging Pattern

**Story:** As a developer, I want structured logging with automatic PII sanitization so that I can debug issues without exposing sensitive user data.

**Acceptance Criteria:**

- [ ] Logger has debug, info, warn, error methods
- [ ] All logs are structured JSON with timestamp, level, msg, metadata
- [ ] PII fields automatically redacted: token, password, email, location, messageContent, phoneNumber
- [ ] Sanitization works recursively for nested objects
- [ ] Tests verify PII is never logged
- [ ] Log level configurable via env var

**Technical Requirements:**

```typescript
logger.info("User signed in", { userId: "123", email: "test@ex.com" });
// Output: {"level":"INFO","timestamp":"...","msg":"User signed in","userId":"123","email":"[REDACTED]"}
```

**PII Fields to Redact:**

- token, password, jwt, secret, apiKey
- email, phoneNumber, phone
- location, latitude, longitude, address
- messageContent, message, body, text
- ssn, creditCard (if ever added)

**Privacy Note:** CRITICAL - never log PII per rules/security.md#L6
**Cost Note:** $0

**Reference:** rules/security.md#L6, rules/code-style.md#L7

---

### 0.6 Environment Configuration

**Story:** As a developer, I want validated environment variables so that misconfigurations fail fast at startup rather than in production.

**Acceptance Criteria:**

- [ ] env.ts exports all config with types
- [ ] Required vars throw error if missing at startup
- [ ] Optional vars have documented defaults
- [ ] .env.example contains all variables
- [ ] Validation works for string, number, boolean types
- [ ] Feature flags defined (ENABLE_APPLE_AUTH, ENABLE_HEALTHKIT)

**Environment Variables:**

```bash
# Required
API_URL=http://localhost:3000/api
APPLE_CLIENT_ID=com.yourapp.service
JWT_SECRET=your-secret-here

# Optional with Defaults
NODE_ENV=development
LOG_LEVEL=info
API_TIMEOUT_MS=10000
RATE_LIMIT_WINDOW=86400
RATE_LIMIT_NUDGES_PER_PAIR=3
RATE_LIMIT_NUDGES_PER_USER=10

# Feature Flags
ENABLE_APPLE_AUTH=true
ENABLE_HEALTHKIT=false
```

**Technical Requirements:**

- Throw on missing required vars at import time
- Helper functions: getRequiredEnv, getOptionalEnv, getNumberEnv, getBooleanEnv
- Never commit .env to git (in .gitignore)

**Privacy Note:** JWT_SECRET must be kept secret
**Cost Note:** $0

**Reference:** rules/security.md#L5 (secrets only in env vars)

---

### 0.7 Navigation Skeleton

**Story:** As a developer, I want basic app navigation working so that I can add screens in M1+ without restructuring.

**Acceptance Criteria:**

- [ ] Expo Router configured (app/ directory routing)
- [ ] App loads to placeholder home screen
- [ ] Can navigate to /auth/signin screen
- [ ] Navigation state persists across hot reloads
- [ ] Works on iPhone via Expo Go

**Screens to Create (Placeholders):**

- `app/_layout.tsx` - Root navigation stack
- `app/index.tsx` - Home screen placeholder
- `app/auth/signin.tsx` - Sign-in screen placeholder

**Technical Requirements:**

- Use Expo Router file-based routing
- React Navigation under the hood
- No auth protection yet (M1 task)

**Privacy Note:** N/A
**Cost Note:** $0

---

### 0.8 Auth Service Stub

**Story:** As a developer, I want a mocked auth service so that I can develop features requiring auth without waiting for Apple Sign-In integration.

**Acceptance Criteria:**

- [ ] auth.signIn() returns mock JWT and user
- [ ] auth.signOut() clears session
- [ ] auth.getSession() retrieves stored session
- [ ] auth.isAuthenticated() returns boolean
- [ ] Session persists in AsyncStorage across app restarts
- [ ] Token expiry checked (7 days)
- [ ] Tests verify all methods work
- [ ] Placeholder for refreshToken() (TODO for M1)

**Mock Behavior:**

```typescript
signIn() → { user: { id, displayName, email }, token: "mock-jwt-..." }
// Stores in AsyncStorage, expires in 7 days
```

**Technical Requirements:**

- Use @react-native-async-storage/async-storage
- Token format: "mock-jwt-[timestamp]" for uniqueness
- User ID: "mock-user-123" (deterministic for testing)
- TODO comments for real Apple Sign-In implementation

**Privacy Note:** Mock email never leaves device
**Cost Note:** $0

**Reference:** spec/milestones.md#M1.1 (will be replaced in M1)

---

## Validation Checklist

Before moving to M1:

- [ ] `npm install` works
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes with no warnings
- [ ] `npm run format:check` passes
- [ ] `npm test` passes (with tests for logger, errors, auth stub)
- [ ] CI pipeline green on GitHub
- [ ] App loads on iPhone via Expo Go
- [ ] Can navigate between screens
- [ ] Mock auth sign-in/sign-out works
- [ ] All directories exist per startup_guide.md
- [ ] .env.example filled out

---

## What NOT to Build in M0

❌ NO backend API deployment
❌ NO database setup (SQLite or cloud)
❌ NO real Apple Sign-In integration
❌ NO user-facing features (goals, habits, posts)
❌ NO UI design/styling (placeholders only)
❌ NO ML or auto-logging
❌ NO sensor integrations
❌ NO network calls to APIs

**Why:** M0 is foundation only. Features start in M1.

---

## Dependencies

**Before M0:**

- Node.js installed
- iPhone with Expo Go app
- GitHub account (for CI)

**After M0:**

- M1 can start (auth, profile, privacy)

---

## Cost & Privacy Summary

**Monthly Cost:** $0

- No cloud services
- GitHub Actions CI free tier
- All development local + iPhone

**Privacy Considerations:**

- No user data collected yet
- Logger sanitization in place for M1+
- Env var pattern for secrets established

---

## Reference Documents

- [spec/milestones.md](spec/milestones.md#L3-L9) - M0 definition
- [spec/startup_guide.md](spec/startup_guide.md#L60-L74) - Directory structure
- [rules/code-style.md](rules/code-style.md) - Code patterns
- [rules/security.md](rules/security.md) - Security rules
- [rules/ai.md](rules/ai.md) - Development rules
