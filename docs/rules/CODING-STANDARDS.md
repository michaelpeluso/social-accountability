# Coding Standards

**TypeScript patterns, security requirements, and testing rules**

---

## TypeScript Standards

### Strict Mode (Non-Negotiable)

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

✅ **DO:**

- Use explicit types for all function returns
- Use TypeScript enums for fixed sets of values
- Use `unknown` instead of `any` when type is uncertain
- Use type guards to narrow `unknown` types

❌ **DON'T:**

- Use `any` (add `// TODO: type this` if absolutely needed)
- Use `@ts-ignore` or `@ts-expect-error`
- Leave implicit `any` in function parameters
- Use type assertions without validation (`value as Type`)

### Type Organization

```typescript
// src/types/index.ts - Export all types from one place
export * from './models';
export * from './api';
export * from './enums';

// src/types/models.ts - Domain models
export interface User { ... }
export interface Habit { ... }

// src/types/api.ts - Request/response types
export interface ApiResponse<T> { data: T }
export interface ApiError { code: string; message: string }

// src/types/enums.ts - All enums
export enum Privacy { SELF = 'SELF', FRIENDS = 'FRIENDS', PUBLIC = 'PUBLIC' }
```

### Naming Conventions

- **Interfaces/Types**: PascalCase (`User`, `ApiResponse<T>`)
- **Enums**: PascalCase for name, SCREAMING_SNAKE_CASE for values
  ```typescript
  enum Privacy {
    SELF = "SELF",
    FRIENDS = "FRIENDS",
    PUBLIC = "PUBLIC",
  }
  ```
- **Functions/Variables**: camelCase (`getUserById`, `currentUser`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_RETRIES`, `API_BASE_URL`)
- **Components**: PascalCase (`HabitCard`, `ProfileScreen`)
- **Files**: kebab-case (`habit-card.tsx`, `user-profile.ts`)

### Function Patterns

```typescript
// ✅ GOOD: Explicit return type, typed parameters
function calculateStreak(habit: Habit, checkIns: CheckIn[]): number {
  // Implementation
  return streak;
}

// ❌ BAD: Implicit return type, missing parameter types
function calculateStreak(habit, checkIns) {
  return streak;
}

// ✅ GOOD: Async functions
async function fetchUser(id: string): Promise<User> {
  const response = await api.get<User>(`/users/${id}`);
  return response.data;
}

// ❌ BAD: No return type on async
async function fetchUser(id: string) {
  return await api.get(`/users/${id}`);
}
```

### Component Patterns

```typescript
// ✅ GOOD: Functional component with typed props
interface HabitCardProps {
  habit: Habit;
  onPress: (id: string) => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({ habit, onPress }) => {
  return <View>...</View>;
};

// ❌ BAD: No prop types
export const HabitCard = ({ habit, onPress }) => {
  return <View>...</View>;
};
```

---

## Error Handling

### Typed Errors Only

```typescript
// src/lib/errors.ts
export enum ErrorCode {
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  BAD_REQUEST = "BAD_REQUEST",
  RATE_LIMITED = "RATE_LIMITED",
  VALIDATION_FAILED = "VALIDATION_FAILED",
  CONFLICT = "CONFLICT",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
}

export class AppError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = "AppError";
  }

  toApiResponse() {
    return {
      error: {
        code: this.code,
        message: this.message,
      },
    };
  }
}

// ✅ GOOD: Throw typed errors
if (!user) {
  throw new AppError("User not found", ErrorCode.NOT_FOUND, 404);
}

// ❌ BAD: Throw strings
if (!user) {
  throw new Error("User not found");
}
```

### Error Boundaries

```typescript
// app/_layout.tsx
import * as Sentry from '@sentry/react-native';

export default function RootLayout() {
  return (
    <Sentry.ErrorBoundary fallback={<ErrorScreen />}>
      {/* App content */}
    </Sentry.ErrorBoundary>
  );
}
```

---

## Logging

### Structured Logging (No PII)

```typescript
// src/lib/logger.ts
interface LogContext {
  [key: string]: string | number | boolean | undefined;
}

class Logger {
  info(message: string, context?: LogContext) {
    console.log(
      JSON.stringify({
        level: "info",
        message,
        timestamp: new Date().toISOString(),
        ...context,
      })
    );
  }

  error(message: string, error?: Error, context?: LogContext) {
    console.error(
      JSON.stringify({
        level: "error",
        message,
        error: error?.message,
        stack: error?.stack,
        timestamp: new Date().toISOString(),
        ...context,
      })
    );
  }
}

export const logger = new Logger();

// ✅ GOOD: Structured, no PII
logger.info("habit_created", { habitId: habit.id, pillar: habit.pillar });

// ❌ BAD: Contains PII
logger.info("User john@example.com created habit");

// ❌ BAD: Unstructured
logger.info("Habit created for user " + userId);
```

### What NOT to Log

❌ Passwords or tokens
❌ Email addresses
❌ User names
❌ Message content
❌ Location coordinates (exact values)
❌ Any PII

✅ **DO Log:**

- User IDs (UUIDs, not names)
- Action types (created, updated, deleted)
- Timestamps
- Error codes
- Aggregated metrics

---

## Security

### 1. Server-Side Privacy Enforcement (CRITICAL)

**Rule:** NEVER trust client-provided privacy filters. Server MUST validate.

```typescript
// ❌ BAD: Trusts client filter
app.get("/habits", async (req, res) => {
  const habits = await db.query("SELECT * FROM habits WHERE privacy = ?", [req.query.privacy]);
  res.json({ data: habits });
});

// ✅ GOOD: Server enforces privacy
app.get("/habits", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const scope = req.query.scope || "mine";

  let query = "SELECT * FROM habits WHERE ";

  if (scope === "mine") {
    query += "userId = ?";
    params = [userId];
  } else if (scope === "friends") {
    query += `(privacy = 'PUBLIC' OR 
               (privacy = 'FRIENDS' AND userId IN (
                 SELECT friendId FROM friendships 
                 WHERE userId = ? AND status = 'ACCEPTED'
               ))
               OR userId = ?)`;
    params = [userId, userId];
  } else if (scope === "public") {
    query += `privacy = 'PUBLIC'`;
    params = [];
  }

  const habits = await db.query(query, params);
  res.json({ data: habits });
});
```

### 2. Authentication

**Rule:** All endpoints require auth except /health and /auth/\*

```typescript
// middleware/auth.ts
import jwt from "jsonwebtoken";

export function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "No token provided" },
    });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({
      error: { code: "FORBIDDEN", message: "Invalid token" },
    });
  }
}

// Apply to all routes
app.use("/api", authenticateToken);

// Except auth routes
app.use("/auth", authRouter); // No auth middleware
```

### 3. Rate Limiting

**Rule:** Rate limit EVERYTHING to prevent abuse

```typescript
import rateLimit from 'express-rate-limit';

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 requests per hour per user
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
  keyGenerator: (req) => req.user?.id || req.ip
});

// Stricter limits for specific endpoints
const friendRequestLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 1 day
  max: 50, // 50 friend requests per day
  keyGenerator: (req) => req.user.id
});

const nudgeLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 1 day
  max: 10, // 10 nudges per day
  keyGenerator: (req) => req.user.id
});

// Per-pair nudge limit (3/day per friend)
async function checkNudgeLimit(fromUserId: string, toUserId: string): Promise<boolean> {
  const count = await db.query(
    'SELECT COUNT(*) FROM nudges WHERE fromUserId = ? AND toUserId = ? AND createdAt > NOW() - INTERVAL 1 DAY',
    [fromUserId, toUserId]
  );
  return count < 3;
}

app.use('/api', apiLimiter);
app.post('/friends/requests', friendRequestLimiter, ...);
app.post('/nudges', nudgeLimiter, async (req, res) => {
  const canSend = await checkNudgeLimit(req.user.id, req.body.toUserId);
  if (!canSend) {
    return res.status(429).json({
      error: { code: 'RATE_LIMITED', message: 'Too many nudges to this user today' }
    });
  }
  // ... create nudge
});
```

### 4. Input Validation

**Rule:** Validate on client AND server (never trust client)

```typescript
import { z } from "zod";

// Define schemas
const CreateHabitSchema = z.object({
  title: z.string().min(1).max(100),
  pillar: z.enum(["MIND", "BODY", "HEART", "SOUL"]),
  privacy: z.enum(["SELF", "FRIENDS", "PUBLIC"]),
  schedule: z.object({
    frequency: z.enum(["daily", "weekly"]),
    targetCount: z.number().positive(),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  }),
});

// ✅ GOOD: Validate on server
app.post("/habits", authenticateToken, async (req, res) => {
  try {
    const validated = CreateHabitSchema.parse(req.body);

    // Verify goalId belongs to user if provided
    if (validated.goalId) {
      const goal = await db.queryOne("SELECT * FROM goals WHERE id = ? AND userId = ?", [
        validated.goalId,
        req.user.id,
      ]);
      if (!goal) {
        throw new AppError("Goal not found", ErrorCode.NOT_FOUND, 404);
      }
    }

    const habit = await createHabit(req.user.id, validated);
    res.json({ data: habit });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: "VALIDATION_FAILED",
          message: "Invalid input",
          details: err.errors,
        },
      });
    } else {
      throw err;
    }
  }
});
```

### 5. Ownership Validation

**Rule:** Always verify user owns or can access the resource

```typescript
// ❌ BAD: No ownership check
app.delete("/habits/:id", authenticateToken, async (req, res) => {
  await db.execute("DELETE FROM habits WHERE id = ?", [req.params.id]);
  res.json({ data: { message: "Deleted" } });
});

// ✅ GOOD: Verify ownership
app.delete("/habits/:id", authenticateToken, async (req, res) => {
  const habit = await db.queryOne("SELECT * FROM habits WHERE id = ?", [req.params.id]);

  if (!habit) {
    throw new AppError("Habit not found", ErrorCode.NOT_FOUND, 404);
  }

  if (habit.userId !== req.user.id) {
    throw new AppError("You cannot delete this habit", ErrorCode.FORBIDDEN, 403);
  }

  await db.execute("DELETE FROM habits WHERE id = ? AND userId = ?", [req.params.id, req.user.id]);
  res.json({ data: { message: "Deleted" } });
});
```

### 6. Environment Variables

**Rule:** Never hardcode secrets, always use env vars

```typescript
// .env.example (committed to repo)
JWT_SECRET=your-secret-here
DATABASE_URL=postgres://...
CLOUDINARY_API_KEY=...
APPLE_CLIENT_ID=...

// .env (NOT committed, in .gitignore)
JWT_SECRET=actual-production-secret-2024-xyz
DATABASE_URL=postgres://user:pass@host:5432/db

// src/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  JWT_SECRET: z.string().min(32),
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'test', 'production']),
  CLOUDINARY_API_KEY: z.string().optional(),
  APPLE_CLIENT_ID: z.string()
});

export const env = envSchema.parse(process.env);

// ✅ GOOD: Use env.JWT_SECRET
const token = jwt.sign(payload, env.JWT_SECRET);

// ❌ BAD: Hardcoded secret
const token = jwt.sign(payload, 'my-secret-key');
```

---

## Testing

### Unit Test Pattern

```typescript
// tests/logic/streaks.test.ts
import { calculateStreak } from "@/logic/streaks";

describe("calculateStreak", () => {
  it("returns 0 for no check-ins", () => {
    const habit = mockHabit({ schedule: { frequency: "daily", targetCount: 1 } });
    const checkIns = [];

    expect(calculateStreak(habit, checkIns)).toBe(0);
  });

  it("calculates daily streak correctly", () => {
    const habit = mockHabit({ schedule: { frequency: "daily", targetCount: 1 } });
    const checkIns = [
      mockCheckIn({ occurredAt: "2024-01-03" }),
      mockCheckIn({ occurredAt: "2024-01-02" }),
      mockCheckIn({ occurredAt: "2024-01-01" }),
    ];

    expect(calculateStreak(habit, checkIns)).toBe(3);
  });

  it("breaks streak on missed day", () => {
    const habit = mockHabit({ schedule: { frequency: "daily", targetCount: 1 } });
    const checkIns = [
      mockCheckIn({ occurredAt: "2024-01-03" }),
      // Missing 2024-01-02
      mockCheckIn({ occurredAt: "2024-01-01" }),
    ];

    expect(calculateStreak(habit, checkIns)).toBe(1);
  });
});
```

### Integration Test Pattern

```typescript
// tests/api/habits.test.ts
import request from "supertest";
import { app } from "@/app";
import { createTestUser, getAuthToken } from "./helpers";

describe("POST /habits", () => {
  let token: string;

  beforeEach(async () => {
    const user = await createTestUser();
    token = await getAuthToken(user.id);
  });

  it("creates habit with valid data", async () => {
    const response = await request(app)
      .post("/habits")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Morning meditation",
        pillar: "SOUL",
        privacy: "SELF",
        schedule: { frequency: "daily", targetCount: 1 },
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      title: "Morning meditation",
      pillar: "SOUL",
    });
  });

  it("returns 401 without auth token", async () => {
    const response = await request(app).post("/habits").send({ title: "Test" });

    expect(response.status).toBe(401);
  });
});
```

### Test Coverage Requirements

- **Logic functions**: 80% coverage minimum
- **API endpoints**: Test success + error cases
- **Privacy enforcement**: Must have tests verifying:
  - User A cannot see User B's SELF content
  - User A CAN see User B's PUBLIC content
  - User A CAN see User B's FRIENDS content if friends

---

## Import Organization

```typescript
// 1. External dependencies
import React, { useState, useEffect } from "react";
import { View, Text } from "react-native";

// 2. Internal aliased imports (@/)
import { logger } from "@/lib/logger";
import { AppError, ErrorCode } from "@/lib/errors";
import { User, Habit } from "@/types";

// 3. Relative imports
import { HabitCard } from "../components/habit-card";
import { styles } from "./styles";
```

---

## File Organization

```
/app                        # Screens (Expo Router)
  /_layout.tsx             # Root layout
  /index.tsx               # Home screen
  /habits/
    /[id].tsx              # Habit detail (dynamic route)
    /new.tsx               # Create habit

/components                 # Reusable UI
  /habit-card.tsx
  /button.tsx
  /index.ts                # Export all components

/services                   # API clients
  /api.ts                  # Base API client
  /auth.ts                 # Auth service
  /habits.ts               # Habits API

/storage                    # SQLite
  /db.ts                   # Database connection
  /schema.ts               # Table definitions
  /migrations/             # Migration files

/logic                      # Business logic
  /streaks.ts              # Streak calculation
  /scoring.ts              # Pillar scoring

/tests                      # Tests mirror source structure
  /logic/
    /streaks.test.ts
  /services/
    /auth.test.ts
```

---

## Quick Reference

### Before Every PR

- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes (no warnings)
- [ ] `npm run format:check` passes
- [ ] `npm test` passes
- [ ] Added tests for new features
- [ ] Updated tests for changed behavior
- [ ] No `any` types added
- [ ] No PII in logs
- [ ] Privacy enforcement verified
- [ ] Rate limits added (if new endpoint)

### Red Flags (Reject PR)

- ❌ `any` types without TODO comment
- ❌ Client-only privacy filtering
- ❌ Missing auth checks on protected routes
- ❌ PII in logs (emails, names, content)
- ❌ Hardcoded secrets
- ❌ No tests for new features
- ❌ Unstructured errors (throw strings)

---

**Last Updated:** December 31, 2025
