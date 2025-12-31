# Spec Navigation Index

**For AI Agents & Developers**

---

## Product Vision

**Automation-first habit tracking with minimal user interaction.** The app leverages 3rd party integrations (location, screen time, health data) to automatically gather, display, and share progress. The core feature is merging social media with self-improvement: users see friends' goals, cheer them on, and hold each other accountable — all with minimal manual effort.

---

## Quick Start

**For implementation:**
1. Read [vision.md](vision.md) - Product goals
2. Read [architecture.md](architecture.md) - Technical foundation
3. Pick a milestone: [M0](M0-foundation.md) → [M1](M1-account-privacy.md) → [M2](M2-habits-tracking.md) → [M3](M3-social.md) → [M4](M4-identity-analytics.md)
4. Reference [data-model.md](data-model.md) and [api-contracts.md](api-contracts.md) as needed

**For understanding scope:**
- [M5-future.md](M5-future.md) - What's NOT in v1

---

## File Organization

### Core Specs
| File | Purpose | Key Topics |
|------|---------|------------|
| [vision.md](vision.md) | Product vision & goals | Automation-first, social accountability |
| [architecture.md](architecture.md) | Technical stack & patterns | Device-first, offline-first, privacy model |
| [data-model.md](data-model.md) | Database schema | Tables, relationships, indexes |
| [api-contracts.md](api-contracts.md) | REST endpoints | Routes, payloads, responses |
| [integrations-guide.md](integrations-guide.md) | 3rd party APIs & permissions | HealthKit, Screen Time, risks |
| [dev-guide.md](dev-guide.md) | Development workflow | Setup, testing, deployment |

### Milestone Specs (Detailed)
| File | Status | Timeline | Key Features |
|------|--------|----------|--------------|
| [M0-foundation.md](M0-foundation.md) | ✅ Started | 1 week | Project setup, types, routing |
| [M1-account-privacy.md](M1-account-privacy.md) | 📋 Next | 2-3 weeks | Apple Sign-In, friends, privacy |
| [M2-habits-tracking.md](M2-habits-tracking.md) | 🔜 Planned | 3-4 weeks | Goals, habits, check-ins, streaks |
| [M3-social.md](M3-social.md) | 🔜 Planned | 2-3 weeks | Posts, feed, reactions, nudges |
| [M4-identity-analytics.md](M4-identity-analytics.md) | 🔜 Planned | 3-4 weeks | Identities, journal, analytics, HealthKit |
| [M5-future.md](M5-future.md) | 💡 Future | TBD | ML, integrations, monetization |

### Development Rules
| File | Purpose |
|------|---------|
| [rules/ai-agent-guide.md](../rules/ai-agent-guide.md) | How to read/interpret specs |
| [rules/code-style.md](../rules/code-style.md) | Code patterns & conventions |
| [rules/security-privacy.md](../rules/security-privacy.md) | Security & privacy requirements |

---

## How AI Agents Should Use These Specs

### Semantic Search Strategy
When searching for concepts, use these keywords:

**Authentication:** M1-account-privacy.md
**Habits/Goals:** M2-habits-tracking.md  
**Social/Feed:** M3-social.md
**Analytics:** M4-identity-analytics.md
**Privacy Model:** architecture.md, M1-account-privacy.md
**Database Schema:** data-model.md
**API Endpoints:** api-contracts.md
**Integrations:** integrations-guide.md
**HealthKit:** M4-identity-analytics.md, integrations-guide.md

### Each Milestone File Structure
- **Metadata:** Purpose, topics, dependencies
- **Overview:** Goal, timeline, cost
- **User Stories:** "As a [role], I want [feature]"
- **Acceptance Criteria:** Checklist
- **Technical Requirements:** Implementation details
- **API Contracts:** Request/response examples
- **Privacy/Security Notes:** Compliance requirements
- **What NOT to Build:** Scope boundaries
- **Validation Checklist:** Definition of done

---

## Common Questions → File References

| Question | Read This |
|----------|-----------|
| What's the product vision? | [vision.md](vision.md) |
| What's the tech stack? | [architecture.md](architecture.md) |
| How does privacy work? | [architecture.md](architecture.md), [M1-account-privacy.md](M1-account-privacy.md) |
| What are the database tables? | [data-model.md](data-model.md) |
| What APIs do I call? | [api-contracts.md](api-contracts.md) |
| Which integrations are allowed? | [integrations-guide.md](integrations-guide.md) |
| What's in v1? | M0-M4 files |
| What's NOT in v1? | [M5-future.md](M5-future.md) |
| How do I set up dev environment? | [dev-guide.md](dev-guide.md) |
| What are the code rules? | [rules/](../rules/) |

---

## Milestone Dependencies

```
M0 (Foundation)
  ↓
M1 (Account & Privacy) ← Backend deployment starts here
  ↓
M2 (Habits & Tracking)
  ↓
M3 (Social Features)
  ↓
M4 (Identity & Analytics)
  ↓
M5+ (Future)
```

---

## Cost Model

**Target:** $0/month for 1000 users (M0-M4)

| Milestone | Hosting | Storage | Compute |
|-----------|---------|---------|---------|
| M0 | None | Local only | Device |
| M1 | Supabase free | < 500MB | Device |
| M2 | Supabase free | < 1GB | Device |
| M3 | Supabase + Cloudinary free | < 25GB | Device |
| M4 | Same | Same | Device |

**M5+:** May require paid tiers depending on features

---

## Privacy Model Evolution

| Milestone | Privacy Levels | Notes |
|-----------|----------------|-------|
| M1-M3 | SELF / FRIENDS / PUBLIC | Simple binary friendship |
| M4 | SELF / CLOSE_FRIENDS / FRIENDS / PUBLIC | Instagram Close Friends model |
| M5+ | Maybe custom lists | Far future, might not be needed |
