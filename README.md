# Social Accountability

**Automation-first iOS habit tracker** that merges social accountability with self-improvement. The app minimizes user interaction by automatically gathering data through 3rd party integrations (location, screen time, health metrics, etc.), generating visual insights, and sharing progress with friends. Users see their friends' goals, cheer them on, and hold each other accountable — all with minimal manual effort.

## stack
- **mobile**: React Native + Expo (iOS-first, managed workflow → dev build)
- **backend**: REST API (Node.js/Express, deployment TBD)
- **db**: SQLite (local-first) + Postgres (cloud sync replica)
- **auth**: Apple Sign-In (required), OAuth providers (post-v1)
- **storage**: Local encrypted storage + cloud backup (S3/similar for media)

## run locally
```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your values

# Start Expo dev server
npm start

# On iPhone: scan QR with Expo Go app
```

## development workflow
```bash
# Type check
npm run type-check

# Lint
npm run lint

# Format
npm run format

# Test
npm test

# Watch tests
npm run test:watch
```

## repo map
- `/spec`: product requirements + API contracts (source of truth)
- `/rules`: engineering guardrails (security, code style, AI rules)
- `/src`: shared utilities (types, errors, logger, config)
- `/app`: screens + navigation (Expo Router)
- `/components`: reusable UI components
- `/services`: API clients, auth, sync
- `/storage`: SQLite models + migrations
- `/sensors`: data source abstractions (mock/iOS)
- `/logic`: business logic (streaks, scoring)
- `/tests`: unit + integration tests

## key decisions
- **privacy model**: SELF/CIRCLE/PUBLIC with per-object overrides, server-side enforcement
- **data sources**: explicit consent required per source, minimal scope (v1 = manual + in-app timers only)
- **offline-first**: local SQLite as source of truth, background sync to cloud
- **ML/auto-logging**: deferred to post-v1 (requires additional data source approvals)
- **development platform**: Windows primary (Expo Go on iPhone), Mac for monthly validation

## milestones
- **M0**: Foundation (types, lint, routing, auth stubs) — frontend-only
- **M1**: Account & Privacy (Apple Sign-In, profile setup, privacy controls)
- **M2**: Goals & Habits (manual tracking, streaks, dashboard)
- **M3**: Social (posts, reactions, nudges, badges)

See [spec/milestones.md](spec/milestones.md) for detailed breakdown.
