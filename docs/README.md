# Social Accountability

**Automation-first iOS habit tracker merging social accountability with self-improvement**

---

## Vision

An iOS app that minimizes user friction by automatically tracking behavior through 3rd party integrations (HealthKit, Screen Time, location), generating visual insights, and enabling friends to hold each other accountable through positive social reinforcement.

**Core Principle:** Friends see your progress, cheer you on, catch you when you slip — with minimal manual logging.

**Target Users:** Health-conscious individuals (18-35) struggling with consistency

---

## Tech Stack

**Mobile**

- React Native + Expo (iOS-first)
- expo-router (file-based routing)
- TypeScript (strict mode)

**Backend**

- Node.js REST API (Express)
- Supabase (free tier)
- JWT auth (7-day expiry)

**Database**

- **Local:** SQLite (source of truth)
- **Cloud:** Postgres (sync replica)
- Pattern: Device-first, offline-first

**Storage**

- expo-secure-store (tokens)
- Cloudinary (media, 25GB free)

**Development**

- Primary: Windows + iPhone (Expo Go)
- Validation: Mac (monthly for HealthKit)

---

## Architecture Principles

### 1. Device-First (Offline-First)

**SQLite = Source of Truth**

```
[User Action] → [SQLite Write] → [UI Update] → [Sync Queue] → [Backend API]
```

- Works offline
- Instant UX (no network wait)
- Lower costs (fewer API calls)
- Privacy (data stays local)

### 2. Privacy Model

Every object has privacy: `SELF` | `FRIENDS` | `CLOSE_FRIENDS` | `PUBLIC`

**Server-side enforcement (CRITICAL):**

```typescript
function enforcePrivacy(object, viewerId) {
  if (object.privacy === "SELF") return object.userId === viewerId;
  if (object.privacy === "FRIENDS") return isFriend(object.userId, viewerId);
  if (object.privacy === "PUBLIC") return true;
  return false;
}
```

**NEVER trust client privacy filters** - Server must re-validate every query.

### 3. Data Hierarchy

- **Identity** (M2): "Who I want to be" - Athlete, Student, Parent
- **Goal** (M2/M3): "Proof I'm that person" - quantitative targets (Run 5K under 30min)
- **Habit** (M2): "What I do daily" - recurring actions (Run 4x/month)

Goals CAN complete, Habits NEVER complete (recurring forever).

### 4. Social Features

- **Posts**: Permanent, 500 char text, supports comments
- **Stories**: 24h TTL, 280 char caption, reactions only
- **Reactions**: 5 emoji only (👍 ❤️ 👏 🔥 📈) - positive reinforcement
- **Nudges**: Templated encouragement (3/day per friend)
- **Badges**: Auto-awarded achievements

### 5. Cost Model

**Goal: $0/month for 1000 users (v1)**

- Device-side calculations (free compute)
- Supabase free tier (500MB DB, 2GB bandwidth)
- Cloudinary free tier (25GB media)
- Local notifications only (no push in v1)

---

## Project Structure

```
/app                  # Screens (expo-router)
/components           # Reusable UI
/services             # API clients, auth
/storage              # SQLite models
/sensors              # Data source abstraction
  /mock               # Fake data for dev
  /ios                # Native implementations
/logic                # Business logic (streaks, scoring)
/src
  /types              # TypeScript definitions
  /lib                # Utilities (logger, errors)
  /config             # Environment config
/tests                # Unit + integration tests
```

---

## Features by Milestone

### M0: Foundation (Current)

- TypeScript setup
- Error handling
- Routing structure
- Auth stubs

### M1: Account & Privacy

- Apple Sign-In
- User profiles
- Friend requests
- Privacy controls (SELF/FRIENDS/PUBLIC)

### M2: Goals & Habits

- Create goals/habits
- Manual check-ins
- Streak calculation
- Dashboard (pillar scores, trends)

### M3: Social

- Posts & stories
- Reactions & nudges
- Feed algorithm
- Badges & achievements

### M4: Identity & Analytics

- Identity system (Athlete, Student, etc.)
- Journal & mood tracking
- Enhanced analytics (correlations, heatmaps)
- HealthKit steps (proof-of-concept)

### M5+: Future

- Full automation (Screen Time, location)
- ML predictions
- Calendar integration
- Monetization

---

## Key Concepts

**Sensor Abstraction:**
All data sources (HealthKit, Screen Time, location) go through `/sensors` interface. Mock providers for Windows dev, real providers for iOS.

**Sync Queue:**
All writes enqueued for background sync. Exponential backoff on failure. Last-modified timestamp for conflict resolution.

**Privacy Levels:**

- `SELF`: Only you
- `FRIENDS`: Your accepted friends
- `CLOSE_FRIENDS`: Inner circle (M4)
- `PUBLIC`: All users

**Rate Limits:**

- Friend requests: 50/day
- Posts: 20/day
- Reactions: 100/day
- Nudges: 3/day per friend, 10/day total

---

## Documentation

- **This file**: Project overview
- **WORKFLOW.md**: Dev workflow & commands
- **data-model.md**: Complete database schema
- **api-contracts.md**: REST API endpoints
- **M0-M5 milestones/**: Feature specifications
- **.github/copilot-instructions.md**: AI agent guide

---

## Development Status

**Current Milestone:** M0 (Foundation)
**Next Up:** M1 (Auth & Privacy)

**Tech Debt:**

- None yet (new project)

**Blockers:**

- None

---

**Last Updated:** December 31, 2025
