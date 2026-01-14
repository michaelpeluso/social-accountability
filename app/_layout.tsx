import { useEffect, useState } from "react";
import { Slot, router, useSegments, useRootNavigationState } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { auth } from "../src/services/auth";
import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { ThemeProvider, useTheme } from "../src/theme";
import { printDatabaseDiagnostics } from "../src/storage/databaseDebug";

function AuthGate({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const { theme } = useTheme();

  useEffect(() => {
    checkAuth();
    // Run database diagnostics in development
    if (__DEV__) {
      printDatabaseDiagnostics().catch((error) =>
        console.error("Database diagnostics failed:", error)
      );
    }
  }, []);

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
