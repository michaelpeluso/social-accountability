import { useEffect, useState, useRef } from "react";
import { Slot, router, useSegments, useRootNavigationState } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { auth } from "../src/services/auth";
import { initializeSyncHandlers } from "../src/services/syncHandlers";
import { createSyncService } from "../src/services/sync";
import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { ThemeProvider, useTheme } from "../src/theme";
import { printDatabaseDiagnostics } from "../src/storage/databaseDebug";
import { logger } from "../src/lib/logger";

function AuthGate({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const { theme } = useTheme();
  const syncServiceRef = useRef<ReturnType<typeof createSyncService> | null>(null);

  useEffect(() => {
    checkAuth();
    initializeApp();

    // Run database diagnostics in development
    if (__DEV__) {
      printDatabaseDiagnostics().catch((error) =>
        console.error("Database diagnostics failed:", error)
      );
    }

    // Cleanup sync service on unmount
    return () => {
      if (syncServiceRef.current) {
        syncServiceRef.current.stop();
        logger.info("Sync service stopped");
      }
    };
  }, []);

  async function initializeApp() {
    try {
      // Initialize sync handlers (registers handlers for each table)
      initializeSyncHandlers();

      // Create and start sync service (processes queue every 30s)
      syncServiceRef.current = createSyncService(30000);
      syncServiceRef.current.start();
      logger.info("Sync service started");
    } catch (error) {
      logger.error("Failed to initialize app services", { error });
    }
  }

  async function checkAuth() {
    try {
      const authenticated = await auth.isAuthenticated();
      setIsAuthenticated(authenticated);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isLoading || !navigationState?.key) return;

    const inAuthGroup = segments[0] === "auth";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/auth/signin");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/");
    }
  }, [isAuthenticated, segments, isLoading, navigationState?.key]);

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background.primary }]}>
        <ActivityIndicator size="large" color={theme.semantic.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthGate>
            <Slot />
          </AuthGate>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
