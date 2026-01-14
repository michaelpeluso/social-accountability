/**
 * TabBar Component
 * Reusable horizontal tab navigation
 */

import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "../../theme";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";

export interface Tab {
  key: string;
  label: string;
  badge?: number;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabKey: string) => void;
}

export function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.tabs, { borderBottomColor: theme.border.light }]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            style={[
              styles.tab,
              isActive && [styles.tabActive, { borderBottomColor: theme.semantic.primary }],
            ]}
            onPress={() => onTabChange(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                { color: isActive ? theme.semantic.primary : theme.text.secondary },
                isActive && styles.tabTextActive,
              ]}
            >
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && ` (${tab.badge})`}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    padding: spacing.md,
    alignItems: "center",
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: typography.fontSize.sm,
  },
  tabTextActive: {
    fontWeight: typography.fontWeight.semibold,
  },
});
