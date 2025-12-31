# AI Agent Cheat Sheet

**Ultra-quick reference for common queries**

---

## 🔍 Fast Lookups

### "Where is the [X]?"

| What You Need           | File                                                     | Section                |
| ----------------------- | -------------------------------------------------------- | ---------------------- |
| **Database schema**     | [spec/data-model.md](spec/data-model.md)                 | Tables start ~line 50  |
| **API endpoints**       | [spec/api-contracts.md](spec/api-contracts.md)           | All endpoints ~line 12 |
| **Auth flow**           | [spec/M1-account-privacy.md](spec/M1-account-privacy.md) | Story 1.1              |
| **Privacy rules**       | [spec/architecture.md](spec/architecture.md)             | Privacy Model section  |
| **Streak logic**        | [spec/M2-habits-tracking.md](spec/M2-habits-tracking.md) | Story 2.4              |
| **Feed algorithm**      | [spec/M3-social.md](spec/M3-social.md)                   | Story 3.2              |
| **TypeScript patterns** | [rules/CODING-STANDARDS.md](rules/CODING-STANDARDS.md)   | TypeScript section     |
| **Security rules**      | [rules/CODING-STANDARDS.md](rules/CODING-STANDARDS.md)   | Security section       |

---

## 🚀 Quick Commands

```bash
# First time setup
npm install

# Development
npm start                # Expo dev server
npm run type-check       # TypeScript validation
npm run lint             # ESLint
npm test                 # Run tests

# Code quality
npm run format           # Format with Prettier
npm run format:check     # Check formatting
```

---

## 📝 Common Patterns

### Privacy Enforcement (Copy-Paste Ready)

```typescript
// Server-side check (ALWAYS DO THIS)
function getHabits(viewerId: string, scope: "mine" | "friends" | "public") {
  let query = "SELECT * FROM habits WHERE ";

  if (scope === "mine") {
    query += "userId = ?";
    params = [viewerId];
  } else if (scope === "friends") {
    query += `(privacy = 'PUBLIC' OR 
               (privacy = 'FRIENDS' AND userId IN (
                 SELECT friendId FROM friendships 
                 WHERE userId = ? AND status = 'ACCEPTED'
               )))`;
    params = [viewerId];
  } else {
    query += `privacy = 'PUBLIC'`;
    params = [];
  }

  return db.query(query, params);
}
```

### Typed Error Handling

```typescript
import { AppError, ErrorCode } from "@/lib/errors";

// ✅ DO THIS
throw new AppError("User not found", ErrorCode.NOT_FOUND, 404);

// ❌ NOT THIS
throw new Error("User not found");
```

### Structured Logging

```typescript
import { logger } from "@/lib/logger";

// ✅ DO THIS (no PII)
logger.info("habit_created", { habitId, pillar, privacy });

// ❌ NOT THIS (contains PII)
logger.info(`User ${email} created habit "${title}"`);
```

### Device-First Sync

```typescript
// 1. Write to SQLite (instant UX)
await db.insert("habits", habit);

// 2. Update UI
setHabits([...habits, habit]);

// 3. Enqueue sync (background)
syncQueue.enqueue({ type: "CREATE", table: "habits", data: habit });
```

---

## ⚡ Critical Rules

### ALWAYS:

- ✅ Server-side privacy enforcement
- ✅ Explicit return types in TypeScript
- ✅ Write to SQLite before cloud
- ✅ Log without PII
- ✅ Rate limit all endpoints
- ✅ Validate user owns resource

### NEVER:

- ❌ Trust client privacy filters
- ❌ Use `any` type
- ❌ Skip auth checks
- ❌ Log emails, names, content
- ❌ Hardcode secrets
- ❌ Implement M5 features

---

## 📚 Deep Dive References

### Full Documentation

- **Start here:** [QUICKSTART.md](QUICKSTART.md)
- **Product vision:** [spec/vision.md](spec/vision.md)
- **Architecture:** [spec/architecture.md](spec/architecture.md)
- **Complete schema:** [spec/data-model.md](spec/data-model.md)
- **Coding standards:** [rules/CODING-STANDARDS.md](rules/CODING-STANDARDS.md)
- **Spec reading guide:** [rules/AI-AGENT-GUIDE.md](rules/AI-AGENT-GUIDE.md)

### By Milestone

- **M0 (Setup):** [spec/M0-foundation.md](spec/M0-foundation.md)
- **M1 (Auth):** [spec/M1-account-privacy.md](spec/M1-account-privacy.md)
- **M2 (Habits):** [spec/M2-habits-tracking.md](spec/M2-habits-tracking.md)
- **M3 (Social):** [spec/M3-social.md](spec/M3-social.md)
- **M4 (Analytics):** [spec/M4-identity-analytics.md](spec/M4-identity-analytics.md)
- **M5+ (Future):** [spec/M5-future.md](spec/M5-future.md)

---

## 🎯 Workflow

```
Question?
  ↓
Check this file first
  ↓
Not here? → [QUICKSTART.md](QUICKSTART.md)
  ↓
Still lost? → [rules/AI-AGENT-GUIDE.md](rules/AI-AGENT-GUIDE.md)
  ↓
Need details? → Milestone files (M0-M4)
```

---

**Last Updated:** December 31, 2025
