# ============================================================================

# MAC VISIT CHECKLIST - Minimize Time Needed

# ============================================================================

#

# EAS builds iOS apps in the CLOUD, so you rarely need a Mac!

# You only need Mac access for these specific tasks:

#

# ============================================================================

## ⏱️ ESTIMATED MAC TIME: 30-60 minutes (one-time setup)

---

## 🎯 WHEN DO YOU NEED A MAC?

### ✅ You DON'T need a Mac for:

- Regular development (use Windows + Expo Go)
- Building iOS apps (EAS Cloud builds)
- Testing on iOS Simulator via EAS (cloud-based)
- Submitting to App Store (EAS Submit)
- Managing certificates (EAS handles this)

### ❌ You DO need a Mac for:

- **First-time Apple Developer enrollment** (can use web, but verification easier on Mac)
- **Creating Apple Developer certificates** (one-time, EAS can auto-generate)
- **Testing on physical device via USB** (Xcode required)
- **Debugging native iOS issues** (rare, Xcode required)

---

## 📋 BEFORE MAC VISIT (Do on Windows)

Run these on YOUR Windows machine before going to your friend's Mac:

```bash
# 1. Ensure you're logged into EAS
npx eas-cli whoami

# 2. Set up EAS secrets (so builds have your credentials)
./scripts/eas-setup-secrets.sh

# 3. Verify eas.json is valid
npx eas-cli build:configure

# 4. Push all code to GitHub
git add -A && git commit -m "Prepare for Mac setup" && git push
```

---

## 📋 ON THE MAC (Friend's Machine)

### Step 1: Clone & Setup (5 min)

```bash
# Clone your repo
git clone https://github.com/YOUR_USERNAME/social-accountability.git
cd social-accountability

# Install dependencies
npm install

# Login to EAS (use your Expo account)
npx eas-cli login
```

### Step 2: Apple Developer Setup (15-30 min, ONE-TIME)

If you haven't enrolled in Apple Developer Program yet:

1. Go to https://developer.apple.com/programs/enroll/
2. Sign in with your Apple ID
3. Pay $99/year fee
4. Wait for approval (can be instant or take 48h)

**Already enrolled?** Skip to Step 3.

### Step 3: Configure iOS Credentials (10 min, ONE-TIME)

EAS can auto-generate certificates, but you need to authorize it:

```bash
# Let EAS manage your iOS credentials (RECOMMENDED)
npx eas-cli credentials

# Select: iOS
# Select: Build Credentials
# Select: Set up automatically (Let EAS handle it)
```

This creates:

- Distribution Certificate
- Provisioning Profile
- Push Notification Key (if needed)

**EAS stores these securely - you won't need to do this again!**

### Step 4: Test Build (5 min)

```bash
# Trigger a development build
npx eas-cli build --profile development --platform ios

# This runs in the CLOUD - you can leave after starting it!
```

### Step 5: (Optional) Test on Physical Device (15 min)

If you want to test on a real iPhone while at your friend's place:

```bash
# Install the development build
npx eas-cli build:run --platform ios

# Or download the .ipa from expo.dev and install via Xcode
```

---

## 📋 AFTER MAC VISIT (Back on Windows)

You're now fully set up! All future builds can be done from Windows:

```bash
# Build for development (internal testing)
./scripts/eas-build.sh development ios

# Build for preview (beta testers)
./scripts/eas-build.sh preview ios

# Build for production (App Store)
./scripts/eas-build.sh production ios

# Check build status
npx eas-cli build:list
```

---

## 🔑 CREDENTIALS MANAGEMENT

EAS stores your Apple credentials securely. To view/manage:

```bash
# List all credentials
npx eas-cli credentials

# Download credentials (backup)
npx eas-cli credentials --platform ios
# Select: Download credentials to local machine
```

---

## 📱 INSTALLING BUILDS

### Development/Preview builds:

1. Go to https://expo.dev/accounts/pelsos-org/projects/social-accountability/builds
2. Find your build
3. Scan QR code with iPhone camera
4. Tap "Install" when prompted

### Production builds:

Submit to TestFlight or App Store via:

```bash
npx eas-cli submit --platform ios --profile production
```

---

## 🆘 TROUBLESHOOTING

### "Apple Developer account not found"

- Make sure you're enrolled at developer.apple.com
- Check that your Apple ID matches the one in EAS

### "Provisioning profile invalid"

```bash
# Clear and regenerate
npx eas-cli credentials --platform ios
# Select: Remove credentials
# Then: Set up automatically
```

### "Build failed"

- Check build logs at expo.dev
- Most issues are code/config problems, not Mac-related

---

## 📅 FUTURE MAC VISITS

After initial setup, you should RARELY need a Mac:

| Task                            | Mac Needed?                            |
| ------------------------------- | -------------------------------------- |
| Regular development             | ❌ No (Windows + Expo Go)              |
| Build iOS app                   | ❌ No (EAS Cloud)                      |
| Submit to App Store             | ❌ No (EAS Submit)                     |
| Update certificates             | ❌ No (EAS auto-renews)                |
| Test on simulator               | ❌ No (EAS can run simulator in cloud) |
| Debug native crash              | ✅ Yes (need Xcode)                    |
| Test on physical device via USB | ✅ Yes (need Xcode)                    |

**Bottom line:** After one 30-60 minute setup session, you may never need a Mac again! 🎉
