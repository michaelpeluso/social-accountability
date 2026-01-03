# Development Workflow Guide

## Quick Reference Table

| Step | What                 | Command                        | Expected Result                 | Troubleshooting                         |
| ---- | -------------------- | ------------------------------ | ------------------------------- | --------------------------------------- |
| 1    | **Start Dev Server** | `npm run dev`                  | QR code + local URL displayed   | Port busy? `npm run kill-port`          |
| 2    | **Connect iPhone**   | Open Expo Go → Scan QR         | "Downloading..." then app loads | Same WiFi? Check 192.168.1.108:8081     |
| 3    | **View App**         | Wait for bundle                | "Social Accountability" screen  | Errors? Check terminal output           |
| 4    | **Test Debugger**    | Press `j` in terminal          | Chrome DevTools opens           | App must be connected first             |
| 5    | **Reload App**       | Press `r` in terminal          | App reloads on iPhone           | Fast refresh for code changes           |
| 6    | **Run Tests**        | `npm test` (separate terminal) | 17 tests pass                   | TypeScript errors? `npm run type-check` |
| 7    | **Stop Server**      | Press `Ctrl+C`                 | Server shuts down               | Still running? `npm run kill-port`      |

---

## 🚀 Daily Development Workflow

### Morning Setup (2 minutes)

```bash
# 1. Navigate to project
cd "c:/Users/HP/OneDrive/Desktop/_/Code/Social Accountability"

# 2. Pull latest changes (if using git)
git pull

# 3. Start dev server with pre-flight checks
npm run dev
```

**What happens:**

- ✅ Kills any process on port 8081
- ✅ Runs TypeScript check
- ✅ Runs linter
- ✅ Starts Expo dev server
- 📱 Shows QR code for iPhone connection

### Connecting Your iPhone (first time)

1. **Install Expo Go** from App Store (one-time)
2. **Join same WiFi** as your Windows laptop
3. **Scan QR code** shown in terminal
4. **Wait 10-30 seconds** for bundle to download
5. **See "Social Accountability"** on your iPhone screen ✅

### Making Code Changes

```bash
# File watching is automatic - just edit and save!
# Fast refresh happens automatically
# To force reload: press 'r' in terminal
```

**Auto-reload files:**

- `app/*.tsx` - Navigation/screens
- `components/*.tsx` - UI components
- `services/*.ts` - Business logic
- `src/types/*.ts` - Type definitions

**Requires manual reload (press `r`):**

- `app.json` - Expo config
- `.env` - Environment variables
- New dependencies added

---

## 🧪 Testing Workflows

### Quick Check (before committing)

```bash
npm run check
```

Runs: TypeScript → Tests → Linter → Format check

### Watch Mode (during development)

```bash
npm test:watch
```

Re-runs tests on file changes.

### Production Readiness Test

```bash
npm run prod-test
```

Full quality gates + production build test.

---

## 🛠️ Common Commands

| Task                 | Command              | When to Use                 |
| -------------------- | -------------------- | --------------------------- |
| **Start dev server** | `npm run dev`        | Every morning, after breaks |
| **Interactive menu** | `npm run workflow`   | When unsure what to do next |
| **Diagnostics**      | `npm run doctor`     | Troubleshooting issues      |
| **Kill port 8081**   | `npm run kill-port`  | "Port already in use" error |
| **Clean reinstall**  | `npm run clean`      | Weird dependency issues     |
| **Fix dependencies** | `npm run fix`        | After updating packages     |
| **Type check only**  | `npm run type-check` | TypeScript errors           |
| **Lint only**        | `npm run lint`       | Code style issues           |
| **Format code**      | `npm run format`     | Before committing           |
| **Run tests**        | `npm test`           | After code changes          |
| **Production build** | `npm run prod-test`  | Before releasing            |

---

## 🔍 Terminal Keyboard Shortcuts (while dev server running)

| Key      | Action        | Purpose                                        |
| -------- | ------------- | ---------------------------------------------- |
| `r`      | Reload app    | Force refresh without restarting server        |
| `m`      | Toggle menu   | Show/hide developer menu on device             |
| `j`      | Open debugger | Launch Chrome DevTools (app must be connected) |
| `c`      | Clear cache   | Fix bundler cache issues                       |
| `?`      | Show help     | List all shortcuts                             |
| `Ctrl+C` | Stop server   | Shut down dev server                           |

---

## 📱 Understanding "No Compatible Apps Connected"

**This is NORMAL** when you first start the server! It means:

- ✅ Server is running correctly
- ⏳ Waiting for you to scan QR code with Expo Go
- 📱 No device has connected yet

**Steps to connect:**

1. Open **Expo Go** on iPhone
2. Tap **"Scan QR Code"**
3. Point camera at QR in terminal
4. Wait for "Downloading JavaScript bundle..."
5. App loads → "Social Accountability" screen

**After first scan:** Your iPhone stays connected until you:

- Close Expo Go app
- Disconnect from WiFi
- Stop the dev server

---

## 🚨 Troubleshooting Guide

### Server won't start

```bash
# Port 8081 is busy
npm run kill-port

# Then restart
npm run dev
```

### iPhone can't connect

```bash
# Check if both devices on same WiFi
# Windows: ipconfig | findstr IPv4
# Should see 192.168.1.108

# Test server is reachable
curl http://192.168.1.108:8081
```

### TypeScript errors

```bash
npm run type-check
# Fix errors in files listed
```

### Dependency issues

```bash
# Try fixing first
npm run fix

# If still broken, nuclear option
npm run clean
```

### App crashes on load

```bash
# Check terminal output - errors show here
# Look for red error messages
# Common: missing .env file
```

### Run full diagnostics

```bash
npm run doctor
```

Checks: Node version, npm, network, port, dependencies, .env, TypeScript

---

## 🎯 Production Testing Workflow

Before deploying or creating a release:

```bash
# 1. Run full quality checks + production build
npm run prod-test

# Expected output:
# ✅ TypeScript check passed
# ✅ Linter passed
# ✅ Tests passed (17 tests)
# ✅ Format check passed
# ✅ Production build succeeded
```

This simulates a production build without deploying.

---

## 📋 First-Time Setup (for new developers)

```bash
# 1. Clone repository
git clone <repo-url>
cd "Social Accountability"

# 2. Run setup script
npm run setup

# What it does:
# - Installs dependencies
# - Creates .env from template
# - Runs TypeScript check
# - Runs tests
# - Makes scripts executable
# - Provides next steps

# 3. Start developing
npm run dev
```

---

## 🔄 Git Workflow Integration

```bash
# Before committing
npm run check          # Quality checks
git add .
git commit -m "feat: ..."

# Before pushing
npm run prod-test      # Production readiness

# After pulling
npm install            # Update dependencies
npm run dev            # Start server
```

---

## 💡 Pro Tips

1. **Keep terminal visible** - Errors show in real-time
2. **Use `npm run workflow`** - Interactive menu when stuck
3. **Press `r` to reload** - Faster than restarting server
4. **Run `npm run doctor`** - First step when debugging
5. **Same WiFi is critical** - iPhone must be on laptop's network
6. **QR code changes** - If IP changes, rescan QR code
7. **Fast refresh is magic** - Most code changes auto-reload
8. **Press `j` for debugging** - But only after app connects

---

## 📚 Related Documentation

- [Full Workflow Details](docs/WORKFLOW.md) - Complete development guide
- [Architecture](docs/architecture.md) - Technical design decisions
- [Data Model](docs/data-model.md) - Database schema
- [API Contracts](docs/api-contracts.md) - Backend API specs
- [Milestone M0](docs/milestones/M0-foundation.md) - Current phase
- [Scripts README](scripts/README.md) - Automation script details

---

## ❓ Still Stuck?

Run the interactive workflow helper:

```bash
npm run workflow
```

Or check system status:

```bash
npm run doctor
```

Both provide guided next steps based on your current state.
