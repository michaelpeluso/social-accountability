/**
 * Profile Screen (M3.5)
 * Redirects to dynamic profile page for current user
 */

import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { router } from "expo-router";
import { auth } from "../../src/services/auth";
import { useTheme } from "../../src/theme";

export default function ProfileScreen() {
  const { theme } = useTheme();

  useEffect(() => {
    async function redirectToProfile() {
      const user = await auth.getUser();
      if (user) {
        router.replace(`/profile/${user.id}`);
      } else {
        router.replace("/auth/signin");
      }
    }
    redirectToProfile();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
      <ActivityIndicator size="large" color={theme.semantic.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
