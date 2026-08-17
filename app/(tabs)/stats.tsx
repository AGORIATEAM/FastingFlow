import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Circle, Svg, Path } from 'react-native-svg';

import {
  EmptyState,
  GlassCard,
  PressableScale,
  Screen,
  SectionTitle,
  Skeleton,
  StatTile,
} from '@/components/ui';
import { calculateStreak } from '@/lib/domain/fasting';
import { haptics } from '@/lib/haptics';
import { useRepositories } from '@/lib/repositories/provider';
import type { FastSession } from '@/lib/schemas';
import { useUserStore } from '@/lib/stores/useUserStore';
import { Colors, Fonts, Header, Radius, Spacing, Typography } from '@/lib/theme';

// ─── Helpers ────────────────────────────────────────────────────────

function durationMs(s: FastSession): number {
  if (!s.endedAt) return 0;
  return new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime();
}

function msToHours(ms: number) {
  return ms / (1000 * 60 * 60);
}

function formatDuration(ms: number): string {
  const h = Math.floor(ms / (1000 * 60 * 60));
  const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (m === 0) return `${h}h`;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function dayLabel(date: Date): string {
  return ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][date.getDay()] ?? '';
}

type Period = 'week' | 'month' | 'year';

function cutoffMs(period: Period): number {
  const now = Date.now();
  const DAY = 86400000;
  if (period === 'week') return now - 7 * DAY;
  if (period === 'month') return now - 30 * DAY;
  return now - 365 * DAY;
}

// ─── SVG Icons ──────────────────────────────────────────────────────

function ClockIcon({ color = Colors.secondary, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
      <Path d="M12 7v5l3 2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function BoltIcon({ color = Colors.tertiary }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M13 2L4.5 13.5H11L10.5 22L20 10.5H13.5L13 2z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TrophyIcon({ color = Colors.secondary }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 21h8M12 17v4M7 4H4a1 1 0 00-1 1v3c0 2.21 1.79 4 4 4h.5M17 4h3a1 1 0 011 1v3c0 2.21-1.79 4-4 4h-.5M7 4h10v7a5 5 0 01-10 0V4z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckIcon({ color = Colors.tertiary }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke={Colors.onSurfaceVariant}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function FlameIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C10.5 5 8 8 8 11c0 .88.18 1.72.5 2.5C7.55 12.5 7 11 7 9.5c0 0-3 3-3 6.5C4 19.64 7.58 23 12 23s8-3.36 8-7c0-3.5-3-6.5-5-8C15 9 15 10.5 15 12c0 0-1-1.5-1.5-3.5C13 6 12 2 12 2z"
        fill={Colors.tertiary}
      />
    </Svg>
  );
}

// ─── Period selector (full-width tabs) ───────────────────────────────

const PERIODS: { id: Period; label: string }[] = [
  { id: 'week', label: 'Semaine' },
  { id: 'month', label: 'Mois' },
  { id: 'year', label: 'Année' },
];

function PeriodSelector({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <View style={styles.periodRow}>
      {PERIODS.map((p) => {
        const selected = value === p.id;
        return (
          <PressableScale
            key={p.id}
            style={[styles.periodBtn, selected && styles.periodBtnActive]}
            accessibilityLabel={p.label}
            accessibilityState={{ selected }}
            onPress={() => {
              if (!selected) {
                haptics.selection();
                onChange(p.id);
              }
            }}
          >
            <Text
              style={[styles.periodText, selected && styles.periodTextActive]}
              maxFontSizeMultiplier={1.3}
            >
              {p.label}
            </Text>
            {selected && <View style={styles.periodDot} />}
          </PressableScale>
        );
      })}
    </View>
  );
}

// ─── Insight banner ──────────────────────────────────────────────────

function InsightBanner({
  totalH,
  count,
  period,
}: {
  totalH: number;
  count: number;
  period: Period;
}) {
  const periodLabel =
    period === 'week' ? 'cette semaine' : period === 'month' ? 'ce mois' : 'cette année';
  const avgH = count > 0 ? totalH / count : 0;
  let message = 'Commencez votre premier jeûne pour voir vos statistiques.';
  let accent: string = Colors.onSurfaceVariant;

  if (count > 0) {
    if (avgH >= 18) {
      message = `Excellent ! Moyenne de ${avgH.toFixed(1)}h ${periodLabel}.`;
      accent = Colors.tertiary;
    } else if (avgH >= 14) {
      message = `Bien ! ${count} jeûne${count > 1 ? 's' : ''} complété${count > 1 ? 's' : ''} ${periodLabel}.`;
      accent = Colors.secondary;
    } else {
      message = `${count} jeûne${count > 1 ? 's' : ''} ${periodLabel}. Continuez sur votre lancée !`;
      accent = Colors.secondary;
    }
  }

  return (
    <GlassCard style={[styles.insightBanner, { borderLeftColor: accent }]}>
      <FlameIcon />
      <Text style={[styles.insightText, { color: accent }]} maxFontSizeMultiplier={1.3}>
        {message}
      </Text>
    </GlassCard>
  );
}

// ─── Longest fast card ───────────────────────────────────────────────

function LongestFastCard({ ms, completionRate }: { ms: number; completionRate: number }) {
  return (
    <GlassCard style={styles.longestCard}>
      <View>
        <Text style={styles.longestLabel} maxFontSizeMultiplier={1.3}>
          Plus Long Jeûne
        </Text>
        <Text style={styles.longestValue}>{ms > 0 ? formatDuration(ms) : '—'}</Text>
        <View style={styles.longestMeta}>
          <CheckIcon />
          <Text style={styles.longestMetaText} maxFontSizeMultiplier={1.3}>
            {completionRate > 0
              ? `${completionRate}% de taux de complétion`
              : 'Aucun jeûne enregistré'}
          </Text>
        </View>
      </View>
      <View style={styles.trophyBadge}>
        <TrophyIcon />
      </View>
    </GlassCard>
  );
}

// ─── Bar chart ───────────────────────────────────────────────────────

const BAR_MAX_H = 100;
const GOAL_H = 18;

interface DayBar {
  day: string;
  hours: number;
}

function BarChart({
  title,
  data,
  average,
  showGoal,
  highlightLabel,
}: {
  title: string;
  data: DayBar[];
  average: number;
  showGoal: boolean;
  highlightLabel?: string | undefined;
}) {
  const maxHours = Math.max(...data.map((d) => d.hours), showGoal ? GOAL_H : 0, 1);
  const goalLineH = (GOAL_H / maxHours) * BAR_MAX_H;
  const bestH = Math.max(...data.map((d) => d.hours), 0);
  const chartSummary = `${title}. Moyenne ${average.toFixed(1)} heures par jour sur la période, maximum ${bestH.toFixed(0)} heures.`;

  return (
    <GlassCard style={styles.chartCard}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>{title}</Text>
          {showGoal && (
            <View style={styles.chartSubRow}>
              <View style={styles.legendDot} />
              <Text style={styles.chartSub} maxFontSizeMultiplier={1.3}>
                Objectif {GOAL_H}h / jour
              </Text>
            </View>
          )}
        </View>
        <View style={styles.avgBadge}>
          <Text style={styles.avgValue} maxFontSizeMultiplier={1.3}>
            {average > 0 ? average.toFixed(1) : '0'}h
          </Text>
          <Text style={styles.avgLabel} maxFontSizeMultiplier={1.3}>
            moy/j
          </Text>
        </View>
      </View>

      {/* Bars with goal line */}
      <View style={styles.chartArea} accessible accessibilityLabel={chartSummary}>
        {/* Dashed goal line */}
        {showGoal && (
          <View
            style={[styles.goalLine, { bottom: goalLineH + 20 }]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <View style={styles.goalLineDash} />
            <Text style={styles.goalLineLabel}>{GOAL_H}h</Text>
          </View>
        )}

        <View
          style={styles.barsRow}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {data.map((d, i) => {
            const barH = Math.max((d.hours / maxHours) * BAR_MAX_H, d.hours > 0 ? 6 : 2);
            const meetsGoal = showGoal && d.hours >= GOAL_H;
            const isToday = highlightLabel !== undefined && d.day === highlightLabel;
            return (
              <View key={i} style={styles.barCol}>
                {d.hours > 0 && (
                  <Text
                    style={[
                      styles.barValueLabel,
                      { color: meetsGoal ? Colors.tertiary : Colors.secondary },
                    ]}
                  >
                    {d.hours.toFixed(0)}h
                  </Text>
                )}
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barH,
                        backgroundColor: meetsGoal ? Colors.tertiary : Colors.cyan,
                        opacity: d.hours > 0 ? 1 : 0.12,
                      },
                      isToday && styles.barToday,
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, isToday && { color: Colors.cyan }]}>{d.day}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </GlassCard>
  );
}

// ─── Heatmap ─────────────────────────────────────────────────────────

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const CELL_GAP = 4;
const HEAT_LABEL_W = 14;
const HEAT_CONTAINER_GAP = 6;

/** Intensity (0–1) → heat cell color, derived from the tertiary token. */
function heatColor(v: number): string {
  if (v === 0) return Colors.primaryContainer;
  if (v >= 1) return Colors.tertiary;
  const alpha = Math.round(v * 255)
    .toString(16)
    .padStart(2, '0');
  return `${Colors.tertiary}${alpha}`;
}

interface HeatCell {
  date: string;
  hours: number;
}

function Heatmap({ cells, startDate }: { cells: HeatCell[]; startDate: Date }) {
  const { width } = useWindowDimensions();
  // Screen padding (lg ×2) + card padding (md ×2) + label column + column gap.
  const gridW = width - Spacing.lg * 2 - Spacing.md * 2 - HEAT_LABEL_W - HEAT_CONTAINER_GAP;
  const cellW = (gridW - CELL_GAP * 6) / 7;

  function intensity(hours: number) {
    if (hours === 0) return 0;
    if (hours < 8) return 0.2;
    if (hours < 14) return 0.5;
    if (hours < 18) return 0.75;
    return 1;
  }

  const activeDays = cells.filter((c) => c.hours > 0).length;
  const heatSummary = `Calendrier d'activité des ${cells.length} derniers jours : ${activeDays} jour${activeDays > 1 ? 's' : ''} avec jeûne.`;

  return (
    <GlassCard style={styles.chartCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Calendrier d'activité</Text>
        <Text style={styles.heatRange} maxFontSizeMultiplier={1.3}>
          {startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} – aujourd'hui
        </Text>
      </View>

      <View style={styles.heatContainer} accessible accessibilityLabel={heatSummary}>
        {/* Day labels */}
        <View
          style={styles.heatDayLabels}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {DAY_LABELS.map((d, i) => (
            <Text key={i} style={[styles.heatDayLabel, { height: cellW, lineHeight: cellW }]}>
              {d}
            </Text>
          ))}
        </View>

        {/* Grid */}
        <View
          style={styles.heatGrid}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {cells.map((cell, i) => {
            const v = intensity(cell.hours);
            const isToday = cell.date === isoDate(new Date());
            return (
              <View
                key={i}
                style={[
                  styles.heatCell,
                  { width: cellW, height: cellW, backgroundColor: heatColor(v) },
                  isToday && styles.heatCellToday,
                ]}
              />
            );
          })}
        </View>
      </View>

      {/* Legend */}
      <View
        style={styles.heatLegend}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Text style={styles.legendSmall}>Inactif</Text>
        <View style={styles.heatLegendDots}>
          {[0, 0.2, 0.5, 0.75, 1].map((v, i) => (
            <View key={i} style={[styles.heatLegendDot, { backgroundColor: heatColor(v) }]} />
          ))}
        </View>
        <Text style={styles.legendSmall}>Objectif</Text>
      </View>
    </GlassCard>
  );
}

// ─── Recent fasts ────────────────────────────────────────────────────

function completionColor(pct: number): string {
  if (pct >= 100) return Colors.tertiary;
  if (pct >= 70) return Colors.secondary;
  return Colors.onSurfaceVariant;
}

/** Duration-tiered badge icon: ≥18h trophy, ≥14h check, otherwise clock. */
function durationBadge(actualH: number) {
  if (actualH >= 18) return <TrophyIcon color={Colors.tertiary} />;
  if (actualH >= 14) return <CheckIcon color={Colors.secondary} />;
  return <ClockIcon color={Colors.mutedText} />;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel} maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
      <Text style={styles.detailValue} maxFontSizeMultiplier={1.3}>
        {value}
      </Text>
    </View>
  );
}

function RecentFastCard({ session }: { session: FastSession }) {
  const [expanded, setExpanded] = useState(false);
  const ms = durationMs(session);
  const actualH = msToHours(ms);
  const pct =
    session.plannedDurationH > 0
      ? Math.min(Math.round((actualH / session.plannedDurationH) * 100), 100)
      : 0;
  const d = new Date(session.startedAt);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  let dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  if (isoDate(d) === isoDate(today)) dateStr = "Aujourd'hui";
  else if (isoDate(d) === isoDate(yesterday)) dateStr = 'Hier';

  const durationLabel = ms > 0 ? formatDuration(ms) : `${session.plannedDurationH}h prévu`;

  return (
    <GlassCard padded={false} style={styles.recentCard}>
      <PressableScale
        haptic="selection"
        onPress={() => setExpanded((e) => !e)}
        style={styles.recentRow}
        accessibilityLabel={`Jeûne du ${dateStr}, ${session.protocol}, ${durationLabel}, complétion ${pct}%`}
        accessibilityState={{ expanded }}
      >
        {/* Left: badge + info */}
        <View style={styles.recentLeft}>
          <View style={styles.recentIconBox}>{durationBadge(actualH)}</View>
          <View style={styles.recentInfo}>
            <Text style={styles.recentDate} maxFontSizeMultiplier={1.3}>
              {dateStr}
            </Text>
            <Text style={styles.recentMeta} maxFontSizeMultiplier={1.3}>
              {session.protocol} · {durationLabel}
            </Text>
            {/* Mini completion bar */}
            <View style={styles.recentBar}>
              <View
                style={[
                  styles.recentBarFill,
                  { width: `${pct}%`, backgroundColor: completionColor(pct) },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Right: pct + chevron */}
        <View style={styles.recentRight}>
          <Text style={[styles.recentPct, { color: completionColor(pct) }]}>{pct}%</Text>
          <View style={expanded && styles.chevronExpanded}>
            <ChevronIcon />
          </View>
        </View>
      </PressableScale>

      {expanded && (
        <Animated.View entering={FadeInDown.duration(180)} style={styles.recentDetails}>
          <DetailRow label="Durée" value={durationLabel} />
          <DetailRow label="Protocole" value={session.protocol} />
          <DetailRow label="Complétion" value={`${pct}%`} />
          {session.notes ? <DetailRow label="Note" value={session.notes} /> : null}
        </Animated.View>
      )}
    </GlassCard>
  );
}

function EmptyFasts() {
  return (
    <GlassCard padded={false}>
      <EmptyState
        icon={<ClockIcon color={Colors.mutedText} size={32} />}
        title="Aucun jeûne enregistré"
        body="Démarrez votre premier jeûne depuis l'onglet Fast pour commencer à suivre vos progrès."
      />
    </GlassCard>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────

export default function StatsScreen() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const { fastSessions } = useRepositories();

  const [period, setPeriod] = useState<Period>('week');
  const [sessions, setSessions] = useState<FastSession[]>([]);
  const [recent, setRecent] = useState<FastSession[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [completed, rec] = await Promise.all([
        fastSessions.findByStatus(user.id, 'completed'),
        fastSessions.findRecentByUserId(user.id, 10),
      ]);
      setSessions(completed);
      setRecent(rec);
    } catch {
      // Keep last known data on transient DB errors
    } finally {
      setLoading(false);
    }
  }, [user, fastSessions]);

  // Reload whenever the tab regains focus so a fast finished on the timer
  // screen shows up immediately.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const cutoff = cutoffMs(period);
  const filtered = sessions.filter((s) => new Date(s.startedAt).getTime() >= cutoff);

  // KPIs
  const totalH = filtered.reduce((acc, s) => acc + msToHours(durationMs(s)), 0);
  const streak = calculateStreak(sessions);
  const longestMs = sessions.reduce((max, s) => Math.max(max, durationMs(s)), 0);
  const avgH = filtered.length > 0 ? totalH / filtered.length : 0;
  const completedCount = filtered.length;
  const completionRate =
    filtered.length > 0
      ? Math.round(
          (filtered.reduce((acc, s) => {
            const actual = msToHours(durationMs(s));
            const planned = s.plannedDurationH;
            return acc + (planned > 0 ? Math.min(actual / planned, 1) : 1);
          }, 0) /
            filtered.length) *
            100
        )
      : 0;

  // Bars driven by the selected period
  function hoursOnDate(dateStr: string): number {
    return sessions
      .filter((s) => s.endedAt && isoDate(new Date(s.startedAt)) === dateStr)
      .reduce((acc, s) => acc + msToHours(durationMs(s)), 0);
  }

  function hoursBetween(startMs: number, endMs: number): number {
    return sessions
      .filter((s) => {
        const t = new Date(s.startedAt).getTime();
        return s.endedAt !== null && t >= startMs && t < endMs;
      })
      .reduce((acc, s) => acc + msToHours(durationMs(s)), 0);
  }

  const DAY_MS = 24 * 60 * 60 * 1000;
  let chartTitle: string;
  let chartBars: DayBar[];
  let chartAvg: number;
  let chartShowGoal: boolean;
  let chartHighlight: string | undefined;

  if (period === 'week') {
    chartTitle = 'Progression hebdomadaire';
    chartBars = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { day: dayLabel(d), hours: hoursOnDate(isoDate(d)) };
    });
    chartAvg = chartBars.reduce((a, b) => a + b.hours, 0) / 7;
    chartShowGoal = true;
    chartHighlight = dayLabel(new Date());
  } else if (period === 'month') {
    chartTitle = 'Progression mensuelle';
    const endOfToday = new Date();
    endOfToday.setHours(24, 0, 0, 0);
    chartBars = Array.from({ length: 4 }, (_, i) => {
      const end = endOfToday.getTime() - (3 - i) * 7 * DAY_MS;
      const start = end - 7 * DAY_MS;
      const startDate = new Date(start);
      const label = `${String(startDate.getDate()).padStart(2, '0')}/${String(
        startDate.getMonth() + 1
      ).padStart(2, '0')}`;
      return { day: label, hours: hoursBetween(start, end) };
    });
    chartAvg = chartBars.reduce((a, b) => a + b.hours, 0) / 28;
    chartShowGoal = false;
  } else {
    chartTitle = 'Progression annuelle';
    const monthLabels = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
    const now = new Date();
    chartBars = Array.from({ length: 12 }, (_, i) => {
      const start = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
      return {
        day: monthLabels[start.getMonth()] ?? '',
        hours: hoursBetween(start.getTime(), end.getTime()),
      };
    });
    chartAvg = chartBars.reduce((a, b) => a + b.hours, 0) / 365;
    chartShowGoal = false;
  }

  // Heatmap (last 28 days)
  const heatStart = new Date();
  heatStart.setDate(heatStart.getDate() - 27);
  const heatCells: HeatCell[] = Array.from({ length: 28 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (27 - i));
    const dateStr = isoDate(d);
    const dayH = sessions
      .filter((s) => s.endedAt && isoDate(new Date(s.startedAt)) === dateStr)
      .reduce((acc, s) => acc + msToHours(durationMs(s)), 0);
    return { date: dateStr, hours: dayH };
  });

  const recentCompleted = recent.filter((s) => s.status === 'completed');

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* App bar */}
      <View style={styles.appBar}>
        <Text style={styles.appBarBrand}>FastLife</Text>
        <View style={styles.appBarRight}>
          <Text style={styles.appBarTitle} maxFontSizeMultiplier={1.3}>
            Statistiques
          </Text>
        </View>
      </View>

      <Screen
        scroll
        contentStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.cyan} />
        }
      >
        <PeriodSelector value={period} onChange={setPeriod} />

        {loading ? (
          <>
            <Skeleton height={64} radius={Radius.md} />
            <Skeleton height={118} radius={Radius.xl} />
            <Skeleton height={96} radius={Radius.xl} />
            <Skeleton height={230} radius={Radius.xl} />
          </>
        ) : (
          <>
            <InsightBanner totalH={totalH} count={completedCount} period={period} />

            {/* KPI strip */}
            <View style={styles.kpiRow}>
              <StatTile
                style={styles.kpiTile}
                icon={<ClockIcon />}
                label="Heures"
                value={Math.round(totalH) > 0 ? `${Math.round(totalH)}h` : '—'}
                sub="total"
                accent={Colors.secondary}
              />
              <StatTile
                style={styles.kpiTile}
                icon={<BoltIcon />}
                label="Série"
                value={String(streak)}
                sub="jours"
                accent={Colors.tertiary}
              />
              <StatTile
                style={styles.kpiTile}
                icon={<ClockIcon color={Colors.cyan} />}
                label="Moyenne"
                value={avgH > 0 ? `${avgH.toFixed(1)}h` : '—'}
                sub="par jeûne"
                accent={Colors.cyan}
              />
            </View>

            <LongestFastCard ms={longestMs} completionRate={completionRate} />

            <BarChart
              title={chartTitle}
              data={chartBars}
              average={chartAvg}
              showGoal={chartShowGoal}
              highlightLabel={chartHighlight}
            />

            <Heatmap cells={heatCells} startDate={heatStart} />

            {/* Recent fasts */}
            <View style={styles.section}>
              <SectionTitle
                title="Jeûnes récents"
                right={
                  <PressableScale
                    onPress={() => router.push('/history')}
                    haptic="selection"
                    accessibilityLabel="Voir tout l'historique"
                  >
                    <Text style={styles.seeAll} maxFontSizeMultiplier={1.3}>
                      Tout voir
                    </Text>
                  </PressableScale>
                }
              />
              {recentCompleted.length === 0 ? (
                <EmptyFasts />
              ) : (
                recentCompleted.slice(0, 5).map((s) => <RecentFastCard key={s.id} session={s} />)
              )}
            </View>
          </>
        )}
      </Screen>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  seeAll: {
    color: Colors.secondary,
    fontFamily: Fonts.semibold,
    fontSize: Typography.bodySmall,
  },
  root: { flex: 1, backgroundColor: Colors.bg },

  appBar: {
    height: Header.height,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    backgroundColor: Header.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Header.borderColor,
  },
  appBarBrand: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3, color: Colors.white },
  appBarRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  appBarTitle: { fontSize: 13, fontWeight: '600', color: Colors.onSurfaceVariant },

  content: { paddingTop: Spacing.lg, gap: Spacing.md },

  // Period selector — full width
  periodRow: {
    flexDirection: 'row',
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.md,
    padding: 4,
  },
  periodBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 13, gap: 4 },
  periodBtnActive: { backgroundColor: Colors.deepBlue },
  periodText: { fontSize: 13, fontWeight: '600', color: Colors.onSurfaceVariant },
  periodTextActive: { color: Colors.white },
  periodDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.cyan },

  // Insight banner
  insightBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderLeftWidth: 3,
    borderRadius: 14,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  insightText: { fontSize: 13, fontWeight: '500', flex: 1, lineHeight: 18 },

  // KPI strip
  kpiRow: { flexDirection: 'row', gap: Spacing.sm },
  kpiTile: { flex: 1 },

  // Longest fast card
  longestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 18,
  },
  longestLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  longestValue: { fontSize: 26, fontWeight: '700', color: Colors.white, letterSpacing: -0.8 },
  longestMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  longestMetaText: { fontSize: 11, color: Colors.onSurfaceVariant },
  trophyBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Colors.secondary}1A`,
    borderWidth: 1,
    borderColor: `${Colors.secondary}30`,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Chart / heatmap cards
  chartCard: { gap: Spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: Colors.white },
  chartSubRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  legendDot: { width: 6, height: 2, borderRadius: 1, backgroundColor: `${Colors.tertiary}80` },
  chartSub: { fontSize: 11, color: Colors.onSurfaceVariant },
  avgBadge: { alignItems: 'flex-end' },
  avgValue: { fontSize: 22, fontWeight: '700', color: Colors.secondary, letterSpacing: -0.5 },
  avgLabel: { fontSize: 10, color: Colors.onSurfaceVariant, marginTop: 1 },

  // Bar chart
  chartArea: { position: 'relative' },
  goalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  goalLineDash: {
    flex: 1,
    height: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    borderColor: `${Colors.tertiary}50`,
  },
  goalLineLabel: {
    fontSize: 9,
    color: Colors.tertiary,
    fontWeight: '600',
    width: 20,
    textAlign: 'right',
  },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: BAR_MAX_H + 36 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  barTrack: { width: '100%', height: BAR_MAX_H, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 6, minHeight: 3 },
  barToday: {
    shadowColor: Colors.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  barValueLabel: { fontSize: 9, fontWeight: '700', textAlign: 'center' },
  barLabel: { fontSize: 9, color: Colors.onSurfaceVariant, fontWeight: '500' },

  // Heatmap
  heatRange: { fontSize: 11, color: Colors.onSurfaceVariant },
  heatContainer: { flexDirection: 'row', gap: HEAT_CONTAINER_GAP },
  heatDayLabels: { gap: CELL_GAP, paddingTop: 1, width: HEAT_LABEL_W },
  heatDayLabel: {
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    textAlignVertical: 'center',
  },
  heatGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: CELL_GAP },
  heatCell: { borderRadius: 3 },
  heatCellToday: { borderWidth: 1.5, borderColor: Colors.cyan },
  heatLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  heatLegendDots: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  heatLegendDot: { width: 10, height: 10, borderRadius: 2 },
  legendSmall: { fontSize: 9, color: Colors.onSurfaceVariant },

  // Recent fasts
  section: { gap: 10 },

  recentCard: { borderRadius: 18 },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  recentLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  recentIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  recentInfo: { flex: 1, gap: 3 },
  recentDate: { fontSize: 14, fontWeight: '600', color: Colors.white },
  recentMeta: { fontSize: 11, color: Colors.onSurfaceVariant, fontWeight: '500' },
  recentBar: {
    height: 3,
    borderRadius: 2,
    backgroundColor: `${Colors.white}14`,
    overflow: 'hidden',
    marginTop: 2,
  },
  recentBarFill: { height: '100%', borderRadius: 2 },
  recentRight: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: Spacing.sm },
  recentPct: { fontSize: 12, fontWeight: '700' },
  chevronExpanded: { transform: [{ rotate: '90deg' }] },
  recentDetails: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Header.borderColor,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    color: Colors.mutedText,
    textTransform: 'uppercase',
  },
  detailValue: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: Colors.onSurface,
    textAlign: 'right',
  },
});
