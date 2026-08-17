import { useEffect, useState } from 'react';
import { Alert, Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Circle, Svg, Path } from 'react-native-svg';

import { calculateStreak } from '@/lib/domain/fasting';
import { useRepositories } from '@/lib/repositories/provider';
import type { FastSession } from '@/lib/schemas';
import { useUserStore } from '@/lib/stores/useUserStore';

const { width: SW } = Dimensions.get('window');
const CONTENT_W = SW - 40; // 20px padding each side

// ─── Design tokens ──────────────────────────────────────────────────
const C = {
  bg: '#050F1D',
  surface: '#131316',
  deepBlue: '#0D2547',
  glass: 'rgba(13, 37, 71, 0.45)',
  glassBorder: 'rgba(245, 247, 250, 0.10)',
  glassBorderDim: 'rgba(255, 255, 255, 0.06)',
  cyan: '#3DB4F2',
  secondary: '#84cfff',
  secondaryContainer: '#009ad7',
  tertiary: '#45dfa4',
  onSurface: '#e4e2e5',
  onSurfaceVariant: '#c5c6ce',
  primaryContainer: '#0a1f3d',
  white: '#ffffff',
  divider: 'rgba(255,255,255,0.06)',
};

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

function ClockIcon({ color = C.secondary }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
      <Path d="M12 7v5l3 2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function BoltIcon({ color = C.tertiary }: { color?: string }) {
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

function TrophyIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 21h8M12 17v4M7 4H4a1 1 0 00-1 1v3c0 2.21 1.79 4 4 4h.5M17 4h3a1 1 0 011 1v3c0 2.21-1.79 4-4 4h-.5M7 4h10v7a5 5 0 01-10 0V4z"
        stroke={C.secondary}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={C.tertiary}
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
      <Path d="M9 18l6-6-6-6" stroke={C.onSurfaceVariant} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function FlameIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C10.5 5 8 8 8 11c0 .88.18 1.72.5 2.5C7.55 12.5 7 11 7 9.5c0 0-3 3-3 6.5C4 19.64 7.58 23 12 23s8-3.36 8-7c0-3.5-3-6.5-5-8C15 9 15 10.5 15 12c0 0-1-1.5-1.5-3.5C13 6 12 2 12 2z"
        fill={C.tertiary}
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
      {PERIODS.map((p) => (
        <Pressable
          key={p.id}
          style={[styles.periodBtn, value === p.id && styles.periodBtnActive]}
          onPress={() => onChange(p.id)}
        >
          <Text style={[styles.periodText, value === p.id && styles.periodTextActive]}>
            {p.label}
          </Text>
          {value === p.id && <View style={styles.periodDot} />}
        </Pressable>
      ))}
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
  let accent = C.onSurfaceVariant;

  if (count > 0) {
    if (avgH >= 18) {
      message = `Excellent ! Moyenne de ${avgH.toFixed(1)}h ${periodLabel}.`;
      accent = C.tertiary;
    } else if (avgH >= 14) {
      message = `Bien ! ${count} jeûne${count > 1 ? 's' : ''} complété${count > 1 ? 's' : ''} ${periodLabel}.`;
      accent = C.secondary;
    } else {
      message = `${count} jeûne${count > 1 ? 's' : ''} ${periodLabel}. Continuez sur votre lancée !`;
      accent = C.secondary;
    }
  }

  return (
    <View style={[styles.insightBanner, { borderLeftColor: accent }]}>
      <FlameIcon />
      <Text style={[styles.insightText, { color: accent }]}>{message}</Text>
    </View>
  );
}

// ─── KPI strip ───────────────────────────────────────────────────────

interface Kpi {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent: string;
}

function KpiStrip({ kpis }: { kpis: Kpi[] }) {
  return (
    <View style={styles.kpiStrip}>
      {kpis.map((k, i) => (
        <View key={i} style={[styles.kpiCard, i < kpis.length - 1 && styles.kpiCardBorder]}>
          <View style={styles.kpiTop}>{k.icon}</View>
          <Text style={styles.kpiValue}>{k.value}</Text>
          <Text style={[styles.kpiSub, { color: k.accent }]}>{k.sub}</Text>
          <Text style={styles.kpiLabel}>{k.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Longest fast card ───────────────────────────────────────────────

function LongestFastCard({ ms, completionRate }: { ms: number; completionRate: number }) {
  return (
    <View style={styles.longestCard}>
      <View>
        <Text style={styles.longestLabel}>Plus Long Jeûne</Text>
        <Text style={styles.longestValue}>{ms > 0 ? formatDuration(ms) : '—'}</Text>
        <View style={styles.longestMeta}>
          <CheckIcon />
          <Text style={styles.longestMetaText}>
            {completionRate > 0
              ? `${completionRate}% de taux de complétion`
              : 'Aucun jeûne enregistré'}
          </Text>
        </View>
      </View>
      <View style={styles.trophyBadge}>
        <TrophyIcon />
      </View>
    </View>
  );
}

// ─── Bar chart ───────────────────────────────────────────────────────

const BAR_MAX_H = 100;
const GOAL_H = 18;

interface DayBar {
  day: string;
  hours: number;
}

function BarChart({ data, average }: { data: DayBar[]; average: number }) {
  const maxHours = Math.max(...data.map((d) => d.hours), GOAL_H, 1);
  const goalLineH = (GOAL_H / maxHours) * BAR_MAX_H;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>Progression hebdomadaire</Text>
          <View style={styles.chartSubRow}>
            <View style={styles.legendDot} />
            <Text style={styles.chartSub}>Objectif {GOAL_H}h / jour</Text>
          </View>
        </View>
        <View style={styles.avgBadge}>
          <Text style={styles.avgValue}>{average > 0 ? average.toFixed(1) : '0'}h</Text>
          <Text style={styles.avgLabel}>moy/j</Text>
        </View>
      </View>

      {/* Bars with goal line */}
      <View style={styles.chartArea}>
        {/* Dashed goal line */}
        <View style={[styles.goalLine, { bottom: goalLineH + 20 }]}>
          <View style={styles.goalLineDash} />
          <Text style={styles.goalLineLabel}>{GOAL_H}h</Text>
        </View>

        <View style={styles.barsRow}>
          {data.map((d) => {
            const barH = Math.max((d.hours / maxHours) * BAR_MAX_H, d.hours > 0 ? 6 : 2);
            const meetsGoal = d.hours >= GOAL_H;
            const isToday = d.day === dayLabel(new Date());
            return (
              <View key={d.day} style={styles.barCol}>
                {d.hours > 0 && (
                  <Text
                    style={[styles.barValueLabel, { color: meetsGoal ? C.tertiary : C.secondary }]}
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
                        backgroundColor: meetsGoal ? C.tertiary : C.cyan,
                        opacity: d.hours > 0 ? 1 : 0.12,
                      },
                      isToday && styles.barToday,
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, isToday && { color: C.cyan }]}>{d.day}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ─── Heatmap ─────────────────────────────────────────────────────────

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const CELL_GAP = 4;
const CELL_W = (CONTENT_W - 22 - CELL_GAP * 6) / 7; // 22px = left label column

interface HeatCell {
  date: string;
  hours: number;
}

function Heatmap({ cells, startDate }: { cells: HeatCell[]; startDate: Date }) {
  function intensity(hours: number) {
    if (hours === 0) return 0;
    if (hours < 8) return 0.2;
    if (hours < 14) return 0.5;
    if (hours < 18) return 0.75;
    return 1;
  }

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Calendrier d'activité</Text>
        <Text style={styles.heatRange}>
          {startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} – aujourd'hui
        </Text>
      </View>

      <View style={styles.heatContainer}>
        {/* Day labels */}
        <View style={styles.heatDayLabels}>
          {DAY_LABELS.map((d, i) => (
            <Text key={i} style={styles.heatDayLabel}>
              {d}
            </Text>
          ))}
        </View>

        {/* Grid */}
        <View style={styles.heatGrid}>
          {cells.map((cell, i) => {
            const v = intensity(cell.hours);
            const isToday = cell.date === isoDate(new Date());
            return (
              <View
                key={i}
                style={[
                  styles.heatCell,
                  { backgroundColor: v === 0 ? C.primaryContainer : `rgba(69,223,164,${v})` },
                  isToday && styles.heatCellToday,
                ]}
              />
            );
          })}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.heatLegend}>
        <Text style={styles.legendSmall}>Inactif</Text>
        <View style={styles.heatLegendDots}>
          {[0, 0.2, 0.5, 0.75, 1].map((v, i) => (
            <View
              key={i}
              style={[
                styles.heatLegendDot,
                { backgroundColor: v === 0 ? C.primaryContainer : `rgba(69,223,164,${v})` },
              ]}
            />
          ))}
        </View>
        <Text style={styles.legendSmall}>Objectif</Text>
      </View>
    </View>
  );
}

// ─── Recent fasts ────────────────────────────────────────────────────

function completionColor(pct: number): string {
  if (pct >= 100) return C.tertiary;
  if (pct >= 70) return C.secondary;
  return C.onSurfaceVariant;
}

function RecentFastCard({ session }: { session: FastSession }) {
  const [pressed, setPressed] = useState(false);
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

  return (
    <Pressable
      style={[styles.recentCard, pressed && styles.recentCardPressed]}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={() =>
        Alert.alert(
          `Jeûne du ${dateStr}`,
          `Protocole : ${session.protocol}\nDurée : ${ms > 0 ? formatDuration(ms) : `${session.plannedDurationH}h prévu`}\nComplétion : ${pct}%`,
          [{ text: 'OK' }]
        )
      }
    >
      {/* Left: emoji + info */}
      <View style={styles.recentLeft}>
        <View style={styles.recentIconBox}>
          <Text style={{ fontSize: 20 }}>
            {actualH >= 20 ? '🏆' : actualH >= 16 ? '✅' : actualH >= 12 ? '👍' : '⏱️'}
          </Text>
        </View>
        <View style={styles.recentInfo}>
          <Text style={styles.recentDate}>{dateStr}</Text>
          <Text style={styles.recentMeta}>
            {session.protocol} ·{' '}
            {ms > 0 ? formatDuration(ms) : `${session.plannedDurationH}h prévu`}
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
        <ChevronIcon />
      </View>
    </Pressable>
  );
}

function EmptyFasts() {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyIcon}>🌅</Text>
      <Text style={styles.emptyTitle}>Aucun jeûne enregistré</Text>
      <Text style={styles.emptyBody}>
        Démarrez votre premier jeûne depuis l'onglet Fast pour commencer à suivre vos progrès.
      </Text>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────

export default function StatsScreen() {
  const user = useUserStore((s) => s.user);
  const { fastSessions } = useRepositories();

  const [period, setPeriod] = useState<Period>('week');
  const [sessions, setSessions] = useState<FastSession[]>([]);
  const [recent, setRecent] = useState<FastSession[]>([]);

  useEffect(() => {
    if (!user) return;
    fastSessions.findByStatus(user.id, 'completed').then(setSessions);
    fastSessions.findRecentByUserId(user.id, 10).then(setRecent);
  }, [user, fastSessions]);

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

  // Weekly bars (last 7 days)
  const weekBars: DayBar[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = isoDate(d);
    const dayH = sessions
      .filter((s) => s.endedAt && isoDate(new Date(s.startedAt)) === dateStr)
      .reduce((acc, s) => acc + msToHours(durationMs(s)), 0);
    return { day: dayLabel(d), hours: dayH };
  });
  const weekAvg = weekBars.reduce((a, b) => a + b.hours, 0) / 7;

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

  const kpis = [
    {
      icon: <ClockIcon />,
      label: 'Heures',
      value: Math.round(totalH) > 0 ? `${Math.round(totalH)}h` : '—',
      sub: 'total',
      accent: C.secondary,
    },
    {
      icon: <BoltIcon />,
      label: 'Série',
      value: String(streak),
      sub: 'jours',
      accent: C.tertiary,
    },
    {
      icon: <ClockIcon color={C.cyan} />,
      label: 'Moyenne',
      value: avgH > 0 ? `${avgH.toFixed(1)}h` : '—',
      sub: 'par jeûne',
      accent: C.cyan,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* App bar */}
      <View style={styles.appBar}>
        <Text style={styles.appBarBrand}>FastLife</Text>
        <View style={styles.appBarRight}>
          <Text style={styles.appBarTitle}>Statistiques</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <PeriodSelector value={period} onChange={setPeriod} />

        <InsightBanner totalH={totalH} count={completedCount} period={period} />

        <KpiStrip kpis={kpis} />

        <LongestFastCard ms={longestMs} completionRate={completionRate} />

        <BarChart data={weekBars} average={weekAvg} />

        <Heatmap cells={heatCells} startDate={heatStart} />

        {/* Recent fasts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Jeûnes récents</Text>
            <Pressable hitSlop={16}>
              <Text style={styles.seeAll}>Tout voir</Text>
            </Pressable>
          </View>
          {recent.filter((s) => s.status === 'completed').length === 0 ? (
            <EmptyFasts />
          ) : (
            recent
              .filter((s) => s.status === 'completed')
              .slice(0, 5)
              .map((s) => <RecentFastCard key={s.id} session={s} />)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },

  appBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(13,37,71,0.88)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  appBarBrand: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3, color: C.white },
  appBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  appBarTitle: { fontSize: 13, fontWeight: '600', color: C.onSurfaceVariant },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100, gap: 16 },

  // Period selector — full width
  periodRow: {
    flexDirection: 'row',
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.glassBorder,
    borderRadius: 16,
    padding: 4,
  },
  periodBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 13, gap: 4 },
  periodBtnActive: { backgroundColor: C.deepBlue },
  periodText: { fontSize: 13, fontWeight: '600', color: C.onSurfaceVariant },
  periodTextActive: { color: C.white },
  periodDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.cyan },

  // Insight banner
  insightBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.glassBorder,
    borderLeftWidth: 3,
    borderRadius: 14,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  insightText: { fontSize: 13, fontWeight: '500', flex: 1, lineHeight: 18 },

  // KPI strip
  kpiStrip: {
    flexDirection: 'row',
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.glassBorder,
    borderRadius: 20,
  },
  kpiCard: { flex: 1, paddingVertical: 16, paddingHorizontal: 12, alignItems: 'center', gap: 3 },
  kpiCardBorder: { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: C.glassBorderDim },
  kpiTop: { marginBottom: 4 },
  kpiValue: { fontSize: 22, fontWeight: '700', color: C.white, letterSpacing: -0.5 },
  kpiSub: { fontSize: 10, fontWeight: '600' },
  kpiLabel: { fontSize: 10, color: C.onSurfaceVariant, fontWeight: '500', letterSpacing: 0.3 },

  // Longest fast card
  longestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.glassBorder,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  longestLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: C.onSurfaceVariant,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  longestValue: { fontSize: 26, fontWeight: '700', color: C.white, letterSpacing: -0.8 },
  longestMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  longestMetaText: { fontSize: 11, color: C.onSurfaceVariant },
  trophyBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(132,207,255,0.10)',
    borderWidth: 1,
    borderColor: `${C.secondary}30`,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Generic card
  card: {
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.glassBorder,
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: C.white },
  chartSubRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  legendDot: { width: 6, height: 2, borderRadius: 1, backgroundColor: `${C.tertiary}80` },
  chartSub: { fontSize: 11, color: C.onSurfaceVariant },
  avgBadge: { alignItems: 'flex-end' },
  avgValue: { fontSize: 22, fontWeight: '700', color: C.secondary, letterSpacing: -0.5 },
  avgLabel: { fontSize: 10, color: C.onSurfaceVariant, marginTop: 1 },

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
    borderColor: `${C.tertiary}50`,
  },
  goalLineLabel: {
    fontSize: 9,
    color: C.tertiary,
    fontWeight: '600',
    width: 20,
    textAlign: 'right',
  },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: BAR_MAX_H + 36 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  barTrack: { width: '100%', height: BAR_MAX_H, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 6, minHeight: 3 },
  barToday: {
    shadowColor: C.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  barValueLabel: { fontSize: 9, fontWeight: '700', textAlign: 'center' },
  barLabel: { fontSize: 9, color: C.onSurfaceVariant, fontWeight: '500' },

  // Heatmap
  heatRange: { fontSize: 11, color: C.onSurfaceVariant },
  heatContainer: { flexDirection: 'row', gap: 6 },
  heatDayLabels: { gap: CELL_GAP, paddingTop: 1 },
  heatDayLabel: {
    height: CELL_W,
    fontSize: 9,
    color: C.onSurfaceVariant,
    textAlignVertical: 'center',
    lineHeight: CELL_W,
  },
  heatGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: CELL_GAP },
  heatCell: { width: CELL_W, height: CELL_W, borderRadius: 3 },
  heatCellToday: { borderWidth: 1.5, borderColor: C.cyan },
  heatLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  heatLegendDots: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  heatLegendDot: { width: 10, height: 10, borderRadius: 2 },
  legendSmall: { fontSize: 9, color: C.onSurfaceVariant },

  // Recent fasts
  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: C.white },
  seeAll: { fontSize: 12, fontWeight: '600', color: C.secondary },

  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.glassBorder,
    borderRadius: 18,
    padding: 14,
  },
  recentCardPressed: { backgroundColor: 'rgba(13,37,71,0.7)' },
  recentLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  recentIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: C.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  recentInfo: { flex: 1, gap: 3 },
  recentDate: { fontSize: 14, fontWeight: '600', color: C.white },
  recentMeta: { fontSize: 11, color: C.onSurfaceVariant, fontWeight: '500' },
  recentBar: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginTop: 2,
  },
  recentBarFill: { height: '100%', borderRadius: 2 },
  recentRight: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8 },
  recentPct: { fontSize: 12, fontWeight: '700' },

  // Empty state
  emptyCard: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 32,
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.glassBorder,
    borderRadius: 20,
  },
  emptyIcon: { fontSize: 36, marginBottom: 4 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: C.white },
  emptyBody: {
    fontSize: 13,
    color: C.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 20,
  },
});
