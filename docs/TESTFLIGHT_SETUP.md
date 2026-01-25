# TestFlight Deployment Setup

Automated iOS builds without a Mac.

---

## How It Works

```
GitHub Actions → EAS Cloud (Expo's Macs) → TestFlight
```

You click "Run workflow" → EAS builds on their servers → App appears in TestFlight.

---

## One-Time Setup

### 1. GitHub Secrets

Go to **GitHub → Repo → Settings → Secrets → Actions** and add:

| Secret                     | Where to get it                                        |
| -------------------------- | ------------------------------------------------------ |
| `EXPO_TOKEN`               | [expo.dev](https://expo.dev) → Account → Access Tokens |
| `APPSTORE_ISSUER_ID`       | App Store Connect → Users & Access → Keys (UUID)       |
| `APPSTORE_API_KEY_ID`      | Same page (10-char Key ID)                             |
| `APPSTORE_API_PRIVATE_KEY` | .p8 file contents (including BEGIN/END lines)          |

### 2. EAS Environment Variables

```bash
eas env:create --name EXPO_APPLE_ID --value "your@email.com" --type string
eas env:create --name EXPO_ASC_APP_ID --value "1234567890" --type string
eas env:create --name EXPO_APPLE_TEAM_ID --value "ABCD1234" --type string
```

Find your ASC App ID in App Store Connect URL: `apps.apple.com/app/id1234567890`

---

## Deploy

1. **GitHub → Actions → 🚀 Deploy to TestFlight**
2. Click **Run workflow**
3. Optionally add release notes
4. Wait ~20 min
5. App appears in TestFlight

---

## Profiles

| Profile       | Bundle ID                     | Use                    |
| ------------- | ----------------------------- | ---------------------- |
| `development` | com.social.accountability.dev | Local dev (Expo Go)    |
| `production`  | com.social.accountability     | TestFlight & App Store |

---

## Cost

- **EAS**: 15 free iOS builds/month, then $2/build
- **GitHub Actions**: ~5 min per deploy (Ubuntu, cheap)

---

## Troubleshooting

```bash
# Check EAS login
eas whoami

# View credentials
eas credentials --platform ios

# List builds
eas build:list --platform ios

# Test locally
eas build --platform ios --profile production
```
