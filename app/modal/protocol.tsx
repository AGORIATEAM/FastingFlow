import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AppHeader } from '@/components/AppHeader';
import { Chip, GlassCard, PressableScale, PrimaryButton } from '@/components/ui';
import type { Protocol } from '@/lib/schemas';
import { useAppSettingsStore } from '@/lib/stores/useAppSettingsStore';
import { Colors, Fonts, Header, Radius, Spacing, Typography } from '@/lib/theme';

// Accent colors without theme tokens — named locally.
/** Intermediate protocol accent (between secondary and tertiary). */
const ACCENT_BLUE_SOFT = '#6ec6ff';
/** Bright late-phase accent (36h+). */
const ACCENT_TERTIARY_BRIGHT = '#68fcbf';
/** Neutral lavender accent for the free protocol. */
const ACCENT_LAVENDER = '#b4c7ed';

/** Threshold (hours) above which prolonged fasts need medical supervision. */
const PROLONGED_FAST_H = 36;

// ─── Protocol metadata (enriched) ───────────────────────────────────

interface ProtocolMeta {
  id: Protocol;
  title: string;
  fastH: number; // fasting hours
  eatH: number; // eating window hours
  difficulty: 1 | 2 | 3 | 4 | 5;
  level: string; // level label
  accent: string; // card accent color
  highlight: string; // tag highlight color
  description: string;
  keyBenefit: string; // one-line benefit
}

const PROTOCOLS: ProtocolMeta[] = [
  {
    id: '16:8',
    title: '16:8',
    fastH: 16,
    eatH: 8,
    difficulty: 1,
    level: 'Débutant',
    accent: Colors.secondary,
    highlight: Colors.secondary,
    description: "Stabilise l'insuline et amorce la lipolyse. Fenêtre d'alimentation de 8h.",
    keyBenefit: 'Autophagie légère · Insuline stable',
  },
  {
    id: '18:6',
    title: '18:6',
    fastH: 18,
    eatH: 6,
    difficulty: 2,
    level: 'Intermédiaire',
    accent: ACCENT_BLUE_SOFT,
    highlight: ACCENT_BLUE_SOFT,
    description: "Prolonge la cétose. Améliore la clarté mentale et la sensibilité à l'insuline.",
    keyBenefit: 'Cétose débutante · Clarté mentale',
  },
  {
    id: '20:4',
    title: '20:4',
    fastH: 20,
    eatH: 4,
    difficulty: 3,
    level: 'Avancé',
    accent: Colors.tertiary,
    highlight: Colors.tertiary,
    description:
      "Stimule l'hormone de croissance. Fenêtre très restreinte pour une régénération profonde.",
    keyBenefit: 'Autophagie active · GH stimulée',
  },
  {
    id: 'OMAD',
    title: 'OMAD',
    fastH: 23,
    eatH: 1,
    difficulty: 4,
    level: 'Expert',
    accent: Colors.tertiary,
    highlight: Colors.tertiary,
    description: '"One Meal A Day". Repos digestif quasi-total, clarté cognitive maximale.',
    keyBenefit: 'Repos digestif · Cétose profonde',
  },
  {
    id: '24h',
    title: '24 heures',
    fastH: 24,
    eatH: 0,
    difficulty: 4,
    level: 'Expert',
    accent: ACCENT_TERTIARY_BRIGHT,
    highlight: ACCENT_TERTIARY_BRIGHT,
    description:
      'Protocole circadien complet. Réinitialisation immunitaire et nettoyage cellulaire intense.',
    keyBenefit: 'Immunité renforcée · Autophagie profonde',
  },
  {
    id: '36h',
    title: '36 heures',
    fastH: 36,
    eatH: 0,
    difficulty: 5,
    level: 'Expert',
    accent: ACCENT_TERTIARY_BRIGHT,
    highlight: ACCENT_TERTIARY_BRIGHT,
    description:
      'Autophagie profonde et activation des gènes de longévité (SIRT1, FOXO3). À encadrer.',
    keyBenefit: 'Gènes de longévité · Régénération intense',
  },
  {
    id: '48h',
    title: '48 heures',
    fastH: 48,
    eatH: 0,
    difficulty: 5,
    level: 'Expert',
    accent: ACCENT_TERTIARY_BRIGHT,
    highlight: ACCENT_TERTIARY_BRIGHT,
    description:
      "Pic maximal d'hormone de croissance et régénération cellulaire complète. Réservé aux jeûneurs expérimentés.",
    keyBenefit: 'Pic HGH · Régénération complète',
  },
  {
    id: 'free',
    title: 'Jeûne libre',
    fastH: 0,
    eatH: 0,
    difficulty: 1,
    level: 'Personnalisé',
    accent: ACCENT_LAVENDER,
    highlight: ACCENT_LAVENDER,
    description: 'Définissez votre durée selon votre rythme biologique et vos contraintes du jour.',
    keyBenefit: 'Flexibilité totale',
  },
];

// ─── Icons ───────────────────────────────────────────────────────────

function CheckIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2a10 10 0 100 20 10 10 0 000-20z"
        fill={color}
        fillOpacity={0.2}
        stroke={color}
        strokeWidth="1.5"
      />
      <Path
        d="M8 12l3 3 5-5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Fasting window visualizer (24 segments) ─────────────────────────

const SEGMENTS = 24;

function FastingWindow({ fastH, eatH, accent }: { fastH: number; eatH: number; accent: string }) {
  const { width } = useWindowDimensions();

  if (fastH === 0) {
    return (
      <View style={styles.windowFree}>
        <Text style={[styles.windowFreeText, { color: accent }]} maxFontSizeMultiplier={1.3}>
          Durée personnalisée
        </Text>
      </View>
    );
  }

  const segW = (width - 40 - 36 - 16) / SEGMENTS; // account for padding + label + gap
  return (
    <View style={styles.windowRow}>
      <View style={styles.windowBars}>
        {Array.from({ length: SEGMENTS }).map((_, i) => {
          const isFasting = i < fastH;
          return (
            <View
              key={i}
              style={[
                styles.windowSegment,
                { width: segW - 1.5 },
                isFasting
                  ? { backgroundColor: accent, opacity: 0.7 + (i / fastH) * 0.3 }
                  : { backgroundColor: 'rgba(255,255,255,0.07)' },
                i === 0 && { borderTopLeftRadius: 3, borderBottomLeftRadius: 3 },
                i === SEGMENTS - 1 && { borderTopRightRadius: 3, borderBottomRightRadius: 3 },
              ]}
            />
          );
        })}
      </View>
      <View style={styles.windowLabels}>
        <Text style={[styles.windowLabel, { color: accent }]} maxFontSizeMultiplier={1.3}>
          {fastH}h
        </Text>
        {eatH > 0 && (
          <Text style={styles.windowLabelEat} maxFontSizeMultiplier={1.3}>
            {eatH}h
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── Difficulty dots ─────────────────────────────────────────────────

function DifficultyDots({ level, accent }: { level: number; accent: string }) {
  return (
    <View style={styles.dotsRow}>
      {[1, 2, 3, 4, 5].map((d) => (
        <View
          key={d}
          style={[styles.dot, { backgroundColor: d <= level ? accent : 'rgba(255,255,255,0.12)' }]}
        />
      ))}
    </View>
  );
}

// ─── Protocol card ───────────────────────────────────────────────────

function ProtocolCard({
  meta,
  selected,
  onSelect,
}: {
  meta: ProtocolMeta;
  selected: boolean;
  onSelect: () => void;
}) {
  const { accent } = meta;

  return (
    <PressableScale
      onPress={onSelect}
      haptic="selection"
      accessibilityLabel={`Protocole ${meta.title}, ${meta.level}`}
      accessibilityState={{ selected }}
    >
      <GlassCard
        style={[
          styles.card,
          selected && [styles.cardActive, { borderColor: accent, shadowColor: accent }],
        ]}
      >
        {/* Accent glow on selection */}
        {selected && <View style={[styles.cardGlow, { backgroundColor: `${accent}08` }]} />}

        {/* Header row */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View
              style={[
                styles.levelPill,
                { backgroundColor: `${accent}18`, borderColor: `${accent}35` },
              ]}
            >
              <Text style={[styles.levelText, { color: accent }]} maxFontSizeMultiplier={1.3}>
                {meta.level}
              </Text>
            </View>
            <Text style={styles.cardTitle} maxFontSizeMultiplier={1.3}>
              {meta.title}
            </Text>
          </View>
          <View style={styles.cardHeaderRight}>
            <DifficultyDots level={meta.difficulty} accent={accent} />
            {selected && <CheckIcon color={accent} />}
          </View>
        </View>

        {/* Fasting window bar */}
        <FastingWindow fastH={meta.fastH} eatH={meta.eatH} accent={accent} />

        {/* Description */}
        <Text style={styles.cardDesc} maxFontSizeMultiplier={1.3}>
          {meta.description}
        </Text>

        {/* Key benefit pill */}
        <View style={[styles.benefitPill, { borderColor: `${accent}25` }]}>
          <View style={[styles.benefitDot, { backgroundColor: accent }]} />
          <Text style={[styles.benefitText, { color: accent }]} maxFontSizeMultiplier={1.3}>
            {meta.keyBenefit}
          </Text>
        </View>
      </GlassCard>
    </PressableScale>
  );
}

// ─── Free duration picker ────────────────────────────────────────────

const FREE_PRESETS = [8, 12, 16, 20, 24, 36, 48, 60, 72, 96];

function FreeDurationPicker({ value, onChange }: { value: number; onChange: (h: number) => void }) {
  return (
    <View style={styles.freePicker}>
      <Text style={styles.freePickerTitle} maxFontSizeMultiplier={1.3}>
        Durée personnalisée
      </Text>

      {/* Stepper */}
      <View style={styles.freeStepperRow}>
        <PressableScale
          onPress={() => onChange(Math.max(1, value - 1))}
          haptic="selection"
          accessibilityLabel="Réduire la durée"
          style={styles.freeStepBtn}
        >
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M5 12h14" stroke={Colors.secondary} strokeWidth="2" strokeLinecap="round" />
          </Svg>
        </PressableScale>

        <View style={styles.freeStepValue}>
          <Text style={styles.freeStepNum} maxFontSizeMultiplier={1.3}>
            {value}
          </Text>
          <Text style={styles.freeStepUnit} maxFontSizeMultiplier={1.3}>
            heures
          </Text>
        </View>

        <PressableScale
          onPress={() => onChange(Math.min(96, value + 1))}
          haptic="selection"
          accessibilityLabel="Augmenter la durée"
          style={styles.freeStepBtn}
        >
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 5v14M5 12h14"
              stroke={Colors.secondary}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </Svg>
        </PressableScale>
      </View>

      {/* Quick presets */}
      <View style={styles.freePresets}>
        {FREE_PRESETS.map((h) => (
          <Chip key={h} label={`${h}h`} selected={value === h} onPress={() => onChange(h)} />
        ))}
      </View>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────

export default function ProtocolPickerModal() {
  const router = useRouter();
  const preferred = useAppSettingsStore((s) => s.preferredProtocol);
  const storedFreeDuration = useAppSettingsStore((s) => s.freeDurationH);
  const setPreferred = useAppSettingsStore((s) => s.setPreferredProtocol);
  const setFreeDurationH = useAppSettingsStore((s) => s.setFreeDurationH);
  const [selected, setSelected] = useState<Protocol>(preferred);
  const [freeDuration, setFreeDuration] = useState(storedFreeDuration);

  const selectedMeta = PROTOCOLS.find((p) => p.id === selected);
  const showHealthWarning =
    (selectedMeta !== undefined && selectedMeta.fastH >= PROLONGED_FAST_H) ||
    (selected === 'free' && freeDuration >= PROLONGED_FAST_H);

  function confirm() {
    setPreferred(selected);
    if (selected === 'free') setFreeDurationH(freeDuration);
    router.back();
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <AppHeader title="Protocole de jeûne" onBack={() => router.back()} />
      </SafeAreaView>

      {/* Scrollable content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Background blobs */}
        <View style={styles.blobTL} />
        <View style={styles.blobBR} />

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle} maxFontSizeMultiplier={1.3}>
            Choisissez{'\n'}votre protocole
          </Text>
          <Text style={styles.heroSubtitle} maxFontSizeMultiplier={1.3}>
            La durée de jeûne adaptée à votre niveau et vos objectifs de santé.
          </Text>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendSeg, { backgroundColor: Colors.secondary }]} />
            <Text style={styles.legendText} maxFontSizeMultiplier={1.3}>
              Jeûne
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSeg, { backgroundColor: 'rgba(255,255,255,0.12)' }]} />
            <Text style={styles.legendText} maxFontSizeMultiplier={1.3}>
              Alimentation
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.dotsRow}>
              {[1, 2, 3].map((d) => (
                <View
                  key={d}
                  style={[
                    styles.dot,
                    { backgroundColor: d <= 2 ? Colors.secondary : 'rgba(255,255,255,0.12)' },
                  ]}
                />
              ))}
            </View>
            <Text style={styles.legendText} maxFontSizeMultiplier={1.3}>
              Difficulté
            </Text>
          </View>
        </View>

        {/* Protocol list */}
        <View style={styles.list}>
          {PROTOCOLS.map((meta) => (
            <View key={meta.id}>
              <ProtocolCard
                meta={meta}
                selected={selected === meta.id}
                onSelect={() => setSelected(meta.id)}
              />
              {/* Duration picker appears inline under 'free' when selected */}
              {meta.id === 'free' && selected === 'free' && (
                <FreeDurationPicker value={freeDuration} onChange={setFreeDuration} />
              )}
            </View>
          ))}
        </View>

        {/* Health warning for prolonged fasts */}
        {showHealthWarning && (
          <GlassCard style={styles.warningCard}>
            <Text accessibilityRole="alert" style={styles.warningText} maxFontSizeMultiplier={1.3}>
              Les jeûnes prolongés (36 h et plus) doivent être encadrés par un professionnel de
              santé.
            </Text>
          </GlassCard>
        )}

        {/* Bottom spacer for fixed button */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Fixed confirm button at bottom */}
      <SafeAreaView style={styles.footerArea} edges={['bottom']}>
        <View style={styles.footer}>
          <View style={styles.footerInfo}>
            <Text style={styles.footerLabel} maxFontSizeMultiplier={1.3}>
              Sélectionné
            </Text>
            <Text
              style={[styles.footerProtocol, { color: selectedMeta?.accent ?? Colors.secondary }]}
              maxFontSizeMultiplier={1.3}
            >
              {selectedMeta?.title ?? selected}
            </Text>
          </View>
          <PrimaryButton label="Confirmer" onPress={confirm} style={styles.confirmBtn} />
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  safeTop: { backgroundColor: Header.bg },

  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl },

  // Blobs
  blobTL: {
    position: 'absolute',
    top: 0,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: Radius.full,
    backgroundColor: `${Colors.secondaryContainer}0F`,
  },
  blobBR: {
    position: 'absolute',
    top: 300,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: Radius.full,
    backgroundColor: `${Colors.tertiary}0A`,
  },

  // Hero
  hero: { marginBottom: Spacing.lg, gap: Spacing.sm },
  heroTitle: {
    fontFamily: Fonts.bold,
    fontSize: 30,
    letterSpacing: -0.8,
    color: Colors.white,
    lineHeight: 36,
  },
  heroSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    lineHeight: 21,
  },

  // Legend
  legend: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSeg: { width: 20, height: 6, borderRadius: 2 },
  legendText: {
    fontFamily: Fonts.regular,
    fontSize: Typography.label,
    color: Colors.onSurfaceVariant,
  },

  // Protocol list
  list: { gap: 10 },

  // Card
  card: {
    borderRadius: 18,
    padding: Spacing.md,
    gap: 12,
    overflow: 'hidden',
  },
  cardActive: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  cardGlow: {
    position: 'absolute',
    inset: 0,
    borderRadius: 18,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardHeaderLeft: { flex: 1, gap: 6 },
  cardHeaderRight: { flexDirection: 'column', alignItems: 'flex-end', gap: 8, marginLeft: 12 },

  // Level pill
  levelPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  levelText: { fontFamily: Fonts.bold, fontSize: 10, letterSpacing: 1 },

  cardTitle: {
    fontFamily: Fonts.bold,
    fontSize: 19,
    letterSpacing: -0.4,
    color: Colors.white,
    lineHeight: 24,
  },

  // Difficulty dots
  dotsRow: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3 },

  // Window bar
  windowRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  windowBars: { flex: 1, flexDirection: 'row', gap: 1.5, height: 10 },
  windowSegment: { height: 10 },
  windowLabels: { flexDirection: 'row', gap: 4 },
  windowLabel: { fontFamily: Fonts.bold, fontSize: Typography.label, letterSpacing: 0.3 },
  windowLabelEat: {
    fontFamily: Fonts.medium,
    fontSize: Typography.label,
    color: 'rgba(255,255,255,0.25)',
  },
  windowFree: { paddingVertical: 4 },
  windowFreeText: { fontFamily: Fonts.semibold, fontSize: 12, letterSpacing: 0.3 },

  cardDesc: {
    fontFamily: Fonts.regular,
    fontSize: Typography.bodySmall,
    color: Colors.onSurfaceVariant,
    lineHeight: 19,
  },

  // Benefit pill
  benefitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  benefitDot: { width: 5, height: 5, borderRadius: 3 },
  benefitText: { fontFamily: Fonts.semibold, fontSize: Typography.label },

  // Health warning
  warningCard: {
    marginTop: Spacing.md,
    borderColor: `${Colors.error}40`,
    backgroundColor: Colors.errorBg,
  },
  warningText: {
    fontFamily: Fonts.medium,
    fontSize: Typography.bodySmall,
    color: Colors.error,
    lineHeight: 19,
  },

  bottomSpacer: { height: 100 },

  // Fixed footer
  footerArea: { backgroundColor: `${Colors.bg}F2` },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Header.borderColor,
    gap: Spacing.md,
  },
  footerInfo: { gap: 2 },
  footerLabel: {
    fontFamily: Fonts.semibold,
    fontSize: Typography.label,
    letterSpacing: 1,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  footerProtocol: { fontFamily: Fonts.bold, fontSize: 17, letterSpacing: -0.3 },
  confirmBtn: { flexShrink: 0 },

  // Free duration picker
  freePicker: {
    backgroundColor: `${Colors.deepBlue}99`,
    borderWidth: 1,
    borderColor: `${Colors.secondary}30`,
    borderTopWidth: 0,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    padding: Spacing.md,
    paddingTop: 14,
    gap: 14,
    marginTop: -4,
  },
  freePickerTitle: {
    fontFamily: Fonts.bold,
    fontSize: Typography.label,
    letterSpacing: 1.5,
    color: Colors.secondary,
    textTransform: 'uppercase',
  },
  freeStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: `${Colors.bg}80`,
    borderWidth: 1,
    borderColor: Header.borderColor,
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  freeStepBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
  },
  freeStepValue: { alignItems: 'center', gap: 0 },
  freeStepNum: {
    fontFamily: Fonts.bold,
    fontSize: 28,
    color: Colors.secondary,
    letterSpacing: -1,
  },
  freeStepUnit: {
    fontFamily: Fonts.regular,
    fontSize: Typography.label,
    color: Colors.onSurfaceVariant,
    marginTop: -2,
  },
  freePresets: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
