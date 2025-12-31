---
purpose: 3rd party integrations, permissions, App Store approval risks
topics: HealthKit, Screen Time API, location, calendar, consent, retention policy
dependencies: architecture.md
---

# Integrations Guide

**For planning which data sources to use and when**

---

## Integration Strategy

### v1 Philosophy
1. **Start manual** (no permissions = no App Store friction)
2. **Add one integration at a time** (prove value per source)
3. **Device-first** (on-device processing, no cloud)
4. **Explicit consent** (clear purpose + can revoke)

### Milestone Timeline
- **M1-M2:** Manual check-ins only (no integrations)
- **M4:** HealthKit steps (proof-of-concept)
- **M5+:** Screen Time, Location, Calendar (risky, post-approval)

---

## M4: HealthKit Steps (ALLOWED)

### Implementation
**Story:** 4.7 in [M4-identity-analytics.md](M4-identity-analytics.md#47-healthkit-steps-proof-of-concept)

**Kit/Framework:**
```typescript
import * as HealthKit from 'expo-health-kit';

// Request permission
await HealthKit.requestPermissions([
  { type: 'quantity', identifier: 'stepCount' }
]);

// Query steps
const steps = await HealthKit.queryQuantity({
  identifier: 'stepCount',
  unit: 'count',
  startDate: startOfDay(),
  endDate: endOfDay()
});
```

**Required Info.plist Key:**
```xml
<key>NSHealthShareUsageDescription</key>
<string>Track your daily steps to automatically log walking habits</string>
```

### Privacy & Consent
- ✅ Steps count only (no heart rate, sleep, etc.)
- ✅ Explicit consent screen before permission request
- ✅ Can disable anytime in settings
- ✅ Data stays on device unless user syncs
- ✅ Clear UI: "Steps: 10,543 (from Apple Health)"

### App Store Risk
**Risk Level:** ⚠️ **LOW**  
**Justification:** "Auto-log walking habit when user hits 10k steps"  
**Documentation:** [HealthKit Setup](https://developer.apple.com/documentation/healthkit/setting-up-healthkit)

### Cost
**$0** - HealthKit is free

### Retention Policy
- User-initiated delete: immediate
- Account deletion: 30-day soft delete, then purge
- HealthKit permission revoked: stop querying, keep history (user choice)

---

## M5+: Screen Time API (HIGH RISK)

### Purpose
Track app usage (social media, productivity) to auto-log "no phone" habits

### Kit/Framework
```typescript
import { DeviceActivity, FamilyControls } from 'react-native';

// Request authorization
await DeviceActivity.requestAuthorization();

// Query app usage
const usage = await DeviceActivity.queryApplicationUsage({
  interval: { start: startOfDay(), end: endOfDay() }
});
```

**Required Info.plist Key:**
```xml
<key>NSUserTrackingUsageDescription</key>
<string>Track app usage to help you build healthier screen time habits</string>
```

### Privacy & Consent
- ⚠️ Very sensitive data (all app usage)
- ⚠️ Must be EXTREMELY clear about purpose
- ⚠️ Never share raw data (only aggregated insights)

### App Store Risk
**Risk Level:** 🚨 **HIGH**  
**Why:** Apple scrutinizes screen time access heavily  
**Justification Required:** "Help user reduce social media time by tracking usage and suggesting breaks"  
**Documentation:** [Screen Time API](https://developer.apple.com/documentation/screentimeapi)

**Approval Strategy:**
1. Ship M1-M4 first (prove value without permissions)
2. Add Screen Time as v2 feature (after user trust)
3. Make it OPTIONAL (not required for core features)
4. Document use case extensively in App Store review notes

### Cost
**$0** - Screen Time API is free

### Status
**🔮 Future** - Not in M0-M4 scope

---

## M5+: Location (VERY HIGH RISK)

### Purpose
Auto-check-in when arriving at gym, park, library

### Kit/Framework
```typescript
import * as Location from 'expo-location';

// Request permission
await Location.requestForegroundPermissionsAsync();

// Monitor visits
await Location.startLocationUpdatesAsync('visit-tracking', {
  accuracy: Location.Accuracy.Balanced,
  distanceInterval: 100
});
```

**Required Info.plist Keys:**
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Detect gym visits to auto-log workout habits</string>

<!-- Only if "Always" needed (avoid if possible) -->
<key>NSLocationAlwaysUsageDescription</key>
<string>Track visits even when app closed for seamless habit tracking</string>
```

### Privacy & Consent
- 🚨 **Always-On = App Store red flag**
- 🚨 Battery drain concerns
- 🚨 Privacy nightmare (full movement tracking)

### App Store Risk
**Risk Level:** 🚨🚨 **VERY HIGH**  
**Why:** Always-on location requires strict justification  
**Justification:** "Auto-log gym visits for workout habits"  
**Apple's Bar:** Must prove it's ESSENTIAL (not nice-to-have)

**Alternatives:**
- Use CoreLocation Visits API (coarser, less battery)
- Only request "When In Use" (not "Always")
- Let user manually mark locations (no GPS needed)

### Cost
**$0** - CoreLocation is free (but battery impact)

### Status
**🔮 Maybe Never** - Too risky, manual may be better

---

## M5+: Calendar Integration (MODERATE RISK)

### Purpose
Detect gym appointments → suggest workout check-in

### Kit/Framework
```typescript
import * as Calendar from 'expo-calendar';

// Request permission (iOS 17+ supports write-only)
const { status } = await Calendar.requestCalendarPermissionsAsync();

// Query events
const events = await Calendar.getEventsAsync(
  [calendarId],
  startDate,
  endDate
);
```

**Required Info.plist Key:**
```xml
<key>NSCalendarsUsageDescription</key>
<string>Detect workout appointments to suggest habit logging</string>
```

### Privacy & Consent
- ⚠️ Sensitive (all calendar events visible)
- ✅ iOS 17+ supports write-only access (prefer this)

### App Store Risk
**Risk Level:** ⚠️ **MODERATE**  
**Why:** Calendar access is personal, but common  
**Justification:** "Suggest habits based on scheduled events"  
**Documentation:** [EventKit](https://developer.apple.com/documentation/eventkit)

**Best Practice:**
- Use write-only if possible (add events, don't read)
- Filter to specific event types (e.g., "Gym", "Workout")
- Make OPTIONAL (not required)

### Cost
**$0** - EventKit is free

### Status
**🔮 Future** - M5+ only

---

## NOT ALLOWED / Too Risky

### ❌ Messages/SMS Content
**Why:** Apple doesn't expose this to 3rd parties (privacy)  
**Alternative:** Track app usage time (Screen Time API)

### ❌ Call Logs
**Why:** Privacy violation  
**Alternative:** Track Phone app usage time

### ❌ Photos Library Scanning
**Why:** Privacy + battery drain  
**Alternative:** Let user manually attach photos to posts

### ❌ Social Media Scraping (Instagram, Snapchat)
**Why:** Against ToS + unreliable  
**Alternative:** OAuth APIs (Reddit, Twitter) if user connects

### ❌ Apple Pay Transaction History
**Why:** PassKit doesn't expose this  
**Alternative:** Bank integration (Plaid-style, M5+)

---

## Consent & Retention Policies

### Consent Requirements
Every data source MUST have:
1. **Purpose Screen** - Why we need this permission
2. **Data Fields** - Exactly what we collect
3. **Retention** - How long we keep it
4. **Revoke** - How to disable
5. **Delete** - What happens when you delete

### Example: HealthKit Consent Screen
```
┌──────────────────────────────────────┐
│ Enable Steps Tracking                │
├──────────────────────────────────────┤
│ Why:                                 │
│ Auto-log your "10k steps" habit      │
│                                       │
│ Data Collected:                      │
│ • Daily step count only              │
│ • No heart rate, sleep, or location  │
│                                       │
│ How Long:                            │
│ • Kept until you delete habit        │
│ • Purged 30 days after account       │
│   deletion                           │
│                                       │
│ Privacy:                             │
│ • Data stays on your device          │
│ • Only syncs if you choose           │
│ • Can disable anytime in settings    │
│                                       │
│         [Enable]    [Not Now]        │
└──────────────────────────────────────┘
```

### Retention Policy
- **Default:** Keep all user data until user deletes account or individual items
- **Media:** 90 days after account deletion, then purged
- **Audit Logs:** 30 days, contain only userId + action + timestamp (no PII)
- **Deleted Accounts:** Anonymize all data (replace userId with random UUID, clear names/emails)
- **Integration Data:** Deleted immediately when permission revoked (user choice)

### Data Deletion
User can delete:
- Individual habits (and all related check-ins)
- Individual posts (and all reactions)
- Specific integrations (e.g., disable HealthKit, keep manual check-ins)
- Entire account (30-day soft delete, then hard purge)

---

## API Documentation Links

### Apple Frameworks
- [HealthKit](https://developer.apple.com/documentation/healthkit)
- [Screen Time API](https://developer.apple.com/documentation/screentimeapi)
- [CoreLocation](https://developer.apple.com/documentation/corelocation)
- [EventKit (Calendar)](https://developer.apple.com/documentation/eventkit)
- [CoreMotion](https://developer.apple.com/documentation/coremotion)
- [WeatherKit](https://developer.apple.com/documentation/weatherkit)

### Third-Party OAuth
- [Spotify Web API](https://developer.spotify.com/documentation/web-api)
- [Reddit API](https://www.reddit.com/dev/api)
- [Twitter API](https://developer.twitter.com/en/docs)
- [Strava API](https://developers.strava.com)

---

## Reference

- Architecture: [architecture.md](architecture.md)
- M4 HealthKit Implementation: [M4-identity-analytics.md](M4-identity-analytics.md#47-healthkit-steps-proof-of-concept)
- Future Integrations: [M5-future.md](M5-future.md)
- Security Rules: [rules/security-privacy.md](../rules/security-privacy.md)
