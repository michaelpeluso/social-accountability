/**
 * Dashboard Screen - Pillar Scores & Habit Summary
 * M2-2.6: Dashboard - Pillar Scores
 * M2-2.7: Dashboard - Habit Summary
 *
 * All calculations run on device (free compute).
 * Refactored to use extracted card and chart components.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { View, StyleSheet, ScrollView, RefreshControl, Alert, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { auth } from "../../src/services/auth";
import { getHabits } from "../../src/storage/habits";
import { getUserCheckIns } from "../../src/storage/checkIns";
import { ALL_PILLARS } from "../../src/types/goals";
import { useTheme } from "../../src/theme";
import { spacing } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";
import type { Habit, HabitCheckIn } from "../../src/types";
import {
  calculateAllPillarScores,
  calculateHabitSummary,
  getHabitsNeedingAttention,
  getDailyCheckInCounts,
  calculateRecoveryStatus,
  getCheckInsByDayOfWeek,
  getCompletionRateTrend,
  getPeakActivityHours,
  type PillarScore,
} from "../../src/logic";
import {
  OverallScoreCard,
  PillarScoreCard,
  SummaryCard,
  NeedsAttentionCard,
  TopStreaksCard,
  RecoveryCard,
  MissedCard,
  PeakHoursCard,
} from "../../src/components/cards";
import { ActivityChart, CompletionTrendChart, DayOfWeekChart } from "../../src/components/charts";
import { PillarDetailModal } from "../../src/components/modals";
import { ScreenHeader, EmptyState, SectionTitle } from "../../src/components/layout";

export default function DashboardScreen() {
  const { theme } = useTheme();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [checkIns, setCheckIns] = useState<HabitCheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [activityDays, setActivityDays] = useState<7 | 30 | 90>(7);
  const [selectedPillar, setSelectedPillar] = useState<PillarScore | null>(null);
  const [showPillarModal, setShowPillarModal] = useState(false);

  const loadData = useCallback(async (uid: string) => {
    try {
      const [habitsData, checkInsData] = await Promise.all([
        getHabits(uid),
        getUserCheckIns(uid, { limit: 500 }),
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
    return getDailyCheckInCounts(dashboardCheckIns, activityDays);
  }, [checkIns, activityDays]);

  const recoveryHabits = useMemo(() => {
    return habits
      .filter((h) => !h.isArchived)
      .map((h) => {
        const habitCheckIns = checkIns
          .filter((c) => c.habitId === h.id)
          .map((c) => ({ occurredAt: c.occurredAt }));
        const recovery = calculateRecoveryStatus(
          { frequency: h.schedule.frequency, targetCount: h.schedule.targetCount },
          habitCheckIns
        );
        return {
          habitId: h.id,
          title: h.title,
          pillar: h.pillar,
          recovery,
        };
      })
      .filter((h) => h.recovery.isInRecovery && h.recovery.recoveryStreak > 0)
      .sort((a, b) => b.recovery.recoveryStreak - a.recovery.recoveryStreak)
      .slice(0, 3);
  }, [habits, checkIns]);

  const peakHours = useMemo(() => {
    const dashboardCheckIns = checkIns.map((c) => ({
      id: c.id,
      habitId: c.habitId,
      occurredAt: c.occurredAt,
    }));
    return getPeakActivityHours(dashboardCheckIns, 30);
  }, [checkIns]);

  const dayOfWeekData = useMemo(() => {
    const dashboardCheckIns = checkIns.map((c) => ({
      id: c.id,
      habitId: c.habitId,
      occurredAt: c.occurredAt,
    }));
    return getCheckInsByDayOfWeek(dashboardCheckIns, 4);
  }, [checkIns]);

  const completionTrend = useMemo(() => {
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
    return getCompletionRateTrend(dashboardHabits, dashboardCheckIns, 8);
  }, [habits, checkIns]);

  const selectedPillarHabits = useMemo(() => {
    if (!selectedPillar) return [];
    return habits.filter((h) => h.pillar === selectedPillar.pillar && !h.isArchived);
  }, [habits, selectedPillar]);

  function handlePillarTap(score: PillarScore) {
    setSelectedPillar(score);
    setShowPillarModal(true);
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
        <ScreenHeader title="Dashboard" backLabel="Back" />
        <Text style={[styles.loadingText, { color: theme.text.secondary }]}>
          Loading dashboard...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
      <ScreenHeader title="Dashboard" backLabel="Back" />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.text.secondary}
          />
        }
      >
        {/* Overall Score */}
        <OverallScoreCard score={pillarData.overall} activeHabits={habitSummary.activeHabits} />

        {/* Pillar Scores Grid */}
        <SectionTitle>Life Pillars</SectionTitle>
        <View style={styles.pillarGrid}>
          {ALL_PILLARS.map((pillar) => {
            const score = pillarData.pillars.find((p) => p.pillar === pillar);
            if (!score) return null;
            return (
              <PillarScoreCard key={pillar} score={score} onPress={() => handlePillarTap(score)} />
            );
          })}
        </View>

        {/* Weekly Summary */}
        <SectionTitle>This Week</SectionTitle>
        <SummaryCard
          checkInsThisWeek={habitSummary.checkInsThisWeek}
          completionRate={habitSummary.completionRate}
          checkInsToday={habitSummary.checkInsToday}
        />

        {/* Weekly Activity */}
        <ActivityChart data={weeklyActivity} days={activityDays} onDaysChange={setActivityDays} />

        {/* Needs Attention */}
        {needsAttention.length > 0 && (
          <>
            <SectionTitle>Needs Attention</SectionTitle>
            <NeedsAttentionCard habits={needsAttention} />
          </>
        )}

        {/* Top Streaks */}
        {habitSummary.topStreaks.length > 0 && (
          <>
            <SectionTitle>Top Streaks</SectionTitle>
            <TopStreaksCard streaks={habitSummary.topStreaks} />
          </>
        )}

        {/* Recovery Streaks */}
        {recoveryHabits.length > 0 && (
          <>
            <SectionTitle>Getting Back on Track</SectionTitle>
            <RecoveryCard habits={recoveryHabits} />
          </>
        )}

        {/* Most Missed */}
        {habitSummary.mostMissed.length > 0 && (
          <>
            <SectionTitle>Needs Work</SectionTitle>
            <MissedCard items={habitSummary.mostMissed} />
          </>
        )}

        {/* Peak Activity Times */}
        {peakHours.length > 0 && (
          <>
            <SectionTitle>Best Check-in Times</SectionTitle>
            <PeakHoursCard hours={peakHours} />
          </>
        )}

        {/* Completion Rate Trend */}
        {completionTrend.length > 0 && (
          <>
            <SectionTitle>Weekly Completion Trend</SectionTitle>
            <CompletionTrendChart data={completionTrend} />
          </>
        )}

        {/* Day of Week Breakdown */}
        {dayOfWeekData.some((d) => d.count > 0) && (
          <>
            <SectionTitle>Activity by Day</SectionTitle>
            <DayOfWeekChart data={dayOfWeekData} />
          </>
        )}

        {/* Empty State */}
        {habits.length === 0 && (
          <EmptyState
            emoji="📊"
            title="No habits yet"
            subtitle="Create your first habit to start tracking"
            ctaLabel="Create Habit"
            onCtaPress={() => router.push("/habits")}
          />
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Pillar Detail Modal */}
      <PillarDetailModal
        visible={showPillarModal}
        onClose={() => setShowPillarModal(false)}
        pillarScore={selectedPillar}
        habits={selectedPillarHabits}
        checkIns={checkIns}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    textAlign: "center",
    marginTop: 100,
    fontSize: typography.fontSize.base,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  pillarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  bottomSpacer: {
    height: 40,
  },
});
