import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
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
    <View style={styles.container}>
      <Text style={styles.title}>Social Accountability</Text>
      {user && <Text style={styles.welcome}>Welcome, {user.displayName}!</Text>}

      {/* Main Actions */}
      <View style={styles.mainActions}>
        <Pressable style={styles.primaryButton} onPress={() => router.push("/goals")}>
          <Text style={styles.primaryButtonText}>My Goals</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  welcome: {
    fontSize: 18,
    color: "#333",
    marginBottom: 40,
  },
  mainActions: {
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: "#000",
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  nav: {
    flexDirection: "row",
    gap: 16,
  },
  navButton: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  navButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "500",
  },
});
