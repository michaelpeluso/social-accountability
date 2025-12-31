# Social Accountability - AI Agent Quickstart

**THIS IS YOUR STARTING POINT.** Read this first to understand where everything is.

---

## 🎯 What Am I Building?

**iOS habit tracker** that uses automation + social accountability to help users build better habits.

- Manual tracking (M1-M3) → Automated integrations (M4+)
- Private by default → Shareable with friends
- Device-first → Cloud sync
- $0 cost for v1 (1000 users)

**Current Status:** M0 (Foundation) - Setting up types, routing, auth stubs

---

## 🗺️ Documentation Map (Where to Look)

### For Implementation Questions

| I Need To...                  | Read This File                                                                       | Why                                         |
| ----------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------- |
| Understand the product vision | [spec/product/vision.md](spec/product/vision.md)                                     | Product goals, target user, success metrics |
| Know the tech stack           | [spec/product/architecture.md](spec/product/architecture.md)                         | Stack decisions, patterns, cost model       |
| See the database schema       | [spec/product/data-model.md](spec/product/data-model.md)                             | All tables, relationships, privacy model    |
| Find API endpoints            | [spec/product/api-contracts.md](spec/product/api-contracts.md)                       | REST endpoints, request/response formats    |
| Implement M0 features         | [spec/milestones/M0-foundation.md](spec/milestones/M0-foundation.md)                 | Project setup, types, error handling        |
| Implement M1 features         | [spec/milestones/M1-account-privacy.md](spec/milestones/M1-account-privacy.md)       | Auth, profiles, privacy controls, friends   |
| Implement M2 features         | [spec/milestones/M2-habits-tracking.md](spec/milestones/M2-habits-tracking.md)       | Goals, habits, check-ins, streaks           |
| Implement M3 features         | [spec/milestones/M3-social.md](spec/milestones/M3-social.md)                         | Posts, reactions, nudges, badges            |
| Implement M4 features         | [spec/milestones/M4-identity-analytics.md](spec/milestones/M4-identity-analytics.md) | Identities, journal, mood, HealthKit        |
| Know what's out of scope      | [spec/milestones/M5-future.md](spec/milestones/M5-future.md)                         | Post-v1 features (ML, location, etc.)       |
| Set up dev environment        | [spec/development/dev-guide.md](spec/development/dev-guide.md)                       | Windows + iPhone workflow, sensor pattern   |
| Configure CI/CD               | [spec/development/dev-tooling.md](spec/development/dev-tooling.md)                   | GitHub Actions, Husky, testing              |
| Add integrations              | [spec/development/integrations-guide.md](spec/development/integrations-guide.md)     | HealthKit, Screen Time risks, permissions   |

### For Code Quality Questions

| I Need To...              | Read This File                                                  | Why                                        |
| ------------------------- | --------------------------------------------------------------- | ------------------------------------------ |
| Know coding conventions   | [rules/CODING-STANDARDS.md](rules/CODING-STANDARDS.md)          | TypeScript patterns, naming, structure     |
| Understand security rules | [rules/CODING-STANDARDS.md](rules/CODING-STANDARDS.md#security) | Privacy enforcement, rate limits, auth     |
| Learn how to read specs   | [rules/AI-AGENT-GUIDE.md](rules/AI-AGENT-GUIDE.md)              | Metadata format, search keywords, patterns |

---

## 🔍 AI Agent Search Keywords

Use these keywords to find concepts quickly:

### By Concept

- **Authentication**: M1-account-privacy.md, architecture.md
- **Privacy Model**: architecture.md, data-model.md, M1-account-privacy.md
- **Database Schema**: data-model.md
- **API Endpoints**: api-contracts.md, M1/M2/M3 files
- **Habits/Goals**: M2-habits-tracking.md, data-model.md
- **Social Features**: M3-social.md, data-model.md
- **Identities**: M4-identity-analytics.md, data-model.md
- **HealthKit**: M4-identity-analytics.md, integrations-guide.md
- **Streaks**: M2-habits-tracking.md (story 2.4)
- **Feed Algorithm**: M3-social.md (story 3.2)
- **Nudges**: M3-social.md (story 3.4)
- **Badges**: M3-social.md (story 3.5)
- **Dashboard**: M2-habits-tracking.md (stories 2.6-2.8)
- **Journal**: M4-identity-analytics.md (story 4.2)
- **Challenges**: M4-identity-analytics.md (story 4.8)

### By Privacy Level

- **SELF**: M1-account-privacy.md, architecture.md#privacy-enforcement
- **FRIENDS**: M1-account-privacy.md, data-model.md#relationships
- **CLOSE_FRIENDS**: M4-identity-analytics.md (story 4.9)
- **PUBLIC**: M1-account-privacy.md, M3-social.md

### By Technology

- **SQLite**: architecture.md, data-model.md
- **Expo Router**: M0-foundation.md, dev-guide.md
- **JWT**: architecture.md#authentication-flow, M1-account-privacy.md
- **TypeScript**: M0-foundation.md, rules/CODING-STANDARDS.md
- **HealthKit**: M4-identity-analytics.md, integrations-guide.md
- **Supabase**: architecture.md#backend-deployment-options

---

## 📋 Common AI Agent Queries → Quick Answers

### "How does privacy enforcement work?"

**Answer:** Server-side checks on every query. NEVER trust client.
**Read:** [spec/product/architecture.md](spec/product/architecture.md#privacy-model) + [spec/product/data-model.md](spec/product/data-model.md#privacy-enforcement-critical)

### "What's the data model?"

**Answer:** User → Goal → Habit → CheckIn hierarchy. All objects have privacy field.
**Read:** [spec/product/data-model.md](spec/product/data-model.md#relationships-diagram)

### "What API endpoints exist?"

**Answer:** REST endpoints for auth, goals, habits, posts, reactions, nudges.
**Read:** [spec/product/api-contracts.md](spec/product/api-contracts.md)

### "How do I implement feature X?"

**Answer:** Find the milestone (M0-M4), read the user story with acceptance criteria.
**Read:** Milestone files in spec/

### "What's not allowed in v1?"

**Answer:** No ML, no auto-logging (except HealthKit steps in M4), no location, no screen time.
**Read:** [spec/milestones/M5-future.md](spec/milestones/M5-future.md)

### "How do I write code?"

**Answer:** TypeScript strict mode, functional patterns, typed errors, structured logging.
**Read:** [rules/CODING-STANDARDS.md](rules/CODING-STANDARDS.md)

### "How do I handle security?"

**Answer:** Server-side validation, rate limiting, no PII in logs, JWT auth.
**Read:** [rules/CODING-STANDARDS.md](rules/CODING-STANDARDS.md#security)

### "What's the dev workflow?"

**Answer:** Windows primary, iPhone (Expo Go), Mac monthly for HealthKit.
**Read:** [spec/development/dev-guide.md](spec/development/dev-guide.md)

### "How do I add integrations?"

**Answer:** Check integrations-guide.md for risks. Only HealthKit steps in M4.
**Read:** [spec/development/integrations-guide.md](spec/development/integrations-guide.md)

---

## 🏗️ Project Structure

```
/                           # Root
├── docs/                  # All documentation
│   ├── QUICKSTART.md      # ← YOU ARE HERE (AI starting point)
│   ├── CHEATSHEET.md      # One-page quick reference
│   ├── spec/              # Product requirements
│   │   ├── product/       # Core docs (vision, architecture, data-model, etc.)
│   │   ├── milestones/    # M0-M5 feature specs
│   │   ├── development/   # dev-guide, dev-tooling, integrations-guide
│   │   └── INDEX.md
│   └── rules/             # Coding standards
│       ├── CODING-STANDARDS.md
│       ├── AI-AGENT-GUIDE.md
│       └── INDEX.md
├── README.md              # Human-readable overview
├── .github/
│   └── copilot-instructions.md
├── src/                   # Source code
│   ├── types/             # TypeScript definitions
│   ├── lib/               # Utilities (logger, errors)
│   └── config/            # Environment config
├── app/                   # Screens (Expo Router)
├── services/              # API clients, auth
├── storage/               # SQLite models
├── sensors/               # Data source abstractions
├── logic/                 # Business logic
└── tests/                 # Unit tests
```

---

## ⚡ Quick Start (5 Minutes)

1. **First time reading?**
   - Read: [spec/product/vision.md](spec/product/vision.md) (2 min)
   - Read: [spec/product/architecture.md](spec/product/architecture.md) (3 min)
   - You now understand the product

2. **Ready to implement?**
   - Find your milestone: [spec/milestones/M0-foundation.md](spec/milestones/M0-foundation.md) through [spec/milestones/M4-identity-analytics.md](spec/milestones/M4-identity-analytics.md)
   - Each milestone has user stories with acceptance criteria
   - Reference [spec/product/data-model.md](spec/product/data-model.md) for schema

3. **Need to write code?**
   - Read: [rules/CODING-STANDARDS.md](rules/CODING-STANDARDS.md) (5 min)
   - Follow TypeScript patterns
   - Enforce privacy server-side

4. **Confused about where info is?**
   - **Come back to this file** (QUICKSTART.md)
   - Use the tables above to find what you need
   - Search keywords to locate concepts

---

## 🤖 AI Agent Best Practices

### DO:

✅ Read QUICKSTART.md first (this file)
✅ Search for keywords from tables above
✅ Read entire user story (not just title)
✅ Check data-model.md for schema before implementing
✅ Verify security rules in CODING-STANDARDS.md
✅ Cross-reference milestone files with data-model.md

### DON'T:

❌ Invent features not in spec
❌ Skip privacy enforcement patterns
❌ Use `any` type in TypeScript
❌ Trust client-provided privacy filters
❌ Implement M5 features (future only)
❌ Add integrations beyond HealthKit steps (M4)

---

## 📞 Still Can't Find It?

1. **Search this file** for keywords
2. **Check the table** for your question type
3. **Read the referenced file** completely
4. **Look at cross-references** in that file
5. If implementing: **Read the milestone file** + data-model.md + api-contracts.md

---

## 🔄 File Organization Summary

**3 Types of Documentation:**

1. **spec/** = WHAT to build (product requirements)
   - product/vision.md = why we're building this
   - product/architecture.md = how it's structured
   - product/data-model.md = database schema
   - milestones/M0-M4 files = detailed features by milestone
   - development/ = dev-guide, dev-tooling, integrations

2. **rules/** = HOW to build (code quality)
   - CODING-STANDARDS.md = TypeScript patterns + security
   - AI-AGENT-GUIDE.md = How to read the specs

3. **.github/copilot-instructions.md** = Context for GitHub Copilot

**This file (QUICKSTART.md)** = Navigation hub for AI agents

---

**Last Updated:** December 31, 2025
**Current Milestone:** M0 (Foundation)
