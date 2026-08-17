import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Circle, Path, Svg } from 'react-native-svg';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { PhaseBadge } from '@/components/fasting/PhaseBadge';
import { ProgressRing } from '@/components/fasting/ProgressRing';
import {
  EmptyState,
  GlassCard,
  PressableScale,
  Screen,
  SectionTitle,
  StatTile,
} from '@/components/ui';
import { useRepositories } from '@/lib/repositories/provider';
import type { FastSession, JournalEntry, PhaseReached } from '@/lib/schemas';
import { Colors, Fonts, Header, HitSlop, Radius, Spacing, Typography } from '@/lib/theme';

const RING_SIZE = 140;

const MOOD_LABELS = ['Stable', 'Énergique', 'Fatigué', 'Concentré', 'Calme'] as const;

// ─── Formatting helpers ──────────────────────────────────────────────

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function fullDateLabel(iso: string): string {
  return capitalize(
    new Date(iso).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  );
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function actualDurationH(session: FastSession): number {
  const end = session.endedAt ? new Date(session.endedAt).getTime() : Date.now();
  return (end - new Date(session.startedAt).getTime()) / 3_600_000;
}

function formatDurationH(hours: number): string {
  const totalMinutes = Math.max(0, Math.round(hours * 60));
  const hh = Math.floor(totalMinutes / 60);
  const mm = totalMinutes % 60;
  if (hh === 0) return `${mm} min`;
  if (mm === 0) return `${hh}h`;
  return `${hh}h ${String(mm).padStart(2, '0')}`;
}

function statusBadge(session: FastSession): { label: string; color: string } {
  switch (session.status) {
    case 'completed':
      return { label: 'Terminé', color: Colors.tertiary };
    case 'cancelled':
      return { label: 'Annulé', color: Colors.error };
    case 'active':
      return { label: 'En cours', color: Colors.cyan };
  }
}

/** Accent per reached phase: early secondary, 18-48h tertiary, beyond cyan. */
function phaseAccent(phaseId: string): string {
  const hours = Number.parseInt(phaseId, 10);
  if (Number.isNaN(hours)) return Colors.secondary;
  if (hours < 18) return Colors.secondary;
  if (hours <= 48) return Colors.tertiary;
  return Colors.cyan;
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

function ClockIcon({ color = Colors.secondary }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
      <Path
        d="M12 7v5l3.5 2"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TargetIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={Colors.cyan} strokeWidth="1.5" />
      <Circle cx="12" cy="12" r="5" stroke={Colors.cyan} strokeWidth="1.5" />
      <Circle cx="12" cy="12" r="1.5" fill={Colors.cyan} />
    </Svg>
  );
}

function CheckIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={Colors.tertiary} strokeWidth="1.5" />
      <Path
        d="M8.5 12.5l2.5 2.5 4.5-5"
        stroke={Colors.tertiary}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DropIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3s6 6.6 6 11a6 6 0 01-12 0c0-4.4 6-11 6-11z"
        stroke={Colors.secondary}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────

type LoadState =
  | { status: 'loading' }
  | { status: 'missing' }
  | {
      status: 'ready';
      session: FastSession;
      phases: PhaseReached[];
      journal: JournalEntry[];
    };

export default function FastDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { fastSessions, phasesReached, journalEntries } = useRepositories();

  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    async function load() {
      if (!id) {
        if (active) setState({ status: 'missing' });
        return;
      }
      const session = await fastSessions.findById(id);
      if (!session) {
        if (active) setState({ status: 'missing' });
        return;
      }
      const [phases, journal] = await Promise.all([
        phasesReached.findByFastSessionId(session.id),
        journalEntries.findByFastSessionId(session.id),
      ]);
      if (active) setState({ status: 'ready', session, phases, journal });
    }
    load().catch(() => {
      if (active) setState({ status: 'missing' });
    });
    return () => {
      active = false;
    };
  }, [id, fastSessions, phasesReached, journalEntries]);

  const header = (
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
        Détail du jeûne
      </Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  if (state.status === 'loading') {
    return <Screen>{header}</Screen>;
  }

  if (state.status === 'missing') {
    return (
      <Screen>
        {header}
        <EmptyState
          icon={<ClockIcon color={Colors.mutedText} />}
          title="Jeûne introuvable"
          body="Cette session n'existe pas ou a été supprimée."
          cta={{ label: 'Retour', onPress: () => router.back() }}
          style={styles.emptyState}
        />
      </Screen>
    );
  }

  const { session, phases, journal } = state;
  const badge = statusBadge(session);
  const actualH = actualDurationH(session);
  const completion =
    session.plannedDurationH > 0 ? Math.min(Math.max(actualH / session.plannedDurationH, 0), 1) : 0;
  const completionPct = Math.round(completion * 100);
  const plannedLabel =
    session.plannedDurationH > 0 ? formatDurationH(session.plannedDurationH) : 'Libre';

  return (
    <Screen>
      {header}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.date} maxFontSizeMultiplier={1.3}>
            {fullDateLabel(session.startedAt)}
          </Text>
          <PhaseBadge label={badge.label} color={badge.color} />
          <ProgressRing progress={completion} size={RING_SIZE} strokeWidth={9}>
            <Text style={styles.ringValue} maxFontSizeMultiplier={1.3}>
              {`${completionPct}%`}
            </Text>
            <Text style={styles.ringLabel} maxFontSizeMultiplier={1.3}>
              COMPLÉTION
            </Text>
          </ProgressRing>
        </View>

        <View style={styles.tilesRow}>
          <StatTile
            icon={<ClockIcon />}
            value={formatDurationH(actualH)}
            label="Durée réelle"
            style={styles.tile}
          />
          <StatTile
            icon={<TargetIcon />}
            value={plannedLabel}
            label="Prévu"
            accent={Colors.cyan}
            style={styles.tile}
          />
          <StatTile
            icon={<CheckIcon />}
            value={`${completionPct}%`}
            label="Complétion"
            accent={Colors.tertiary}
            style={styles.tile}
          />
        </View>

        <View style={styles.block}>
          <SectionTitle title="Phases atteintes" accent={Colors.tertiary} />
          <GlassCard>
            {phases.length === 0 ? (
              <Text style={styles.emptyText} maxFontSizeMultiplier={1.3}>
                Aucune phase métabolique atteinte pendant cette session.
              </Text>
            ) : (
              <View style={styles.phasesWrap}>
                {phases.map((phase) => {
                  const accent = phaseAccent(phase.phaseId);
                  return (
                    <View
                      key={phase.id}
                      style={[styles.phasePill, { borderColor: `${accent}40` }]}
                      accessible
                      accessibilityLabel={`Phase ${phase.phaseId} atteinte à ${timeLabel(phase.reachedAt)}`}
                    >
                      <View
                        style={[styles.phaseDot, { backgroundColor: accent, shadowColor: accent }]}
                      />
                      <Text
                        style={[styles.phasePillHour, { color: accent }]}
                        maxFontSizeMultiplier={1.3}
                      >
                        {phase.phaseId.toUpperCase()}
                      </Text>
                      <Text style={styles.phasePillTime} maxFontSizeMultiplier={1.3}>
                        {timeLabel(phase.reachedAt)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </GlassCard>
        </View>

        <View style={styles.block}>
          <SectionTitle title="Journal de la session" accent={Colors.secondary} />
          {journal.length === 0 ? (
            <GlassCard>
              <Text style={styles.emptyText} maxFontSizeMultiplier={1.3}>
                Aucune entrée de journal pour cette session.
              </Text>
            </GlassCard>
          ) : (
            journal.map((entry) => (
              <GlassCard key={entry.id} style={styles.journalCard}>
                <View style={styles.journalHeader}>
                  <Text style={styles.journalTime} maxFontSizeMultiplier={1.3}>
                    {timeLabel(entry.createdAt)}
                  </Text>
                  <Text style={styles.journalMood} maxFontSizeMultiplier={1.3}>
                    {MOOD_LABELS[entry.mood - 1] ?? '—'}
                  </Text>
                </View>
                <View style={styles.journalWater}>
                  <DropIcon />
                  <Text style={styles.journalWaterText} maxFontSizeMultiplier={1.3}>
                    {`${entry.waterMl} ml d'eau`}
                  </Text>
                </View>
                {entry.text ? (
                  <Text style={styles.journalNote} maxFontSizeMultiplier={1.3}>
                    {entry.text}
                  </Text>
                ) : null}
              </GlassCard>
            ))
          )}
        </View>
      </ScrollView>
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
  emptyState: {
    flex: 1,
  },

  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.section,
  },

  hero: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  date: {
    fontFamily: Fonts.semibold,
    fontSize: Typography.body,
    color: Colors.onSurface,
    textAlign: 'center',
  },
  ringValue: {
    fontFamily: Fonts.display,
    fontSize: 28,
    color: Colors.white,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  ringLabel: {
    fontFamily: Fonts.semibold,
    fontSize: 9,
    letterSpacing: 1.5,
    color: Colors.mutedText,
    marginTop: 2,
  },

  tilesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  tile: {
    flex: 1,
  },

  block: {
    gap: Spacing.sm,
  },
  emptyText: {
    fontFamily: Fonts.regular,
    fontSize: Typography.bodySmall,
    color: Colors.mutedText,
    lineHeight: 19,
  },

  phasesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  phasePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: `${Colors.primaryContainer}60`,
  },
  phaseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 3,
  },
  phasePillHour: {
    fontFamily: Fonts.bold,
    fontSize: Typography.label,
    letterSpacing: 1,
  },
  phasePillTime: {
    fontFamily: Fonts.regular,
    fontSize: Typography.label,
    color: Colors.onSurfaceVariant,
    fontVariant: ['tabular-nums'],
  },

  journalCard: {
    gap: Spacing.sm,
  },
  journalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  journalTime: {
    fontFamily: Fonts.display,
    fontSize: Typography.bodySmall,
    color: Colors.onSurfaceVariant,
    fontVariant: ['tabular-nums'],
  },
  journalMood: {
    fontFamily: Fonts.semibold,
    fontSize: Typography.bodySmall,
    color: Colors.secondary,
  },
  journalWater: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  journalWaterText: {
    fontFamily: Fonts.regular,
    fontSize: Typography.bodySmall,
    color: Colors.onSurfaceVariant,
  },
  journalNote: {
    fontFamily: Fonts.regular,
    fontSize: Typography.bodySmall,
    color: Colors.onSurface,
    lineHeight: 20,
  },
});
