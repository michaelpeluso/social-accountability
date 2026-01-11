/**
 * Dev Tools Screen
 * Testing utilities for development
 * Remove or hide behind ENABLE_DEV_TOOLS flag in production
 */

import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { seedDemoData, clearDemoData, hasDemoData } from "@/storage";
import { useTheme } from "@/theme";
import { spacing, borderRadius } from "@/theme/spacing";
import { typography } from "@/theme/typography";

export default function DevToolsScreen() {
  const { theme } = useTheme();
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSeedData = async () => {
    setLoading(true);
    setStatus("Seeding data...");
    try {
      const result = await seedDemoData();
      setStatus(result.message);
      Alert.alert("Success", result.message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setStatus(`Error: ${message}`);
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    Alert.alert("Clear Demo Data?", "This will delete all demo users, habits, posts, etc.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          setStatus("Clearing data...");
          try {
            await clearDemoData();
            setStatus("Demo data cleared successfully");
            Alert.alert("Success", "Demo data cleared");
          } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            setStatus(`Error: ${message}`);
            Alert.alert("Error", message);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleCheckData = async () => {
    setLoading(true);
    try {
      const exists = await hasDemoData();
      const message = exists ? "Demo data exists in database" : "No demo data found";
      setStatus(message);
      Alert.alert("Status", message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setStatus(`Error: ${message}`);
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.secondary }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: theme.background.primary, borderBottomColor: theme.border.light },
        ]}
      >
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={[styles.backButtonText, { color: theme.semantic.primary }]}>‹ Back</Text>
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: theme.text.primary }]}>Dev Tools</Text>
          <Text style={[styles.subtitle, { color: theme.text.tertiary }]}>
            Testing utilities for development
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContent}>
        <View style={[styles.section, { gap: theme.space.componentGap }]}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Demo Data</Text>

          <Pressable
            style={[
              styles.button,
              { backgroundColor: theme.button.primary.background },
              loading && styles.buttonDisabled,
            ]}
            onPress={handleSeedData}
            disabled={loading}
          >
            <Text style={[styles.buttonText, { color: theme.button.primary.text }]}>
              Seed Demo Data
            </Text>
            <Text style={[styles.buttonDescription, { color: theme.button.primary.text }]}>
              Creates 4 users, 4 habits, 7 check-ins, 2 posts
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.button,
              styles.buttonSecondary,
              {
                backgroundColor: theme.button.secondary.background,
                borderColor: theme.semantic.primary,
              },
              loading && styles.buttonDisabled,
            ]}
            onPress={handleCheckData}
            disabled={loading}
          >
            <Text
              style={[
                styles.buttonText,
                styles.buttonTextSecondary,
                { color: theme.semantic.primary },
              ]}
            >
              Check Demo Data
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.button,
              styles.buttonDanger,
              { backgroundColor: theme.button.danger.background },
              loading && styles.buttonDisabled,
            ]}
            onPress={handleClearData}
            disabled={loading}
          >
            <Text style={[styles.buttonText, { color: theme.button.danger.text }]}>
              Clear Demo Data
            </Text>
          </Pressable>
        </View>

        {status !== "" && (
          <View
            style={[
              styles.statusBox,
              {
                backgroundColor: theme.background.primary,
                borderLeftColor: theme.semantic.primary,
              },
            ]}
          >
            <Text style={[styles.statusText, { color: theme.text.secondary }]}>{status}</Text>
          </View>
        )}

        <View
          style={[
            styles.infoBox,
            {
              backgroundColor: theme.semantic.warning + "20",
              borderLeftColor: theme.semantic.warning,
            },
          ]}
        >
          <Text style={[styles.infoTitle, { color: theme.semantic.warning }]}>Demo Users</Text>
          <Text style={[styles.infoText, { color: theme.semantic.warning }]}>
            • You (Demo) - demo_main_user
          </Text>
          <Text style={[styles.infoText, { color: theme.semantic.warning }]}>
            • Alice - demo_alice (friend)
          </Text>
          <Text style={[styles.infoText, { color: theme.semantic.warning }]}>
            • Bob - demo_bob (friend)
          </Text>
          <Text style={[styles.infoText, { color: theme.semantic.warning }]}>
            • Carol - demo_carol (pending)
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.md,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  backButtonText: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.normal,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
  },
  scrollContent: {
    flex: 1,
  },
  section: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  button: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: "center",
  },
  buttonSecondary: {
    borderWidth: 2,
  },
  buttonDanger: {},
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  buttonTextSecondary: {},
  buttonDescription: {
    fontSize: typography.fontSize.xs,
    opacity: 0.8,
    marginTop: 2,
  },
  statusBox: {
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
  },
  statusText: {
    fontSize: typography.fontSize.sm,
  },
  infoBox: {
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
  },
  infoTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: typography.fontSize.xs,
    marginBottom: 2,
  },
});
