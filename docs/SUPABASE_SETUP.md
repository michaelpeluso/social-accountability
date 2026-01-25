# Supabase Setup Guide

**Complete step-by-step guide for setting up cloud sync for Social Accountability**

**Architecture:** SQLite (local source of truth) ↔️ Supabase Postgres (cloud replica)
**Time Estimate:** 2-3 hours initial setup, 6-8 hours full sync implementation
**Cost:** $0 (free tier supports 1000+ users)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        DEVICE (iPhone)                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ SQLite Database (source of truth)                        │  │
│  │ - Users create habits/goals                              │  │
│  │ - Log check-ins                                          │  │
│  │ - All reads/writes happen here FIRST                     │  │
│  │ - Works offline                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Sync Queue                                               │  │
│  │ - Queues changes for upload                              │  │
│  │ - Retries on failure                                     │  │
│  │ - Syncs every 15 min + on app open                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            ↕️ HTTPS + JWT
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE (Cloud Replica)                     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Postgres Database (replica only)                         │  │
│  │ - Receives synced data from device                       │  │
│  │ - Sends updates to other devices                         │  │
│  │ - Enables multi-device sync                              │  │
│  │ - Backup/restore                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Principle:** Device NEVER waits for cloud. All operations are instant (SQLite), then synced in background.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Create Supabase Project](#1-create-supabase-project)
3. [Create Cloud Schema](#2-create-cloud-schema)
4. [Row-Level Security](#3-row-level-security)
5. [Authentication Setup](#4-authentication-setup)
6. [API Client Configuration](#5-api-client-configuration)
7. [Sync Service Implementation](#6-sync-service-implementation)
8. [Testing & Validation](#7-testing--validation)
9. [Monitoring & Maintenance](#8-monitoring--maintenance)

---

## Prerequisites

### Required Accounts

- [ ] GitHub account (for Supabase login)
- [ ] Apple Developer account ($99/year) - for Apple Sign-In
- [ ] supabase account (free tier) - for media storage

### Local Development

- [ ] Node.js 18+ installed
- [ ] Expo CLI configured
- [ ] iPhone with Expo Go app
- [ ] Git repository set up

### Knowledge Requirements

- Basic SQL understanding
- React Native/Expo experience
- REST API concepts
- JWT authentication basics

---

## 1. Create Supabase Project

**Time:** 5 minutes
**Cost:** Free

### Step 1.1: Sign Up

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub
4. Authorize Supabase

### Step 1.2: Create Project

1. Click "New Project"
2. Fill in details:
   - **Name:** `social-accountability`
   - **Database Password:** Generate strong password (save to password manager)
   - **Region:** Choose closest to target users (e.g., `us-east-1`)
   - **Pricing Plan:** Free

3. Click "Create new project"
4. Wait 2-3 minutes for provisioning

### Step 1.3: Save Credentials

Once project is ready, go to **Settings → API**:

1. Copy **Project URL** (looks like `https://xxxxx.supabase.co`)
2. Copy **anon public** key (starts with `eyJ...`)
3. Copy **service_role** key (KEEP SECRET)

Add to `.env`:

```bash
# Supabase Configuration
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # NEVER commit this
```

### Step 1.4: Configure Settings

Go to **Settings → General**:

- **Site URL:** `exp://localhost:8081` (dev), update for production
- **Redirect URLs:** Add `exp://localhost:8081/**` for Expo deep linking

---

## 2. Create Cloud Schema

**Time:** 15-30 minutes
**Goal:** Create matching Postgres schema in Supabase (SQLite stays on device)

**IMPORTANT:** You are NOT migrating data from SQLite to Postgres. You're creating a cloud replica with the same schema. SQLite remains the local database on device.

### Step 2.1: Cloud Schema Script

Create `scripts/supabase-schema.sql` (mirrors SQLite schema from `src/storage/database.ts`):

```sql
-- ============================================
-- SOCIAL ACCOUNTABILITY - POSTGRES CLOUD SCHEMA
-- Mirrors SQLite v3 schema from src/storage/database.ts
-- Purpose: Cloud replica for sync, NOT a replacement for local SQLite
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  apple_id TEXT UNIQUE,
  display_name TEXT NOT NULL,
  email TEXT UNIQUE,
  photo_url TEXT,
  bio TEXT CHECK (char_length(bio) <= 280),
  default_privacy TEXT NOT NULL DEFAULT 'SELF' CHECK (default_privacy IN ('SELF', 'CLOSE_FRIENDS', 'FRIENDS', 'PUBLIC')),
  is_vacation_mode BOOLEAN NOT NULL DEFAULT FALSE,
  vacation_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ
);

CREATE TABLE session (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- SOCIAL RELATIONSHIPS
-- ============================================

CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED')),
  is_close_friend BOOLEAN NOT NULL DEFAULT FALSE,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ,
  UNIQUE(user_id, friend_id)
);

CREATE TABLE blocked_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ,
  UNIQUE(user_id, blocked_user_id)
);

-- ============================================
-- IDENTITIES & GOALS
-- ============================================

CREATE TABLE identities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) <= 50),
  pillar TEXT NOT NULL CHECK (pillar IN ('MIND', 'BODY', 'HEART', 'SOUL')),
  icon TEXT NOT NULL,
  is_preset BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ
);

CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  identity_id UUID REFERENCES identities(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  description TEXT CHECK (char_length(description) <= 500),
  pillar TEXT NOT NULL CHECK (pillar IN ('MIND', 'BODY', 'HEART', 'SOUL')),
  privacy TEXT NOT NULL DEFAULT 'SELF' CHECK (privacy IN ('SELF', 'CLOSE_FRIENDS', 'FRIENDS', 'PUBLIC')),
  is_indefinite BOOLEAN NOT NULL DEFAULT FALSE,
  metric_type TEXT NOT NULL DEFAULT 'COUNT' CHECK (metric_type IN ('COUNT', 'DURATION', 'DISTANCE', 'WEIGHT', 'CUSTOM')),
  metric_unit TEXT,
  start_value DECIMAL,
  target_value DECIMAL,
  current_value DECIMAL,
  start_date TIMESTAMPTZ,
  deadline TIMESTAMPTZ,
  data_source TEXT NOT NULL DEFAULT 'MANUAL' CHECK (data_source IN ('MANUAL', 'HABIT_LINKED', 'INTEGRATION')),
  linked_habit_ids JSONB,
  is_vacation_mode BOOLEAN NOT NULL DEFAULT FALSE,
  vacation_ends_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ
);

-- ============================================
-- HABITS & CHECK-INS
-- ============================================

CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  identity_id UUID REFERENCES identities(id) ON DELETE SET NULL,
  parent_habit_id UUID REFERENCES habits(id) ON DELETE SET NULL,
  stack_after_habit_id UUID REFERENCES habits(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  description TEXT CHECK (char_length(description) <= 500),
  pillar TEXT NOT NULL CHECK (pillar IN ('MIND', 'BODY', 'HEART', 'SOUL')),
  habit_type TEXT NOT NULL DEFAULT 'BUILD' CHECK (habit_type IN ('BUILD', 'BREAK', 'LIMIT')),
  completion_type TEXT NOT NULL DEFAULT 'BINARY' CHECK (completion_type IN ('BINARY', 'COUNT', 'DURATION', 'INTENSITY')),
  target_value DECIMAL,
  unit TEXT,
  icon TEXT,
  tags JSONB,
  schedule JSONB NOT NULL,
  timezone TEXT,
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  mini_version TEXT CHECK (char_length(mini_version) <= 100),
  grace_days INTEGER NOT NULL DEFAULT 0,
  privacy TEXT NOT NULL DEFAULT 'SELF' CHECK (privacy IN ('SELF', 'CLOSE_FRIENDS', 'FRIENDS', 'PUBLIC')),
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at TIMESTAMPTZ,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_check_in_at TIMESTAMPTZ,
  last_missed_at TIMESTAMPTZ,
  recovery_streak INTEGER NOT NULL DEFAULT 0,
  best_time_hour INTEGER CHECK (best_time_hour BETWEEN 0 AND 23),
  best_time_confidence DECIMAL CHECK (best_time_confidence BETWEEN 0 AND 1),
  environmental_cue TEXT CHECK (char_length(environmental_cue) <= 200),
  progressive_overload JSONB,
  progressive_overload_start DECIMAL,
  progressive_overload_previous DECIMAL,
  progressive_overload_last_applied_at TIMESTAMPTZ,
  is_reminder_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  reminder_times JSONB,
  reminder_text TEXT CHECK (char_length(reminder_text) <= 100),
  reflection_prompt TEXT CHECK (char_length(reflection_prompt) <= 200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ
);

CREATE TABLE habit_check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  occurred_at TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL DEFAULT 'MANUAL' CHECK (source IN ('MANUAL', 'INTEGRATION', 'TRIGGER')),
  success BOOLEAN NOT NULL DEFAULT TRUE,
  value DECIMAL,
  evidence_url TEXT,
  note TEXT CHECK (char_length(note) <= 500),
  intensity INTEGER CHECK (intensity BETWEEN 1 AND 5),
  mood_before INTEGER CHECK (mood_before BETWEEN 1 AND 5),
  mood_after INTEGER CHECK (mood_after BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ,
  UNIQUE(habit_id, occurred_at, source)
);

-- ============================================
-- JOURNAL & MOOD
-- ============================================

CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (char_length(text) BETWEEN 1 AND 5000),
  pillar TEXT CHECK (pillar IN ('MIND', 'BODY', 'HEART', 'SOUL')),
  privacy TEXT NOT NULL DEFAULT 'SELF' CHECK (privacy IN ('SELF', 'CLOSE_FRIENDS', 'FRIENDS', 'PUBLIC')),
  tags JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ
);

CREATE TABLE mood_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mood INTEGER NOT NULL CHECK (mood BETWEEN 1 AND 5),
  emotion TEXT CHECK (char_length(emotion) <= 50),
  note TEXT CHECK (char_length(note) <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ
);

-- ============================================
-- SOCIAL CONTENT
-- ============================================

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pillar TEXT NOT NULL CHECK (pillar IN ('MIND', 'BODY', 'HEART', 'SOUL')),
  privacy TEXT NOT NULL DEFAULT 'FRIENDS' CHECK (privacy IN ('CLOSE_FRIENDS', 'FRIENDS', 'PUBLIC')),
  text TEXT CHECK (char_length(text) <= 500),
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('IMAGE', 'VIDEO')),
  post_type_tags JSONB,
  custom_tags JSONB,
  check_in_id UUID REFERENCES habit_check_ins(id) ON DELETE SET NULL,
  habit_id UUID REFERENCES habits(id) ON DELETE SET NULL,
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ
);

CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pillar TEXT NOT NULL CHECK (pillar IN ('MIND', 'BODY', 'HEART', 'SOUL')),
  privacy TEXT NOT NULL DEFAULT 'FRIENDS' CHECK (privacy IN ('CLOSE_FRIENDS', 'FRIENDS', 'PUBLIC')),
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('IMAGE', 'VIDEO')),
  caption TEXT CHECK (char_length(caption) <= 280),
  tags JSONB,
  check_in_id UUID REFERENCES habit_check_ins(id) ON DELETE SET NULL,
  habit_id UUID REFERENCES habits(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ
);

CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (emoji IN ('👍', '❤️', '👏', '🔥', '📈')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ,
  CHECK ((post_id IS NOT NULL) <> (story_id IS NOT NULL))
);

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (char_length(text) BETWEEN 1 AND 280),
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ
);

CREATE TABLE nudges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  habit_id UUID REFERENCES habits(id) ON DELETE SET NULL,
  template_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ
);

-- ============================================
-- GAMIFICATION
-- ============================================

CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_name TEXT NOT NULL,
  pillar TEXT CHECK (pillar IN ('MIND', 'BODY', 'HEART', 'SOUL')),
  habit_id UUID REFERENCES habits(id) ON DELETE SET NULL,
  tier INTEGER CHECK (tier BETWEEN 1 AND 5),
  metadata JSONB,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  shared_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ,
  UNIQUE(user_id, badge_name, pillar, habit_id)
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) <= 100),
  text TEXT NOT NULL CHECK (char_length(text) <= 200),
  data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- SYSTEM TABLES
-- ============================================

CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  target_id UUID,
  date DATE NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, action_type, target_id, date)
);

CREATE TABLE sync_queue (
  id BIGSERIAL PRIMARY KEY,
  operation TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_apple_id ON users(apple_id);

-- Friendships
CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX idx_friendships_status ON friendships(status);
CREATE INDEX idx_friendships_close ON friendships(user_id, is_close_friend);

-- Goals
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_identity_id ON goals(identity_id);
CREATE INDEX idx_goals_pillar ON goals(pillar);
CREATE INDEX idx_goals_deadline ON goals(deadline) WHERE deadline IS NOT NULL;

-- Habits
CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_habits_goal_id ON habits(goal_id);
CREATE INDEX idx_habits_pillar ON habits(pillar);
CREATE INDEX idx_habits_archived ON habits(is_archived);

-- Check-ins
CREATE INDEX idx_check_ins_habit_id ON habit_check_ins(habit_id);
CREATE INDEX idx_check_ins_user_id ON habit_check_ins(user_id);
CREATE INDEX idx_check_ins_occurred_at ON habit_check_ins(occurred_at DESC);

-- Posts & Stories
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_privacy ON posts(privacy);
CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_expires_at ON stories(expires_at);

-- Reactions
CREATE INDEX idx_reactions_post_id ON reactions(post_id);
CREATE INDEX idx_reactions_story_id ON reactions(story_id);
CREATE INDEX idx_reactions_user_id ON reactions(user_id);
CREATE UNIQUE INDEX idx_reactions_post_user ON reactions(post_id, user_id) WHERE post_id IS NOT NULL;
CREATE UNIQUE INDEX idx_reactions_story_user ON reactions(story_id, user_id) WHERE story_id IS NOT NULL;

-- Nudges
CREATE INDEX idx_nudges_from_user ON nudges(from_user_id);
CREATE INDEX idx_nudges_to_user ON nudges(to_user_id);
CREATE INDEX idx_nudges_created_at ON nudges(created_at DESC);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_identities_updated_at BEFORE UPDATE ON identities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON habits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-delete expired stories (run daily via cron)
CREATE OR REPLACE FUNCTION delete_expired_stories()
RETURNS void AS $$
BEGIN
  DELETE FROM stories WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

### Step 2.2: Create Cloud Schema

1. Go to Supabase Dashboard → **SQL Editor**
2. Click "New Query"
3. Copy/paste the entire cloud schema script above
4. Click "Run" (bottom right)
5. Wait for completion (30-60 seconds)

**Note:** This creates an empty Postgres database in the cloud. Your local SQLite database is unchanged and remains the source of truth.

### Step 2.3: Verify Cloud Schema

Check tables created:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Should see 18 core tables:

- users, session, friendships, blocked_users
- identities, goals, habits, habit_check_ins
- journal_entries, mood_entries
- posts, stories, reactions, comments, nudges
- badges, notifications
- rate_limits, sync_queue, settings

---

## 3. Row-Level Security

**Time:** 30-60 minutes
**Goal:** Enforce privacy rules at database level

### Step 3.1: Enable RLS

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudges ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
```

### Step 3.2: Users Table Policies

```sql
-- Users can read own profile + public profiles
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Service role can do anything (for admin operations)
CREATE POLICY "Service role full access" ON users
  FOR ALL USING (auth.role() = 'service_role');
```

### Step 3.3: Privacy-Based Policies

```sql
-- Helper function to check friendship status
CREATE OR REPLACE FUNCTION is_friend(user_a UUID, user_b UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM friendships
    WHERE ((user_id = user_a AND friend_id = user_b)
        OR (user_id = user_b AND friend_id = user_a))
      AND status = 'ACCEPTED'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to check close friend status
CREATE OR REPLACE FUNCTION is_close_friend(user_a UUID, user_b UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM friendships
    WHERE user_id = user_a
      AND friend_id = user_b
      AND status = 'ACCEPTED'
      AND is_close_friend = TRUE
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Goals policies
CREATE POLICY "Users can read own goals" ON goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can read friends' goals" ON goals
  FOR SELECT USING (
    privacy = 'FRIENDS' AND is_friend(user_id, auth.uid())
  );

CREATE POLICY "Users can read close friends' goals" ON goals
  FOR SELECT USING (
    privacy = 'CLOSE_FRIENDS' AND is_close_friend(user_id, auth.uid())
  );

CREATE POLICY "Users can read public goals" ON goals
  FOR SELECT USING (privacy = 'PUBLIC');

CREATE POLICY "Users can create own goals" ON goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON goals
  FOR DELETE USING (auth.uid() = user_id);

-- Habits policies (same pattern)
CREATE POLICY "Users can read own habits" ON habits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can read friends' habits" ON habits
  FOR SELECT USING (
    privacy = 'FRIENDS' AND is_friend(user_id, auth.uid())
  );

CREATE POLICY "Users can read close friends' habits" ON habits
  FOR SELECT USING (
    privacy = 'CLOSE_FRIENDS' AND is_close_friend(user_id, auth.uid())
  );

CREATE POLICY "Users can read public habits" ON habits
  FOR SELECT USING (privacy = 'PUBLIC');

CREATE POLICY "Users can manage own habits" ON habits
  FOR ALL USING (auth.uid() = user_id);

-- Posts policies
CREATE POLICY "Users can read friends' posts" ON posts
  FOR SELECT USING (
    privacy = 'FRIENDS' AND is_friend(user_id, auth.uid())
  );

CREATE POLICY "Users can read close friends' posts" ON posts
  FOR SELECT USING (
    privacy = 'CLOSE_FRIENDS' AND is_close_friend(user_id, auth.uid())
  );

CREATE POLICY "Users can read public posts" ON posts
  FOR SELECT USING (privacy = 'PUBLIC');

CREATE POLICY "Users can manage own posts" ON posts
  FOR ALL USING (auth.uid() = user_id);

-- Check-ins inherit habit privacy
CREATE POLICY "Users can read own check-ins" ON habit_check_ins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can read friends' check-ins" ON habit_check_ins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM habits h
      WHERE h.id = habit_check_ins.habit_id
        AND h.privacy IN ('FRIENDS', 'PUBLIC')
        AND (h.user_id = auth.uid() OR is_friend(h.user_id, auth.uid()))
    )
  );

CREATE POLICY "Users can manage own check-ins" ON habit_check_ins
  FOR ALL USING (auth.uid() = user_id);

-- Journal is always SELF only
CREATE POLICY "Users can only see own journal" ON journal_entries
  FOR ALL USING (auth.uid() = user_id);

-- Mood is always SELF only
CREATE POLICY "Users can only see own mood" ON mood_entries
  FOR ALL USING (auth.uid() = user_id);

-- Reactions: can react to anything you can see
CREATE POLICY "Users can read reactions on visible posts" ON reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = reactions.post_id
        AND (p.user_id = auth.uid()
          OR (p.privacy = 'PUBLIC')
          OR (p.privacy = 'FRIENDS' AND is_friend(p.user_id, auth.uid()))
          OR (p.privacy = 'CLOSE_FRIENDS' AND is_close_friend(p.user_id, auth.uid())))
    )
  );

CREATE POLICY "Users can create reactions" ON reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reactions" ON reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Notifications: only see your own
CREATE POLICY "Users can only see own notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id);
```

### Step 3.4: Test Policies

Create test users and verify:

```sql
-- Test: User A cannot read User B's SELF habits
-- Test: User A CAN read User B's FRIENDS habits if they're friends
-- Test: User A CAN read User B's PUBLIC habits
-- Test: User A CANNOT update User B's habits
```

---

## 4. Authentication Setup

**Time:** 20-30 minutes
**Goal:** Enable Apple Sign-In

### Step 4.1: Apple Developer Setup

1. Go to [developer.apple.com](https://developer.apple.com)
2. **Identifiers** → **App IDs** → Create new
3. Fill in:
   - **Description:** Social Accountability
   - **Bundle ID:** com.socialaccountability.app
   - **Capabilities:** Check "Sign in with Apple"
4. Save and download configuration

### Step 4.2: Configure Supabase

1. Go to **Authentication → Providers**
2. Find "Apple" and enable
3. Fill in:
   - **Client ID:** (from Apple Developer)
   - **Team ID:** (from Apple Developer)
   - **Key ID:** (from Apple Developer)
   - **Private Key:** Upload `.p8` file from Apple
4. Save configuration

### Step 4.3: Update App Code

Install dependencies:

```bash
npm install @supabase/supabase-js expo-apple-authentication
```

Create `src/services/supabase.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config/env";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

Update `src/services/auth.ts`:

```typescript
import * as AppleAuthentication from "expo-apple-authentication";
import { supabase } from "./supabase";
import { logger } from "../lib/logger";

export async function signInWithApple() {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: credential.identityToken!,
    });

    if (error) throw error;

    logger.info("Apple sign-in successful", { userId: data.user?.id });
    return { user: data.user, session: data.session };
  } catch (error) {
    logger.error("Apple sign-in failed", { error });
    throw error;
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}
```

---

## 5. Supabase Storage Setup

**Time:** 15-20 minutes
**Goal:** Configure media storage buckets for photos/videos

### Step 5.1: Create Storage Buckets

1. Go to Supabase Dashboard → **Storage**
2. Click "Create bucket"
3. Create these buckets:

```
Bucket Name: avatars
Public: Yes (profile photos are public)
File size limit: 5MB
Allowed MIME types: image/jpeg, image/png, image/webp
```

```
Bucket Name: post-media
Public: No (privacy controlled via RLS)
File size limit: 10MB
Allowed MIME types: image/jpeg, image/png, image/webp, video/mp4
```

```
Bucket Name: evidence
Public: No (check-in evidence photos)
File size limit: 5MB
Allowed MIME types: image/jpeg, image/png, image/webp
```

### Step 5.2: Configure Storage RLS Policies

```sql
-- Avatars: anyone can read, only owner can upload/update
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Post media: privacy based on post privacy setting
CREATE POLICY "Users can upload post media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'post-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view post media they have access to" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'post-media'
    AND (
      -- Own posts
      auth.uid()::text = (storage.foldername(name))[1]
      -- Public posts (implement by checking posts table)
      OR EXISTS (
        SELECT 1 FROM posts p
        WHERE p.media_url LIKE '%' || name
          AND p.privacy = 'PUBLIC'
      )
      -- Friends posts (implement by checking friendships)
      OR EXISTS (
        SELECT 1 FROM posts p
        WHERE p.media_url LIKE '%' || name
          AND p.privacy IN ('FRIENDS', 'CLOSE_FRIENDS')
          AND is_friend(p.user_id, auth.uid())
      )
    )
  );

-- Evidence photos: only owner can access
CREATE POLICY "Users can upload check-in evidence" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'evidence'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own evidence" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'evidence'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

### Step 5.3: Create Upload Service

Create `src/services/upload.ts`:

```typescript
import { supabase } from "./supabase";
import { logger } from "../lib/logger";
import * as FileSystem from "expo-file-system";

export async function uploadAvatar(userId: string, localUri: string): Promise<string> {
  try {
    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const fileExt = localUri.split(".").pop();
    const fileName = `${userId}/avatar.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("avatars")
      .upload(filePath, decode(base64), {
        contentType: `image/${fileExt}`,
        upsert: true, // Replace if exists
      });

    if (error) throw error;

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    logger.info("Avatar uploaded", { userId, url: publicUrl });
    return publicUrl;
  } catch (error) {
    logger.error("Avatar upload failed", { error });
    throw error;
  }
}

export async function uploadPostMedia(
  userId: string,
  localUri: string,
  type: "image" | "video"
): Promise<string> {
  try {
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const fileExt = localUri.split(".").pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from("post-media")
      .upload(fileName, decode(base64), {
        contentType: type === "image" ? `image/${fileExt}` : `video/${fileExt}`,
      });

    if (error) throw error;

    // Get signed URL (private, expires in 1 hour)
    const {
      data: { signedUrl },
      error: urlError,
    } = await supabase.storage.from("post-media").createSignedUrl(fileName, 3600);

    if (urlError) throw urlError;

    logger.info("Post media uploaded", { userId, type, url: signedUrl });
    return signedUrl;
  } catch (error) {
    logger.error("Post media upload failed", { error });
    throw error;
  }
}

export async function uploadEvidence(
  userId: string,
  habitId: string,
  localUri: string
): Promise<string> {
  try {
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const fileExt = localUri.split(".").pop();
    const fileName = `${userId}/${habitId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from("evidence")
      .upload(fileName, decode(base64), {
        contentType: `image/${fileExt}`,
      });

    if (error) throw error;

    const {
      data: { signedUrl },
      error: urlError,
    } = await supabase.storage.from("evidence").createSignedUrl(fileName, 3600);

    if (urlError) throw urlError;

    logger.info("Evidence uploaded", { userId, habitId, url: signedUrl });
    return signedUrl;
  } catch (error) {
    logger.error("Evidence upload failed", { error });
    throw error;
  }
}

// Helper to decode base64
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
```

### Step 5.4: Update Forms to Use Upload Service

```typescript
// Example: Profile photo update
import { uploadAvatar } from "../services/upload";
import * as ImagePicker from "expo-image-picker";

async function handlePhotoChange() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (!result.canceled) {
    const photoUrl = await uploadAvatar(userId, result.assets[0].uri);
    // Update user profile with photoUrl
    await updateUserProfile({ photoUrl });
  }
}
```

---

## 6. API Client Configuration

**Time:** 10-15 minutes
**Goal:** Set up type-safe API client

### Step 6.1: Generate TypeScript Types

```bash
npx supabase gen types typescript --project-id [YOUR_PROJECT_ID] > src/types/supabase.ts
```

### Step 5.2: Create API Service

Update `src/services/api.ts`:

```typescript
import { supabase } from "./supabase";
import type { Database } from "../types/supabase";
import { logger } from "../lib/logger";

type Tables = Database["public"]["Tables"];

export const api = {
  // Goals
  async getGoals() {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async createGoal(goal: Omit<Tables["goals"]["Insert"], "id" | "created_at" | "updated_at">) {
    const { data, error } = await supabase.from("goals").insert(goal).select().single();

    if (error) throw error;
    return data;
  },

  // Habits
  async getHabits() {
    const { data, error } = await supabase
      .from("habits")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async createHabit(habit: Omit<Tables["habits"]["Insert"], "id" | "created_at" | "updated_at">) {
    const { data, error } = await supabase.from("habits").insert(habit).select().single();

    if (error) throw error;
    return data;
  },

  // Check-ins
  async getCheckIns(habitId: string) {
    const { data, error } = await supabase
      .from("habit_check_ins")
      .select("*")
      .eq("habit_id", habitId)
      .order("occurred_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async createCheckIn(checkIn: Omit<Tables["habit_check_ins"]["Insert"], "id" | "created_at">) {
    const { data, error } = await supabase
      .from("habit_check_ins")
      .insert(checkIn)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Posts
  async getFeed(scope: "mine" | "friends" | "public", limit = 20, cursor?: string) {
    let query = supabase
      .from("posts")
      .select("*, user:users(id, display_name, photo_url)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (scope === "mine") {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      query = query.eq("user_id", user!.id);
    } else if (scope === "friends") {
      query = query.in("privacy", ["FRIENDS", "PUBLIC"]);
    } else {
      query = query.eq("privacy", "PUBLIC");
    }

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Friends
  async getFriends() {
    const { data, error } = await supabase
      .from("friendships")
      .select("*, friend:users(id, display_name, photo_url)")
      .eq("status", "ACCEPTED");

    if (error) throw error;
    return data;
  },

  async sendFriendRequest(friendId: string) {
    const { data, error } = await supabase
      .from("friendships")
      .insert({ friend_id: friendId, status: "PENDING" })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
```

---

## 6. Sync Service Implementation

**Time:** 2-4 hours
**Goal:** Bidirectional sync between local SQLite and cloud Postgres

### Architecture Reminder

```
Device Operations (Always Fast):
1. User creates habit
2. Write to SQLite immediately ✅ (instant UX)
3. Enqueue sync job
4. Return success to user

Background Sync (Every 15 min):
1. Check sync queue for pending operations
2. Upload changes to Supabase
3. Download changes from Supabase
4. Merge into local SQLite (conflict resolution: device timestamp wins)
```

### Step 6.1: Sync Queue Implementation

Update `src/services/sync.ts`:

```typescript
import { supabase } from "./supabase";
import { query, execute, transaction } from "../storage/database";
import { logger } from "../lib/logger";

interface SyncQueueItem {
  id: number;
  operation: "INSERT" | "UPDATE" | "DELETE";
  table_name: string;
  record_id: string;
  payload: any;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  attempts: number;
}

export class SyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;

  async start() {
    // Sync on app start
    await this.syncAll();

    // Sync every 15 minutes
    this.syncInterval = setInterval(
      () => {
        this.syncAll();
      },
      15 * 60 * 1000
    );

    logger.info("Sync service started");
  }

  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    logger.info("Sync service stopped");
  }

  async syncAll() {
    if (this.isSyncing) {
      logger.debug("Sync already in progress, skipping");
      return;
    }

    this.isSyncing = true;
    logger.info("Starting sync");

    try {
      // 1. Pull updates from cloud
      await this.pullFromCloud();

      // 2. Push local changes to cloud
      await this.pushToCloud();

      logger.info("Sync completed successfully");
    } catch (error) {
      logger.error("Sync failed", { error });
    } finally {
      this.isSyncing = false;
    }
  }

  private async pullFromCloud() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      logger.debug("No session, skipping cloud pull");
      return;
    }

    // Get last sync timestamp
    const lastSync = await query<{ value: string }>("SELECT value FROM settings WHERE key = ?", [
      "last_sync_at",
    ]);
    const lastSyncAt = lastSync[0]?.value || new Date(0).toISOString();

    // Pull each table
    const tables = ["goals", "habits", "habit_check_ins", "posts", "reactions"];

    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select("*").gt("updated_at", lastSyncAt);

        if (error) throw error;

        if (data && data.length > 0) {
          await this.mergeCloudData(table, data);
          logger.debug(`Pulled ${data.length} records from ${table}`);
        }
      } catch (error) {
        logger.error(`Failed to pull ${table}`, { error });
      }
    }

    // Update last sync timestamp
    await execute("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)", [
      "last_sync_at",
      new Date().toISOString(),
      new Date().toISOString(),
    ]);
  }

  private async mergeCloudData(table: string, records: any[]) {
    await transaction(async (db) => {
      for (const record of records) {
        // Check if local record exists
        const local = await query<any>(`SELECT * FROM ${table} WHERE id = ?`, [record.id]);

        if (local.length === 0) {
          // Insert new record
          const columns = Object.keys(record).join(", ");
          const placeholders = Object.keys(record)
            .map(() => "?")
            .join(", ");
          const values = Object.values(record);

          await execute(`INSERT INTO ${table} (${columns}) VALUES (${placeholders})`, values);
        } else {
          // Conflict resolution: use newer timestamp
          const localUpdatedAt = new Date(local[0].updated_at || local[0].created_at);
          const cloudUpdatedAt = new Date(record.updated_at || record.created_at);

          if (cloudUpdatedAt > localUpdatedAt) {
            // Cloud is newer, update local
            const updates = Object.keys(record)
              .filter((k) => k !== "id")
              .map((k) => `${k} = ?`)
              .join(", ");
            const values = Object.keys(record)
              .filter((k) => k !== "id")
              .map((k) => record[k]);
            values.push(record.id);

            await execute(`UPDATE ${table} SET ${updates} WHERE id = ?`, values);
          }
        }
      }
    });
  }

  private async pushToCloud() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      logger.debug("No session, skipping cloud push");
      return;
    }

    // Get pending sync queue items
    const queue = await query<SyncQueueItem>(
      "SELECT * FROM sync_queue WHERE status = ? ORDER BY created_at ASC LIMIT 50",
      ["PENDING"]
    );

    for (const item of queue) {
      try {
        // Mark as processing
        await execute("UPDATE sync_queue SET status = ?, last_attempt_at = ? WHERE id = ?", [
          "PROCESSING",
          new Date().toISOString(),
          item.id,
        ]);

        // Execute operation
        if (item.operation === "INSERT") {
          const { error } = await supabase.from(item.table_name).insert(item.payload);
          if (error) throw error;
        } else if (item.operation === "UPDATE") {
          const { error } = await supabase
            .from(item.table_name)
            .update(item.payload)
            .eq("id", item.record_id);
          if (error) throw error;
        } else if (item.operation === "DELETE") {
          const { error } = await supabase.from(item.table_name).delete().eq("id", item.record_id);
          if (error) throw error;
        }

        // Mark as completed
        await execute("UPDATE sync_queue SET status = ?, completed_at = ? WHERE id = ?", [
          "COMPLETED",
          new Date().toISOString(),
          item.id,
        ]);

        logger.debug("Synced item", { table: item.table_name, operation: item.operation });
      } catch (error) {
        // Mark as failed, increment attempts
        const newAttempts = item.attempts + 1;
        const status = newAttempts >= 3 ? "FAILED" : "PENDING";

        await execute(
          "UPDATE sync_queue SET status = ?, attempts = ?, last_attempt_at = ? WHERE id = ?",
          [status, newAttempts, new Date().toISOString(), item.id]
        );

        logger.error("Sync item failed", {
          table: item.table_name,
          operation: item.operation,
          attempts: newAttempts,
          error,
        });
      }
    }
  }

  async enqueueSync(
    operation: "INSERT" | "UPDATE" | "DELETE",
    table: string,
    recordId: string,
    payload: any
  ) {
    await execute(
      "INSERT INTO sync_queue (operation, table_name, record_id, payload, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [operation, table, recordId, JSON.stringify(payload), "PENDING", new Date().toISOString()]
    );
  }
}

export const syncService = new SyncService();
```

### Step 6.2: Update Storage Modules to Enqueue Sync

**Critical:** Storage modules write to SQLite FIRST, then enqueue for cloud sync.

Modify storage functions to enqueue sync operations:

```typescript
// Example: src/storage/goals.ts
import { execute, query } from "./database";
import { syncService } from "../services/sync";

export async function createGoal(goal: Goal) {
  // 1. Write to SQLite FIRST (instant UX, works offline)
  await execute(
    "INSERT INTO goals (id, user_id, title, pillar, privacy, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [goal.id, goal.userId, goal.title, goal.pillar, goal.privacy, goal.createdAt, goal.updatedAt]
  );

  // 2. Enqueue for background cloud sync (non-blocking)
  await syncService.enqueueSync("INSERT", "goals", goal.id, goal);

  // 3. Return immediately (user doesn't wait for cloud)
  return goal;
}

export async function updateGoal(goalId: string, updates: Partial<Goal>) {
  // 1. Update SQLite first
  const setClause = Object.keys(updates)
    .map((k) => `${k} = ?`)
    .join(", ");
  const values = [...Object.values(updates), goalId];

  await execute(`UPDATE goals SET ${setClause}, updated_at = ? WHERE id = ?`, [
    ...values.slice(0, -1),
    new Date().toISOString(),
    goalId,
  ]);

  // 2. Enqueue sync
  await syncService.enqueueSync("UPDATE", "goals", goalId, updates);

  return updates;
}

export async function deleteGoal(goalId: string) {
  // 1. Delete from SQLite (or soft delete with deletedAt)
  await execute("UPDATE goals SET deleted_at = ? WHERE id = ?", [new Date().toISOString(), goalId]);

  // 2. Enqueue sync
  await syncService.enqueueSync("DELETE", "goals", goalId, {});
}
```

**Apply this pattern to all storage modules:**

- src/storage/habits.ts
- src/storage/checkIns.ts
- src/storage/posts.ts
- src/storage/reactions.ts
- src/storage/nudges.ts
- etc.

**Key principle:** User operations NEVER block on network calls.

### Step 6.3: Initialize Sync on App Start

Update `app/_layout.tsx`:

```typescript
import { useEffect } from 'react';
import { syncService } from '../src/services/sync';

export default function RootLayout() {
  useEffect(() => {
    // Start sync service
    syncService.start();

    return () => {
      syncService.stop();
    };
  }, []);

  return (
    // ... existing layout
  );
}
```

---

## 7. Testing & Validation

**Time:** 1-2 hours
**Goal:** Verify everything works

### Step 7.1: Manual Testing Checklist

- [ ] **Local-First Operations (Must Be Instant)**
  - [ ] Create goal offline → appears in SQLite immediately
  - [ ] Create habit offline → appears in local list instantly
  - [ ] Log check-in offline → updates streak immediately
  - [ ] All operations work without internet ✅

- [ ] **Cloud Sync (Background)**
  - [ ] Go online → sync queue starts uploading
  - [ ] Check Supabase dashboard → data appears in Postgres
  - [ ] Create goal on device A → syncs to cloud → appears on device B
  - [ ] Offline changes sync when connection restored

- [ ] **Conflict Resolution**
  - [ ] Create habit on device A (offline)
  - [ ] Edit same habit on device B (offline)
  - [ ] Both go online → newer timestamp wins
  - [ ] No data loss

- [ ] **Auth Flow**
  - [ ] Apple Sign-In works on device
  - [ ] JWT token stored in SQLite + SecureStore
  - [ ] Session persists across app restarts
  - [ ] Sign out clears session

- [ ] **Privacy Enforcement (Cloud-Side)**
  - [ ] User A creates SELF goal → syncs to cloud
  - [ ] User B cannot see it in Supabase (RLS blocks)
  - [ ] User A creates FRIENDS goal → User B (friend) can see it
  - [ ] User A creates PUBLIC goal → everyone can see it

### Step 7.2: Automated Tests

Create `tests/integration/supabase.test.ts`:

```typescript
import { supabase } from "../../src/services/supabase";
import { api } from "../../src/services/api";

describe("Supabase Integration", () => {
  let testUser: any;

  beforeAll(async () => {
    // Create test user
    const { data, error } = await supabase.auth.signUp({
      email: "test@example.com",
      password: "testpassword123",
    });
    testUser = data.user;
  });

  afterAll(async () => {
    // Cleanup
    await supabase.auth.signOut();
  });

  test("creates goal locally then syncs to cloud", async () => {
    // 1. Create in local SQLite (instant)
    const localGoal = await createGoal({
      id: uuid(),
      userId: testUser.id,
      title: "Test Goal",
      pillar: "MIND",
      privacy: "SELF",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Goal exists in SQLite immediately
    const localResult = await query("SELECT * FROM goals WHERE id = ?", [localGoal.id]);
    expect(localResult.length).toBe(1);

    // 2. Trigger sync manually (or wait for background sync)
    await syncService.syncAll();

    // 3. Verify synced to Supabase
    const { data: cloudGoal, error } = await supabase
      .from("goals")
      .select("*")
      .eq("id", localGoal.id)
      .single();

    expect(error).toBeNull();
    expect(cloudGoal?.title).toBe("Test Goal");
  });

  test("offline mode: creates goal without cloud connection", async () => {
    // Simulate offline by blocking network (or just don't call sync)
    const offlineGoal = await createGoal({
      id: uuid(),
      userId: testUser.id,
      title: "Offline Goal",
      pillar: "BODY",
      privacy: "SELF",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Goal exists locally
    const localResult = await query("SELECT * FROM goals WHERE id = ?", [offlineGoal.id]);
    expect(localResult.length).toBe(1);

    // Check sync queue has pending operation
    const queueResult = await query("SELECT * FROM sync_queue WHERE record_id = ? AND status = ?", [
      offlineGoal.id,
      "PENDING",
    ]);
    expect(queueResult.length).toBe(1);
  });

  test("enforces SELF privacy (RLS prevents cross-user reads)", async () => {
    // Create goal as user A with SELF privacy
    const goalA = await createGoal({
      id: uuid(),
      userId: testUser.id,
      title: "Private Goal",
      pillar: "MIND",
      privacy: "SELF",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Sync to cloud
    await syncService.syncAll();

    // Sign out user A
    await supabase.auth.signOut();

    // Sign in as user B
    const { data: userB } = await supabase.auth.signUp({
      email: "userb@example.com",
      password: "password123",
    });

    // Try to read user A's goal from cloud
    const { data, error } = await supabase.from("goals").select("*").eq("id", goalA.id).single();

    // Should fail (RLS blocks it)
    expect(error).toBeDefined();
    expect(data).toBeNull();
  });
});
```

Run tests:

```bash
npm test tests/integration/supabase.test.ts
```

---

## 8. Monitoring & Maintenance

**Goal:** Keep costs low and catch issues early

### Step 8.1: Cost Monitoring Dashboard

Create `docs/COST_DASHBOARD.md`:

```markdown
# Cost Monitoring Dashboard

## Current Usage (Check Weekly)

### Supabase

- **Database Size:** [Check in Dashboard → Database → Usage]
  - Free tier: 500MB
  - Current: \_**\_ MB (\_\_** %)
  - Alert threshold: 400MB (80%)

- **Bandwidth:** [Check in Dashboard → Database → Usage]
  - Free tier: 5GB/month
  - Current: \_**\_ GB (\_\_** %)
  - Alert threshold: 4GB (80%)

- **API Requests:** [Check in Dashboard → API → Usage]
  - Free tier: Unlimited
  - Current: \_\_\_\_ requests/day

### Supabase Storage

- **Storage:** [Check in Dashboard → Storage → Usage]
  - Free tier: 1GB
  - Current: \_**\_ MB (\_\_** %)
  - Alert threshold: 800MB (80%)
  - Note: 1GB = ~1000 profile photos or ~200 short videos

- **Bandwidth:** [Check in Dashboard → Storage → Usage]
  - Free tier: 2GB/month (included in database bandwidth)
  - Current: \_**\_ GB (\_\_** %)

## Cost Projections

| Users | DB Size | Bandwidth | Media | Total Cost |
| ----- | ------- | --------- | ----- | ---------- |
| 100   | 40MB    | 500MB     | 2GB   | $0         |
| 500   | 200MB   | 2.5GB     | 10GB  | $0         |
| 1000  | 400MB   | 5GB       | 20GB  | $0         |
| 5000  | 2GB     | 25GB      | 100GB | $50/month  |

## Alert Thresholds

- [ ] Database: 400MB (80% of free tier)
- [ ] Bandwidth: 4GB (80% of free tier)
- [ ] Media: 20GB (80% of free tier)

## Upgrade Triggers

- **Supabase Pro ($25/month):**
  - Database > 400MB
  - Need more than 5GB bandwidth
  - Want automatic backups

- **Supabase Storage (included in Pro tier):**
  - Storage > 1GB → Included in Supabase Pro ($25/month gets 100GB)
  - Bandwidth > 2GB/month → Also included in Pro
```

### Step 8.2: Error Tracking

Add Sentry for production error tracking:

```bash
npm install @sentry/react-native
```

Configure in `src/lib/logger.ts`:

```typescript
import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === "production",
});

export const logger = {
  info: (message: string, meta?: any) => {
    console.log(message, meta);
  },
  error: (message: string, meta?: any) => {
    console.error(message, meta);
    Sentry.captureException(new Error(message), { extra: meta });
  },
};
```

### Step 8.3: Database Backup Schedule

Set up weekly backups in Supabase:

1. Go to **Settings → Database → Backups**
2. Enable "Point-in-time recovery" (free tier: 7 days)
3. Schedule manual backups weekly:
   - Every Sunday at 2am UTC
   - Keep for 30 days

### Step 8.4: Performance Monitoring

Add query to check slow queries:

```sql
-- Run monthly to find slow queries
SELECT
  query,
  calls,
  total_time / calls as avg_time,
  min_time,
  max_time
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY total_time DESC
LIMIT 10;
```

---

## Quick Reference

### Environment Variables

```bash
# .env (NEVER COMMIT)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Backend only

# .env.local (safe to commit)
API_URL=https://xxxxx.supabase.co/rest/v1
ENABLE_SYNC=true
SYNC_INTERVAL=15  # minutes
```

### Common Commands

```bash
# Generate types
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts

# Run migration
psql $DATABASE_URL < scripts/migrate-to-postgres.sql

# Test RLS policies
npm run test:integration

# Check sync queue status
sqlite3 social_accountability.db "SELECT status, COUNT(*) FROM sync_queue GROUP BY status"
```

### Troubleshooting

**Sync failing:**

1. Check internet connection
2. Verify JWT token not expired: `await supabase.auth.getSession()`
3. Check sync queue: `SELECT * FROM sync_queue WHERE status = 'FAILED'`
4. Review logs for error details
5. Remember: Local SQLite always works, sync is background only

**RLS blocking legitimate access:**

1. Test query in SQL Editor with `auth.uid()` set
2. Verify friendship exists: `SELECT * FROM friendships WHERE ...`
3. Check privacy field on object
4. Remember: RLS only affects cloud reads, local SQLite unaffected

**Database getting full:**

1. Delete old stories: `DELETE FROM stories WHERE expires_at < NOW()` (in Supabase)
2. Archive old check-ins: Move to cold storage (cloud only)
3. Compress media files
4. Local SQLite can grow large (it's fine, iOS handles it)

---

## Next Steps

After completing setup:

1. **M1 Milestone:**
   - [ ] Deploy auth flow to production
   - [ ] Test with real users (beta testers)
   - [ ] Monitor sync queue (check for failed syncs)
   - [ ] Verify local SQLite operations are always instant

2. **M2 Milestone:**
   - [ ] Implement habits & goals sync (already using local SQLite)
   - [ ] Add streak calculations (device-side)
   - [ ] Build dashboard (reads from local SQLite)

3. **M3 Milestone:**
   - [ ] Enable social features (posts stored in SQLite, synced to cloud)
   - [ ] Set up media upload pipeline (Supabase Storage buckets)
   - [ ] Test feed performance (reads from local SQLite first)

---

**Architecture Reminder:**

- ✅ SQLite: Local source of truth, always instant, works offline
- ☁️ Supabase: Cloud replica for backup and multi-device sync
- 🔄 Sync: Background process, never blocks user operations
- 📱 Device timestamp always wins in conflicts

**Last Updated:** January 18, 2026
**Estimated Total Time:** 6-8 hours for full sync implementation
**Cost:** $0 for first 1000+ users
