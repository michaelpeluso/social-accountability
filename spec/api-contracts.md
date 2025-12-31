# api contract (v1)

## auth
- bearer token required unless stated otherwise

## responses
- success: { "data": ... }
- error: { "error": { "code": string, "message": string } }

## endpoints

### GET /me
- auth: required
- returns current user profile + default privacy settings

### POST /goals
- auth: required
- body:
  - title (string)
  - pillar (MIND|BODY|HEART|SOUL)
  - privacy (SELF|CIRCLE|PUBLIC)
- returns Goal

### GET /goals
- auth: required
- query:
  - scope=mine|circle|public (default mine)
- returns Goal[]

### POST /habits
- auth: required
- body:
  - title
  - goalId?
  - parentHabitId?
  - schedule: TODO
  - privacy
- returns Habit

### POST /habits/{habitId}/checkins
- auth: required
- body:
  - occurredAt (iso timestamp)
  - source (MANUAL|INTEGRATION) default MANUAL
  - evidenceRef?
- returns HabitCheckIn

### POST /posts
- auth: required
- body:
  - pillar
  - privacy
  - bodyText?
  - mediaUrl?
  - circleId?
- returns Post

### POST /posts/{postId}/reactions
- auth: required
- body:
  - emoji
- returns Reaction

### POST /nudges
- auth: required
- body:
  - toUserId
  - templateId
- rate limits: 3 nudges/day per fromUserId+toUserId pair, 10/day per fromUserId total

### GET /feed
- auth: required
- query:
  - scope=mine|circle|public (default circle)
  - limit (default 20, max 100)
  - cursor (pagination token)
- returns { data: Post[], nextCursor?: string }
