# Environment Variables in Expo

## How It Works

Expo has **built-in support** for `.env` files via Metro bundler. You do **NOT** need the `dotenv` package.

### The `dotenv` Problem

❌ **NEVER install or use `dotenv` in React Native/Expo projects**

```typescript
// ❌ WRONG - This breaks React Native
import "dotenv/config";
```

**Why it fails:**

- `dotenv` is a Node.js package that requires `fs`, `os`, `path`, `crypto` modules
- React Native doesn't include Node.js standard library
- Metro bundler error: "attempted to import the Node standard library module 'os'"

## Correct Approach

### 1. Local Development (.env files)

Expo Metro bundler automatically loads variables prefixed with `EXPO_PUBLIC_`:

**.env.local** (committed, non-sensitive defaults):

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**.env** (gitignored, local overrides):

```bash
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-real-key
JWT_SECRET=your-secret
```

### 2. EAS Builds

For cloud builds, use two methods:

**eas.json** (non-sensitive):

```json
{
  "build": {
    "development": {
      "env": {
        "EXPO_PUBLIC_API_URL": "http://localhost:3000"
      }
    }
  }
}
```

**EAS Secrets** (sensitive):

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-key" --type string
```

### 3. Accessing Variables in Code

**app.config.js** (Node.js context - runs at build time):

```javascript
export default ({ config }) => ({
  ...config,
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
});
```

**src/config/env.ts** (React Native context - runs in app):

```typescript
import Constants from "expo-constants";

const expoExtra = Constants.expoConfig?.extra ?? {};

function getEnv(key: string, defaultValue: string = ""): string {
  // First try Constants (works everywhere)
  const extraKey = key
    .replace("EXPO_PUBLIC_", "")
    .toLowerCase()
    .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

  if (expoExtra[extraKey]) {
    return expoExtra[extraKey] as string;
  }

  // Fallback to process.env (Metro injected, works in local dev)
  if (typeof process !== "undefined" && process.env?.[key]) {
    return process.env[key];
  }

  return defaultValue;
}

export const config = {
  apiUrl: getEnv("EXPO_PUBLIC_API_URL", "http://localhost:3000"),
  supabaseUrl: getEnv("EXPO_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: getEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY"),
};
```

## Key Rules

1. ✅ Use `EXPO_PUBLIC_` prefix for client-accessible variables
2. ✅ Use `Constants.expoConfig.extra` to access values
3. ✅ Metro bundler handles `.env` files automatically
4. ❌ Never import or require `dotenv`
5. ❌ Never use Node.js modules (`fs`, `os`, `path`, `crypto`)
6. ❌ Non-`EXPO_PUBLIC_` vars are NOT bundled (server-side only)

## Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ Local Development                                       │
├─────────────────────────────────────────────────────────┤
│ .env.local (defaults)                                   │
│ .env (overrides)                                        │
│    ↓                                                     │
│ Metro Bundler reads EXPO_PUBLIC_* vars                  │
│    ↓                                                     │
│ app.config.js (Node.js) reads process.env              │
│    ↓                                                     │
│ Exposes via config.extra.*                             │
│    ↓                                                     │
│ App code reads Constants.expoConfig.extra              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ EAS Cloud Builds                                        │
├─────────────────────────────────────────────────────────┤
│ eas.json env (non-sensitive)                            │
│ EAS Secrets (sensitive)                                 │
│    ↓                                                     │
│ Build environment injects into process.env             │
│    ↓                                                     │
│ app.config.js reads process.env                        │
│    ↓                                                     │
│ Exposes via config.extra.*                             │
│    ↓                                                     │
│ App code reads Constants.expoConfig.extra              │
└─────────────────────────────────────────────────────────┘
```

## Debugging

If you see `undefined` when accessing env vars:

1. **Check the prefix:** Must be `EXPO_PUBLIC_`
2. **Restart Metro:** `npx expo start --clear`
3. **Check app.config.js:** Verify it reads and exposes the var
4. **Check Constants:** `console.log(Constants.expoConfig.extra)`
5. **Never use dotenv:** It will break React Native

## References

- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [Expo Constants](https://docs.expo.dev/versions/latest/sdk/constants/)
- [EAS Environment Variables](https://docs.expo.dev/build-reference/variables/)
