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
