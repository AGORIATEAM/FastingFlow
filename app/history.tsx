import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Circle, Path, Svg } from 'react-native-svg';
import { useRouter } from 'expo-router';

import { EmptyState, PressableScale, Screen } from '@/components/ui';
import { useRepositories } from '@/lib/repositories/provider';
import type { FastSession } from '@/lib/schemas';
import { useUserStore } from '@/lib/stores/useUserStore';
import { Colors, Fonts, Header, HitSlop, Radius, Spacing, Typography } from '@/lib/theme';

const HISTORY_LIMIT = 200;

// ─── Formatting helpers ──────────────────────────────────────────────

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function monthKey(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(iso: string): string {
  return capitalize(new Date(iso).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }));
}

function dayLabel(iso: string): string {
  return capitalize(
    new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
  );
}

function actualDurationH(session: FastSession): number {
  if (!session.endedAt) return 0;
  return (new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 3_600_000;
}

function formatDurationH(hours: number): string {
  const totalMinutes = Math.max(0, Math.round(hours * 60));
  const hh = Math.floor(totalMinutes / 60);
  const mm = totalMinutes % 60;
  if (hh === 0) return `${mm} min`;
  if (mm === 0) return `${hh}h`;
  return `${hh}h ${String(mm).padStart(2, '0')}`;
}

function completionRatio(session: FastSession): number {
  if (session.plannedDurationH <= 0) return 0;
  return Math.min(Math.max(actualDurationH(session) / session.plannedDurationH, 0), 1);
}

// ─── Rows ────────────────────────────────────────────────────────────

type HistoryRow =
  | { kind: 'month'; key: string; label: string }
  | { kind: 'session'; key: string; session: FastSession };

function buildRows(sessions: FastSession[]): HistoryRow[] {
  const rows: HistoryRow[] = [];
  let lastMonth: string | null = null;
  for (const session of sessions) {
    const month = monthKey(session.startedAt);
    if (month !== lastMonth) {
      rows.push({ kind: 'month', key: `month-${month}`, label: monthLabel(session.startedAt) });
      lastMonth = month;
    }
    rows.push({ kind: 'session', key: session.id, session });
  }
  return rows;
}

// ─── Icons ───────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={Colors.onSurface}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function HistoryIcon({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={Colors.secondary} strokeWidth="1.5" />
      <Path
        d="M12 7v5l3.5 2"
        stroke={Colors.secondary}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={Colors.mutedText} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Session row ─────────────────────────────────────────────────────

function SessionRow({ session, onPress }: { session: FastSession; onPress: () => void }) {
  const cancelled = session.status === 'cancelled';
  const duration = formatDurationH(actualDurationH(session));
  const ratio = completionRatio(session);
  const barColor = cancelled ? Colors.error : Colors.tertiary;
  const statusLabel = cancelled ? 'annulé' : 'terminé';

  return (
    <PressableScale
      onPress={onPress}
      haptic="light"
      accessibilityLabel={`Jeûne ${session.protocol} du ${dayLabel(session.startedAt)}, ${duration}, ${statusLabel}`}
      style={[styles.sessionRow, cancelled && styles.sessionRowCancelled]}
    >
      <View style={styles.sessionInfo}>
        <View style={styles.sessionTopLine}>
          <Text style={styles.sessionDate} maxFontSizeMultiplier={1.3}>
            {dayLabel(session.startedAt)}
          </Text>
          <Text style={styles.sessionProtocol} maxFontSizeMultiplier={1.3}>
            {session.protocol}
          </Text>
        </View>
        <View style={styles.sessionBottomLine}>
          <Text style={styles.sessionDuration} maxFontSizeMultiplier={1.3}>
            {duration}
          </Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.round(ratio * 100)}%`, backgroundColor: barColor },
              ]}
            />
          </View>
        </View>
      </View>
      <ChevronIcon />
    </PressableScale>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────

export default function HistoryScreen() {
  const router = useRouter();
  const { fastSessions } = useRepositories();
  const user = useUserStore((s) => s.user);

  const [sessions, setSessions] = useState<FastSession[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const recent = await fastSessions.findRecentByUserId(user.id, HISTORY_LIMIT);
    setSessions(recent.filter((s) => s.status !== 'active'));
  }, [fastSessions, user]);

  useEffect(() => {
    let active = true;
    load()
      .catch(() => {
        // Silent failure: the empty state is shown instead.
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load()
      .catch(() => {
        // Silent failure: keep the current list.
      })
      .finally(() => setRefreshing(false));
  }, [load]);

  const rows = buildRows(sessions);

  return (
    <Screen>
      <View style={styles.header}>
        <PressableScale
          onPress={() => router.back()}
          haptic="light"
          accessibilityLabel="Retour"
          hitSlop={HitSlop}
          style={styles.backBtn}
        >
          <BackIcon />
        </PressableScale>
        <Text style={styles.headerTitle} accessibilityRole="header" maxFontSizeMultiplier={1.3}>
          Historique
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={rows}
        keyExtractor={(row) => row.key}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.cyan} />
        }
        renderItem={({ item }) => {
          switch (item.kind) {
            case 'month':
              return (
                <Text
                  style={styles.monthLabel}
                  accessibilityRole="header"
                  maxFontSizeMultiplier={1.3}
                >
                  {item.label}
                </Text>
              );
            case 'session':
              return (
                <SessionRow
                  session={item.session}
                  onPress={() =>
                    router.push({ pathname: '/fast/[id]', params: { id: item.session.id } })
                  }
                />
              );
          }
        }}
        ListEmptyComponent={
          loaded ? (
            <EmptyState
              icon={<HistoryIcon />}
              title="Aucun jeûne terminé"
              body="Vos jeûnes terminés apparaîtront ici. Lancez votre premier jeûne pour commencer."
              style={styles.emptyState}
            />
          ) : null
        }
      />
    </Screen>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    height: Header.height,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    backgroundColor: Header.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Header.borderColor,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Fonts.semibold,
    fontSize: Typography.body + 1,
    color: Colors.white,
  },
  headerSpacer: {
    width: 36,
  },

  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyState: {
    marginTop: Spacing.xxl,
  },

  monthLabel: {
    fontFamily: Fonts.semibold,
    fontSize: Typography.bodySmall,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.mutedText,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },

  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  sessionRowCancelled: {
    opacity: 0.55,
  },
  sessionInfo: {
    flex: 1,
    gap: Spacing.sm,
  },
  sessionTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  sessionDate: {
    fontFamily: Fonts.medium,
    fontSize: Typography.body,
    color: Colors.white,
  },
  sessionProtocol: {
    fontFamily: Fonts.bold,
    fontSize: Typography.label,
    letterSpacing: 1.2,
    color: Colors.secondary,
    textTransform: 'uppercase',
  },
  sessionBottomLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  sessionDuration: {
    fontFamily: Fonts.display,
    fontSize: Typography.bodySmall,
    color: Colors.onSurfaceVariant,
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.ring,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
});
