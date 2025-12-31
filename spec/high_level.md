# Product Vision

This is an iOS app that tracks user behavior through automated 3rd party integrations (location, screen time, health data, etc.) to generate in-depth, visual insights that encourage healthier habits. **The core principle is minimizing user interaction** — automated systems gather, display, and share progress for a seamless "off-the-app" experience.

The main feature is **merging social media with self-improvement**: users see their friends' goals, cheer them on, and hold them accountable when they miss habits. Social visibility and positive reinforcement drive long-term behavior change with minimal manual effort.

---

# **Milestone 0: Technical Architecture & Infrastructure**

### 0.1 Backend & Storage

* **Databases:**

  * **Primary:** Cloud-based SQL or NoSQL (e.g., Postgres, Firebase) for structured habit, milestone, user data.
  * **Secondary / Cache:** Redis or local storage for fast access to recent logs and ML outputs.
* **Media Storage:**

  * Cloud object storage (S3/Google Cloud Storage) for images/videos; encrypted at rest.
* **Data Schema Guidance:**

  * Users → Profiles → Pillars/Identities → Habits/Milestones → Logs → ML interpretations.
  * Flexible schema for future micro-habits or new activity types.
* **APIs:**

  * REST or GraphQL endpoints for all CRUD operations.
  * Version endpoints for smooth updates.
  * ML processing endpoints (if cloud-assisted) must handle offline fallback.

### 0.2 ML & Auto-Logging Pipelines

* On-device ML pipelines preferred for privacy.
* Optional cloud aggregation for anonymized analytics (if user consents).
* **Guidance:**

  * Sequence mining: maintain recent history buffer per user.
  * Clustering: periodic recomputation (daily/weekly) for efficiency.
  * Auto-log confidence thresholds: allow manual override.

### 0.3 Offline-First & Sync Strategy

* Local encrypted storage to support offline logging.
* Background sync with cloud when device online.
* Conflict resolution: last-modified timestamp + user override.

### 0.4 Notifications & Scheduling

* **Push Notifications:**

  * Habit reminders, streak alerts, challenge nudges.
  * Use local notification scheduling for recurring habits.
* **Scheduling Guidance:**

  * Respect time zones.
  * Rate-limit repeated notifications.
  * Users can mute or customize per habit/pillar.

### 0.5 Error Handling & Edge Cases

* Consent revocation: stop auto-logging, anonymize stored data.
* Failed syncs or ML computation: retry logic + logging.
* Account conflicts: detect duplicate accounts or device inconsistencies.
* Media errors: fallback for failed uploads (queue & retry).
* **Guidance:** robust logging and monitoring for early anomaly detection.

### 0.6 Onboarding & Tutorials

* **First-time user flow:**

  * Explain pillars, identities, and habit logging.
  * Guide circle/friend setup and privacy options.
  * Optional “sample habits” and auto-log demo.
* **Interactive tutorials:**

  * Show ML auto-logging detection with mock data.
  * Explain dashboard metrics and social loops.

### 0.7 Performance & Scalability

* On-device ML must not block main UI thread.
* Batch auto-log processing at scheduled intervals.
* Lazy load feed, badges, graphs.
* Optimize media thumbnails.
* Cloud backups incremental, not full re-uploads.

### 0.8 Security & Privacy Enhancements

* **Authentication:** OAuth token refresh & revocation; optional 2FA.
* **Encryption:** AES-256 local storage, HTTPS/TLS network calls. Encrypt media URLs & user identifiers.
* **Rate limiting & abuse protection:** Prevent spam posts, nudges, or challenge exploits.
* **Secure media handling:** Validate uploads (type/size), access tokens for private media.

### 0.9 Analytics & Admin Tools (Optional)

* Internal dashboards for engagement metrics (if user consents).
* Debug view for ML interpretation and auto-log confidence.
* Manual adjustment for streaks/logs in edge cases.
* Abuse detection alerts for social features.

---

# **Milestone 1: Account & Privacy**

### 1.1 Account Creation & Sign-In

* Users can create accounts via:

  * Apple Sign-In
  * Additional OAuth providers (Google, Facebook, etc.)
* Authentication handled by Apple or verified third-party services.
* Explicit user consent required for all tracked data sources.
* Supports account recovery and multi-device sync via secure cloud backup.

### 1.2 Profile Setup

* Users input detailed profile information, including:

  * Name, photo, bio
  * Habits, activities, and goals
  * Selected identities (used for milestone and habit suggestions)
  * Friends or private circle members
  * Optional pillar preference weights (Mind, Body, Heart, Soul)
* Profile includes full setup flow to categorize habits, goals, preferred routines, and circle management.

### 1.3 Privacy & Sharing

* Global privacy options: self-only, circle-only, public.
* Goals, habits, milestones, and journal entries can have independent privacy settings.
* All data encrypted in storage; optional backups via Apple or verified third-party services.
* Users can view, export, or delete any stored data.

### 1.4 Circle Management

* Users can create, edit, or remove private circles of friends/family.
* Sharing of habits, milestones, or achievements restricted by circle settings.
* Circle invitations and acceptances require explicit consent.

---

# **Milestone 2: Goal & Habit Tracking**

### 2.1 Identity & Pillar Assignment

* Users can select multiple identities; each identity strictly assigned to one pillar: Mind, Body, Heart, or Soul.
* Identities drive milestone goal suggestions and micro-habit prompts.
* Pillar scores aggregate across identities for dashboard metrics and trend analysis.
* Users can add, remove, or edit identities and adjust pillar preference weights.
* Identities allow flexible decoupling of habits from milestones.

### 2.2 Automated Logging & Interpretation

**Sources of Auto-Logging:**

* Location: gym, park, library, yoga studio, walking/running routes
* App usage: reading, fitness, mindfulness, productivity apps
* Calendar & events: classes, appointments, meetings
* Device sensors: steps, heart rate, sleep, screen unlocks
* Media consumption: podcasts, audiobooks, videos
* Journal entries: keyword-based sentiment analysis for mood inference
* Routine detection: repeated behavior sequences (morning run, evening reading, weekly review)
* Optional manual entries feed into auto-logging as supplemental data

**Machine Learning Techniques & Interpretation:**

* **Clustering:** detect behavior patterns and productivity peaks
* **Categorization:** classify app usage, media, calendar events, and journal entries into pillars and goal types
* **Trend & Correlation Analysis:**

  * Sleep vs mood
  * Activity vs energy
  * Calendar load vs stress
  * Nutrition vs mood/energy
  * Habit streaks vs pillar scores
  * Productivity times vs task completion
* **Anomaly Detection:** highlight deviations such as skipped meals, missed workouts, or irregular sleep
* **Sequence Mining:** predict optimal timing or next micro-habit based on repeated sequences
* **Keyword & Sentiment Analysis:** assign automatic mood scores from journal entries using stored positive/negative word lists

**Actionable Outputs:**

* Auto-log micro-habits or milestones based on detected behaviors
* Highlight top missed habits, peak productivity times, and underperforming pillars
* Optional advice/warnings:

  * Low calories → hydration reminder
  * Busy calendar → stress warning
  * Late bedtime → mood alert
* Manual overrides allowed for all auto-logged or inferred entries

### 2.3 Suggestion & Action Engine

* Converts auto-logged and ML-interpreted data into in-app prompts and micro-habit suggestions.
* Triggers:

  * Missed or underperforming habits/milestones
  * Identified patterns, anomalies, and correlations
  * Pillar imbalances
* Optional advice:

  * Sleep recommendations
  * Nutrition reminders
  * Stress alerts
  * Social engagement prompts
* Supports manual override, acceptance, or dismissal.
* Tracks user interactions to refine future suggestions.

### 2.4 Manual Inputs

* Users can log:

  * Habits, milestones
  * Mood (emoji, scale, or text)
  * Journal entries with pillar tagging
* Manual entries override automated logs.
* Users can create, pause, or delete custom micro-habits.
* Manual inputs feed into ML models to improve pattern detection and predictive suggestions.
* Notes can be added to each entry to provide context for future analysis.

### 2.5 Goal & Habit Fields

* **Core Fields:** title, description, pillar, type (time/count/presence/avoidance/financial), frequency, privacy, auto-log toggle, manual override flag
* **Optional Fields:** milestone link (decoupled), reminders/notifications, importance/weight score
* **Actions:** create, edit, pause, delete, duplicate, toggle auto-log/manual, assign/unassign milestones, adjust privacy
* **Integration:** fields linked to auto-log sources and ML interpretations for automatic scoring

### 2.6 Dashboard & Insights

* **Purpose:** purely informational; no suggested actions displayed.
* **Components:**

  1. **Pillar Overview:** Mind, Body, Heart, Soul scores; Pillar Health metric; strongest/weakest pillars
  2. **Milestone & Habit Summary:** completion %, streaks, top missed habits
  3. **Broad Trends & Patterns:**

     * Most productive times (daily/week)
     * Recurring routines
     * Media consumption patterns
     * Sleep, activity, and social engagement trends
     * Pillar trends (daily, weekly, monthly)
     * Auto-log vs manual entry counts
  4. **Identity Drill-Down:** per-identity contributions, associated milestones/micro-habits, filtering by pillar/identity/timeframe
  5. **Historical Metrics:** past vs current comparisons, long-term trends
* **Visualizations:** graphs, charts, heatmaps, tables, calendars
* **Feedback Loop:** ignored prompts or overridden logs feed into pattern refinement for future ML interpretations

### 2.7 Privacy & Storage

* **Storage:**

  * Local device storage encrypted (AES-256)
  * Optional cloud backup via Apple or verified third-party services
* **Data Types:** auto-logged behaviors, ML interpretations, manual inputs, sensitive health/behavioral data
* **Processing:** all ML computations performed on-device; no external AI calls
* **Access & Permissions:**

  * Explicit consent required for all data sources
  * Granular control per pillar, milestone, habit, or identity
* **Optional Features:** encrypted backups, data minimization, anonymized analytics
* **Actions:** export, delete, or modify stored data; maintain privacy settings

---

# **Milestone 3: Social Interaction & Gamified Loop**

### 3.1 Story Posting

* Users can post daily stories with **text, images, or videos**, tagged to a **pillar** (e.g., fitness, learning, mindfulness).
* Posts can include multiple media types.
* **Visibility options**: private, friends-only, or public.
* Users can **edit/delete posts** within 24 hours.
* Stories generate **summary snippets** for feeds.

### 3.2 Smart Post Suggestions

* System tracks user activity (gym check-ins, book completions, meditation).
* Suggests posts based on activity with **auto-filled hashtags/pillar tags**.
* Users can **turn off suggestions** or customize triggers.

### 3.3 Friend Reactions

* Reactions are **emoji or predefined positive messages** only.
* Users see a **reaction summary** on each post.
* Optional **reaction streaks** for consistent positive engagement.

### 3.4 Nudges & Reminders

* Nudges are **positive, predefined, and rate-limited**.
* Examples: “Keep it up!”, “Proud of your streak!”
* Users can **customize nudge frequency** or mute specific friends.
* Automated nudges encourage posting after missed days.

### 3.5 Badges & Achievements

* Awarded for streaks, milestone completions, and recovery after a miss.
* **Custom graphics and descriptions** for badges.
* Users can **share badges** with friends, publicly, or externally.
* Badge notifications include **motivational messages**.

### 3.6 Social Feed & Engagement

* Feed displays stories, badges, and achievements chronologically or algorithmically.
* Filters: pillar, activity type, or friend group.
* Engagement metrics: reactions, nudges, streak highlights.
* Optional **weekly digest** of friends’ top activities and achievements.

### 3.7 Privacy & Safety

* Users control **story and achievement visibility**.
* All interactions are **positive-only**; no open-text comments except controlled cases.
* Nudges, reactions, and badge sharing are **reversible**.
* Activity tracking respects **user consent and privacy settings**.

### 3.8 Gamified Social Loop

#### 3.8.1 Habit Challenges & Productive Competitions

* Users join challenges tied to pillars (e.g., read 5 books in a month, 20 gym sessions).
* Types: **solo or group** challenges.
* **Leaderboards** display progress/streaks without negative comparisons.
* Challenges include **optional deadlines** and automated motivational nudges.

#### 3.8.2 “<Habit>-Together” Mode

* Users create/join habit-together groups (reading, gym, meditation).
* Features: shared streaks, mutual nudges, mini-achievements.
* Users can **post about group sessions** with images/videos.

#### 3.8.3 Controlled Commenting & Posts

* Optional free-text comments limited to friends/groups.
* Automatic moderation filters profanity, negativity, off-topic content.
* Comments can earn **micro-badges** for engagement or helpfulness.
* Likes on comments only; no negative reactions.

#### 3.8.4 Core Gamified Additions

1. **Tiered Progression Levels**

   * Users level up per pillar via streaks, activity, and challenge completion.
   * Unlock **profile icons, reaction animations, or display perks**.
   * Levels reset slowly per season for continued engagement.

2. **Daily & Weekly Quests**

   * Short, achievable tasks per pillar, reset daily/weekly.
   * Rewards: **bonus streaks, progression points, micro-badges**.
   * Personalized based on user habits/activity.

3. **Friend Boosts & Power-ups**

   * Limited boosts sent to friends: extra streak day or quest bonus.
   * Encourages cooperative engagement and social reinforcement.
   * Rate-limited to prevent spam.

#### 3.8.5 Loop Mechanics

* **Daily Posting → Reactions → Nudges → Streaks → Badges → Social Feed Visibility**.
* **Challenge & Group Feedback Loop**: group streaks and challenge completion unlock **badges and leaderboard recognition**.
* Optional **micro-games/backburner features**: vote-based engagement or mini-competitions.