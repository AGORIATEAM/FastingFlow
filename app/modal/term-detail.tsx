import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Circle, Path, Svg } from 'react-native-svg';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Chip, EmptyState, GlassCard, PressableScale, Screen } from '@/components/ui';
import lexiconRaw from '@/content/lexicon.json';
import { LexiconContentSchema } from '@/lib/schemas';
import { Colors, Fonts, Header, HitSlop, Spacing, TextStyles, Typography } from '@/lib/theme';

// Content is validated once at module load — invalid JSON fails fast in dev.
const LEXICON = LexiconContentSchema.parse(lexiconRaw);

/** Case- and accent-insensitive normalization (NFD, diacritics stripped). */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Accent per activation phase: early secondary, 18-48h tertiary, beyond cyan. */
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

function BookIcon({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V2H6.5A2.5 2.5 0 004 4.5v15z"
        stroke={Colors.secondary}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BodyIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="5" r="2.5" stroke={Colors.tertiary} strokeWidth="1.5" />
      <Path
        d="M12 8v7M12 15l-3.5 6M12 15l3.5 6M6 10.5l6-1.5 6 1.5"
        stroke={Colors.tertiary}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MindIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9.5 3A5.5 5.5 0 004 8.5c0 1.5.5 2.6 1.2 3.6L4 16l3 .5c.6 2 2.4 3.5 4.7 3.5h.8a5.5 5.5 0 005.5-5.5v-3A8 8 0 009.5 3z"
        stroke={Colors.secondary}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 9.5h4M10 12.5h2.5"
        stroke={Colors.secondary}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────

export default function TermDetailModal() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id?: string; name?: string }>();

  const entry = LEXICON.find((candidate) => {
    if (id && candidate.id === id) return true;
    const queries = [id, name].filter((q): q is string => typeof q === 'string' && q.length > 0);
    return queries.some(
      (q) => normalize(q) === candidate.id || normalize(q) === normalize(candidate.name)
    );
  });

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
          Lexique
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {!entry ? (
        <EmptyState
          icon={<BookIcon />}
          title="Terme introuvable"
          body="Ce terme n'existe pas dans le lexique scientifique."
          cta={{ label: 'Retour', onPress: () => router.back() }}
          style={styles.emptyState}
        />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Text style={styles.tag} maxFontSizeMultiplier={1.3}>
              CONCEPT SCIENTIFIQUE
            </Text>
            <Text style={styles.title} accessibilityRole="header" maxFontSizeMultiplier={1.3}>
              {entry.name}
            </Text>
          </View>

          <Text style={styles.definition} maxFontSizeMultiplier={1.3}>
            {entry.definition}
          </Text>

          <GlassCard style={styles.impactCard}>
            <View style={styles.impactHeader}>
              <BodyIcon />
              <Text
                style={[styles.impactLabel, { color: Colors.tertiary }]}
                maxFontSizeMultiplier={1.3}
              >
                IMPACT CORPS
              </Text>
            </View>
            <Text style={styles.impactBody} maxFontSizeMultiplier={1.3}>
              {entry.bodyImpact}
            </Text>
          </GlassCard>

          <GlassCard style={styles.impactCard}>
            <View style={styles.impactHeader}>
              <MindIcon />
              <Text
                style={[styles.impactLabel, { color: Colors.secondary }]}
                maxFontSizeMultiplier={1.3}
              >
                IMPACT ESPRIT
              </Text>
            </View>
            <Text style={styles.impactBody} maxFontSizeMultiplier={1.3}>
              {entry.mindImpact}
            </Text>
          </GlassCard>

          <View style={styles.phasesBlock}>
            <Text style={styles.phasesLabel} maxFontSizeMultiplier={1.3}>
              PHASES D'ACTIVATION
            </Text>
            <View style={styles.phasesRow}>
              {entry.activationPhases.map((phaseId) => (
                <Chip key={phaseId} label={phaseId} selected color={phaseAccent(phaseId)} />
              ))}
            </View>
          </View>
        </ScrollView>
      )}
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
    gap: Spacing.md,
  },

  hero: {
    gap: Spacing.xs,
  },
  tag: {
    fontFamily: Fonts.bold,
    fontSize: 9,
    letterSpacing: 2,
    color: Colors.secondary,
    textTransform: 'uppercase',
  },
  title: {
    ...TextStyles.h1,
  },
  definition: {
    ...TextStyles.body,
    lineHeight: 22,
  },

  impactCard: {
    gap: Spacing.sm,
  },
  impactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  impactLabel: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  impactBody: {
    fontFamily: Fonts.regular,
    fontSize: Typography.bodySmall,
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
  },

  phasesBlock: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  phasesLabel: {
    fontFamily: Fonts.bold,
    fontSize: 9,
    letterSpacing: 1.5,
    color: Colors.mutedText,
    textTransform: 'uppercase',
  },
  phasesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
});
