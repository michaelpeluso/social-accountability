# Milestone 1: Account & Privacy

**Goal:** Enable user authentication, profile setup, and granular privacy controls.
**Timeline:** 2-3 weeks
**Cost Target:** $0 (using free tiers)
**Dependencies:** M0 complete

---

## Overview

M1 establishes user identity and privacy foundation. All features respect SELF/FRIENDS/PUBLIC privacy model (simple friends-only, no groups). Backend deployment begins (Supabase/Firebase free tier). Device-first architecture: local SQLite as source of truth, cloud as sync replica.

**Privacy Model Evolution:**
- M1-M3: SELF/FRIENDS/PUBLIC (simple binary friendship)
- M4: Add CLOSE_FRIENDS option (SELF/CLOSE_FRIENDS/FRIENDS/PUBLIC)
- M5+: Maybe custom lists (far future)

---

## Technical Architecture

```
[iPhone App]
    ↓ SQLite (local source of truth)
    ↓ Sync Queue (offline-first)
    ↓ HTTPS + Bearer Token
[Backend API]
    ↓ Auth (token validation)
    ↓ Privacy Enforcement (server-side checks)
    ↓ Postgres/Firestore (sync replica)
```

**Privacy Enforcement Pattern (CRITICAL):**
Every API read/write:
1. Extract userId from JWT bearer token
2. Check object.privacy field
3. If SELF: verify userId === object.userId
4. If FRIENDS: verify Friendship record exists (status = ACCEPTED)
5. If PUBLIC: allow read (but validate on write)
6. Return 403 if check fails

**Reference:** rules/security.md#L3, spec/data-model.md#L87-L95

---

## User Stories

### 1.1 Apple Sign-In Integration

**Story:** As a new user, I want to sign in with Apple so that I can create an account without managing passwords.

**Acceptance Criteria:**
- [ ] "Sign in with Apple" button on auth screen
- [ ] Tapping button triggers Apple auth flow
- [ ] On success, app exchanges Apple token with backend
- [ ] Backend validates Apple token, creates user if new
- [ ] Backend returns JWT (7-day expiry)
- [ ] JWT stored securely in device keychain
- [ ] User redirected to home screen
- [ ] Session persists across app restarts
- [ ] Error handling for cancelled auth, network failures

**API Contract:**
```
POST /auth/apple
Body: { appleToken: string }
Response: { data: { user: User, token: string } }
```

**Technical Requirements:**
- Use expo-apple-authentication package
- Backend validates token with Apple API
- JWT includes userId, expiresAt
- Store JWT in encrypted storage (expo-secure-store)
- Replace mock auth from M0

**Privacy Notes:**
- User can choose to hide email from Apple
- Only collect: id, displayName, optional email
- Clear consent screen before first auth
- No tracking without explicit consent

**Security Notes:**
- Token validation server-side only (never trust client)
- Rate limit: 5 attempts per IP per minute
- HTTPS only (no HTTP in production)
- JWT_SECRET in env vars (never hardcoded)

**Cost:** Free (Apple auth is free, Supabase handles it)

**Reference:** spec/milestones.md#L13-L17, spec/permissions.md#L10-L13

---

### 1.2 Account Recovery

**Story:** As a user who lost my device, I want to recover my account so that I don't lose my data.

**Acceptance Criteria:**
- [ ] "Forgot Password" option (if email provided)
- [ ] Email-based reset link sent
- [ ] Reset link valid for 1 hour
- [ ] User can set recovery email in settings
- [ ] Recovery email verified before enabled
- [ ] Multi-device sync via cloud backup

**API Contract:**
```
POST /auth/recovery/request
Body: { email: string }
Response: { data: { message: "Recovery email sent" } }

POST /auth/recovery/verify
Body: { token: string, newPassword?: string }
Response: { data: { token: string } }
```

**Technical Requirements:**
- Email via SendGrid/Mailgun (free tier)
- Recovery token: UUID, 1-hour expiry
- Store in recoveryTokens table with expiry
- Clear token after use
- If user used Apple Sign-In only: must re-auth with Apple

**Privacy Notes:**
- Email optional (user may not provide)
- Don't send recovery email if no email on file
- Don't confirm whether email exists (prevents enumeration)

**Security Notes:**
- Rate limit: 3 requests per email per hour
- Token single-use only
- HTTPS required

**Cost:** SendGrid free tier (100 emails/day)

**Reference:** spec/milestones.md#L16

---

### 1.3 Profile Setup

**Story:** As a new user, I want to set up my profile so that I can personalize my experience.

**Acceptance Criteria:**
- [ ] Profile form with fields: displayName (required), photoUrl (optional), bio (optional, 280 char max)
- [ ] Photo upload with preview (max 5MB, jpg/png only)
- [ ] Bio character counter
- [ ] Save button persists to backend
- [ ] Profile visible in /me endpoint
- [ ] Can edit profile later in settings

**API Contract:**
```
GET /me
Response: { data: User }

PATCH /me
Body: { displayName?: string, photoUrl?: string, bio?: string }
Response: { data: User }
```

**Technical Requirements:**
- displayName: 1-50 chars, no special chars except space, -, '
- bio: 0-280 chars, supports emoji
- photoUrl: uploaded to S3/Cloudinary, return CDN URL
- Validate on client + server
- SQLite stores profile locally
- Background sync to cloud

**Privacy Notes:**
- Profile privacy controlled by global default (see 1.5)
- Photo stored with userId prefix to prevent collisions
- No location data in profile

**Security Notes:**
- Validate file type (magic bytes, not just extension)
- Scan uploads for malware (if using S3, enable virus scanning)
- Rate limit: 10 profile updates per hour

**Cost:** Cloudinary free tier (25GB storage, 25GB bandwidth)

**Reference:** spec/milestones.md#L19-L21

---

### 1.4 Privacy Defaults

**Story:** As a privacy-conscious user, I want to set default privacy levels so that all my content respects my preferences.

**Acceptance Criteria:**
- [ ] Privacy settings screen with toggle: SELF | FRIENDS | PUBLIC
- [ ] Setting saved to user profile
- [ ] New goals/habits inherit this default
- [ ] Can override per object
- [ ] Clear explanation of each level:
  - SELF: only you can see
  - FRIENDS: your friends can see
  - PUBLIC: anyone can see
- [ ] Setting syncs to backend

**API Contract:**
```
PATCH /me/privacy
Body: { defaultPrivacy: "SELF" | "FRIENDS" | "PUBLIC" }
Response: { data: User }
```

**Technical Requirements:**
- Store in user.defaultPrivacy field
- Default on signup: SELF (most private)
- Apply to new goals, habits, posts
- Existing objects unchanged (respect user intent)

**Privacy Notes:**
- SELF is default (privacy-first)
- Warn user when changing to PUBLIC
- Retroactive changes NOT applied (user must update individually)

**Security Notes:**
- Validation: must be one of three values
- Server enforces privacy on all reads (see architecture above)

**Cost:** $0

**Reference:** spec/milestones.md#L23-L25, spec/data-model.md#L4

---

### 1.5 Per-Object Privacy Controls

**Story:** As a user, I want to set privacy per goal/habit so that I can share some things publicly while keeping others private.

**Acceptance Criteria:**
- [ ] Privacy dropdown on goal/habit create/edit forms
- [ ] Options: SELF, FRIENDS, PUBLIC
- [ ] Defaults to user's global privacy setting
- [ ] Privacy displayed on object detail screens
- [ ] Changing privacy immediately affects visibility
- [ ] Backend enforces privacy on all queries

**Backend Privacy Enforcement (CRITICAL):**
```sql
-- Example: GET /goals
SELECT * FROM goals 
WHERE privacy = 'PUBLIC'
OR (privacy = 'FRIENDS' AND userId IN (
  SELECT friendId FROM friendships 
  WHERE userId = :currentUserId AND status = 'ACCEPTED'
))
OR (privacy = 'SELF' AND userId = :currentUserId)
```

**Technical Requirements:**
- privacy field on: Goal, Habit, HabitCheckIn, Post tables
- Server-side filtering on all list endpoints
- Client-side filtering for offline reads
- Privacy changes logged for audit

**Privacy Notes:**
- FRIENDS requires accepted friendship (see 1.7)
- PUBLIC objects: no sensitive fields (no location, detailed notes)
- User can always see own objects regardless of privacy

**Security Notes:**
- NEVER trust client-provided privacy filters
- Server MUST filter every query
- Test: user A cannot see user B's SELF objects
- Test: user A CAN see user B's PUBLIC objects
- Test: user A CAN see user B's FRIENDS objects if they are friends

**Cost:** $0 (just query logic)

**Reference:** spec/milestones.md#L24, spec/data-model.md#L87-L95, rules/security.md#L3

---

### 1.6 Data Export

**Story:** As a user, I want to export my data so that I own my information and can back it up.

**Acceptance Criteria:**
- [ ] "Export Data" button in settings
- [ ] Generates JSON file with all user data:
  - Profile, goals, habits, check-ins, posts, reactions, nudges
  - Includes timestamps, privacy settings
  - Excludes: tokens, passwords
- [ ] Download as user-{id}-{timestamp}.json
- [ ] Can import into spreadsheet/analysis tools
- [ ] Export includes data dictionary (field explanations)

**API Contract:**
```
GET /me/export
Response: { data: { user, goals, habits, checkIns, posts, ... } }
```

**Technical Requirements:**
- Backend fetches all data for userId
- Format: JSON with nested structure
- Include metadata: exportedAt, version
- Gzip compression for large datasets
- Rate limit: 1 export per hour

**Privacy Notes:**
- Export includes SELF, CIRCLE, PUBLIC objects (user owns all)
- Excludes other users' data (even if visible)
- Clear tokens/secrets before export

**Security Notes:**
- Require auth (only user can export own data)
- Don't include JWT tokens in export
- Log export events for audit

**Cost:** $0 (simple DB query)

**Reference:** spec/milestones.md#L25

---

### 1.7 Data Deletion

**Story:** As a user, I want to delete my account so that all my data is removed if I stop using the app.

**Acceptance Criteria:**
- [ ] "Delete Account" button in settings (requires confirmation)
- [ ] Confirmation modal: "This is permanent. Are you sure?"
- [ ] Type "DELETE" to confirm
- [ ] Deletes all user data:
  - User profile
  - All goals, habits, check-ins
  - All posts, reactions, nudges sent/received
  - Circle memberships (removed from all circles)
- [ ] Anonymizes references (replace userId with random UUID)
- [ ] Media files deleted from storage
- [ ] User logged out immediately
- [ ] Cannot undo

**API Contract:**
```
DELETE /me
Body: { confirmation: "DELETE" }
Response: { data: { message: "Account deleted" } }
```

**Technical Requirements:**
- Soft delete initially (mark deletedAt, keep 30 days for recovery)
- Hard delete after 30 days (cron job)
- Cascade delete all owned objects
- Update references to "Deleted User" in others' feeds
- Revoke all tokens

**Privacy Notes:**
- GDPR-compliant: user has right to deletion
- Anonymize, don't just hide
- Logs: keep minimal audit (userId → action → timestamp)
- Media: 90 days retention, then purge (per spec/permissions.md)

**Security Notes:**
- Require current password/auth confirmation
- Rate limit: 1 attempt per hour (prevents accidental mass deletion)
- Log deletion events
- Email confirmation before final deletion

**Cost:** $0 (DB operations only)

**Reference:** spec/milestones.md#L25, spec/permissions.md#L23-L27

---

### 1.8 Friend Requests

**Story:** As a user, I want to send friend requests so that we can share accountability.

**Acceptance Criteria:**
- [ ] "Add Friend" button with search (by username/email)
- [ ] Sends friend request as in-app notification
- [ ] Recipient sees pending request, can Accept/Decline
- [ ] On Accept: Friendship record created with status ACCEPTED
- [ ] Friends can see each other's FRIENDS-privacy objects
- [ ] Friends list shows all accepted friendships
- [ ] Can unfriend (requires confirmation)

**API Contract:**
```
POST /friends/requests
Body: { recipientId: string }
Response: { data: { message: "Friend request sent" } }

POST /friends/requests/:id/accept
Response: { data: Friendship }

DELETE /friends/requests/:id
Response: { data: { message: "Request declined" } }

DELETE /friends/:friendshipId
Response: { data: { message: "Unfriended" } }

GET /friends
Response: { data: User[] }
```

**Technical Requirements:**
- Friendship table: id, userId, friendId, status (PENDING/ACCEPTED), createdAt
- Status starts as PENDING, changes to ACCEPTED on accept
- Max 500 friends per user (free tier)

**Privacy Notes:**
- Both users must consent (cannot force-add)
- Unfriending: revokes access to all FRIENDS objects immediately
- Friend requests visible to recipient only

**Security Notes:**
- Prevent duplicate requests
- Rate limit: 50 friend requests per day
- Validate both users exist

**Cost:** $0 (DB records only)

**Reference:** spec/milestones.md#L20

---

### 1.9 Friend Management

**Story:** As a user, I want to manage my friends so that I control who has access to my content.

**Acceptance Criteria:**
- [ ] Friends list shows all accepted friendships
- [ ] Shows pending requests (sent and received)
- [ ] Can unfriend anyone (requires confirmation: "Remove [name] as friend?")
- [ ] Unfriending: revokes access to all FRIENDS content immediately
- [ ] Can block users (prevents future requests)

**API Contract:**
```
GET /friends
Response: { data: User[] }

GET /friends/requests
Response: { data: { sent: FriendRequest[], received: FriendRequest[] } }

DELETE /friends/:friendshipId
Response: { data: { message: "Unfriended" } }

POST /users/:userId/block
Response: { data: { message: "User blocked" } }
```

**Technical Requirements:**
- Friendship is bidirectional (creates 2 records: A→B and B→A)
- Unfriend: delete both records
- Block: add to blocked_users table, reject all pending requests
- Privacy check: revoke FRIENDS visibility immediately

**Privacy Notes:**
- Unfriending: they lose access to all FRIENDS posts
- Their own posts remain (privacy unchanged)
- Blocking: prevents all future interaction

**Security Notes:**
- Validate friendship exists before unfriend
- Rate limit: 20 unfriend operations per day (prevent abuse)

**Cost:** $0

**Reference:** spec/milestones.md#L20

---

## Validation Checklist

Before moving to M2:
- [ ] User can sign in with Apple on iPhone
- [ ] JWT stored securely, persists across restarts
- [ ] Profile created with displayName, bio, photo
- [ ] Privacy defaults set and applied to new objects
- [ ] Can export all data as JSON
- [ ] Can delete account (soft delete works)
- [ ] Friend requests sent/accepted
- [ ] Friends list populated
- [ ] Privacy enforcement works:
  - [ ] User A cannot see User B's SELF goals
  - [ ] User A CAN see User B's PUBLIC goals
  - [ ] User A CAN see User B's FRIENDS goals IF they are friends
- [ ] Backend deployed to free tier (Supabase/Firebase)
- [ ] All M1 tests pass

---

## What NOT to Build in M1

❌ NO goals or habits yet (M2)
❌ NO social feed (M3)
❌ NO integrations (HealthKit, etc.) - M4+
❌ NO ML or auto-logging - M5+
❌ NO password auth (Apple Sign-In only in v1)
❌ NO Google/Facebook OAuth (post-v1)
❌ NO paid features (all free in M1-M3)

---

## Backend Deployment Options (Free Tier)

**Option A: Supabase** (Recommended)
- ✅ Free tier: 500MB DB, 1GB file storage, auth included
- ✅ Postgres database (familiar SQL)
- ✅ Built-in auth with Apple Sign-In support
- ✅ Row-level security (RLS) for privacy enforcement
- ✅ Real-time subscriptions (future feature)
- ⚠️ Limits: 2 projects, 500MB DB

**Option B: Firebase**
- ✅ Free tier: 1GB storage, 10GB bandwidth, auth included
- ✅ Apple Sign-In integration
- ✅ NoSQL (Firestore) - flexible schema
- ⚠️ Query limitations (no complex joins)
- ⚠️ Costs scale with reads/writes

**Recommendation:** Supabase for M1 (SQL easier for privacy queries)

---

## Cost & Privacy Summary

**Monthly Cost (1000 users):** $0
- Supabase free tier
- Cloudinary free tier
- SendGrid free tier (recovery emails)

**Scale Trigger (move to paid):**
- 500MB DB exceeded → $25/month Supabase Pro
- 5000+ users → $25-50/month

**Privacy Compliance:**
- ✅ GDPR-compliant (export, delete)
- ✅ Server-side privacy enforcement
- ✅ Explicit consent for all data
- ✅ No tracking without opt-in
- ✅ Encrypted storage (Supabase handles it)

---

## Dependencies

**Before M1:**
- M0 complete (foundation ready)
- Backend chosen (Supabase/Firebase)

**After M1:**
- M2 can start (goals, habits, tracking)

---

## Reference Documents

- [spec/milestones.md](spec/milestones.md#L11-L27) - M1 definition
- [spec/data-model.md](spec/data-model.md) - Schema
- [spec/api-contact.md](spec/api-contact.md) - API contracts
- [spec/permissions.md](spec/permissions.md) - Consent rules
- [rules/security.md](rules/security.md) - Privacy enforcement
