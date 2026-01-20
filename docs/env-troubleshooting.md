# Environment Variables Troubleshooting

## Common Issues & Solutions

### Error: "Missing required environment variable: APPLE_CLIENT_ID"

**Cause:** Server-side secrets (APPLE_CLIENT_ID, JWT_SECRET) are not accessible in React Native context.

**Solution:** These variables are now **optional** in client code and only required when actually needed (when ENABLE_APPLE_AUTH=true).

**Files Updated:**

- `src/config/env.ts` - Changed `getRequiredEnv()` to `getOptionalEnv()` for server-side secrets
- `.env.local` - Added default values for development

### Why .env.example is NOT loaded

Metro bundler only loads:

1. `.env.local` - Committed file with non-sensitive defaults
2. `.env` - Gitignored file with your actual secrets

**`.env.example` is just a template** - it's never loaded by the app!

To use:

```bash
cp .env.example .env
# Then edit .env with your actual secrets
```

### Server-Side vs Client-Side Variables

**Client-Side (bundled in app):**

- Must use `EXPO_PUBLIC_` prefix
- Accessible via `Constants.expoConfig.extra`
- Examples: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SUPABASE_URL`

**Server-Side (backend only):**

- No `EXPO_PUBLIC_` prefix
- NOT bundled in client app
- Only used in Node.js context (app.config.js, backend API)
- Examples: `JWT_SECRET`, `APPLE_AUTH_PRIVATE_KEY_PATH`

### Variable Priority Order

1. **Constants.expoConfig.extra** (from app.config.js)
   - Works in React Native + EAS builds
   - Primary source for client code

2. **process.env** (Metro bundler injected)
   - Only works in Node.js context
   - Used in app.config.js at build time

3. **Default values** (fallbacks in env.ts)

### File Structure

```
.env.local          ✅ Committed - non-sensitive defaults
.env                ❌ Gitignored - your actual secrets
.env.example        📄 Template only - never loaded
```

### TypeScript Version

Expo requires specific TypeScript versions for compatibility:

```json
{
  "devDependencies": {
    "typescript": "~5.9.2" // Match Expo's recommended version
  }
}
```

Check recommended version: `npx expo install --check`

### Testing

Jest tests mock environment variables in `config/jest.setup.js`:

```javascript
process.env.APPLE_CLIENT_ID = "com.test.app";
process.env.JWT_SECRET = "test-jwt-secret-for-testing";
```

### Metro Bundler Cache

If you see stale values or errors after fixing .env:

```bash
npm start -- --clear    # Clear cache and restart
# or
npx expo start --clear
```

### Quick Checklist

When you see environment variable errors:

- [ ] Is the variable in `.env.local` (for defaults)?
- [ ] Is the variable in `.env` (for secrets)?
- [ ] Does it need `EXPO_PUBLIC_` prefix (client-side)?
- [ ] Is `app.config.js` exposing it via `extra`?
- [ ] Did you restart Metro after changing .env files?
- [ ] Is TypeScript version matching Expo's recommendation?

### Development vs Production

**Local Development:**

```bash
# .env.local (committed)
ENABLE_APPLE_AUTH=false
APPLE_CLIENT_ID=com.social.accountability.dev
JWT_SECRET=dev-jwt-secret-replace-in-production

# .env (gitignored) - optional overrides
# (empty for now, add real secrets when testing Apple auth)
```

**EAS Production:**

```bash
# Set via EAS Secrets
eas secret:create --scope project --name JWT_SECRET --value "$(openssl rand -base64 32)"
eas secret:create --scope project --name APPLE_CLIENT_ID --value "com.social.accountability"
```

### References

- [Expo Environment Variables Guide](https://docs.expo.dev/guides/environment-variables/)
- [docs/env-vars-expo.md](./env-vars-expo.md) - Complete Expo env vars guide
