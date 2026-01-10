/**
 * Dashboard Screen - Pillar Scores & Habit Summary
 * M2-2.6: Dashboard - Pillar Scores
 * M2-2.7: Dashboard - Habit Summary
 *
 * All calculations run on device (free compute).
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, RefreshControl, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { auth } from "../../src/services/auth";
import { getHabits } from "../../src/storage/habits";
import { getUserCheckIns } from "../../src/storage/checkIns";
import { PILLAR_INFO, ALL_PILLARS } from "../../src/types/goals";
import type { Habit, HabitCheckIn } from "../../src/types";
import {
  calculateAllPillarScores,
  getTrendArrow,
  getTrendColor,
  getScoreColor,
  calculateHabitSummary,
  getHabitsNeedingAttention,
  getDailyCheckInCounts,
} from "../../src/logic";

export default function DashboardScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [checkIns, setCheckIns] = useState<HabitCheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const loadData = useCallback(async (uid: string) => {
    try {
      // Load all habits and recent check-ins
      const [habitsData, checkInsData] = await Promise.all([
        getHabits(uid),
        getUserCheckIns(uid, { limit: 500 }), // Last 500 check-ins for calculations
      ]);
      setHabits(habitsData);
      setCheckIns(checkInsData);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      Alert.alert("Error", "Failed to load dashboard data");
    }
  }, []);

  useEffect(() => {
    async function initialize() {
      const user = await auth.getUser();
      if (user) {
        setUserId(user.id);
        await loadData(user.id);
      }
      setIsLoading(false);
    }
    initialize();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    if (!userId) return;
    setIsRefreshing(true);
    await loadData(userId);
    setIsRefreshing(false);
  }, [userId, loadData]);

  // Calculate all dashboard metrics on device
  const pillarData = useMemo(() => {
    const pillarHabits = habits.map((h) => ({
      id: h.id,
      pillar: h.pillar,
      schedule: h.schedule,
      isArchived: h.isArchived,
    }));
    const pillarCheckIns = checkIns.map((c) => ({
      habitId: c.habitId,
      occurredAt: c.occurredAt,
    }));
    return calculateAllPillarScores(pillarHabits, pillarCheckIns);
  }, [habits, checkIns]);

  const habitSummary = useMemo(() => {
    const dashboardHabits = habits.map((h) => ({
      id: h.id,
      title: h.title,
      pillar: h.pillar,
      schedule: h.schedule,
      isArchived: h.isArchived,
      currentStreak: h.currentStreak,
      longestStreak: h.longestStreak,
    }));
    const dashboardCheckIns = checkIns.map((c) => ({
      id: c.id,
      habitId: c.habitId,
      occurredAt: c.occurredAt,
    }));
    return calculateHabitSummary(dashboardHabits, dashboardCheckIns);
  }, [habits, checkIns]);

  const needsAttention = useMemo(() => {
    const dashboardHabits = habits.map((h) => ({
      id: h.id,
      title: h.title,
      pillar: h.pillar,
      schedule: h.schedule,
      isArchived: h.isArchived,
      currentStreak: h.currentStreak,
      longestStreak: h.longestStreak,
    }));
    const dashboardCheckIns = checkIns.map((c) => ({
      id: c.id,
      habitId: c.habitId,
      occurredAt: c.occurredAt,
    }));
    return getHabitsNeedingAttention(dashboardHabits, dashboardCheckIns);
  }, [habits, checkIns]);

  const weeklyActivity = useMemo(() => {
    const dashboardCheckIns = checkIns.map((c) => ({
      id: c.id,
      habitId: c.habitId,
      occurredAt: c.occurredAt,
    }));
    return getDailyCheckInCounts(dashboardCheckIns, 7);
  }, [checkIns]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Dashboard</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        {/* Overall Score */}
        <View style={styles.overallCard}>
          <Text style={styles.overallLabel}>Overall Score</Text>
          <Text style={[styles.overallScore, { color: getScoreColor(pillarData.overall) }]}>
            {pillarData.overall}%
          </Text>
          <Text style={styles.overallSubtext}>{habitSummary.activeHabits} active habits</Text>
        </View>

        {/* Pillar Scores Grid */}
        <Text style={styles.sectionTitle}>Life Pillars</Text>
        <View style={styles.pillarGrid}>
          {ALL_PILLARS.map((pillar) => {
            const score = pillarData.pillars.find((p) => p.pillar === pillar);
            const info = PILLAR_INFO[pillar];
            if (!score) return null;

            return (
              <View key={pillar} style={[styles.pillarCard, { borderLeftColor: info.color }]}>
                <View style={styles.pillarHeader}>
                  <Text style={styles.pillarEmoji}>{info.emoji}</Text>
                  <Text style={styles.pillarName}>{info.label}</Text>
                </View>
                <View style={styles.pillarScoreRow}>
                  <Text style={[styles.pillarScore, { color: getScoreColor(score.score) }]}>
                    {score.score}%
                  </Text>
                  <Text style={[styles.trendArrow, { color: getTrendColor(score.trend) }]}>
                    {getTrendArrow(score.trend)}
                  </Text>
                </View>
                <Text style={styles.pillarMeta}>
                  {score.habitCount} habit{score.habitCount !== 1 ? "s" : ""}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Weekly Summary */}
        <Text style={styles.sectionTitle}>This Week</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{habitSummary.checkInsThisWeek}</Text>
              <Text style={styles.summaryLabel}>Check-ins</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{habitSummary.completionRate}%</Text>
              <Text style={styles.summaryLabel}>Completion</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{habitSummary.checkInsToday}</Text>
              <Text style={styles.summaryLabel}>Today</Text>
            </View>
          </View>
        </View>

        {/* Weekly Activity Mini Chart */}
        <View style={styles.activityCard}>
          <Text style={styles.cardTitle}>Weekly Activity</Text>
          <View style={styles.activityChart}>
            {weeklyActivity.map((day, index) => {
              const maxCount = Math.max(...weeklyActivity.map((d) => d.count), 1);
              const height = (day.count / maxCount) * 60 + 4;
              const dayName = day.date.toLocaleDateString("en-US", { weekday: "short" });

              return (
                <View key={index} style={styles.activityDay}>
                  <View
                    style={[
                      styles.activityBar,
                      { height, backgroundColor: day.count > 0 ? "#4CAF50" : "#E0E0E0" },
                    ]}
                  />
                  <Text style={styles.activityLabel}>{dayName}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Needs Attention */}
        {needsAttention.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Needs Attention</Text>
            <View style={styles.attentionCard}>
              {needsAttention.slice(0, 3).map((habit) => (
                <Pressable
                  key={habit.id}
                  style={styles.attentionItem}
                  onPress={() => router.push(`/habits/${habit.id}`)}
                >
                  <Text style={styles.attentionEmoji}>{PILLAR_INFO[habit.pillar].emoji}</Text>
                  <Text style={styles.attentionTitle} numberOfLines={1}>
                    {habit.title}
                  </Text>
                  <Text style={styles.attentionCta}>Log</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* Top Streaks */}
        {habitSummary.topStreaks.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Top Streaks</Text>
            <View style={styles.streaksCard}>
              {habitSummary.topStreaks.map((item, index) => (
                <Pressable
                  key={item.habitId}
                  style={styles.streakItem}
                  onPress={() => router.push(`/habits/${item.habitId}`)}
                >
                  <Text style={styles.streakRank}>#{index + 1}</Text>
                  <Text style={styles.streakTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.streakCount}>{item.streak} days</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* Empty State */}
        {habits.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No habits yet</Text>
            <Text style={styles.emptySubtext}>Create your first habit to start tracking</Text>
            <Pressable style={styles.createButton} onPress={() => router.push("/habits")}>
              <Text style={styles.createButtonText}>Create Habit</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingText: {
    textAlign: "center",
    marginTop: 100,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: "#007AFF",
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  placeholder: {
    width: 50,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  // Overall Score
  overallCard: {
    backgroundColor: "#f8f8f8",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  overallLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  overallScore: {
    fontSize: 48,
    fontWeight: "bold",
  },
  overallSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
  // Pillar Grid
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  pillarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  pillarCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  pillarHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  pillarEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  pillarName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  pillarScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pillarScore: {
    fontSize: 24,
    fontWeight: "bold",
  },
  trendArrow: {
    fontSize: 18,
    fontWeight: "bold",
  },
  pillarMeta: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  // Summary Card
  summaryCard: {
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#e0e0e0",
  },
  // Activity Chart
  activityCard: {
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  activityChart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 80,
  },
  activityDay: {
    alignItems: "center",
    flex: 1,
  },
  activityBar: {
    width: 24,
    borderRadius: 4,
    marginBottom: 8,
  },
  activityLabel: {
    fontSize: 10,
    color: "#999",
  },
  // Needs Attention
  attentionCard: {
    backgroundColor: "#FFF3E0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  attentionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#FFE0B2",
  },
  attentionEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  attentionTitle: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  attentionCta: {
    color: "#FF9800",
    fontWeight: "600",
    fontSize: 14,
  },
  // Top Streaks
  streaksCard: {
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  streakItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#C8E6C9",
  },
  streakRank: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4CAF50",
    width: 30,
  },
  streakTitle: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  streakCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4CAF50",
  },
  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
  },
  createButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSpacer: {
    height: 40,
  },
});
