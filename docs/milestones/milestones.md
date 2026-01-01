# milestones (source of truth)

**Note:** This file provides high-level milestone summaries. For detailed user stories, acceptance criteria, and technical requirements, see the individual milestone files:

- [milestone-0-foundation.md](milestone-0-foundation.md) - M0 detailed spec
- [milestone-1-account-privacy.md](milestone-1-account-privacy.md) - M1 detailed spec
- [milestone-2-habits-tracking.md](milestone-2-habits-tracking.md) - M2 detailed spec
- [milestone-3-social.md](milestone-3-social.md) - M3 detailed spec
- [milestone-4-identity-analytics.md](milestone-4-identity-analytics.md) - M4 detailed spec

---

## milestone 0: foundation (frontend-only)

- project setup (lint, format, types, CI)
- routing/navigation skeleton (expo-router)
- auth stubs + session handling (mocked tokens)
- core domain types + error/log patterns
- directory structure per startup_guide.md
- NO backend deployment, NO database, NO ML (deferred to post-M1)

## milestone 1: account & privacy

### 1.1 auth

- sign in with apple (required, v1 only)
- optional oauth providers (post-v1)
- account recovery (email-based reset)
- secure session + token refresh (JWT)

### 1.2 profile setup

- profile fields: displayName (required), photoUrl (optional), bio (optional, 280 char max)
- circle setup: single default circle, invite by userId, accept/reject flow
- pillar weights (mind/body/heart/soul): optional 0-100 per pillar, defaults to 25 each

### 1.3 privacy & sharing

- global default privacy: self-only | circle-only | public
- per-object privacy for: goals, habits, milestones, journal entries
- enforcement: server-side checks for every read/write

## milestone 2: goals/habits + tracking

- create/edit/delete goals & habits (hierarchical)
- habit.schedule format: { frequency: "daily" | "weekly", targetCount: number, daysOfWeek?: number[] }
- check-ins (manual) + optional automatically logged evidence with external data sources
- streaks + misses + recovery events (on-device calculation)
- dashboard is informational only (no action suggestions, no ML)

## milestone 3: social accountability

- feed posts (text/image/video) tagged to pillar
- reactions (emojis and short 50 character comments)
- nudges (positive predefined templates, rate-limited to 3/day per pair)
- badges for streaks/milestones/recovery
- productive competitions (habit-together): deferred to post-v1
