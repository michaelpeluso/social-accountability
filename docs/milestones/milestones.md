# milestones (source of truth)

**Note:** This file provides high-level milestone summaries. For detailed user stories, acceptance criteria, and technical requirements, see the individual milestone files:

- [M0-foundation.md](M0-foundation.md) - M0 detailed spec
- [M1-account-privacy.md](M1-account-privacy.md) - M1 detailed spec
- [M2-habits-tracking.md](M2-habits-tracking.md) - M2 detailed spec
- [M3-social.md](M3-social.md) - M3 detailed spec
- [M4-identity-analytics.md](M4-identity-analytics.md) - M4 detailed spec
- [M5-growth-hub.md](M5-growth-hub.md) - M5 detailed spec (Growth Hub & Life Modules)
- [M6-build-break-stacking.md](M6-build-break-stacking.md) - M6 detailed spec
- [M7-behavioral-drift-social.md](M7-behavioral-drift-social.md) - M7 detailed spec
- [M8-future.md](M8-future.md) - M8+ future expansion

---

## milestone 0: foundation (frontend-only)

**Timeline:** 1 week  
**Dependencies:** None

- project setup (lint, format, types, CI)
- routing/navigation skeleton (expo-router)
- auth stubs + session handling (mocked tokens)
- core domain types + error/log patterns
- directory structure per startup_guide.md
- NO backend deployment, NO database, NO ML (deferred to post-M1)

## milestone 1: account & privacy

**Timeline:** 2-3 weeks  
**Dependencies:** M0

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

**Timeline:** 3-4 weeks  
**Dependencies:** M1

- create/edit/delete goals & habits (hierarchical)
- habit.schedule format: { frequency: "daily" | "weekly", targetCount: number, daysOfWeek?: number[] }
- check-ins (manual) + optional automatically logged evidence with external data sources
- streaks + misses + recovery events (on-device calculation)
- dashboard is informational only (no action suggestions, no ML)

## milestone 3: social accountability

**Timeline:** 3-4 weeks  
**Dependencies:** M2

- feed posts (text/image/video) tagged to pillar
- reactions (emojis and short 50 character comments)
- nudges (positive predefined templates, rate-limited to 3/day per pair)
- badges for streaks/milestones/recovery
- habit joining: invite friends to habits or request to join theirs with approve/deny flow
- shared progress view for joined habits showing all participants' streaks and check-ins
- productive competitions (habit-together): deferred to post-v1

## milestone 4: identity, analytics & engagement

**Timeline:** 3-4 weeks  
**Dependencies:** M3

- Identity system (preset list: Athlete, Student, Parent, etc.) with pillar mapping
- Journal tracking with full-text search and Markdown support
- Mood tracking (emoji scale 1-5) with device-side insights
- Correlations (statistical analysis showing habit interdependencies)
- Time-of-day heatmap showing optimal check-in windows
- Close friends feature (inner circle privacy tier between SELF and FRIENDS)
- Dashboard export reports (PDF/CSV for coaches/therapists)
- All analytics calculated device-side (zero cost)

## milestone 5: growth hub (life modules)

**Timeline:** 4-5 weeks  
**Dependencies:** M4

- Growth Hub landing page (central module dashboard with streaks)
- Library module: book tracking (reading/finished/want-to-read), progress updates, ratings, social sharing
- Training module: workout logging with exercise library, PR tracking, body weight trends, progression charts
- Nutrition module: meal logging (breakfast/lunch/dinner), weekly completion view, streak tracking
- Podcast module: episode logging, listening stats, show history
- Module streak system (hardcoded requirements: books 1/week, workouts 3/week, meals 7/week, podcasts 1/week)
- History views per module with charts/visualizations (device-side analytics)
- Account linking OAuth infrastructure (Goodreads, Strava, Spotify - tokens only, NO auto-sync yet)
- Module social sharing (book finishes, workout PRs, weekly achievements)
- Habit + Module integration (habits can link to modules for enhanced check-ins with rich data)

## milestone 6: BUILD/BREAK habits & stacking

**Timeline:** 3-4 weeks  
**Dependencies:** M5

- BUILD habits (positive) vs BREAK habits (negative) with recovery framing
- Intensity tracking (1-5 scale) for habit quality (energized vs going through motions)
- Habit stacking detection using Atomic Habits methodology (auto-detect "after X, do Y" patterns)
- Mini versions for busy days ("1 push-up" instead of full workout)
- Environmental cues ("shoes by door" for running habit)
- HealthKit integration proof-of-concept (steps auto-logging, 10k+ daily goal)
- Challenges system (friend competitions: completion/streak/together modes)
- Badge awards (gold/silver/bronze) for challenge winners

## milestone 7: behavioral drift & social support

**Timeline:** 3-4 weeks  
**Dependencies:** M6

- Behavioral drift detection (7 patterns: AVOIDANCE, OVERCONSUMPTION, COMPARISON, etc.)
- Visual analytics dashboard with annotated trend charts showing drift/recovery
- Support request flow (ask close friends for help, receive gentle nudges)
- Auto-generated weekly status updates (opt-in, editable before posting)
- Pattern sharing with chart-to-Story conversion (supportive emojis only)
- Granular privacy controls (per-post-type toggles, detailed metrics warning)
- All sharing requires explicit user consent (no forced auto-posts)
- Qualitative friend visibility ("working through it" vs raw metrics)

## milestone 8: future expansion (post-v1)

**Timeline:** TBD  
**Dependencies:** M7 complete, user feedback from v1

- Calendar integration (detect gym appointments, meeting-heavy days, suggest mini versions)
- Screen Time API full integration (per-app tracking, BREAK habit verification, usage alerts)
- ML & sentiment analysis (on-device journal analysis, habit-mood correlations, optimal timing)
- Expanded HealthKit (sleep, HRV, workout types, nutrition from Apple Health)
- Background location (geofenced gym/park auto-check-in, very high App Store risk)
- Custom friend lists ("Gym Buddies", "Family", "Work Friends" for targeted sharing)
- Monetization ($2.99/month premium: advanced analytics, data export, early M7+ access)
- Content moderation (AI + human review, user reporting, transparency log)
- Direct messaging (1:1 chat, E2E encryption, abuse prevention)
- Suggestion engine (time-based patterns, miss detection, stacking suggestions)
- AI-powered habit join suggestions (ML-based matching using identities, pillars, semantic similarity, mutual friends)
- External social media feed (curated Instagram/Twitter/YouTube posts with 3-friend approval requirement)
- See [M8-future.md](M8-future.md) for full details
