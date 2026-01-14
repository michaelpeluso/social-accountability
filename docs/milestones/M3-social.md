# Milestone 3: Social Accountability

**Goal:** Enable users to share progress, support friends, and build accountability through positive social loops.
**Timeline:** 2-3 weeks
**Cost Target:** $0 (minimal bandwidth usage)
**Dependencies:** M2 complete (habits & tracking working)

---

## Overview

M3 adds social layer on top of tracking. Users post stories, react with emojis, send positive nudges, and earn badges. All features designed for positive reinforcement (no negative interactions, no shaming). Feed algorithm simple (chronological + privacy filters, device-side). Rate limits prevent spam.

---

## Design Principles

1. **Positive Only:** No downvotes, no criticism, no comparison metrics
2. **Privacy-First:** Feed respects SELF/FRIENDS/PUBLIC rules
3. **Rate-Limited:** Prevent spam/abuse (3 nudges/day per pair)
4. **Async:** Feed loads in background, works offline (shows cached)
5. **Device-Side Filtering:** Privacy checks on device + server

**Reference:** spec/high_level.md#L296-L350 (social features)

---

## User Stories

### 3.1 Create Post

**Story:** As a user, I want to share my progress so that my friends can support me.

**Acceptance Criteria:**

- [ ] "New Post" button on home screen
- [ ] Post form:
  - Body text (optional, 500 chars max)
  - Photo/video (optional, max 10MB)
  - Pillar tag (required, dropdown: MIND/BODY/HEART/SOUL)
  - Privacy (required, defaults to user default: SELF/FRIENDS/PUBLIC)
  - "Advanced" toggle reveals optional fields:
    - Pillar tag override (optional, chips: mind · body · heart · soul)
    - Media type selector (photo, short video <60s, chart snapshot)
    - Post type tags (optional, chips: #win, #struggle, #question, #reflection, or custom with #)
    - Linked object picker (optional, search: habit · goal · milestone · module)
    - Location category (home/work/gym/outdoors - if location permission granted)
- [ ] Preview before posting
- [ ] Save creates post locally, syncs in background
- [ ] Post appears in own feed immediately
- [ ] Friends see post after sync (if privacy = FRIENDS or PUBLIC)
- [ ] Public users see post after sync (if privacy = PUBLIC)

**Post Types:**

- Text only: "Completed my morning meditation 🧘"
- Text + photo: workout selfie + "5K done!"
- Text + video: short yoga flow clip
- Linked to check-in (optional): "Just logged workout #42 💪"

**API Contract:**

```
POST /posts
Body: {
  pillar: Pillar,
  privacy: Privacy,
  bodyText?: string,
  mediaUrl?: string
}
Response: { data: Post }
```

**Technical Requirements:**

- Media upload: Cloudinary API (client-side upload for speed)
- Video: max 60 seconds, auto-compress to 10MB
- SQLite insert first (instant UX)
- Sync queue: POST /posts with retry
- createdAt: device timestamp

**Privacy Notes:**

- FRIENDS posts: visible to all accepted friends
- PUBLIC posts: no location, no identifiable info in photo EXIF
- Strip EXIF data from photos before upload

**Security Notes:**

- Rate limit: 20 posts per user per day
- Content moderation: TODO (M5, for now rely on user reports)
- Validate media type (image/video only, no executables)

**Cost:** Cloudinary free tier (25GB storage)

**Reference:** spec/high_level.md#L305-L312, spec/api-contact.md#L50-L59

---

### 3.2 Feed - View Posts

**Story:** As a user, I want to see my friends' posts so that I can support their progress.

**Acceptance Criteria:**

- [ ] Feed screen shows posts chronologically (newest first)
- [ ] Feed scopes:
  - "Friends" (default): posts from friends (privacy = FRIENDS or PUBLIC)
  - "Discover": all public posts (discovery feed)
  - "Mine": only my posts
- [ ] Each post shows:
  - Author name, photo
  - Pillar tag (colored badge)
  - Body text
  - Media (photo/video player)
  - Timestamp (relative: "2h ago")
  - Reactions summary (emoji counts)
  - "React" and "Nudge" buttons
- [ ] Infinite scroll (paginated, 20 per page)
- [ ] Pull to refresh
- [ ] Offline: show cached posts (sync when online)

**Feed Algorithm (Device-Side):**

```typescript
// Simple chronological, filtered by privacy
function getFeed(scope: "mine" | "friends" | "discover"): Post[] {
  let posts = queryPosts(); // from SQLite or API

  if (scope === "mine") {
    return posts.filter((p) => p.authorUserId === currentUserId);
  }

  if (scope === "friends") {
    return posts.filter(
      (p) =>
        p.privacy === "PUBLIC" ||
        (p.privacy === "FRIENDS" && isFriend(p.authorUserId)) ||
        p.authorUserId === currentUserId
    );
  }

  if (scope === "discover") {
    return posts.filter((p) => p.privacy === "PUBLIC");
  }
}
```

**API Contract:**

```
GET /feed
Query: scope=mine|friends|discover, limit=20, cursor=<token>
Response: { data: Post[], nextCursor?: string }
```

**Technical Requirements:**

- Pagination: cursor-based (lastPostId)
- Cache posts in SQLite (offline support)
- Lazy load media (thumbnails first, full on tap)
- Filter client-side (privacy double-check)

**Privacy Notes:**

- Server filters by privacy (never trust client)
- Client re-filters (defense in depth)
- FRIENDS posts: verify friendship server-side

**Security Notes:**

- Rate limit: 100 feed loads per user per hour

**Cost:** Free tier covers bandwidth (< 2GB/month for 1000 users)

**Reference:** spec/high_level.md#L346-L350, spec/api-contact.md#L61-L68

---

### 3.3 Reactions (Emoji Only)

**Story:** As a user, I want to react to my friends' posts so that I can show support quickly.

**Acceptance Criteria:**

- [ ] "React" button on each post
- [ ] Emoji picker shows allowed reactions: � ❤️ 👏 🔥 📈
- [ ] Tapping emoji adds reaction (or removes if already reacted)
- [ ] Post shows reaction summary: "👏 3 🔥 5"
- [ ] Tapping summary shows who reacted
- [ ] One reaction per user per post (can change reaction)
- [ ] Reaction syncs to server in background

**Allowed Emojis (Fixed Set):**

- 👍 Like (general support)
- ❤️ Heart (love, care)
- 👏 Clap (celebrating achievement)
- 🔥 Fire (impressive, on fire)
- 📈 Growth (progress, improvement)

**Why limited:** Prevents negative reactions (no 👎, no 😢)

**API Contract:**

```
POST /posts/:id/reactions
Body: { emoji: string }
Response: { data: Reaction }

DELETE /posts/:id/reactions/:reactionId
Response: { data: { message: "Reaction removed" } }
```

**Technical Requirements:**

- One reaction per user per post (UNIQUE constraint: postId + userId)
- Changing reaction: DELETE old + POST new (or PATCH)
- SQLite cache reactions locally
- Sync queue: retry on failure

**Privacy Notes:**

- Can only react to posts you can see (privacy check)
- Reaction author visible to post author + other reactors

**Security Notes:**

- Validate emoji is in allowed set (prevent abuse)
- Rate limit: 100 reactions per user per day

**Cost:** $0 (minimal DB writes)

**Reference:** spec/high_level.md#L322-L325, spec/api-contact.md#L61-L63

---

### 3.4 Nudges (Positive Only)

**Story:** As a user, I want to send a nudge to a friend so that I can encourage them to keep going.

**Acceptance Criteria:**

- [ ] "Nudge" button on friend's profile or post
- [ ] Nudge template picker (predefined messages):
  - "Keep it up! 💪"
  - "Proud of your streak! 🔥"
  - "You've got this! 🔥"
  - "Don't break the chain! ⛓️"
  - "Let's do this together! 🙌"
- [ ] Tapping template sends nudge
- [ ] Rate limit: 3 nudges per friend per day, 10 total per day
- [ ] Recipient sees nudge in notifications
- [ ] Nudge shows sender, template, timestamp

**Why Templates:** Prevent harassment, keep positive tone

**API Contract:**

```
POST /nudges
Body: { toUserId: string, templateId: string }
Response: { data: Nudge }

Rate Limits: 3/day per pair, 10/day per user
```

**Nudge Templates (IDs):**

- `keep-it-up` - "Keep it up! 💪"
- `proud-streak` - "Proud of your streak! 🔥"
- `you-got-this` - "You've got this! 🔥"
- `dont-break-chain` - "Don't break the chain! ⛓️"
- `lets-do-together` - "Let's do this together! 🙌"

**Technical Requirements:**

- Store templates in DB (id, text, emoji)
- Rate limit enforcement server-side (critical)
- SQLite cache nudges locally
- Notifications: use expo-notifications (local notifications)

**Privacy Notes:**

- Can only nudge friends (prevent spam)
- Cannot nudge users who blocked you (M5 feature)

**Security Notes:**

- Rate limit STRICTLY enforced (prevent abuse)
- Server checks: fromUserId ↔ toUserId are friends (bidirectional friendship)
- Log excessive nudging (potential harassment)

**Cost:** $0

**Reference:** spec/high_level.md#L326-L333, spec/api-contact.md#L65-L70, spec/milestones.md#L58

---

### 3.5 Badges & Achievements

**Story:** As a user, I want to earn badges so that I feel recognized for my progress.

**Acceptance Criteria:**

- [ ] Badges auto-awarded for achievements:
  - **Streak Badges:** 7-day streak, 30-day streak, 100-day streak
  - **Milestone Badges:** 10 habits created, 100 check-ins, 1000 check-ins
  - **Recovery Badges:** Came back after 3-day miss, 7-day miss
  - **Pillar Badges:** 90% completion in one pillar for a month
  - **Social Badges:** 50 reactions given, 10 nudges sent
- [ ] Badge unlocked notification (modal with animation)
- [ ] Profile shows earned badges (grid view)
- [ ] Can share badge to feed (optional post)
- [ ] Badge detail shows: name, description, earn date, rarity

**Badge Calculation (Device-Side):**

```typescript
function checkBadges(user: User, habits: Habit[], checkIns: HabitCheckIn[]) {
  // 7-day streak badge
  if (hasStreak(habits, checkIns, 7) && !hasBadge(user, "streak-7")) {
    awardBadge(user, "streak-7");
  }

  // 100 check-ins badge
  if (checkIns.length >= 100 && !hasBadge(user, "checkins-100")) {
    awardBadge(user, "checkins-100");
  }

  // Recovery badge
  if (recoveredAfterMiss(checkIns, 3) && !hasBadge(user, "recovery-3")) {
    awardBadge(user, "recovery-3");
  }

  // ... more badges
}
```

**Technical Requirements:**

- Badges table: id, userId, badgeType, earnedAt
- Check on every check-in (device-side)
- Sync to server (for profile visibility)
- Badge images: stored locally (bundle with app)
- Animations: Lottie or react-native-animatable

**Privacy Notes:**

- Badges visible per profile privacy (SELF/CIRCLE/PUBLIC)
- Cannot fake badges (server validates on sync)

**Security Notes:**

- Server re-validates badge awards (prevent cheating)
- Rate limit: 10 badge shares per day

**Cost:** $0 (logic on device, images bundled)

**Reference:** spec/high_level.md#L334-L341

---

### 3.6 Notifications

**Story:** As a user, I want to receive notifications so that I know when friends interact with my content.

**Acceptance Criteria:**

- [ ] Notifications for:
  - New reaction on my post
  - Nudge received
  - Badge earned
  - Friend posted (optional, user can mute)
  - Habit reminder (M4 feature)
- [ ] Notification settings screen:
  - Toggle per type
  - Quiet hours (e.g., 10pm - 8am)
  - Frequency: instant | hourly digest | daily digest
- [ ] Tapping notification navigates to relevant screen
- [ ] Badge count on app icon

**Technical Requirements:**

- expo-notifications for local notifications
- Push notifications: Expo Push Notification service (free tier)
- Server sends push on reaction/nudge
- Client schedules local for badges, reminders
- Notification permissions requested on first use

**Privacy Notes:**

- Notifications respect user preferences
- No notification content in lock screen (just "New activity")
- User can disable entirely

**Security Notes:**

- Rate limit: 50 notifications per user per day (server-side)
- Don't send notifications for blocked users (M5)

**Cost:** Expo push free tier (unlimited, rate-limited)

**Reference:** spec/high_level.md#L334 (badge notifications)

---

### 3.7 Edit/Delete Posts

**Story:** As a user, I want to edit or delete my posts so that I can fix mistakes or remove content.

**Acceptance Criteria:**

- [ ] Post detail has "Edit" and "Delete" buttons (own posts only)
- [ ] Edit: can change body text, privacy (not media or pillar)
- [ ] Edit shows "Edited" badge with timestamp
- [ ] Delete: requires confirmation ("This cannot be undone")
- [ ] Deleted post: removed from feeds, reactions/nudges deleted
- [ ] Edit/delete available for 24 hours after posting (prevent history rewriting)

**API Contract:**

```
PATCH /posts/:id
Body: { bodyText?: string, privacy?: Privacy }
Response: { data: Post }

DELETE /posts/:id
Response: { data: { message: "Post deleted" } }
```

**Technical Requirements:**

- SQLite update/delete, sync to server
- Cascade delete reactions when post deleted
- editedAt timestamp on edit
- 24-hour window enforced server-side

**Privacy Notes:**

- Changing privacy: affects visibility immediately
- Cannot change PUBLIC → SELF if already reacted (prevents confusion)

**Security Notes:**

- Validate ownership before edit/delete
- Rate limit: 20 edits per user per day

**Cost:** $0

**Reference:** spec/high_level.md#L310

---

### 3.8 Weekly Digest (Optional)

**Story:** As a user, I want a weekly summary so that I stay motivated without checking the app constantly.

**Acceptance Criteria:**

- [ ] Every Monday, generate digest:
  - Your top habits this week
  - Friends' top achievements
  - Badges earned by friends
  - Upcoming challenges (M4 feature)
- [ ] Digest shown in-app (banner) + optional email
- [ ] User can opt out in settings

**Technical Requirements:**

- Cron job (server-side): every Monday 9am user local time
- Query: top check-ins, badges earned (past week)
- Email: SendGrid template (free tier)
- In-app: stored in notifications table

**Privacy Notes:**

- Only includes CIRCLE/PUBLIC content
- No individual check-in details (just counts)

**Security Notes:**

- Rate limit: 1 digest per user per week

**Cost:** SendGrid free tier (100 emails/day, enough for 1000 users)

**Reference:** spec/high_level.md#L350

---

## Validation Checklist

Before moving to M4:

- [ ] Users can create posts with text/photo/video
- [ ] Feed shows posts filtered by privacy
- [ ] Reactions work (add, remove, see who reacted)
- [ ] Nudges send with rate limiting (3/day per pair)
- [ ] Badges auto-award on achievements
- [ ] Notifications work (push + local)
- [ ] Edit/delete posts within 24 hours
- [ ] Tests pass:
  - [ ] Privacy filtering (SELF/CIRCLE/PUBLIC)
  - [ ] Rate limiting (nudges, posts, reactions)
  - [ ] Badge calculation
  - [ ] Feed pagination

---

### 3.7 Habit Joining

**Story:** As a user, I want to invite friends to join my habits or request to join theirs, so we can build accountability together.

**Acceptance Criteria:**

- [ ] Habit detail page shows "Invite Friends" button (habit owner only)
- [ ] Habit detail page shows "Request to Join" button (for friends' habits visible to user)
- [ ] Invite flow:
  - Select friends from list (only accepted friends)
  - Add optional message (100 chars)
  - Send invite (creates HabitInvite record)
  - Friends receive notification
- [ ] Request flow:
  - User sees friend's habit (if privacy allows)
  - Taps "Request to Join"
  - Add optional message (100 chars)
  - Owner receives notification with approve/deny
- [ ] Joined habits show participant list (privacy-respecting)
- [ ] Joined members see shared progress view:
  - Each member's streak visible
  - Shared check-in count: "You and 3 friends completed this today"
  - Optional: mini leaderboard (opt-in per habit)
- [ ] Owner can remove participants anytime
- [ ] Participants can leave habit anytime

**Example Invite Flow:**

```
User: Opens "Morning Meditation" habit
  ↓
Taps "Invite Friends"
  ↓
Selects: Sarah, Mike
Message: "Join me for daily meditation! 🧘"
  ↓
[Send Invites]
  ↓
Sarah & Mike receive notification:
  "John invited you to join 'Morning Meditation'"
  [Accept] [Decline]
  ↓
Sarah accepts → Added to habit participants
  ↓
Sarah's habit list now shows "Morning Meditation (with John)"
```

**Example Request Flow:**

```
User: Browsing Sarah's profile
  ↓
Sees habit: "Evening Workout 💪" (privacy: FRIENDS)
  ↓
Taps "Request to Join"
  ↓
Message: "This looks great! Can I join?"
  ↓
[Send Request]
  ↓
Sarah receives notification:
  "Mike wants to join your 'Evening Workout' habit"
  [Approve] [Deny]
  ↓
Sarah approves → Mike added as participant
```

**Shared Progress View:**

```
Morning Meditation (with Sarah, Mike)

Your streak: 12 days 🔥
Sarah's streak: 8 days
Mike's streak: 5 days

Today's check-ins: 2/3
✓ You (7:15am)
✓ Sarah (7:30am)
⏳ Mike (pending)

This Week: 18 total check-ins
```

**Privacy & Visibility Rules:**

- Only habits with privacy = FRIENDS or PUBLIC can be joined
- SELF habits cannot receive join requests (private by design)
- Participants see only what habit privacy allows:
  - FRIENDS: all participants see each other's streaks/check-ins
  - PUBLIC: anyone can see, but must join to participate
- Habit owner controls who can join (approve/deny requests)
- Owner can set habit to "Open" (auto-accept requests) or "Approval Required" (default)

**Notifications:**

```typescript
// Invite sent
{
  type: "HABIT_INVITE",
  from: { userId: "user_123", name: "John" },
  habit: { id: "habit_456", name: "Morning Meditation" },
  message: "Join me for daily meditation! 🧘",
  actions: ["Accept", "Decline"]
}

// Request received
{
  type: "HABIT_JOIN_REQUEST",
  from: { userId: "user_789", name: "Mike" },
  habit: { id: "habit_456", name: "Evening Workout" },
  message: "This looks great! Can I join?",
  actions: ["Approve", "Deny"]
}

// Accepted notification
{
  type: "HABIT_JOIN_ACCEPTED",
  habit: { id: "habit_456", name: "Morning Meditation" },
  message: "Sarah accepted your invite to Morning Meditation"
}

// Friend joined notification
{
  type: "HABIT_MEMBER_JOINED",
  user: { userId: "user_789", name: "Mike" },
  habit: { id: "habit_456", name: "Morning Meditation" },
  message: "Mike joined your Morning Meditation habit"
}
```

**API Contract:**

```
POST /habits/:id/invite
Body: { friendIds: string[], message?: string }
Response: { data: HabitInvite[] }

POST /habits/:id/request-join
Body: { message?: string }
Response: { data: HabitJoinRequest }

POST /habit-invites/:id/accept
Response: { data: HabitParticipant }

POST /habit-invites/:id/decline
Response: { success: true }

POST /habit-join-requests/:id/approve
Response: { data: HabitParticipant }

POST /habit-join-requests/:id/deny
Response: { success: true }

DELETE /habits/:id/participants/:userId
Response: { success: true }

GET /habits/:id/participants
Response: { data: HabitParticipant[] }
```

**Technical Requirements:**

- HabitInvites table: id, habitId, fromUserId, toUserId, message, status (PENDING/ACCEPTED/DECLINED), createdAt
- HabitJoinRequests table: id, habitId, fromUserId, message, status (PENDING/APPROVED/DENIED), createdAt
- HabitParticipants table: id, habitId, userId, joinedAt, role (OWNER/MEMBER)
- Query joined habits: `WHERE habitId IN (SELECT habitId FROM habit_participants WHERE userId = ?)`
- Shared progress: aggregate check-ins across all participants (device-side calculation)

**Privacy Notes:**

- Participants list visible only to other participants (SELF habits exception: owner only)
- Check-in details respect individual privacy settings
- Owner can make habit participants list PUBLIC (opt-in)

**Security Notes:**

- Rate limit: 50 invites per user per day
- Rate limit: 20 join requests per user per day
- Max 50 participants per habit (prevent spam)
- Owner can disable invites/requests per habit

**Cost:** $0 (database records only)

**Why:** Habit joining enables peer accountability and social support. Seeing friends' progress on shared habits motivates consistency. Invite/request flow balances openness with owner control.

---

## What NOT to Build in M3

❌ NO challenges/competitions (M4)
❌ NO direct messaging (M5+, requires careful design)
❌ NO comments on posts (prevents negativity, use reactions/nudges)
❌ NO downvotes or negative reactions
❌ NO leaderboards (M4, with privacy controls)
❌ NO content moderation AI (M5+, for now rely on reports)
❌ NO blocking/reporting (M5+, need abuse patterns first)

---

## Cost & Privacy Summary

**Monthly Cost (1000 users):**

- Feed bandwidth: ~1GB/month (Supabase free tier: 2GB)
- Push notifications: Expo free tier (unlimited)
- Media storage: Cloudinary free tier (25GB)
- Total: **$0**

**Scale Trigger (move to paid):**

- 5000 users or 50GB media → $25-50/month

**Privacy Compliance:**

- ✅ Feed respects privacy settings (server-side enforcement)
- ✅ No tracking of user behavior (no analytics)
- ✅ Reactions/nudges visible only to relevant users
- ✅ Rate limits prevent spam/harassment

---

## Dependencies

**Before M3:**

- M2 complete (habits, check-ins, dashboard working)

**After M3:**

- M4 can start (identity system, journal, challenges)

---

## Reference Documents

- [spec/milestones.md](spec/milestones.md#L38-L45) - M3 definition
- [spec/high_level.md](spec/high_level.md#L296-L350) - Social features detail
- [spec/api-contact.md](spec/api-contact.md#L50-L70) - API contracts
- [spec/data-model.md](spec/data-model.md#L69-L86) - Post, Reaction, Nudge schema
