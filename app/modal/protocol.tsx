import { useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';

import { useAppSettingsStore } from '@/lib/stores/useAppSettingsStore';
import type { Protocol } from '@/lib/schemas';

const { width: SW } = Dimensions.get('window');

// ─── Design tokens ──────────────────────────────────────────────────
const C = {
  bg: '#050F1D',
  deepBlue: '#0D2547',
  glass: 'rgba(13, 37, 71, 0.45)',
  glassBorder: 'rgba(245, 247, 250, 0.09)',
  secondary: '#84cfff',
  secondaryContainer: '#009ad7',
  tertiary: '#45dfa4',
  tertiaryBright: '#68fcbf',
  primary: '#3DB4F2',
  onSurface: '#e4e2e5',
  onSurfaceVariant: '#c5c6ce',
  primaryContainer: '#0a1f3d',
  white: '#ffffff',
};

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
    accent: '#84cfff',
    highlight: '#84cfff',
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
    accent: '#6ec6ff',
    highlight: '#6ec6ff',
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
    accent: '#45dfa4',
    highlight: '#45dfa4',
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
    accent: '#45dfa4',
    highlight: '#45dfa4',
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
    accent: '#68fcbf',
    highlight: '#68fcbf',
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
    accent: '#68fcbf',
    highlight: '#68fcbf',
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
    accent: '#68fcbf',
    highlight: '#68fcbf',
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
    accent: '#b4c7ed',
    highlight: '#b4c7ed',
    description: 'Définissez votre durée selon votre rythme biologique et vos contraintes du jour.',
    keyBenefit: 'Flexibilité totale',
  },
];

// ─── Icons ───────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={C.onSurface}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="12"
        cy="12"
        r="10"
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

function ArrowIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="#001e2e"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Fasting window visualizer ───────────────────────────────────────

const SEGMENTS = 24;

function FastingWindow({ fastH, eatH, accent }: { fastH: number; eatH: number; accent: string }) {
  if (fastH === 0) {
    return (
      <View style={styles.windowFree}>
        <Text style={[styles.windowFreeText, { color: accent }]}>Durée personnalisée</Text>
      </View>
    );
  }

  const segW = (SW - 40 - 36 - 16) / SEGMENTS; // account for padding + label + gap
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
        <Text style={[styles.windowLabel, { color: accent }]}>{fastH}h</Text>
        {eatH > 0 && <Text style={styles.windowLabelEat}>{eatH}h</Text>}
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
  const [pressed, setPressed] = useState(false);
  const { accent } = meta;

  return (
    <Pressable
      style={[
        styles.card,
        selected && [styles.cardActive, { borderColor: accent, shadowColor: accent }],
        pressed && { transform: [{ scale: 0.985 }] },
      ]}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onSelect}
    >
      {/* Accent glow on selection */}
      {selected && <View style={[styles.cardGlow, { backgroundColor: `${accent}08` }]} />}

      {/* Header row */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          {/* Protocol label */}
          <View
            style={[
              styles.levelPill,
              { backgroundColor: `${accent}18`, borderColor: `${accent}35` },
            ]}
          >
            <Text style={[styles.levelText, { color: accent }]}>{meta.level}</Text>
          </View>
          <Text style={styles.cardTitle}>{meta.title}</Text>
        </View>
        <View style={styles.cardHeaderRight}>
          <DifficultyDots level={meta.difficulty} accent={accent} />
          {selected && <CheckIcon color={accent} />}
        </View>
      </View>

      {/* Fasting window bar */}
      <FastingWindow fastH={meta.fastH} eatH={meta.eatH} accent={accent} />

      {/* Description */}
      <Text style={styles.cardDesc}>{meta.description}</Text>

      {/* Key benefit pill */}
      <View style={[styles.benefitPill, { borderColor: `${accent}25` }]}>
        <View style={[styles.benefitDot, { backgroundColor: accent }]} />
        <Text style={[styles.benefitText, { color: accent }]}>{meta.keyBenefit}</Text>
      </View>
    </Pressable>
  );
}

// ─── Confirm button with proper pressed state ────────────────────────

function ConfirmButton({ onPress, label }: { onPress: () => void; label: string }) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      style={[styles.confirmBtn, pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 }]}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
    >
      <Text style={styles.confirmText}>{label}</Text>
      <ArrowIcon />
    </Pressable>
  );
}

// ─── Back button with pressed state ─────────────────────────────────

function BackButton({ onPress }: { onPress: () => void }) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      style={[styles.backBtn, pressed && { opacity: 0.6 }]}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      hitSlop={16}
    >
      <BackIcon />
    </Pressable>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────

// ─── Free duration picker ────────────────────────────────────────────

const FREE_PRESETS = [8, 12, 16, 20, 24, 36, 48, 60, 72, 96];

function FreeDurationPicker({ value, onChange }: { value: number; onChange: (h: number) => void }) {
  const [minusPressed, setMinusPressed] = useState(false);
  const [plusPressed, setPlusPressed] = useState(false);

  return (
    <View style={styles.freePicker}>
      <Text style={styles.freePickerTitle}>Durée personnalisée</Text>

      {/* Stepper */}
      <View style={styles.freeStepperRow}>
        <Pressable
          style={[styles.freeStepBtn, minusPressed && { opacity: 0.6 }]}
          onPressIn={() => setMinusPressed(true)}
          onPressOut={() => setMinusPressed(false)}
          onPress={() => onChange(Math.max(1, value - 1))}
        >
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M5 12h14" stroke={C.secondary} strokeWidth="2" strokeLinecap="round" />
          </Svg>
        </Pressable>

        <View style={styles.freeStepValue}>
          <Text style={styles.freeStepNum}>{value}</Text>
          <Text style={styles.freeStepUnit}>heures</Text>
        </View>

        <Pressable
          style={[styles.freeStepBtn, plusPressed && { opacity: 0.6 }]}
          onPressIn={() => setPlusPressed(true)}
          onPressOut={() => setPlusPressed(false)}
          onPress={() => onChange(Math.min(96, value + 1))}
        >
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M12 5v14M5 12h14" stroke={C.secondary} strokeWidth="2" strokeLinecap="round" />
          </Svg>
        </Pressable>
      </View>

      {/* Quick presets */}
      <View style={styles.freePresets}>
        {FREE_PRESETS.map((h) => (
          <Pressable
            key={h}
            style={[styles.freePresetChip, value === h && styles.freePresetChipActive]}
            onPress={() => onChange(h)}
          >
            <Text style={[styles.freePresetText, value === h && styles.freePresetTextActive]}>
              {h}h
            </Text>
          </Pressable>
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

  function confirm() {
    setPreferred(selected);
    if (selected === 'free') setFreeDurationH(freeDuration);
    router.back();
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeTop} edges={['top']}>
        {/* App bar */}
        <View style={styles.appBar}>
          <BackButton onPress={() => router.back()} />
          <Text style={styles.appBarTitle}>Protocole de jeûne</Text>
          <View style={{ width: 36 }} />
        </View>
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
          <Text style={styles.heroTitle}>Choisissez{'\n'}votre protocole</Text>
          <Text style={styles.heroSubtitle}>
            La durée de jeûne adaptée à votre niveau et vos objectifs de santé.
          </Text>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendSeg, { backgroundColor: C.secondary }]} />
            <Text style={styles.legendText}>Jeûne</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSeg, { backgroundColor: 'rgba(255,255,255,0.12)' }]} />
            <Text style={styles.legendText}>Alimentation</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.dotsRow}>
              {[1, 2, 3].map((d) => (
                <View
                  key={d}
                  style={[
                    styles.dot,
                    { backgroundColor: d <= 2 ? C.secondary : 'rgba(255,255,255,0.12)' },
                  ]}
                />
              ))}
            </View>
            <Text style={styles.legendText}>Difficulté</Text>
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

        {/* Bottom spacer for fixed button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed confirm button at bottom */}
      <SafeAreaView style={styles.footerArea} edges={['bottom']}>
        <View style={styles.footer}>
          <View style={styles.footerInfo}>
            <Text style={styles.footerLabel}>Sélectionné</Text>
            <Text style={[styles.footerProtocol, { color: selectedMeta?.accent ?? C.secondary }]}>
              {selectedMeta?.title ?? selected}
            </Text>
          </View>
          <ConfirmButton onPress={confirm} label="Confirmer" />
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  safeTop: { backgroundColor: 'rgba(13,37,71,0.92)' },

  appBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(13,37,71,0.92)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  appBarTitle: { fontSize: 15, fontWeight: '600', color: C.onSurface, letterSpacing: 0.1 },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 24 },

  // Blobs
  blobTL: {
    position: 'absolute',
    top: 0,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(0,154,215,0.06)',
  },
  blobBR: {
    position: 'absolute',
    top: 300,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: 'rgba(69,223,164,0.04)',
  },

  // Hero
  hero: { marginBottom: 20, gap: 8 },
  heroTitle: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.8,
    color: C.white,
    lineHeight: 36,
  },
  heroSubtitle: { fontSize: 14, color: C.onSurfaceVariant, lineHeight: 21 },

  // Legend
  legend: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSeg: { width: 20, height: 6, borderRadius: 2 },
  legendText: { fontSize: 11, color: C.onSurfaceVariant },

  // Protocol list
  list: { gap: 10 },

  // Card
  card: {
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.glassBorder,
    borderRadius: 18,
    padding: 16,
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
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  levelText: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },

  cardTitle: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: C.white,
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
  windowLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  windowLabelEat: { fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: '500' },
  windowFree: { paddingVertical: 4 },
  windowFreeText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },

  cardDesc: { fontSize: 13, color: C.onSurfaceVariant, lineHeight: 19 },

  // Benefit pill
  benefitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  benefitDot: { width: 5, height: 5, borderRadius: 3 },
  benefitText: { fontSize: 11, fontWeight: '600' },

  // Fixed footer
  footerArea: { backgroundColor: 'rgba(5,15,29,0.95)' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
    gap: 16,
  },
  footerInfo: { gap: 2 },
  footerLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    color: C.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  footerProtocol: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },

  // Confirm button
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.secondaryContainer,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 99,
    shadowColor: C.secondaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  confirmText: { fontSize: 15, fontWeight: '700', color: '#001e2e' },

  // Free duration picker
  freePicker: {
    backgroundColor: 'rgba(13, 37, 71, 0.6)',
    borderWidth: 1,
    borderColor: `${C.secondary}30`,
    borderTopWidth: 0,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    padding: 16,
    paddingTop: 14,
    gap: 14,
    marginTop: -4,
  },
  freePickerTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: C.secondary,
    textTransform: 'uppercase',
  },
  freeStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(5,15,29,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  freeStepBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  freeStepValue: { alignItems: 'center', gap: 0 },
  freeStepNum: { fontSize: 28, fontWeight: '700', color: C.secondary, letterSpacing: -1 },
  freeStepUnit: { fontSize: 11, color: C.onSurfaceVariant, marginTop: -2 },
  freePresets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  freePresetChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  freePresetChipActive: {
    borderColor: `${C.secondary}50`,
    backgroundColor: `${C.secondary}15`,
  },
  freePresetText: { fontSize: 12, fontWeight: '600', color: C.onSurfaceVariant },
  freePresetTextActive: { color: C.secondary },
});
