# Cloud Migration Checklist

Pre-flight checklist before deploying to Supabase cloud backend.

---

## Prerequisites

### Development Environment

- [ ] Node.js 18+ installed
- [ ] Expo CLI installed (`npm install -g expo-cli`)
- [ ] Git configured
- [ ] .env.local configured with all required vars

### Accounts & Access

- [ ] GitHub account (for Supabase sign-in)
- [ ] Apple Developer account ($99/year - required for Apple Sign-In)
- [ ] supabase account (free tier - for media uploads)

### Local Testing Complete

- [ ] All M0 features working (TypeScript, routing, components)
- [ ] SQLite database v3 stable
- [ ] Dev tools working (/dev route)
- [ ] All tests passing (`npm test`)
- [ ] Type-check passing (`npm run type-check`)
- [ ] Linting passing (`npm run lint`)

---

## Phase 1: Supabase Project Setup

### Create Project

- [ ] Sign up at https://supabase.com
- [ ] Create new project: "social-accountability"
- [ ] Save database password securely
- [ ] Copy project URL and anon key
- [ ] Add credentials to `.env`

### Environment Variables

```bash
# Add to .env (DO NOT COMMIT)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...  # Keep secret!
DATABASE_URL=postgresql://...
```

---

## Phase 2: Database Migration

### Schema Export

- [ ] Review `src/storage/database.ts` (source of truth)
- [ ] Convert SQLite types to Postgres (TEXT→UUID, INTEGER→BIGINT)
- [ ] Test schema locally with Postgres (optional)

### Run Migration

- [ ] Open Supabase Dashboard → SQL Editor
- [ ] Paste converted schema
- [ ] Execute migration
- [ ] Verify 38 tables created
- [ ] Check indexes created

### Enable Row-Level Security

- [ ] Enable RLS on all tables
- [ ] Create policies for users table
- [ ] Create policies for habits table
- [ ] Create policies for posts table
- [ ] Create policies for friendships table
- [ ] Test policies work (can't read other user's SELF data)

### Migration SQL Checklist

```sql
-- Verify tables
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
-- Should return 38

-- Verify RLS enabled
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;
-- Should list all 38 tables

-- Test as user
SET LOCAL "request.jwt.claims" = '{"sub": "test-user-id"}';
SELECT * FROM habits WHERE user_id = 'other-user' AND privacy = 'SELF';
-- Should return 0 rows
```

---

## Phase 3: Authentication Setup

### Apple Sign-In Configuration

- [ ] Enroll in Apple Developer Program ($99/year)
- [ ] Create App ID in Apple Developer portal
- [ ] Create Services ID for Sign In with Apple
- [ ] Generate .p8 private key
- [ ] Save Team ID, Key ID, Services ID
- [ ] Configure redirect URLs in Apple console

### Supabase Auth Setup

- [ ] Dashboard → Authentication → Providers → Enable Apple
- [ ] Add Apple credentials (Services ID, Team ID, Key ID, .p8 key)
- [ ] Configure redirect URLs
- [ ] Test auth flow in Supabase Dashboard

### Client Implementation

- [ ] Install `@supabase/supabase-js`
- [ ] Create `src/services/supabase.ts` client
- [ ] Update `src/services/auth.ts` to use Supabase
- [ ] Test sign-in flow on device
- [ ] Verify JWT token stored securely
- [ ] Test token refresh

---

## Phase 4: Sync Implementation

### Sync Service

- [ ] Create `src/services/sync.ts`
- [ ] Implement sync queue logic
- [ ] Add retry with exponential backoff
- [ ] Handle conflict resolution (device timestamp wins)
- [ ] Add offline detection

### Background Sync

- [ ] Sync on app open
- [ ] Sync every 15 minutes (setInterval)
- [ ] Sync when app returns to foreground
- [ ] Add sync status indicator in UI

### Test Sync

- [ ] Create habit while online → syncs immediately
- [ ] Create habit while offline → syncs when online
- [ ] Modify habit on device → updates cloud
- [ ] Delete habit → soft-deletes in cloud
- [ ] Verify `synced_at` timestamp updates

---

## Phase 5: API Integration

### Install Dependencies

- [ ] `npm install @supabase/supabase-js`
- [ ] `npx supabase gen types typescript` (generate types)
- [ ] Add `src/types/supabase.ts`

### Update Storage Layer

- [ ] Keep SQLite as source of truth
- [ ] Add sync calls after SQLite writes
- [ ] Handle sync failures gracefully
- [ ] Add retry queue for failed syncs

### Test API Endpoints

- [ ] POST /habits (create)
- [ ] GET /habits (list with privacy filters)
- [ ] PATCH /habits/:id (update)
- [ ] DELETE /habits/:id (soft delete)
- [ ] GET /feed (posts with privacy filters)
- [ ] POST /friendships (friend request)

---

## Phase 6: Privacy & Security

### Row-Level Security Policies

- [ ] Users can only CRUD their own data
- [ ] SELF privacy: owner only
- [ ] FRIENDS privacy: accepted friends only
- [ ] PUBLIC privacy: all authenticated users
- [ ] Friend requests: both parties must accept

### Security Testing

- [ ] Can't read other user's SELF habits
- [ ] Can read friend's FRIENDS habits (after accepting friendship)
- [ ] Can read any PUBLIC habits
- [ ] Can't delete other user's data
- [ ] Can't impersonate other users
- [ ] JWT tokens expire and refresh correctly

### Rate Limiting

- [ ] Implement rate limits in Supabase (or API middleware)
- [ ] Friend requests: 50/day per user
- [ ] Posts: 20/day per user
- [ ] Reactions: 100/day per user
- [ ] Nudges: 10/day per user, 3/day per pair

---

## Phase 7: Media Uploads (supabase)

### Setup supabase

- [ ] Sign up at https://supabase.com (free tier)
- [ ] Copy Cloud Name, API Key, API Secret
- [ ] Add to `.env`

### Client Implementation

- [ ] Install `supabase` SDK
- [ ] Implement photo upload in `src/services/media.ts`
- [ ] Implement video upload (10 second max)
- [ ] Strip EXIF data from photos
- [ ] Compress videos before upload

### Test Media

- [ ] Upload photo from camera
- [ ] Upload photo from library
- [ ] Upload video from library
- [ ] Record short video
- [ ] Verify file size limits (10MB)
- [ ] Verify media displays in posts

---

## Phase 8: Testing

### Authentication Flow

- [ ] Sign in with Apple on device
- [ ] Token stored in secure store
- [ ] Token persists across app restarts
- [ ] Token auto-refreshes before expiry
- [ ] Sign out clears session

### Data Sync Flow

- [ ] Create habit → appears locally immediately
- [ ] Create habit → syncs to cloud in background
- [ ] View habit on another device (same user)
- [ ] Offline: create habit → syncs when online
- [ ] Conflict: device timestamp wins

### Privacy Flow

- [ ] Create SELF habit → friend can't see it
- [ ] Create FRIENDS habit → friend can see it (after accepting friendship)
- [ ] Create PUBLIC habit → anyone can see it
- [ ] Change habit privacy → updates everywhere
- [ ] Friend request → both see each other's FRIENDS content

### Social Flow

- [ ] Create post with photo → appears in feed
- [ ] Friend reacts to post → notification received
- [ ] Comment on friend's post → appears immediately
- [ ] Send nudge → friend receives notification
- [ ] Earn badge → auto-post generated

---

## Phase 9: Monitoring & Optimization

### Supabase Dashboard

- [ ] Monitor database size (500MB free tier limit)
- [ ] Monitor bandwidth usage (5GB/month free tier)
- [ ] Monitor API requests
- [ ] Set up alerts for 80% usage

### Performance

- [ ] Sync queue doesn't block UI
- [ ] Feed loads quickly (< 2 seconds)
- [ ] Infinite scroll works smoothly
- [ ] Images load progressively (thumbnails first)
- [ ] Offline mode works without errors

### Error Handling

- [ ] Network errors show user-friendly messages
- [ ] Sync failures retry automatically
- [ ] Auth errors redirect to sign-in
- [ ] Rate limit errors show clear message

---

## Phase 10: Deployment Prep

### Environment Setup

- [ ] Staging environment in Supabase
- [ ] Production environment in Supabase
- [ ] Separate supabase accounts (staging/prod)
- [ ] Environment variables documented

### App Store Prep

- [ ] App icon designed
- [ ] Screenshots prepared
- [ ] App Store description written
- [ ] Privacy policy created
- [ ] Terms of service created
- [ ] Apple Developer account enrolled

### Pre-Launch Checklist

- [ ] All features tested end-to-end
- [ ] Privacy policies reviewed
- [ ] Rate limits configured
- [ ] Monitoring set up
- [ ] Support email configured
- [ ] Crash reporting enabled (Sentry?)

---

## Cost Projections

### Free Tier (0-1000 users)

- Supabase: $0 (500MB DB, 5GB bandwidth)
- supabase: $0 (25GB storage)
- Apple Developer: $99/year
- **Total: ~$100/year**

### When to Upgrade

**Supabase Pro ($25/month) when:**

- Database > 400MB (80% capacity)
- Bandwidth > 4GB/month (80% capacity)
- Need daily backups

**supabase Paid ($0.10/GB) when:**

- Media storage > 20GB (80% of 25GB free)
- Bandwidth > 20GB/month

### Projected Costs at 1000 Users

- Avg 10MB per user → 10GB DB (need Pro)
- Avg 50MB media per user → 50GB storage (need paid)
- **Monthly: ~$25 (Supabase) + ~$3 (supabase) = $28**

---

## Success Criteria

### Must Work

- ✅ Sign in with Apple
- ✅ Create/view habits
- ✅ Log check-ins
- ✅ View dashboard
- ✅ Add friends
- ✅ Create posts
- ✅ React to posts
- ✅ Offline mode

### Nice to Have

- Real-time updates (Supabase subscriptions)
- Push notifications (later)
- Analytics dashboard
- Email notifications

---

## Rollback Plan

If cloud deployment fails:

1. Revert to local-only mode (SQLite)
2. Disable sync service
3. Comment out Supabase calls
4. Test app still works offline-only
5. Debug issue, try again

Database backups:

- Supabase auto-backups (daily on Pro)
- Export SQLite before major migrations
- Keep migration scripts in version control

---

## Resources

- [Supabase Setup Guide](./SUPABASE_SETUP.md)
- [API Contracts](./api-contracts.md)
- [M1 Milestone](./milestones/M1-account-privacy.md)
- [Supabase Docs](https://supabase.com/docs)
- [Apple Sign-In Guide](https://developer.apple.com/sign-in-with-apple/)

---

**Current Status:** Pre-cloud (M0 complete, preparing for M1)
**Next Step:** Create Supabase project and run database migration
**Estimated Time:** 4-6 hours for full cloud setup
