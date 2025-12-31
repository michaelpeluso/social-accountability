# Milestone 5+: Future Expansion (Post-v1)

**Status:** Future roadmap (not in v1 scope)
**Timeline:** TBD after M1-M4 shipped and validated
**Cost Target:** TBD (may require paid tiers)

---

## Overview

M5+ features require additional permissions, ML infrastructure, or are higher risk for App Store approval. Ship M1-M4 first, gather user feedback, prove value, then expand carefully.

---

## Potential M5 Features

### 5.1 Calendar Integration

- Detect gym appointments → suggest workout check-in
- Meeting-heavy days → stress warnings
- Event-based habit suggestions
- **Risk:** Moderate (calendar access requires justification)
- **Cost:** $0 (device-side processing)

### 5.2 Screen Time API

- Track app usage for "no social media" habits
- Productivity insights (focus time vs distraction)
- **Risk:** HIGH (requires strict App Store justification)
- **Cost:** $0 (device-side)

### 5.3 ML & Sentiment Analysis

- Journal keyword analysis for mood inference
- Habit sequence prediction (optimal timing suggestions)
- Anomaly detection (unusual patterns)
- **Risk:** Low (on-device ML is approved)
- **Cost:** $0 (device-side), but battery impact

### 5.4 More HealthKit Metrics

- Sleep tracking
- Heart rate variability
- Workout types
- Nutrition (if user logs in Apple Health)
- **Risk:** Moderate (each metric needs clear use case)
- **Cost:** $0

### 5.5 Background Location (GYM/PARK)

- Auto-check-in when arriving at gym
- Walking/running route detection
- **Risk:** VERY HIGH (requires always-on location, strict justification)
- **Cost:** $0 but battery drain

### 5.6 Custom Friend Lists (Maybe)

- Create custom groups of friends (Family, Gym Buddies, Work Friends)
- Share posts/habits with specific lists
- **Note:** May be too complex, close friends might be enough
- **Risk:** Low
- **Cost:** $0

### 5.7 Monetization

- Premium tier: $2.99/month
  - Advanced analytics
  - Priority support
  - Early access to features

- Free tier remains fully functional
- **Risk:** Low (user choice)
- **Cost:** RevenueCat SDK (free < $2500/month revenue)

### 5.7 Content Moderation

- AI-based inappropriate content detection
- User reporting system
- Moderator dashboard
- **Risk:** Low (protects community)
- **Cost:** $10-50/month (Moderation API like OpenAI)

### 5.8 Direct Messaging

- 1:1 chat with circle members
- **Risk:** High (requires careful abuse prevention)
- **Cost:** $0 (WebSockets via Supabase)

### 5.9 Suggestion Engine

- "You usually work out after breakfast. Try it today?"
- "You've missed meditation 3 days. Want to restart?"
- **Risk:** Low (rules-based, no manipulation)
- **Cost:** $0 (device-side logic)

---

## Guiding Principles for M5+

1. **Ship M1-M4 first, validate product-market fit**
2. **One permission at a time** (prove safety per [startup_guide.md](startup_guide.md))
3. **Always device-first** (keep costs low)
4. **User control** (can disable any feature)
5. **Privacy-forward** (never surprise users)

---

## Reference

- [spec/permissions.md](permissions.md#L17-L19) - M5+ sources marked "not allowed / risky"
- [spec/startup_guide.md](startup_guide.md#L148-L157) - High-friction sources (post-approval)
- [spec/high_level.md](high_level.md#L174-L256) - Original ML vision (deferred)
