/**
 * ScopeTabs Component
 * Horizontal tab bar for filtering content by scope
 */

import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "../../theme";
import { spacing, borderRadius } from "../../theme/spacing";
import { typography } from "../../theme/typography";

interface ScopeTab<T extends string> {
  key: T;
  label: string;
}

interface ScopeTabsProps<T extends string> {
  tabs: ScopeTab<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
}

export function ScopeTabs<T extends string>({ tabs, activeTab, onTabChange }: ScopeTabsProps<T>) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { borderBottomColor: theme.border.light }]}>
      {tabs.map((tab) => (
        <Pressable
          key={tab.key}
          style={[
            styles.tab,
            { backgroundColor: theme.background.secondary },
            activeTab === tab.key && { backgroundColor: theme.semantic.primary },
          ]}
          onPress={() => onTabChange(tab.key)}
        >
          <Text
            style={[
              styles.tabText,
              { color: theme.text.secondary },
              activeTab === tab.key && { color: theme.button.primary.text, fontWeight: "600" },
            ]}
          >
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xxl,
  },
  tabText: {
    fontSize: typography.fontSize.sm,
  },
});
