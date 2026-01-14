---
title: "M7 - Circles: Group Feeds & Chat"
milestone: M7
status: planned
---

# Circles (Group Feeds & Chat)

Goal: Add first-class "Circle" groups where users can create a circle, invite members, and have a private group feed plus a direct-message-style group chat scoped to that circle.

User stories:

- As a user, I can create a Circle, invite people, and set privacy (private / invite-only / public).
- As a Circle owner I can add/remove members and assign roles (`OWNER`, `MEMBER`).
- As a Circle member I can post to the Circle Feed (posts scoped to the circle) and see only circle members' posts.
- As a Circle member I can send and read group chat messages inside the Circle (persisted conversation between members).
- As a Circle member I receive notifications for circle activity (new post, reaction, mention, new message).

Acceptance criteria:

- A `Circle` entity exists with `id`, `ownerUserId`, `name`, `privacy`, `createdAt`.
- A `CircleMember` join table with `role` and `createdAt` exists; owner can manage members.
- Circle Feed: posts can be created scoped to a `circleId` and are visible to members only according to circle privacy.
- Circle Chat: a message model exists (`CircleMessage`) with `id`, `circleId`, `fromUserId`, `body`, `mediaUrl?`, `createdAt` and supports pagination.
- Notifications: events for `CIRCLE_POST`, `CIRCLE_MESSAGE`, `CIRCLE_INVITE` available and opt-in per user.
- Basic moderation: owners can remove posts/messages and remove members; audit log stored.

Technical notes / data-model references:

- Add models (or reference existing types): `Circle`, `CircleMember`, `CircleMessage`, `CircleInvite`.
- Feed and chat stored locally (SQLite) and synced to the cloud replica (Postgres) via existing sync queue.
- Privacy: server must validate circle membership before returning feed or messages.
- Roles: `OWNER` (full admin), `MEMBER` (regular). Consider adding `MODERATOR` in later milestone.

Migration / implementation hints:

- Migration to add `circles` and `circle_members` tables; add `circle_messages` table for chat messages.
- Extend `Post` schema to allow `circleId` (already exists in some schemas) and enforce feed visibility.
- Add client UI: Circle creation flow, member management screen, Circle Feed screen, Circle Chat screen.

Future enhancements (M8+):

- Read receipts and typing indicators in circle chat.
- Threaded replies, message reactions, cross-circle mentions.
- Integrations: calendar/scheduling for circle events, polls, shared goals.

Security & privacy:

- Circle coordinates or location info must respect user privacy; server checks membership for all circle-scoped data.

Acceptance test ideas:

- Create circle, invite second user, verify invited user sees circle and can post/chat.
- Verify non-member cannot read circle feed or chat.
- Verify owner can remove member and remove posts/messages.
