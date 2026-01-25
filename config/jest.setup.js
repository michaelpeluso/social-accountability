// Mock expo-constants for testing (cloud-only config)
// All env vars come through Constants.expoConfig.extra
jest.mock("expo-constants", () => ({
  expoConfig: {
    extra: {
      appVariant: "development",
      apiUrl: "https://test.example.com/api",
      supabaseUrl: "https://test.supabase.co",
      supabaseAnonKey: "test-anon-key",
      // Feature flags - ensure Apple auth is disabled in tests (uses mock)
      enableAppleAuth: false,
      enableHealthkit: false,
      enableCloudSync: false,
      logLevel: "error",
    },
  },
}));

// Mock expo-apple-authentication
jest.mock("expo-apple-authentication", () => ({
  signInAsync: jest.fn(),
  isAvailableAsync: jest.fn().mockResolvedValue(false),
  AppleAuthenticationScope: {
    EMAIL: 0,
    FULL_NAME: 1,
  },
  AppleAuthenticationButtonType: {
    SIGN_IN: 0,
    CONTINUE: 1,
  },
  AppleAuthenticationButtonStyle: {
    BLACK: 0,
    WHITE: 1,
    WHITE_OUTLINE: 2,
  },
  AppleAuthenticationButton: jest.fn(),
}));

// Mock expo-sqlite
jest.mock("expo-sqlite", () => ({
  openDatabaseAsync: jest.fn().mockResolvedValue({
    execAsync: jest.fn().mockResolvedValue(undefined),
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    getAllAsync: jest.fn().mockResolvedValue([]),
    closeAsync: jest.fn().mockResolvedValue(undefined),
  }),
}));

// Mock expo-secure-store with in-memory storage
jest.mock("expo-secure-store", () => {
  let mockStore = new Map();
  
  return {
    setItemAsync: jest.fn(async (key, value) => {
      mockStore.set(key, value);
    }),
    getItemAsync: jest.fn(async (key) => mockStore.get(key) ?? null),
    deleteItemAsync: jest.fn(async (key) => {
      mockStore.delete(key);
    }),
    // Expose a way to clear the store for testing
    __clearStore: () => {
      mockStore = new Map();
    },
  };
});

// Mock react-native Platform
jest.mock("react-native", () => ({
  Platform: { OS: "ios" },
}));

// Mock AsyncStorage with an in-memory store so auth tests can persist values
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map();

  return {
    setItem: jest.fn(async (key, value) => {
      store.set(key, value);
    }),
    getItem: jest.fn(async (key) => store.get(key) ?? null),
    removeItem: jest.fn(async (key) => {
      store.delete(key);
    }),
    clear: jest.fn(async () => {
      store.clear();
    }),
  };
});

// Suppress console logs in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
