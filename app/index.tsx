import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { auth } from "../services/auth";
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
      <Text style={styles.subtitle}>Your habits dashboard coming soon...</Text>

      <View style={styles.nav}>
        <Pressable style={styles.navButton} onPress={() => router.push("/settings")}>
          <Text style={styles.navButtonText}>Settings</Text>
        </Pressable>

        <Pressable style={styles.navButton} onPress={() => router.push("/friends")}>
          <Text style={styles.navButtonText}>Friends</Text>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 40,
  },
  nav: {
    flexDirection: "row",
    gap: 16,
  },
  navButton: {
    backgroundColor: "#000",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  navButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});
