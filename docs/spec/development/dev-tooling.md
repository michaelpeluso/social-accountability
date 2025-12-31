---
purpose: Development tooling and automation workflow
topics: GitHub Projects, CI/CD, Husky, EAS, testing strategy, single-dev workflow
dependencies: dev-guide.md, architecture.md
---

# Development Tooling & Automation

**Philosophy:** GitHub-native, minimal 3rd parties, maximum automation for single-dev workflow

---

## Core Principle: GitHub-Native + Essential Only

**Why GitHub Projects > Linear:**

- ✅ Zero context switching (same interface as code)
- ✅ Auto-links PRs/commits to issues
- ✅ GitHub Actions can update project boards automatically
- ✅ Free, no 3rd party auth
- ✅ Kanban + roadmap views built-in

---

## Essential Stack (6 tools total)

### 1. Project Management: GitHub Projects

**Setup:**

- Create project board: "Social Accountability"
- Columns: Backlog → M0 → M1 → M2 → M3 → M4 → In Progress → Review → Done
- Automate: PR opened → moves issue to "Review"
- Automate: PR merged → moves to "Done"

**Automated workflow:**

```yaml
# .github/workflows/project-automation.yml
- name: Move issue to "In Progress"
  uses: alex-page/github-project-automation-plus@v0.9.0
  with:
    project: Social Accountability
    column: In Progress
```

---

### 2. CI/CD: GitHub Actions

**File: `.github/workflows/ci.yml`**

```yaml
name: CI
on: [pull_request, push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm test
```

**Automation:**

- Auto-run on every PR
- Block merge if checks fail
- Comment test coverage on PR

---

### 3. Code Quality: Husky + lint-staged

**Installation:**

```bash
npm install -D husky lint-staged
npx husky init
```

**Configuration:**

**`.lintstagedrc.json`:**

```json
{
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md}": ["prettier --write"]
}
```

**`.husky/pre-commit`:**

```bash
#!/bin/sh
npx lint-staged
```

**`.husky/commit-msg`:**

```bash
#!/bin/sh
npx --no -- commitlint --edit $1
```

**Automation:**

- Pre-commit: lint + format changed files
- Pre-push: type-check
- Commit-msg: validate conventional commits

---

### 4. Conventional Commits

**File: `commitlint.config.js`**

```javascript
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [2, "always", ["feat", "fix", "docs", "style", "refactor", "test", "chore"]],
  },
};
```

**Format:**

- `feat: add habit creation form` - New feature
- `fix: streak calculation for weekly habits` - Bug fix
- `docs: update API contracts for M2` - Documentation
- `test: add privacy enforcement tests` - Tests
- `refactor: simplify feed query logic` - Refactoring
- `chore: update dependencies` - Maintenance

---

### 5. Error Tracking: Sentry (M1+)

**When:** Defer to M1 when backend is deployed

**Installation (M1):**

```bash
npm install @sentry/react-native
```

**Configuration:**

```typescript
// app/_layout.tsx
import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  enableAutoSessionTracking: true,
  tracesSampleRate: 0.1, // 10% of transactions
});
```

**Free Tier:** 5,000 errors/month

---

### 6. Secrets Management: GitHub Secrets

**Setup:** Settings → Secrets and variables → Actions

**Required Secrets:**

- `EXPO_TOKEN` (M1)
- `SENTRY_AUTH_TOKEN` (M1)
- `APPLE_KEY_ID` (M1)
- `SUPABASE_URL` (M1)
- `SUPABASE_ANON_KEY` (M1)

**Usage in Actions:**

```yaml
- name: Build with EAS
  env:
    EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
  run: eas build --platform ios --non-interactive
```

---

### 7. Build & Deploy: EAS + Fastlane (M1+)

**EAS Configuration:**

```bash
# M1: Configure EAS
npm install -g eas-cli
eas build:configure
```

**eas.json:**

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "staging": {
      "ios": {
        "buildType": "simulator"
      }
    },
    "production": {
      "ios": {
        "autoIncrement": true
      }
    }
  }
}
```

**Automated Deploy (M1):**

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy Staging
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build iOS
        run: eas build --platform ios --profile staging --non-interactive
```

---

## What We're NOT Using (Pre-Launch)

| Tool             | Why Skip                                        | Revisit When                    |
| ---------------- | ----------------------------------------------- | ------------------------------- |
| Linear           | GitHub Projects sufficient                      | Team grows >3 devs              |
| PostHog          | No users to analyze                             | Post-launch                     |
| Doppler          | GitHub Secrets enough                           | Multi-env complexity            |
| Docusaurus       | GitHub wiki/README fine                         | Public API docs needed          |
| Semantic Release | Manual tags simpler                             | >10 releases/month              |
| Maestro E2E      | Manual testing faster (see testing-strategy.md) | Critical user flows stable (M3) |
| Neon/PlanetScale | Supabase 500MB plenty                           | 500MB DB exceeded               |
| Backblaze B2     | Cloudinary 25GB enough                          | 25GB exceeded                   |

---

## Automated Workflow (Single Dev)

### Daily Development

```bash
1. Pick issue from GitHub Project "M0" column
2. Create branch: git checkout -b feature/issue-123
3. Code → git commit (husky auto-lints)
4. Push → GitHub Actions auto-runs CI
5. PR opened → auto-moves to "Review" column
6. Self-review → merge → auto-moves to "Done"
```

### Release Process (M1+)

```bash
1. Tag: git tag v0.1.0
2. Push tag → GitHub Actions triggers:
   - EAS build production profile
   - Upload to TestFlight (Fastlane)
   - Create GitHub Release with changelog
   - Notify in commit: "Live in TestFlight"
```

---

## Implementation Timeline

### M0 (Foundation) - 4 Tools

1. ✅ **GitHub Projects** - Create board, add M0 issues
2. ✅ **GitHub Actions** - Create `.github/workflows/ci.yml`
3. ✅ **Husky** - Install, configure pre-commit hooks
4. ✅ **Conventional Commits** - Add commitlint config

**Files to Create:**

- `.github/workflows/ci.yml`
- `.husky/pre-commit`
- `.husky/commit-msg`
- `.lintstagedrc.json`
- `commitlint.config.js`

---

### M1 (Account & Privacy) - +2 Tools

5. ✅ **EAS Build** - `eas build:configure`
6. ✅ **Sentry** - Add SDK, capture unhandled errors

**Files to Create:**

- `eas.json`
- `.github/workflows/deploy-staging.yml`
- Update `app/_layout.tsx` with Sentry init

---

### M2+ (Optional)

7. **Fastlane** - Automate TestFlight uploads (if releasing frequently)

**File:** `fastlane/Fastfile`

---

## Cost Summary (Pre-Launch)

| Tool            | M0     | M1       | M2       | M3       | M4       |
| --------------- | ------ | -------- | -------- | -------- | -------- |
| GitHub Projects | $0     | $0       | $0       | $0       | $0       |
| GitHub Actions  | $0\*   | $0\*     | $0\*     | $0\*     | $0\*     |
| Husky           | $0     | $0       | $0       | $0       | $0       |
| EAS Build       | -      | $0\*\*   | $0\*\*   | $0\*\*   | $0\*\*   |
| Sentry          | -      | $0\*\*\* | $0\*\*\* | $0\*\*\* | $0\*\*\* |
| Supabase        | -      | $0       | $0       | $0       | $0       |
| Cloudinary      | -      | -        | -        | $0       | $0       |
| **Total**       | **$0** | **$0**   | **$0**   | **$0**   | **$0**   |

\*GitHub Actions: 2,000 min/month free (plenty for single dev)
**EAS Build: 30 builds/month free \***Sentry: 5,000 errors/month free

---

## Automation ROI

**Without automation:**

- 5 min per commit (manual lint)
- 10 min per PR (manual checks)
- 30 min per release (manual build/upload)

**With automation:**

- 0 min (husky auto-lints)
- 0 min (GitHub Actions auto-checks)
- 5 min (EAS auto-builds, Fastlane auto-uploads)

**Savings:** ~40 min/week × 16 weeks (M0-M4) = **10+ hours saved**

---

## Testing Strategy

### Simple 3-Level Approach

**Level 1: Unit Tests** (Always Run)

- Test individual functions (streak calculations, privacy logic)
- Run on every commit (pre-commit hook + CI)
- Speed: <5 seconds
- Tools: Jest + React Native Testing Library

```bash
npm test                 # Run all unit tests
npm test -- --watch      # Watch mode for development
npm test -- --coverage   # Coverage report
```

**Level 2: Integration Tests** (Run on PR)

- Test modules working together (API + SQLite, sync queue)
- Run in GitHub Actions on PR only
- Speed: <30 seconds
- Example: Create habit locally → sync to cloud → verify both

**Level 3: E2E Tests** (Manual, Pre-Release Only)

- Full user flows in iPhone simulator (M3+)
- Run manually before releases
- Speed: 2-5 minutes
- Tools: Maestro (YAML-based, simple)

### What to Test

✅ **Test:**

- Business logic (streaks, pillar scores, privacy filters)
- Critical paths (auth, habit creation, check-ins)
- Edge cases (missed days, offline mode)

❌ **Don't Test:**

- Third-party libraries (Expo Router, SQLite)
- UI styling (colors, spacing)
- Type definitions

### CI Configuration

```yaml
# .github/workflows/ci.yml includes:
- run: npm run type-check
- run: npm run lint
- run: npm test # Unit tests
- run: npm run test:integration # Only on PR
```

### Coverage Target

- **80% overall** for src/ directory
- Focus on src/lib/, src/logic/, src/services/
- Track with Codecov (free, auto-comments on PRs)

---

## Reference

- [dev-guide.md](dev-guide.md) - Development workflow
- [testing-strategy.md](testing-strategy.md) - Testing approach
- [architecture.md](architecture.md) - Technical patterns
- GitHub Actions docs: https://docs.github.com/en/actions
- EAS Build docs: https://docs.expo.dev/build/introduction/
- Conventional Commits: https://www.conventionalcommits.org/
