---
purpose: Product vision and goals
topics: automation-first, social accountability, minimal user interaction, 3rd party integrations
dependencies: none
---

# Product Vision

## Core Principle

**Automation-first habit tracking with minimal user interaction.**

This is an iOS app that tracks user behavior through automated 3rd party integrations (location, screen time, health data, etc.) to generate in-depth, visual insights that encourage healthier habits. The core principle is minimizing user interaction — automated systems gather, display, and share progress for a seamless "off-the-app" experience.

## Main Feature

**Merging social media with self-improvement.**

Users see their friends' goals, cheer them on, and hold them accountable when they miss habits. Social visibility and positive reinforcement drive long-term behavior change with minimal manual effort.

---

## Product Goals

### 1. Minimize User Friction

- Automated data collection (HealthKit, Screen Time, location)
- Smart defaults (auto-create habits from integrations)
- Background sync (no manual refreshing)
- One-tap check-ins (when manual input required)

### 2. Maximize Social Accountability

- See friends' progress in real-time
- Positive reinforcement only (reactions, nudges)
- Celebrate streaks and achievements
- Challenge friends to build habits together

### 3. Privacy-First Design

- Local-first architecture (SQLite source of truth)
- Explicit consent per data source
- User controls visibility (SELF/FRIENDS/PUBLIC)
- Can delete data anytime

### 4. Zero Cost (v1)

- Device-side compute (free calculations)
- Free tier hosting (Supabase, Cloudinary)
- No backend processing fees
- $0/month for 1000 users

---

## Target User

**Who:** Health-conscious individuals (18-35) who struggle with consistency
**Problem:** Hard to stay motivated without accountability
**Solution:** Friends see your progress, cheer you on, catch you when you slip
**Differentiation:** Automated tracking (not manual journaling) + social pressure

---

## v1 Scope (M0-M4)

### In Scope

✅ Manual habit check-ins (M2)  
✅ Friend accountability (M3)  
✅ HealthKit steps integration (M4 proof-of-concept)  
✅ Privacy controls (M1)  
✅ Offline-first (M1)

### Out of Scope

❌ Full automation (Screen Time, location) - M5+  
❌ ML predictions - M5+  
❌ Calendar integration - M5+  
❌ Monetization - M5+

---

## Success Metrics (v1)

**Activation:**

- 70% of users add ≥1 friend in first week
- 50% of users create ≥3 habits in first week

**Engagement:**

- 3+ app opens per week
- 5+ check-ins per week
- 1+ social interaction (reaction/nudge) per week

**Retention:**

- 40% weekly retention (W1 → W2)
- 20% monthly retention (M1 → M2)

**Social:**

- 3+ friends per user (median)
- 10+ reactions received per user per week

---

## Design Principles

1. **Automation > Manual Input** - Prefer integrations over forms
2. **Social > Solo** - Public accountability beats private tracking
3. **Positive > Negative** - No shaming, only celebration
4. **Simple > Complex** - Binary friendship before custom lists
5. **Privacy > Virality** - User control over forced sharing
6. **Free > Paid** - Cost-conscious architecture (M0-M4)

---

## Reference

- Implementation details: [architecture.md](architecture.md)
- Milestone breakdown: [M0](M0-foundation.md) - [M4](M4-identity-analytics.md)
- Future roadmap: [M5-future.md](M5-future.md)
