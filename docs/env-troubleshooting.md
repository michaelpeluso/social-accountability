# Environment Variables Guide

## Cloud-Only Configuration

This project uses **EAS environment variables only** - no `.env` files.

All configuration lives in:

- **EAS Env Vars** (for builds) - managed via `eas env:*` commands
- **GitHub Secrets** (for CI/CD) - managed in repo settings

This approach:

- ✅ Prevents secrets from being exposed to AI tools
- ✅ Keeps all config in one place (EAS dashboard)
- ✅ Simplifies deployment

---

## Managing EAS Environment Variables

### View Current Variables

```bash
npx eas-cli env:list
```

### Add/Update Variables

```bash
# String type (most common)
npx eas-cli env:create --name VARIABLE_NAME --value "value" --type string

# For sensitive values
npx eas-cli env:create --name SECRET_NAME --value "secret" --type secret

# Update existing
npx eas-cli env:update --name VARIABLE_NAME --value "new-value"
```

### Required Variables

| Variable                        | Type   | Purpose                  |
| ------------------------------- | ------ | ------------------------ |
| `EXPO_PUBLIC_API_URL`           | string | API base URL             |
| `EXPO_PUBLIC_SUPABASE_URL`      | string | Supabase project URL     |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | string | Supabase public key      |
| `JWT_SECRET`                    | secret | Token signing (server)   |
| `EXPO_APPLE_ID`                 | string | Apple ID email           |
| `EXPO_APPLE_TEAM_ID`            | string | Apple Team ID            |
| `EXPO_ASC_APP_ID`               | string | App Store Connect app ID |

---

## GitHub Secrets (for CI/CD)

Set in: **Repo Settings → Secrets and variables → Actions**

| Secret                     | Purpose                                  |
| -------------------------- | ---------------------------------------- |
| `EXPO_TOKEN`               | EAS authentication                       |
| `APPSTORE_ISSUER_ID`       | App Store Connect API                    |
| `APPSTORE_API_KEY_ID`      | App Store Connect API                    |
| `APPSTORE_API_PRIVATE_KEY` | App Store Connect API (full .p8 content) |

---

## Troubleshooting

### "Missing required environment variable: X"

1. Check if variable exists:

   ```bash
   npx eas-cli env:list
   ```

2. Add if missing:

   ```bash
   npx eas-cli env:create --name X --value "value" --type string
   ```

3. Rebuild the app (EAS vars are injected at build time)

### Variables Not Updating

EAS environment variables are injected **at build time**, not runtime.

After changing a variable:

```bash
# Rebuild to pick up changes
npx eas-cli build --profile production --platform ios
```

### Local Development

For local development with `npm start`:

- Variables come from `app.config.js` defaults
- Production values only available in EAS builds

### Testing

Jest tests mock env vars in `config/jest.setup.js`:

```javascript
jest.mock("expo-constants", () => ({
  expoConfig: {
    extra: {
      appVariant: "development",
      apiUrl: "https://test.example.com/api",
      supabaseUrl: "https://test.supabase.co",
      supabaseAnonKey: "test-anon-key",
    },
  },
}));
```

---

## References

- [EAS Environment Variables](https://docs.expo.dev/build/environment-variables/)
- [docs/TESTFLIGHT_SETUP.md](./TESTFLIGHT_SETUP.md) - CI/CD setup
