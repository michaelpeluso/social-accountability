/**
 * Feed Layout
 * Stack navigator for feed screens with proper navigation
 */

import { Stack } from "expo-router";
import { useTheme } from "../../src/theme";

export default function FeedLayout() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.background.primary,
        },
        headerTintColor: theme.semantic.primary,
        headerTitleStyle: {
          color: theme.text.primary,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: "New Post",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: "Post",
          headerBackTitle: "Back",
        }}
      />
    </Stack>
  );
}
