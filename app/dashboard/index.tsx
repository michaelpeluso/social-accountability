/**
 * Dashboard Screen - Pillar Scores & Habit Summary
 * M2-2.6: Dashboard - Pillar Scores
 * M2-2.7: Dashboard - Habit Summary
 *
 * All calculations run on device (free compute).
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  RefreshControl,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { auth } from "../../src/services/auth";
import { getHabits } from "../../src/storage/habits";
import { getUserCheckIns } from "../../src/storage/checkIns";
import { PILLAR_INFO, ALL_PILLARS } from "../../src/types/goals";
import { useTheme } from "../../src/theme";
import type { Habit, HabitCheckIn } from "../../src/types";
import {
  calculateAllPillarScores,
  getTrendArrow,
  getTrendColor,
  getScoreColor,
  calculateHabitSummary,
  getHabitsNeedingAttention,
  getDailyCheckInCounts,
  calculateRecoveryStatus,
  getCheckInsByDayOfWeek,
  getCompletionRateTrend,
  getPeakActivityHours,
  isThisWeek,
  type PillarScore,
} from "../../src/logic";

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
    return getDailyCheckInCounts(dashboardCheckIns, activityDays);
  }, [checkIns, activityDays]);

  // Calculate recovery streaks for all habits
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

  // Best time of day analysis
  const peakHours = useMemo(() => {
    const dashboardCheckIns = checkIns.map((c) => ({
      id: c.id,
      habitId: c.habitId,
      occurredAt: c.occurredAt,
    }));
    return getPeakActivityHours(dashboardCheckIns, 30);
  }, [checkIns]);

  // Day of week breakdown
  const dayOfWeekData = useMemo(() => {
    const dashboardCheckIns = checkIns.map((c) => ({
      id: c.id,
      habitId: c.habitId,
      occurredAt: c.occurredAt,
    }));
    return getCheckInsByDayOfWeek(dashboardCheckIns, 4);
  }, [checkIns]);

  // Completion rate trends
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

  // Get habits for selected pillar
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
        <Text style={[styles.loadingText, { color: theme.text.secondary }]}>
          Loading dashboard...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: theme.border.light }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: theme.button.primary.background }]}>
            Back
          </Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text.primary }]}>Dashboard</Text>
        <View style={styles.placeholder} />
      </View>

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
        <View style={[styles.overallCard, { backgroundColor: theme.card.background }]}>
          <Text style={[styles.overallLabel, { color: theme.text.secondary }]}>Overall Score</Text>
          <Text style={[styles.overallScore, { color: getScoreColor(pillarData.overall) }]}>
            {pillarData.overall}%
          </Text>
          <Text style={[styles.overallSubtext, { color: theme.text.tertiary }]}>
            {habitSummary.activeHabits} active habits
          </Text>
        </View>

        {/* Pillar Scores Grid */}
        <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Life Pillars</Text>
        <View style={styles.pillarGrid}>
          {ALL_PILLARS.map((pillar) => {
            const score = pillarData.pillars.find((p) => p.pillar === pillar);
            const info = PILLAR_INFO[pillar];
            if (!score) return null;

            return (
              <Pressable
                key={pillar}
                style={[
                  styles.pillarCard,
                  { borderLeftColor: info.color, backgroundColor: theme.card.background },
                ]}
                onPress={() => handlePillarTap(score)}
              >
                <View style={styles.pillarHeader}>
                  <Text style={styles.pillarEmoji}>{info.emoji}</Text>
                  <Text style={[styles.pillarName, { color: theme.text.primary }]}>
                    {info.label}
                  </Text>
                </View>
                <View style={styles.pillarScoreRow}>
                  <Text style={[styles.pillarScore, { color: getScoreColor(score.score) }]}>
                    {score.score}%
                  </Text>
                  <Text style={[styles.trendArrow, { color: getTrendColor(score.trend) }]}>
                    {getTrendArrow(score.trend)}
                  </Text>
                </View>
                <Text style={[styles.pillarMeta, { color: theme.text.tertiary }]}>
                  {score.habitCount} habit{score.habitCount !== 1 ? "s" : ""}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Weekly Summary */}
        <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>This Week</Text>
        <View style={[styles.summaryCard, { backgroundColor: theme.card.background }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.text.primary }]}>
                {habitSummary.checkInsThisWeek}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.text.secondary }]}>Check-ins</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: theme.border.light }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.text.primary }]}>
                {habitSummary.completionRate}%
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.text.secondary }]}>Completion</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: theme.border.light }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.text.primary }]}>
                {habitSummary.checkInsToday}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.text.secondary }]}>Today</Text>
            </View>
          </View>
        </View>

        {/* Weekly Activity Mini Chart */}
        <View style={[styles.activityCard, { backgroundColor: theme.card.background }]}>
          <View style={styles.activityHeader}>
            <Text style={[styles.cardTitle, { color: theme.text.primary }]}>Activity</Text>
            <View style={styles.activitySelector}>
              {([7, 30, 90] as const).map((days) => (
                <Pressable
                  key={days}
                  style={[
                    styles.activitySelectorButton,
                    { backgroundColor: theme.background.tertiary },
                    activityDays === days && { backgroundColor: theme.button.primary.background },
                  ]}
                  onPress={() => setActivityDays(days)}
                >
                  <Text
                    style={[
                      styles.activitySelectorText,
                      { color: theme.text.secondary },
                      activityDays === days && { color: theme.button.primary.text },
                    ]}
                  >
                    {days}d
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.activityChart}>
            {weeklyActivity.slice(-Math.min(weeklyActivity.length, 14)).map((day, index) => {
              const maxCount = Math.max(...weeklyActivity.map((d) => d.count), 1);
              const height = (day.count / maxCount) * 60 + 4;
              const dayName = day.date.toLocaleDateString("en-US", { weekday: "short" });

              return (
                <View key={index} style={styles.activityDay}>
                  <View
                    style={[
                      styles.activityBar,
                      {
                        height,
                        backgroundColor:
                          day.count > 0 ? theme.text.success : theme.background.tertiary,
                      },
                    ]}
                  />
                  <Text style={[styles.activityLabel, { color: theme.text.tertiary }]}>
                    {dayName[0]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Needs Attention */}
        {needsAttention.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
              Needs Attention
            </Text>
            <View style={[styles.attentionCard, { backgroundColor: "#FF9500" + "20" }]}>
              {needsAttention.slice(0, 3).map((habit) => (
                <Pressable
                  key={habit.id}
                  style={[styles.attentionItem, { borderBottomColor: theme.border.light }]}
                  onPress={() => router.push(`/habits/${habit.id}`)}
                >
                  <Text style={styles.attentionEmoji}>{PILLAR_INFO[habit.pillar].emoji}</Text>
                  <Text
                    style={[styles.attentionTitle, { color: theme.text.primary }]}
                    numberOfLines={1}
                  >
                    {habit.title}
                  </Text>
                  <Text style={[styles.attentionCta, { color: theme.button.primary.background }]}>
                    Log
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* Top Streaks */}
        {habitSummary.topStreaks.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Top Streaks</Text>
            <View style={[styles.streaksCard, { backgroundColor: theme.card.background }]}>
              {habitSummary.topStreaks.map((item, index) => (
                <Pressable
                  key={item.habitId}
                  style={[styles.streakItem, { borderBottomColor: theme.border.light }]}
                  onPress={() => router.push(`/habits/${item.habitId}`)}
                >
                  <Text style={[styles.streakRank, { color: theme.text.tertiary }]}>
                    #{index + 1}
                  </Text>
                  <Text
                    style={[styles.streakTitle, { color: theme.text.primary }]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text style={[styles.streakCount, { color: theme.text.success }]}>
                    {item.streak} days
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* Recovery Streaks - Show habits getting back on track */}
        {recoveryHabits.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
              Getting Back on Track
            </Text>
            <View style={[styles.recoveryCard, { backgroundColor: theme.card.background }]}>
              {recoveryHabits.map((item) => (
                <Pressable
                  key={item.habitId}
                  style={[styles.recoveryItem, { borderBottomColor: theme.border.light }]}
                  onPress={() => router.push(`/habits/${item.habitId}`)}
                >
                  <Text style={styles.recoveryEmoji}>{PILLAR_INFO[item.pillar].emoji}</Text>
                  <View style={styles.recoveryInfo}>
                    <Text
                      style={[styles.recoveryTitle, { color: theme.text.primary }]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text style={[styles.recoverySubtext, { color: theme.text.secondary }]}>
                      {item.recovery.recoveryStreak} day
                      {item.recovery.recoveryStreak !== 1 ? "s" : ""} back on track
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.recoveryBadge,
                      { backgroundColor: theme.text.success + "20", color: theme.text.success },
                    ]}
                  >
                    {item.recovery.recoveryStreak}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* Most Missed Habits */}
        {habitSummary.mostMissed.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Needs Work</Text>
            <View style={[styles.missedCard, { backgroundColor: theme.card.background }]}>
              {habitSummary.mostMissed.map((item, index) => (
                <Pressable
                  key={item.habitId}
                  style={[styles.missedItem, { borderBottomColor: theme.border.light }]}
                  onPress={() => router.push(`/habits/${item.habitId}`)}
                >
                  <Text style={[styles.missedRank, { color: theme.text.tertiary }]}>
                    #{index + 1}
                  </Text>
                  <Text
                    style={[styles.missedTitle, { color: theme.text.primary }]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text style={[styles.missedCount, { color: theme.text.error }]}>
                    {item.missedDays} missed
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* Peak Activity Times */}
        {peakHours.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
              Best Check-in Times
            </Text>
            <View style={[styles.peakCard, { backgroundColor: theme.card.background }]}>
              {peakHours.map((peak, index) => {
                const hourLabel =
                  peak.hour === 0
                    ? "12 AM"
                    : peak.hour < 12
                      ? `${peak.hour} AM`
                      : peak.hour === 12
                        ? "12 PM"
                        : `${peak.hour - 12} PM`;
                return (
                  <View
                    key={peak.hour}
                    style={[styles.peakItem, { borderBottomColor: theme.border.light }]}
                  >
                    <Text style={[styles.peakRank, { color: theme.text.tertiary }]}>
                      #{index + 1}
                    </Text>
                    <Text style={[styles.peakHour, { color: theme.text.primary }]}>
                      {hourLabel}
                    </Text>
                    <Text style={[styles.peakCount, { color: theme.text.secondary }]}>
                      {peak.count} check-ins
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Completion Rate Trend */}
        {completionTrend.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
              Weekly Completion Trend
            </Text>
            <View style={[styles.trendCard, { backgroundColor: theme.card.background }]}>
              <View style={styles.trendChart}>
                {completionTrend.map((week, index) => {
                  const maxRate = 100;
                  const height = (week.completionRate / maxRate) * 60 + 4;
                  return (
                    <View key={index} style={styles.trendBar}>
                      <View
                        style={[
                          styles.trendBarFill,
                          { height, backgroundColor: getScoreColor(week.completionRate) },
                        ]}
                      />
                      <Text style={[styles.trendLabel, { color: theme.text.tertiary }]}>
                        W{index + 1}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <View style={styles.trendLegend}>
                <Text style={[styles.trendLegendText, { color: theme.text.secondary }]}>
                  Last {completionTrend.length} weeks
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Day of Week Breakdown */}
        {dayOfWeekData.some((d) => d.count > 0) && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
              Activity by Day
            </Text>
            <View style={[styles.dayOfWeekCard, { backgroundColor: theme.card.background }]}>
              {dayOfWeekData.map((dayData, index) => {
                const maxCount = Math.max(...dayOfWeekData.map((d) => d.count), 1);
                const intensity = dayData.count / maxCount;
                const successColor = theme.text.success;
                return (
                  <View key={index} style={styles.dayOfWeekItem}>
                    <View
                      style={[
                        styles.dayOfWeekDot,
                        {
                          backgroundColor:
                            dayData.count > 0
                              ? `${successColor}${Math.round((0.3 + intensity * 0.7) * 255)
                                  .toString(16)
                                  .padStart(2, "0")}`
                              : theme.background.tertiary,
                        },
                      ]}
                    >
                      <Text style={[styles.dayOfWeekCount, { color: theme.text.primary }]}>
                        {dayData.count}
                      </Text>
                    </View>
                    <Text style={[styles.dayOfWeekLabel, { color: theme.text.secondary }]}>
                      {dayData.dayName}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Empty State */}
        {habits.length === 0 && (
          <View style={[styles.emptyState, { backgroundColor: theme.card.background }]}>
            <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>No habits yet</Text>
            <Text style={[styles.emptySubtext, { color: theme.text.secondary }]}>
              Create your first habit to start tracking
            </Text>
            <Pressable
              style={[styles.createButton, { backgroundColor: theme.button.primary.background }]}
              onPress={() => router.push("/habits")}
            >
              <Text style={[styles.createButtonText, { color: theme.button.primary.text }]}>
                Create Habit
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Pillar Detail Modal */}
      <Modal
        visible={showPillarModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPillarModal(false)}
      >
        <SafeAreaView
          style={[styles.modalContainer, { backgroundColor: theme.background.primary }]}
        >
          <View style={[styles.modalHeader, { borderBottomColor: theme.border.light }]}>
            <Pressable onPress={() => setShowPillarModal(false)} style={styles.modalClose}>
              <Text style={[styles.modalCloseText, { color: theme.button.primary.background }]}>
                Close
              </Text>
            </Pressable>
            {selectedPillar && (
              <Text style={[styles.modalTitle, { color: theme.text.primary }]}>
                {PILLAR_INFO[selectedPillar.pillar].emoji}{" "}
                {PILLAR_INFO[selectedPillar.pillar].label}
              </Text>
            )}
            <View style={styles.placeholder} />
          </View>

          {selectedPillar && (
            <ScrollView style={styles.modalContent}>
              {/* Pillar Score Summary */}
              <View style={[styles.modalScoreCard, { backgroundColor: theme.background.tertiary }]}>
                <Text
                  style={[styles.modalScoreValue, { color: getScoreColor(selectedPillar.score) }]}
                >
                  {selectedPillar.score}%
                </Text>
                <Text style={[styles.modalTrend, { color: getTrendColor(selectedPillar.trend) }]}>
                  {getTrendArrow(selectedPillar.trend)}{" "}
                  {selectedPillar.trend === "up"
                    ? "Improving"
                    : selectedPillar.trend === "down"
                      ? "Declining"
                      : "Stable"}
                </Text>
                <Text style={[styles.modalScoreMeta, { color: theme.text.secondary }]}>
                  {selectedPillar.habitCount} habit{selectedPillar.habitCount !== 1 ? "s" : ""} in
                  this pillar
                </Text>
              </View>

              {/* Habits in this Pillar */}
              <Text style={[styles.modalSectionTitle, { color: theme.text.primary }]}>Habits</Text>
              {selectedPillarHabits.length > 0 ? (
                <View style={[styles.modalHabitsList, { backgroundColor: theme.card.background }]}>
                  {selectedPillarHabits.map((habit) => {
                    const habitCheckIns = checkIns.filter((c) => c.habitId === habit.id);
                    const recentCheckIns = habitCheckIns.filter((c) => isThisWeek(c.occurredAt));
                    return (
                      <Pressable
                        key={habit.id}
                        style={[styles.modalHabitItem, { borderBottomColor: theme.border.light }]}
                        onPress={() => {
                          setShowPillarModal(false);
                          router.push(`/habits/${habit.id}`);
                        }}
                      >
                        <View style={styles.modalHabitInfo}>
                          <Text style={[styles.modalHabitTitle, { color: theme.text.primary }]}>
                            {habit.title}
                          </Text>
                          <Text style={[styles.modalHabitMeta, { color: theme.text.secondary }]}>
                            {recentCheckIns.length} this week | {habit.currentStreak} day streak
                          </Text>
                        </View>
                        <Text style={[styles.modalHabitArrow, { color: theme.text.tertiary }]}>
                          →
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <Text style={[styles.modalEmptyText, { color: theme.text.secondary }]}>
                  No habits in this pillar yet
                </Text>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
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
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
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
    marginTop: 4,
  },
  // Summary Card
  summaryCard: {
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
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 40,
  },
  // Activity Chart
  activityCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
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
  },
  // Needs Attention
  attentionCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  attentionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  attentionEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  attentionTitle: {
    flex: 1,
    fontSize: 14,
  },
  attentionCta: {
    fontWeight: "600",
    fontSize: 14,
  },
  // Top Streaks
  streaksCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  streakItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  streakRank: {
    fontSize: 12,
    fontWeight: "600",
    marginRight: 12,
    width: 30,
  },
  streakTitle: {
    flex: 1,
    fontSize: 14,
  },
  streakCount: {
    fontSize: 14,
    fontWeight: "600",
  },
  // Recovery Streaks
  recoveryCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  recoveryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  recoveryEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  recoveryInfo: {
    flex: 1,
  },
  recoveryTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  recoverySubtext: {
    fontSize: 12,
  },
  recoveryBadge: {
    fontSize: 14,
    fontWeight: "bold",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: "hidden",
  },
  // Most Missed
  missedCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  missedItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  missedRank: {
    fontSize: 12,
    fontWeight: "600",
    marginRight: 12,
    width: 30,
  },
  missedTitle: {
    flex: 1,
    fontSize: 14,
  },
  missedCount: {
    fontSize: 14,
    fontWeight: "600",
  },
  // Peak Activity
  peakCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  peakItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  peakRank: {
    fontSize: 12,
    fontWeight: "600",
    marginRight: 12,
    width: 30,
  },
  peakHour: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  peakCount: {
    fontSize: 14,
  },
  // Completion Trend
  trendCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  trendChart: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 80,
  },
  trendBar: {
    alignItems: "center",
    flex: 1,
  },
  trendBarFill: {
    width: 24,
    borderRadius: 4,
    marginBottom: 8,
  },
  trendLabel: {
    fontSize: 10,
  },
  trendLegend: {
    marginTop: 8,
    alignItems: "center",
  },
  trendLegendText: {
    fontSize: 12,
  },
  // Day of Week Breakdown
  dayOfWeekCard: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  dayOfWeekItem: {
    alignItems: "center",
  },
  dayOfWeekDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  dayOfWeekCount: {
    fontSize: 12,
    fontWeight: "600",
  },
  dayOfWeekLabel: {
    fontSize: 10,
  },
  // Activity Header & Selector
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  activitySelector: {
    flexDirection: "row",
    borderRadius: 8,
    padding: 2,
  },
  activitySelectorButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activitySelectorText: {
    fontSize: 12,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalClose: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalScoreCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  modalScoreValue: {
    fontSize: 48,
    fontWeight: "bold",
  },
  modalTrend: {
    fontSize: 16,
    marginTop: 8,
  },
  modalScoreMeta: {
    fontSize: 14,
    marginTop: 8,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  modalHabitsList: {
    borderRadius: 12,
    padding: 12,
  },
  modalHabitItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalHabitInfo: {
    flex: 1,
  },
  modalHabitTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  modalHabitMeta: {
    fontSize: 12,
  },
  modalHabitArrow: {
    fontSize: 18,
  },
  modalEmptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 24,
  },
  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    borderRadius: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: "center",
  },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSpacer: {
    height: 40,
  },
});
