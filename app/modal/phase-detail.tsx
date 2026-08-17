import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Circle, Path, Svg } from 'react-native-svg';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { PhaseBadge } from '@/components/fasting/PhaseBadge';
import { Chip, EmptyState, GlassCard, PressableScale, Screen, SectionTitle } from '@/components/ui';
import lexiconRaw from '@/content/lexicon.json';
import phasesRaw from '@/content/phases.json';
import { LexiconContentSchema, PhasesContentSchema } from '@/lib/schemas';
import { Colors, Fonts, Header, HitSlop, Spacing, TextStyles, Typography } from '@/lib/theme';

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

function FlaskIcon({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 3h6M9 3v6l-5 9a1 1 0 00.9 1.45h14.2A1 1 0 0020 18l-5-9V3M9 3h6"
        stroke={Colors.secondary}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M7.5 15.5h9" stroke={Colors.secondary} strokeWidth="1.5" strokeLinecap="round" />
      <Circle cx="12" cy="18" r="1" fill={Colors.secondary} />
    </Svg>
  );
}

// ─── Shared pieces ───────────────────────────────────────────────────

function ModalHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <PressableScale
        onPress={onBack}
        haptic="light"
        accessibilityLabel="Retour"
        hitSlop={HitSlop}
        style={styles.backBtn}
      >
        <BackIcon />
      </PressableScale>
      <Text style={styles.headerTitle} accessibilityRole="header" maxFontSizeMultiplier={1.3}>
        {title}
      </Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

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

// ─── Screen ──────────────────────────────────────────────────────────

export default function PhaseDetailModal() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const phase = PHASES.find((p) => p.id === id);

  if (!phase) {
    return (
      <Screen>
        <ModalHeader title="Phase" onBack={() => router.back()} />
        <EmptyState
          icon={<FlaskIcon />}
          title="Phase introuvable"
          body="Cette phase métabolique n'existe pas ou n'est plus disponible."
          cta={{ label: 'Retour', onPress: () => router.back() }}
          style={styles.emptyState}
        />
      </Screen>
    );
  }

  const accent = phaseAccent(phase.triggerHours);

  return (
    <Screen>
      <ModalHeader title="Détail de la phase" onBack={() => router.back()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <PhaseBadge label={`${phase.triggerHours}H de jeûne`} color={accent} />
          <Text style={styles.title} accessibilityRole="header" maxFontSizeMultiplier={1.3}>
            {phase.title}
          </Text>
        </View>

        <View style={styles.block}>
          <SectionTitle title="Ce qui se passe" accent={Colors.secondary} />
          <GlassCard style={styles.cardList}>
            {phase.whatHappens.map((line) => (
              <BulletLine key={line} text={line} color={Colors.secondary} />
            ))}
          </GlassCard>
        </View>

        <View style={styles.block}>
          <SectionTitle title="Mécanismes" accent={Colors.cyan} />
          <GlassCard style={styles.cardList}>
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
          </GlassCard>
        </View>

        <View style={styles.block}>
          <SectionTitle title="Bienfaits corps" accent={Colors.tertiary} />
          <GlassCard style={styles.cardList}>
            {phase.bodyBenefits.map((benefit) => (
              <BulletLine key={benefit} text={benefit} color={Colors.tertiary} />
            ))}
          </GlassCard>
        </View>

        <View style={styles.block}>
          <SectionTitle title="Bienfaits esprit" accent={Colors.secondary} />
          <GlassCard style={styles.cardList}>
            {phase.mindBenefits.map((benefit) => (
              <BulletLine key={benefit} text={benefit} color={Colors.secondary} />
            ))}
          </GlassCard>
        </View>

        {phase.keyTerms.length > 0 && (
          <View style={styles.block}>
            <SectionTitle title="Termes clés" accent={Colors.secondaryContainer} />
            <View style={styles.termsRow}>
              {phase.keyTerms.map((term) => (
                <Chip
                  key={term}
                  label={TERM_NAME_BY_ID.get(term) ?? term}
                  onPress={() =>
                    router.push({ pathname: '/modal/term-detail', params: { id: term } })
                  }
                />
              ))}
            </View>
          </View>
        )}
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
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  title: {
    ...TextStyles.h1,
  },

  block: {
    gap: Spacing.sm,
  },
  cardList: {
    gap: Spacing.md,
  },

  bulletRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  bulletDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 8,
    flexShrink: 0,
  },
  bulletText: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: Typography.body,
    color: Colors.onSurfaceVariant,
    lineHeight: 21,
  },
  mechanism: {
    gap: 3,
  },
  mechanismName: {
    fontFamily: Fonts.semibold,
    fontSize: Typography.body,
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
    paddingHorizontal: Spacing.xs,
  },
});
