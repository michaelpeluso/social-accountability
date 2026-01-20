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

- React Native + Expo (iOS-first, managed workflow)
- expo-router (file-based routing)
- TypeScript (strict mode)
- SQLite (local database - source of truth)

**Cloud (Coming Soon)**

- **Supabase** - Postgres database, Storage buckets, auto-generated REST API, JWT auth
- Free tier: 500MB DB + 1GB Storage, 5GB bandwidth/month, unlimited API requests
- Migration path: SQLite → Postgres (both SQL, easy migration)

**Storage**

- expo-secure-store (JWT tokens)
- expo-sqlite (local database)
- Supabase Storage (media files - photos/videos)

**Development**

- Primary: Windows + iPhone (Expo Go)
- Validation: Mac (monthly for native features)

---

## Architecture Principles

### 1. Device-First (Offline-First)

**SQLite = Source of Truth**

```
[User Action] → [SQLite Write] → [UI Update] → [Sync Queue] → [Cloud API (when ready)]
```

- Works offline
- Instant UX (no network wait)
- Lower costs (fewer API calls)
- Privacy (data stays local until synced)

### 2. Privacy Model

Every post-able object has privacy: `SELF` | `FRIENDS` | `PUBLIC`

**Server-side enforcement (CRITICAL for cloud implementation):**

```typescript
// NEVER trust client privacy filters - Server must re-validate every query
function enforcePrivacy(object, currentUserId) {
  if (object.privacy === "SELF") return object.userId === currentUserId;
  if (object.privacy === "FRIENDS") return isFriend(object.userId, currentUserId);
  if (object.privacy === "PUBLIC") return true;
  return false;
}
```

### 3. Data Hierarchy

- **Identity** (M2): "Who I want to be" - Athlete, Student, Parent
- **Goal** (M2/M3): "Proof I'm that person" - quantitative targets (Run 5K under 30min)
- **Habit** (M2): "What I do daily" - recurring actions (Run 4x/month)

Goals CAN complete, Habits NEVER complete (recurring forever).

### 4. Social Features

- **Posts**: Permanent, 500 char text, supports comments, rich media
- **Stories**: 24h TTL, 280 char caption, reactions only
- **Reactions**: 5 emoji only (👍 ❤️ 👏 🔥 📈) - positive reinforcement
- **Nudges**: Templated encouragement (3/day per friend)
- **Badges**: Auto-awarded achievements

### 5. Cost Model

**Goal: $0/month for 1000+ users (M1-M4)**

- Device-side calculations (free compute)
- Supabase free tier (500MB DB + 1GB Storage, 5GB bandwidth)
- Local notifications only (no push until needed)

**When costs start:**

- 1000+ users OR >500MB DB OR >1GB media: Supabase Pro ($25/month)
  - Pro tier includes: 8GB DB + 100GB Storage + 50GB bandwidth
- Push notifications: (consider later, Expo free tier is generous)

---

## Project Structure

```
/app                  # Screens (expo-router)
/src
  /components         # Reusable UI components
  /services           # API clients, auth
  /storage            # SQLite models & queries
  /sensors            # Data source abstraction
    /mock             # Fake data for dev
    /ios              # Native implementations (M4+)
  /logic              # Business logic (streaks, scoring)
  /types              # TypeScript definitions
  /lib                # Utilities (logger, errors)
  /config             # Environment config
  /theme              # Design tokens
/tests                # Unit + integration tests
/docs                 # Documentation
  /milestones         # Feature specifications (M0-M8)
```

---

## Features by Milestone

### ✅ M0: Foundation (Complete)

- TypeScript setup with strict mode
- Error handling & logging
- Routing structure
- SQLite database v3
- Component library
- Dev tools & testing

### 🚧 M1: Account & Privacy (Next)

- Apple Sign-In
- User profiles
- Friend requests
- Privacy controls (SELF/FRIENDS/PUBLIC)
- **Cloud deployment begins** (Supabase setup)

### 📋 M2: Goals & Habits

- Create goals/habits
- Manual check-ins
- Streak calculation
- Dashboard (pillar scores, trends)
- Sync to cloud

### 📋 M3: Social

- Posts & stories with media
- Reactions & nudges
- Feed algorithm
- Badges & achievements

### 📋 M4: Identity & Analytics

- Identity system (Athlete, Student, etc.)
- Journal & mood tracking
- Enhanced analytics
- HealthKit steps (proof-of-concept)

### 📋 M5+: Future

- Full automation (Screen Time, location)
- ML predictions
- Calendar integration
- Monetization

---

## Key Concepts

**Sensor Abstraction:**
All data sources (HealthKit, Screen Time, location) go through `/sensors` interface. Mock providers for Windows dev, real providers for iOS.

**Sync Queue:**
All writes enqueued for background sync. Exponential backoff on failure. Last-modified timestamp for conflict resolution. Device timestamp always wins.

**Privacy Levels:**

- `SELF`: Only you
- `FRIENDS`: Your accepted friends
- `PUBLIC`: All users

**Rate Limits (enforced server-side):**

- Friend requests: 50/day
- Posts: 20/day
- Reactions: 100/day
- Nudges: 3/day per friend, 10/day total

---

## Current Database Schema

**Version:** 3 (SQLite)
**Tables:** 38 tables supporting M0-M8 features
**Source of Truth:** Local SQLite on device
**Cloud Replica:** Coming in M1 (Supabase Postgres)

Key tables:

- `users`, `session`, `settings` - User & auth
- `friendships`, `blocked_users` - Social graph
- `goals`, `habits`, `habit_check_ins` - Core tracking
- `posts`, `stories`, `comments`, `reactions`, `nudges` - Social features
- `badges`, `notifications`, `rate_limits` - Gamification
- Many more for M4+ features (identities, analytics, circles, etc.)

Schema defined in: `src/storage/database.ts`

---

## Development Workflow

**Commands:**

```bash
npm start              # Start Expo dev server
npm run type-check     # TypeScript validation
npm run lint           # ESLint
npm run format         # Prettier
npm test               # Jest tests
npm run test:watch     # Jest watch mode
```

**Dev Tools:**

- Access `/dev` route in app for database management
- Reset database, seed demo data, view schema info
- Useful for testing migrations and schema changes

---

## Cloud Implementation Roadmap

### Phase 1: Supabase Setup (M1)

1. Create Supabase project (free tier)
2. Run schema migration (SQLite → Postgres)
3. Set up authentication (Apple Sign-In)
4. Configure row-level security policies
5. Generate API client

### Phase 2: Sync Implementation (M1-M2)

1. Implement sync queue service
2. Add retry logic with exponential backoff
3. Handle conflict resolution (device timestamp wins)
4. Background sync every 15min + on app open
5. Offline indicator UI

### Phase 3: Privacy Enforcement (M1-M2)

1. Server-side privacy validation
2. Friendship status checks
3. Rate limiting middleware
4. API endpoint authorization

### Why Supabase?

- **SQL compatibility**: Direct migration from SQLite → Postgres
- **Auto-generated API**: No need to write REST endpoints manually
- **Built-in auth**: JWT tokens, social logins
- **Generous free tier**: 500MB DB, 5GB bandwidth
- **Open source**: Can self-host if needed
- **Simple pricing**: $25/month pro tier when you grow

---

## Documentation

- **This file**: Project overview
- **WORKFLOW.md**: Development workflow & Git conventions
- **api-contracts.md**: REST API endpoints (for cloud implementation)
- **M0-M8 milestones/**: Detailed feature specifications
- **.github/copilot-instructions.md**: AI agent guide

---

## Development Status

**Current Milestone:** M0 (Complete) → Preparing for M1
**Current Schema:** SQLite v3, 38 tables
**Next Up:** Cloud deployment (Supabase) + Apple Sign-In

**Tech Debt:**

- None yet (fresh foundation)

**Blockers:**

- Need to decide on exact Supabase setup approach
- Apple Developer account enrollment ($99/year)

---

**Last Updated:** January 18, 2026
