import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Path, Svg } from 'react-native-svg';
import { useRouter } from 'expo-router';

import { Chip, GhostButton, PressableScale, Screen } from '@/components/ui';
import lexiconRaw from '@/content/lexicon.json';
import phasesRaw from '@/content/phases.json';
import { calculateCurrentPhase } from '@/lib/domain/fasting';
import { LexiconContentSchema, PhasesContentSchema } from '@/lib/schemas';
import type { PhaseContent } from '@/lib/schemas';
import { useSessionStore } from '@/lib/stores/useSessionStore';
import {
  Colors,
  Fonts,
  Header,
  HitSlop,
  Radius,
  Spacing,
  TextStyles,
  Typography,
} from '@/lib/theme';

// Content is validated once at module load — invalid JSON fails fast in dev.
const PHASES = PhasesContentSchema.parse(phasesRaw);
const LEXICON = LexiconContentSchema.parse(lexiconRaw);
const TERM_NAME_BY_ID = new Map(LEXICON.map((entry) => [entry.id, entry.name]));

/** Node accent: early phases secondary, 18-48h tertiary, beyond cyan. */
function phaseAccent(triggerHours: number): string {
  if (triggerHours < 18) return Colors.secondary;
  if (triggerHours <= 48) return Colors.tertiary;
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

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <View style={expanded ? styles.chevronUp : null}>
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path
          d="M6 9l6 6 6-6"
          stroke={Colors.onSurfaceVariant}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

// ─── "Tu es ici" marker ──────────────────────────────────────────────

function HereMarker() {
  return (
    <View style={styles.hereMarker} accessible accessibilityLabel="Tu es ici, phase actuelle">
      <View style={styles.hereDot} />
      <Text style={styles.hereText} maxFontSizeMultiplier={1.3}>
        TU ES ICI
      </Text>
    </View>
  );
}

// ─── Bullet line ─────────────────────────────────────────────────────

function BulletLine({ text, color }: { text: string; color: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={[styles.bulletDot, { backgroundColor: color }]} />
      <Text style={styles.bulletText} maxFontSizeMultiplier={1.3}>
        {text}
      </Text>
    </View>
  );
}

// ─── Phase card ──────────────────────────────────────────────────────

interface PhaseCardProps {
  phase: PhaseContent;
  expanded: boolean;
  onToggle: () => void;
  onOpenDetail: () => void;
  onOpenTerm: (term: string) => void;
}

function PhaseCard({ phase, expanded, onToggle, onOpenDetail, onOpenTerm }: PhaseCardProps) {
  const accent = phaseAccent(phase.triggerHours);
  const preview = phase.whatHappens[0] ?? '';

  return (
    <View style={[styles.card, expanded && { borderColor: `${accent}40` }]}>
      <PressableScale
        onPress={onToggle}
        haptic="selection"
        accessibilityLabel={phase.title}
        accessibilityState={{ expanded }}
        hitSlop={HitSlop}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeading}>
            <Text style={[styles.cardHour, { color: accent }]} maxFontSizeMultiplier={1.3}>
              {`${phase.triggerHours}H`}
            </Text>
            <Text style={styles.cardTitle} maxFontSizeMultiplier={1.3}>
              {phase.title}
            </Text>
          </View>
          <ChevronIcon expanded={expanded} />
        </View>
        {!expanded && (
          <Text style={styles.cardPreview} numberOfLines={2} maxFontSizeMultiplier={1.3}>
            {preview}
          </Text>
        )}
      </PressableScale>

      {expanded && (
        <Animated.View entering={FadeInDown.duration(220)} style={styles.expanded}>
          <View style={styles.section}>
            <Text
              style={[styles.sectionLabel, { color: Colors.secondary }]}
              maxFontSizeMultiplier={1.3}
            >
              CE QUI SE PASSE
            </Text>
            {phase.whatHappens.map((line) => (
              <BulletLine key={line} text={line} color={Colors.secondary} />
            ))}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: Colors.cyan }]} maxFontSizeMultiplier={1.3}>
              MÉCANISMES
            </Text>
            {phase.mechanisms.map((mechanism) => (
              <View key={mechanism.name} style={styles.mechanism}>
                <Text style={styles.mechanismName} maxFontSizeMultiplier={1.3}>
                  {mechanism.name}
                </Text>
                <Text style={styles.mechanismDescription} maxFontSizeMultiplier={1.3}>
                  {mechanism.description}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text
              style={[styles.sectionLabel, { color: Colors.tertiary }]}
              maxFontSizeMultiplier={1.3}
            >
              BÉNÉFICES CORPS
            </Text>
            {phase.bodyBenefits.map((benefit) => (
              <BulletLine key={benefit} text={benefit} color={Colors.tertiary} />
            ))}
          </View>

          <View style={styles.section}>
            <Text
              style={[styles.sectionLabel, { color: Colors.secondary }]}
              maxFontSizeMultiplier={1.3}
            >
              BÉNÉFICES ESPRIT
            </Text>
            {phase.mindBenefits.map((benefit) => (
              <BulletLine key={benefit} text={benefit} color={Colors.secondary} />
            ))}
          </View>

          {phase.keyTerms.length > 0 && (
            <View style={styles.section}>
              <Text
                style={[styles.sectionLabel, { color: Colors.mutedText }]}
                maxFontSizeMultiplier={1.3}
              >
                TERMES CLÉS
              </Text>
              <View style={styles.termsRow}>
                {phase.keyTerms.map((term) => (
                  <Chip
                    key={term}
                    label={TERM_NAME_BY_ID.get(term) ?? term}
                    onPress={() => onOpenTerm(term)}
                  />
                ))}
              </View>
            </View>
          )}

          <GhostButton label="Voir le détail" onPress={onOpenDetail} />
        </Animated.View>
      )}
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────

export default function TimelineScreen() {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const activeSession = useSessionStore((s) => s.activeSession);

  const currentPhaseId = useMemo(() => {
    if (!activeSession) return null;
    const elapsedHours = (Date.now() - new Date(activeSession.startedAt).getTime()) / 3_600_000;
    return calculateCurrentPhase(elapsedHours);
  }, [activeSession]);

  // Active session below 12h: the marker sits before the first node.
  const showPreMarker = activeSession !== null && currentPhaseId === null;

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
          Timeline biochimique
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
          L'évolution métabolique de votre corps pendant le jeûne.
        </Text>

        <View style={styles.timeline}>
          <View style={styles.timelineLine} />

          {showPreMarker && (
            <View style={styles.preMarkerRow}>
              <HereMarker />
            </View>
          )}

          {PHASES.map((phase, index) => {
            const accent = phaseAccent(phase.triggerHours);
            const isCurrent = currentPhaseId === phase.id;
            return (
              <Animated.View
                key={phase.id}
                entering={FadeInDown.duration(300).delay(index * 60)}
                style={styles.row}
              >
                <View style={styles.rail}>
                  <View
                    style={[
                      styles.node,
                      { backgroundColor: accent, shadowColor: accent },
                      isCurrent && styles.nodeCurrent,
                    ]}
                  />
                </View>
                <View style={styles.rowBody}>
                  {isCurrent && <HereMarker />}
                  <PhaseCard
                    phase={phase}
                    expanded={expandedId === phase.id}
                    onToggle={() => setExpandedId((prev) => (prev === phase.id ? null : phase.id))}
                    onOpenDetail={() =>
                      router.push({ pathname: '/modal/phase-detail', params: { id: phase.id } })
                    }
                    onOpenTerm={(term) =>
                      router.push({ pathname: '/modal/term-detail', params: { name: term } })
                    }
                  />
                </View>
              </Animated.View>
            );
          })}
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

  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  subtitle: {
    ...TextStyles.body,
    lineHeight: 21,
  },

  timeline: {
    position: 'relative',
    gap: Spacing.md,
  },
  timelineLine: {
    position: 'absolute',
    left: 15,
    top: Spacing.xs,
    bottom: Spacing.xs,
    width: 2,
    borderRadius: 1,
    backgroundColor: `${Colors.cyan}26`,
  },
  row: {
    flexDirection: 'row',
  },
  rail: {
    width: 32,
    alignItems: 'center',
    paddingTop: 22,
  },
  node: {
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  nodeCurrent: {
    width: 16,
    height: 16,
    borderRadius: 8,
    shadowRadius: 9,
  },
  rowBody: {
    flex: 1,
    marginLeft: Spacing.sm,
    gap: Spacing.xs,
  },
  preMarkerRow: {
    marginLeft: 32 + Spacing.sm,
    alignSelf: 'flex-start',
  },

  hereMarker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: `${Colors.cyan}40`,
    backgroundColor: `${Colors.cyan}14`,
  },
  hereDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.cyan,
    shadowColor: Colors.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
    elevation: 4,
  },
  hereText: {
    fontFamily: Fonts.bold,
    fontSize: 9,
    letterSpacing: 2,
    color: Colors.cyan,
  },

  card: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  cardHeading: {
    flex: 1,
    gap: 2,
  },
  cardHour: {
    fontFamily: Fonts.display,
    fontSize: Typography.bodySmall,
    letterSpacing: 1.5,
  },
  cardTitle: {
    fontFamily: Fonts.semibold,
    fontSize: Typography.h3 - 1,
    color: Colors.white,
  },
  cardPreview: {
    marginTop: 6,
    fontFamily: Fonts.regular,
    fontSize: Typography.bodySmall,
    color: Colors.onSurfaceVariant,
    lineHeight: 19,
  },
  chevronUp: {
    transform: [{ rotate: '180deg' }],
  },

  expanded: {
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionLabel: {
    fontFamily: Fonts.bold,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  bulletRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  bulletDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 7,
    flexShrink: 0,
  },
  bulletText: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: Typography.bodySmall,
    color: Colors.onSurfaceVariant,
    lineHeight: 19,
  },
  mechanism: {
    gap: 2,
  },
  mechanismName: {
    fontFamily: Fonts.semibold,
    fontSize: Typography.bodySmall,
    color: Colors.onSurface,
  },
  mechanismDescription: {
    fontFamily: Fonts.regular,
    fontSize: Typography.bodySmall,
    color: Colors.onSurfaceVariant,
    lineHeight: 19,
  },
  termsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
});
