import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../src/services/auth";
import { useTheme } from "../src/theme";
import type { User } from "../src/types/user";

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const currentUser = await auth.getUser();
    setUser(currentUser);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ padding: theme.space.screenPadding }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.header,
            { marginTop: theme.space.sectionGap * 2, marginBottom: theme.space.sectionGap * 2 },
          ]}
        >
          <Text
            style={[
              styles.title,
              {
                fontSize: theme.typography.h1.fontSize,
                fontWeight: theme.typography.h1.fontWeight,
                color: theme.text.primary,
                marginBottom: theme.space.inlineGap,
              },
            ]}
          >
            Social Accountability
          </Text>
          {user && (
            <Text
              style={[
                styles.welcome,
                {
                  fontSize: theme.typography.body.fontSize + 2,
                  color: theme.text.secondary,
                },
              ]}
            >
              Welcome, {user.displayName}!
            </Text>
          )}
        </View>

        {/* Main Actions */}
        <View style={[styles.mainActions, { gap: theme.space.componentGap * 2 }]}>
          <Pressable
            style={[
              styles.primaryButton,
              {
                backgroundColor: theme.background.secondary,
                padding: theme.space.sectionGap + theme.space.componentGap,
                borderRadius: theme.radius.large,
                borderWidth: 1,
                borderColor: theme.border.light,
              },
            ]}
            onPress={() => router.push("/dashboard")}
          >
            <Text style={[styles.primaryButtonEmoji, { marginBottom: theme.space.inlineGap }]}>
              📊
            </Text>
            <Text
              style={[
                styles.primaryButtonText,
                {
                  fontSize: theme.typography.h2.fontSize,
                  fontWeight: theme.typography.h2.fontWeight,
                  color: theme.text.primary,
                  marginBottom: theme.space.inlineGap / 2,
                },
              ]}
            >
              Dashboard
            </Text>
            <Text
              style={[
                styles.primaryButtonSubtext,
                {
                  fontSize: theme.typography.bodySmall.fontSize,
                  color: theme.text.tertiary,
                },
              ]}
            >
              View your progress
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.primaryButton,
              {
                backgroundColor: theme.background.secondary,
                padding: theme.space.sectionGap + theme.space.componentGap,
                borderRadius: theme.radius.large,
                borderWidth: 1,
                borderColor: theme.border.light,
              },
            ]}
            onPress={() => router.push("/goals")}
          >
            <Text style={[styles.primaryButtonEmoji, { marginBottom: theme.space.inlineGap }]}>
              🎯
            </Text>
            <Text
              style={[
                styles.primaryButtonText,
                {
                  fontSize: theme.typography.h2.fontSize,
                  fontWeight: theme.typography.h2.fontWeight,
                  color: theme.text.primary,
                  marginBottom: theme.space.inlineGap / 2,
                },
              ]}
            >
              Goals
            </Text>
            <Text
              style={[
                styles.primaryButtonSubtext,
                {
                  fontSize: theme.typography.bodySmall.fontSize,
                  color: theme.text.tertiary,
                },
              ]}
            >
              Set and track your goals
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.primaryButton,
              {
                backgroundColor: theme.background.secondary,
                padding: theme.space.sectionGap + theme.space.componentGap,
                borderRadius: theme.radius.large,
                borderWidth: 1,
                borderColor: theme.border.light,
              },
            ]}
            onPress={() => router.push("/habits")}
          >
            <Text style={[styles.primaryButtonEmoji, { marginBottom: theme.space.inlineGap }]}>
              🔄
            </Text>
            <Text
              style={[
                styles.primaryButtonText,
                {
                  fontSize: theme.typography.h2.fontSize,
                  fontWeight: theme.typography.h2.fontWeight,
                  color: theme.text.primary,
                  marginBottom: theme.space.inlineGap / 2,
                },
              ]}
            >
              Habits
            </Text>
            <Text
              style={[
                styles.primaryButtonSubtext,
                {
                  fontSize: theme.typography.bodySmall.fontSize,
                  color: theme.text.tertiary,
                },
              ]}
            >
              Build daily routines
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.primaryButton,
              {
                backgroundColor: theme.background.secondary,
                padding: theme.space.sectionGap + theme.space.componentGap,
                borderRadius: theme.radius.large,
                borderWidth: 1,
                borderColor: theme.border.light,
              },
            ]}
            onPress={() => router.push("/feed")}
          >
            <Text style={[styles.primaryButtonEmoji, { marginBottom: theme.space.inlineGap }]}>
              📱
            </Text>
            <Text
              style={[
                styles.primaryButtonText,
                {
                  fontSize: theme.typography.h2.fontSize,
                  fontWeight: theme.typography.h2.fontWeight,
                  color: theme.text.primary,
                  marginBottom: theme.space.inlineGap / 2,
                },
              ]}
            >
              Feed
            </Text>
            <Text
              style={[
                styles.primaryButtonSubtext,
                {
                  fontSize: theme.typography.bodySmall.fontSize,
                  color: theme.text.tertiary,
                },
              ]}
            >
              See what friends are up to
            </Text>
          </Pressable>
        </View>

        {/* Navigation */}
        <View
          style={[
            styles.nav,
            { gap: theme.space.componentGap, paddingBottom: theme.space.screenPadding },
          ]}
        >
          <Pressable
            style={[
              styles.navButton,
              {
                flex: 1,
                backgroundColor: theme.button.secondary.background,
                padding: theme.button.secondary.paddingVertical * 1.5,
                borderRadius: theme.button.secondary.borderRadius,
              },
            ]}
            onPress={() => router.push("/profile")}
          >
            <Text style={[styles.navButtonText, { color: theme.text.primary }]}>My Profile</Text>
          </Pressable>

          <Pressable
            style={[
              styles.navButton,
              {
                flex: 1,
                backgroundColor: theme.button.secondary.background,
                padding: theme.button.secondary.paddingVertical * 1.5,
                borderRadius: theme.button.secondary.borderRadius,
              },
            ]}
            onPress={() => router.push("/friends")}
          >
            <Text style={[styles.navButtonText, { color: theme.text.primary }]}>Friends</Text>
          </Pressable>

          <Pressable
            style={[
              styles.navButton,
              {
                flex: 1,
                backgroundColor: theme.button.secondary.background,
                padding: theme.button.secondary.paddingVertical * 1.5,
                borderRadius: theme.button.secondary.borderRadius,
              },
            ]}
            onPress={() => router.push("/settings")}
          >
            <Text style={[styles.navButtonText, { color: theme.text.primary }]}>Settings</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: "center",
  },
  title: {},
  welcome: {},
  mainActions: {
    flex: 1,
    justifyContent: "center",
  },
  primaryButton: {},
  primaryButtonEmoji: {
    fontSize: 32,
  },
  primaryButtonText: {},
  primaryButtonSubtext: {},
  nav: {
    flexDirection: "row",
  },
  navButton: {
    alignItems: "center",
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
