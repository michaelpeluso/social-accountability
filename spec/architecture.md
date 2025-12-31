---
purpose: Technical architecture, stack decisions, privacy model, sync strategy
topics: device-first, offline-first, SQLite, Supabase, privacy enforcement, cost model
dependencies: vision.md
---

# Technical Architecture

## Stack Decisions

### Mobile
- **Framework:** React Native + Expo (iOS-first)
- **Workflow:** Managed workflow → dev build transition
- **Routing:** expo-router (file-based)
- **State:** React Context + hooks (no Redux yet)
- **Language:** TypeScript (strict mode)

### Backend
- **API:** Node.js REST (Express)
- **Hosting:** Supabase free tier (M1+) or Firebase
- **Auth:** JWT bearer tokens (7-day expiry)

### Database
- **Local (Source of Truth):** SQLite + expo-sqlite
- **Cloud (Sync Replica):** Postgres (Supabase) or Firestore
- **Pattern:** Device-first, offline-first, eventual consistency

### Storage
- **Local:** expo-secure-store (tokens), AsyncStorage (cache)
- **Media:** Cloudinary free tier (25GB, M3+)
- **Encryption:** AES-256 at rest

### Development
- **Primary:** Windows + iPhone (Expo Go)
- **Validation:** Mac (monthly builds for HealthKit/Apple-specific)
- **CI/CD:** GitHub Actions

---

## Architecture Patterns

### 1. Device-First (Offline-First)

**Local SQLite = Source of Truth**
```
[User Action]
   ↓
[SQLite Write] ← Instant UX
   ↓
[Sync Queue] ← Background
   ↓
[Backend API] ← When online
   ↓
[Postgres] ← Replica only
```

**Benefits:**
- Works offline
- Instant UX (no network wait)
- Lower costs (fewer API calls)
- Privacy (data stays local unless user syncs)

**Sync Strategy:**
- Background queue with retry
- Last-modified timestamp for conflicts
- User override on conflicts
- Sync on app open + periodic (15min)

### 2. Privacy Model

**Enforcement: Server-Side + Device-Side**

```typescript
// Every API read
function enforcePrivacy(object, currentUserId) {
  if (object.privacy === 'SELF') {
    return object.userId === currentUserId;
  }
  
  if (object.privacy === 'FRIENDS') {
    return isFriend(object.userId, currentUserId);
  }
  
  if (object.privacy === 'CLOSE_FRIENDS') {
    return isCloseFriend(object.userId, currentUserId);
  }
  
  if (object.privacy === 'PUBLIC') {
    return true;
  }
  
  return false;
}
```

**Privacy Levels:**
- **M1-M3:** SELF / FRIENDS / PUBLIC
- **M4:** Add CLOSE_FRIENDS (Instagram model)
- **M5+:** Maybe custom lists (far future)

**Critical:** NEVER trust client privacy filters. Server MUST re-validate every query.

### 3. Cost Optimization

**Goal: $0/month for 1000 users (M0-M4)**

**Strategy:**
- Device-side calculations (free compute)
- Free tier hosting (Supabase: 500MB DB, 2GB bandwidth)
- Free tier media (Cloudinary: 25GB)
- No ML processing fees (on-device only)

**M1-M4 Cost Breakdown:**
- Hosting: $0 (Supabase free)
- Storage: $0 (< 25GB Cloudinary)
- Compute: $0 (device-side)
- Auth: $0 (JWT + Supabase auth)
- Notifications: $0 (local notifications only)

**When costs start:**
- 1000+ users: May need Supabase Pro ($25/month)
- > 25GB media: Cloudinary paid ($0.10/GB)
- Push notifications: Firebase free tier generous

---

## Data Flow

### Habit Check-In Example
```
1. User taps "Complete" button
2. Insert into local SQLite (instant)
3. Update UI (show checkmark)
4. Add to sync queue
5. Background worker attempts POST /habits/:id/checkins
6. On success: mark synced
7. On failure: retry with exponential backoff
8. If offline: queue persists, syncs when online
```

### Feed Load Example
```
1. User opens feed
2. Read cached posts from SQLite (instant)
3. Show cached posts while loading
4. Background: GET /feed?cursor=...
5. Merge new posts with cache
6. Update UI with new content
7. If offline: show cached only
```

---

## Security Architecture

### Authentication Flow
```
1. User taps "Sign in with Apple"
2. expo-apple-authentication → Apple ID flow
3. App receives Apple token
4. POST /auth/apple { appleToken }
5. Backend validates with Apple API
6. Backend creates/fetches user
7. Backend returns JWT (7-day expiry)
8. App stores JWT in secure store
9. JWT sent as Bearer token on every API call
```

### Token Refresh
- JWT expires after 7 days
- On 401: attempt refresh (if < 30 days)
- On refresh fail: redirect to sign-in

### Rate Limiting
- Friend requests: 50/day
- Posts: 20/day
- Reactions: 100/day
- Nudges: 10/day
- API calls: 100/hour per user

---

## Performance Guidelines

### Device-Side Processing
- All analytics calculations on device (free + private)
- SQLite queries < 100ms
- UI updates < 16ms (60fps)
- Lazy load images (thumbnails first)

### Network
- Pagination: 20 items per page
- Cursor-based (not offset)
- Compress media before upload
- Cache API responses (5min TTL)

### Background Tasks
- Sync queue: runs every 15min or on app open
- HealthKit query: once per day (M4)
- Notification scheduling: on habit create/update

---

## Database Schema Philosophy

**Principle: Denormalize for device performance**

```sql
-- GOOD: Embed privacy on every object
CREATE TABLE habits (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  privacy TEXT NOT NULL, -- 'SELF', 'FRIENDS', 'PUBLIC'
  ...
);

-- GOOD: Copy user data to avoid joins
CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  authorName TEXT NOT NULL, -- Denormalized
  authorPhotoUrl TEXT,      -- Denormalized
  ...
);
```

**Why:** SQLite queries must be fast (< 100ms). Minimize joins.

**Schema:** See [data-model.md](data-model.md)

---

## Error Handling

### Sync Failures
```typescript
// Exponential backoff with max retries
class SyncQueue {
  async retry(task, attempt = 1) {
    const maxAttempts = 5;
    const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
    
    try {
      await task();
    } catch (error) {
      if (attempt < maxAttempts) {
        setTimeout(() => this.retry(task, attempt + 1), delay);
      } else {
        logger.error('Sync failed after max retries', { task, error });
      }
    }
  }
}
```

### Network Errors
- Always show cached data
- Display "Offline" indicator
- Queue writes for later sync
- Never block UI on network

### Validation Errors
- Validate client-side first (instant feedback)
- Re-validate server-side (never trust client)
- Return 400 with field-specific errors
- Log validation failures for debugging

---

## Deployment Strategy

### M0 (Foundation)
- No backend yet
- Local-only development
- Mocked auth/API

### M1 (Account & Privacy)
- Deploy backend to Supabase
- Configure Postgres database
- Set up Apple Sign-In credentials
- Environment: dev, staging (no prod yet)

### M2-M4
- Maintain staging environment
- Manual deploys (no CD yet)
- Monitor free tier usage

### M5+
- CI/CD pipeline (GitHub Actions)
- Production environment
- Monitoring (Sentry, LogRocket)
- Analytics (PostHog)

---

## Notifications Strategy

### M1-M3: Local Notifications Only
```typescript
import * as Notifications from 'expo-notifications';

// Schedule habit reminder
await Notifications.scheduleNotificationAsync({
  content: {
    title: "Time to meditate 🧘",
    body: "Your 10-minute session awaits"
  },
  trigger: {
    hour: 7,
    minute: 0,
    repeats: true
  }
});
```

**Benefits:**
- Free (no push notification service)
- Works offline
- No server coordination needed

**Limitations:**
- Only works when app installed
- No social notifications from friends

### M5+: Push Notifications
- Firebase Cloud Messaging (free tier: unlimited)
- Send when friend reacts/nudges
- Send when challenge milestone hit

---

## Testing Strategy

### Unit Tests
- Core logic (calculations, privacy filters)
- Utilities (logger, error handling)
- Target: 80% coverage on src/

### Integration Tests
- API contracts (request/response)
- Database queries (SQLite)
- Sync queue behavior

### Manual Testing
- E2E flows on iPhone (Expo Go)
- Privacy enforcement (can't see other user's SELF content)
- Offline mode (sync queue works)

**No automated E2E yet** (Detox expensive to maintain)

---

## Migration Strategy

### Schema Changes
```typescript
// Use pragma user_version for migrations
const CURRENT_VERSION = 3;

async function migrate(db) {
  const { user_version } = await db.getAsync('PRAGMA user_version');
  
  if (user_version < 1) {
    await db.execAsync('ALTER TABLE habits ADD COLUMN privacy TEXT DEFAULT "SELF"');
  }
  
  if (user_version < 2) {
    await db.execAsync('CREATE INDEX idx_checkins_date ON checkins(occurredAt)');
  }
  
  await db.execAsync(`PRAGMA user_version = ${CURRENT_VERSION}`);
}
```

### Backend Migrations
- Use Prisma or Knex migrations
- Never drop columns (soft deprecate)
- API versioning: /v1/habits, /v2/habits

---

## Reference

- Vision: [vision.md](vision.md)
- Database: [data-model.md](data-model.md)
- API: [api-contracts.md](api-contracts.md)
- Integrations: [integrations-guide.md](integrations-guide.md)
- Implementation: [M0-foundation.md](M0-foundation.md)
