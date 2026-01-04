import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../src/services/auth";
import type { User } from "../src/types/user";

export default function Index() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const currentUser = await auth.getUser();
    setUser(currentUser);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Social Accountability</Text>
        {user && <Text style={styles.welcome}>Welcome, {user.displayName}!</Text>}
      </View>

      {/* Main Actions */}
      <View style={styles.mainActions}>
        <Pressable style={styles.primaryButton} onPress={() => router.push("/goals")}>
          <Text style={styles.primaryButtonEmoji}>🎯</Text>
          <Text style={styles.primaryButtonText}>Goals</Text>
          <Text style={styles.primaryButtonSubtext}>Set and track your goals</Text>
        </Pressable>

        <Pressable style={styles.primaryButton} onPress={() => router.push("/habits")}>
          <Text style={styles.primaryButtonEmoji}>🔄</Text>
          <Text style={styles.primaryButtonText}>Habits</Text>
          <Text style={styles.primaryButtonSubtext}>Build daily routines</Text>
        </Pressable>
      </View>

      {/* Navigation */}
      <View style={styles.nav}>
        <Pressable style={styles.navButton} onPress={() => router.push("/friends")}>
          <Text style={styles.navButtonText}>Friends</Text>
        </Pressable>

        <Pressable style={styles.navButton} onPress={() => router.push("/settings")}>
          <Text style={styles.navButtonText}>Settings</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  welcome: {
    fontSize: 18,
    color: "#333",
  },
  mainActions: {
    flex: 1,
    justifyContent: "center",
    gap: 16,
  },
  primaryButton: {
    backgroundColor: "#f8f8f8",
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  primaryButtonEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  primaryButtonText: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 4,
  },
  primaryButtonSubtext: {
    fontSize: 14,
    color: "#666",
  },
  nav: {
    flexDirection: "row",
    gap: 16,
    paddingBottom: 20,
  },
  navButton: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  navButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "500",
  },
});
