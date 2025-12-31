# permissions & data sources (v1 rules)

## principle
- collect minimum data necessary
- explicit consent per source
- allow opt-out + delete

## v1 allowed sources
- manual check-ins
- in-app timers (focus sessions)
- optional: apple healthkit metrics (steps count only, explicit consent required)

## v1 not allowed / risky (post-approval only)
- text message content/metadata
- full app usage logs beyond screen time APIs
- background location always-on for habit completion (requires strict justification)
- social app scraping (instagram/snapchat/etc)

## consent requirements
- show purpose + data fields + retention
- separate toggles per source
- revoke consent => stop collection + handle deletion policy

## retention
- default: keep all user data until user deletes account or individual items
- media: 90 days after account deletion, then purged
- audit logs: 30 days, contain only userId + action + timestamp (no PII)
- deleted accounts: anonymize all data (replace userId with random UUID, clear names/emails)
