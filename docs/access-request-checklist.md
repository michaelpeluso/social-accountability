# Access Request Checklist — Apple & Dev Services

Purpose: concise checklist you can send to your org to get the minimal Apple and backend credentials needed for development and E2E testing.

## Apple Developer (solo-developer guidance)

- If you're solo, you will typically enroll in the Apple Developer Program (annual $99) to get full access to App IDs, entitlements, provisioning and signing.
- Enrollment / minimal artifacts you'll create or obtain:
  - Team ID and your Apple Developer account (you'll see these after enrolling)
  - App ID / Bundle ID for your app (e.g., com.yourname.app)
  - Enable capabilities on the App ID: Sign in with Apple, HealthKit (enable HealthKit only when you reach M4)
  - Create a Service ID (Client ID) for "Sign in with Apple"
  - Create an App Store Connect API Key (download .p8). Record Key ID and Issuer ID.
  - Create a Development provisioning profile (includes the App ID). Add your device UDIDs for physical testing.

Notes:

- You do not strictly need to enroll immediately — you can develop M0–M3 with mocks and set `ENABLE_APPLE_AUTH=false` and `ENABLE_HEALTHKIT=false`.
- If you prefer not to buy a Mac, you can still sign builds using EAS/GitHub Actions mac runners, but you must still own or have an App Store Connect API key to sign builds.

## Build & signing options (solo)

- Local Mac + Xcode: enroll and sign in with your Apple ID to create certificates and provisioning profiles.
- Cloud builds (no Mac): use EAS or CI mac runners. Configure signing using an App Store Connect API key (.p8) in `eas.json` or CI secrets.

Tip: keep a single App Store Connect API key for CI signing, and keep the .p8 in a secure secret store (GitHub secrets, AWS Secrets Manager, etc.).

## EAS / CI mac builders (if no Mac locally)

- For EAS or other CI mac builders, configure an App Store Connect API key (Key ID + Issuer ID + private .p8) in CI secrets so builds can be signed.
- You will still need to enroll in Apple Developer Program to create the key and enable entitlements.

## Device testing

- HealthKit and ScreenTime are best tested on a physical iPhone. Add your device UDID to the development provisioning profile to run on-device.
- Simulators can be used for many flows, but HealthKit/ScreenTime are limited or behave differently in simulator.

## Backend / Cloud (dev/staging)

- `API_URL` (local or hosted) to point your app at during development (example: http://localhost:3000 or https://dev-api.example.org)
- Create at least one test user or a way to mint short-lived dev JWTs for API testing.
- If using Supabase, create a dev project and an anon/client key for client usage (do NOT embed service_role keys in the app).
- For media uploads, create a supabase test account and store credentials in CI/secret manager.

## Environment variables (what I will place in `.env.local`)

- `API_URL` — dev API base
- `APPLE_CLIENT_ID` — Service ID (or placeholder until Apple creds are provided)
- `JWT_SECRET` — (for local mock backend only; preferably backend issues tokens instead)
- `ENABLE_APPLE_AUTH` — true/false
- `ENABLE_HEALTHKIT` — true/false

## Security notes

- Prefer creating short-lived dev JWTs or test accounts rather than sharing long-lived secrets.
- Never share production `service_role` or private keys in chat/email; use secure secret stores (GitHub Actions secrets, Vault, etc.)

## Minimal package for M1 (solo)

1. Local or hosted `API_URL` + one test user / short-lived JWT
2. Supabase dev project URL + client key (if using Supabase)
3. (Optional) Create a Service ID + App Store Connect API Key (.p8) if you want to test real Sign in with Apple early — otherwise keep `ENABLE_APPLE_AUTH=false` and use mocked auth.

## Minimal package for M4 (solo)

1. Enroll in Apple Developer Program (or use an existing Apple Developer account)
2. Create App ID with HealthKit entitlement enabled
3. Create development provisioning profile and add your device UDID(s)
4. Create App Store Connect API key (.p8) if you plan to use EAS/CI for signing

---

## Quick start timeline (solo developer)

### Start now (M0 — no costs, no enrollment)

- Create `.env.local` with placeholders (see env vars above)
- Use mocked auth in `services/auth.ts`
- Set `ENABLE_APPLE_AUTH=false` and `ENABLE_HEALTHKIT=false`
- Run app with `npm start` in Expo Go

### Before M1 ends (backend integration)

- Set up local backend or hosted dev API (`API_URL`)
- Create Supabase free account (optional, for cloud sync)
- Set up test user/JWT pattern

### Before M4 starts (Apple enrollment required)

- Enroll in Apple Developer Program ($99/year) — only when you need HealthKit/real Sign in
- Create App ID with Sign in with Apple + HealthKit capabilities
- Create Service ID for Sign in with Apple
- Download App Store Connect API key (.p8) for signing
- Create development provisioning profile
- Add your iPhone UDID to provisioning profile

### Optional (can delay indefinitely)

- supabase account (only needed if testing media uploads in M3)
- Production keys (only needed before public release)
