# Social Accountability

**Automation-first iOS habit tracker** that merges social accountability with self-improvement. The app minimizes user interaction by automatically gathering data through 3rd party integrations (location, screen time, health metrics, etc.), generating visual insights, and sharing progress with friends. Users see their friends' goals, cheer them on, and hold each other accountable — all with minimal manual effort.

---

## 🎯 Quick Links

**New here?** Start with [docs/QUICKSTART.md](docs/QUICKSTART.md) - complete navigation for AI agents and developers.

**Quick reference?** See [docs/CHEATSHEET.md](docs/CHEATSHEET.md) - one-page lookup for common queries.

---

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
cp .env.local .env
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

## documentation structure

```
/                              # Root
├── QUICKSTART.md             # 🎯 START HERE - Complete navigation
├── CHEATSHEET.md             # Quick reference for common queries
├── README.md                 # This file
├── docs/                     # All documentation
│   ├── QUICKSTART.md         # Start here (AI-optimized navigation)
│   ├── CHEATSHEET.md         # One-page quick reference
│   ├── spec/                 # Product requirements (WHAT to build)
│   │   ├── product/          # Core product docs
│   │   │   ├── vision.md
│   │   │   ├── architecture.md
│   │   │   ├── data-model.md
│   │   │   ├── api-contracts.md
│   │   │   └── permissions.md
│   │   ├── milestones/       # Feature specs
│   │   │   ├── M0-foundation.md
│   │   │   ├── M1-account-privacy.md
│   │   │   ├── M2-habits-tracking.md
│   │   │   ├── M3-social.md
│   │   │   ├── M4-identity-analytics.md
│   │   │   └── M5-future.md
│   │   ├── development/      # Dev workflow
│   │   │   ├── dev-guide.md
│   │   │   ├── dev-tooling.md
│   │   │   └── integrations-guide.md
│   │   └── INDEX.md
│   └── rules/                # Coding standards (HOW to build)
│       ├── CODING-STANDARDS.md
│       ├── AI-AGENT-GUIDE.md
│       └── INDEX.md
└── .github/
    └── copilot-instructions.md # GitHub Copilot context
```

## key decisions

- **privacy model**: SELF/FRIENDS/PUBLIC with per-object overrides, server-side enforcement
- **data sources**: explicit consent required per source, minimal scope (v1 = manual + in-app timers only)
- **offline-first**: local SQLite as source of truth, background sync to cloud
- **ML/auto-logging**: deferred to post-v1 (requires additional data source approvals)
- **development platform**: Windows primary (Expo Go on iPhone), Mac for monthly validation

## milestones

- **M0**: Foundation (types, lint, routing, auth stubs) — frontend-only ✅ In Progress
- **M1**: Account & Privacy (Apple Sign-In, profile setup, privacy controls) 📋 Next
- **M2**: Goals & Habits (manual tracking, streaks, dashboard) 🔜
- **M3**: Social (posts, reactions, nudges, badges) 🔜
- **M4**: Identity & Analytics (identities, journal, mood, HealthKit) 🔜
- **M5+**: Future expansion (ML, location, monetization) 💡

See [docs/spec/milestones/milestones.md](docs/spec/milestones/milestones.md) for detailed breakdown.

## for ai agents

**Start here:** [docs/QUICKSTART.md](docs/QUICKSTART.md) - Optimized navigation hub

**Common queries:** [docs/CHEATSHEET.md](docs/CHEATSHEET.md) - Fast lookups

**Reading specs:** [docs/rules/AI-AGENT-GUIDE.md](docs/rules/AI-AGENT-GUIDE.md) - How to interpret docs

**Coding standards:** [docs/rules/CODING-STANDARDS.md](docs/rules/CODING-STANDARDS.md) - TypeScript + security

---

**Current Status:** M0 Foundation (In Progress)  
**Last Updated:** December 31, 2025
