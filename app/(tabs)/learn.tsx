import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Circle, Path, Svg } from 'react-native-svg';

import { AppHeader } from '@/components/AppHeader';
import { Chip, EmptyState, GlassCard, PressableScale, SectionTitle } from '@/components/ui';
import lexiconRaw from '@/content/lexicon.json';
import type { LexiconEntry } from '@/lib/schemas';
import { Colors, Fonts, Header, Radius, Spacing, Typography } from '@/lib/theme';

const lexicon = lexiconRaw as LexiconEntry[];

/** Bright late-phase accent (48h+) — no theme token yet. */
const TERTIARY_BRIGHT = '#68fcbf';

// ─── Phase color map ─────────────────────────────────────────────────
const PHASE_COLORS: Record<string, string> = {
  '12h': Colors.secondary,
  '16h': Colors.secondary,
  '18h': Colors.tertiary,
  '24h': Colors.tertiary,
  '36h': Colors.tertiary,
  '48h': TERTIARY_BRIGHT,
  '56h': TERTIARY_BRIGHT,
  '72h': TERTIARY_BRIGHT,
  '96h': TERTIARY_BRIGHT,
};

// ─── Phase filter (exact phases) ────────────────────────────────────

type PhaseFilter = 'all' | '12h' | '16h' | '18h' | '24h' | '36h' | '48h' | '72h' | '96h';

const PHASE_FILTERS: { id: PhaseFilter; label: string }[] = [
  { id: 'all', label: 'Tout' },
  { id: '12h', label: '12h' },
  { id: '16h', label: '16h' },
  { id: '18h', label: '18h' },
  { id: '24h', label: '24h' },
  { id: '36h', label: '36h' },
  { id: '48h', label: '48h' },
  { id: '72h', label: '72h' },
  { id: '96h', label: '96h' },
];

function matchesFilter(entry: LexiconEntry, filter: PhaseFilter): boolean {
  if (filter === 'all') return true;
  return entry.activationPhases.includes(filter);
}

function activationRange(phases: readonly string[]): string {
  if (!phases.length) return '—';
  const first = phases[0]!;
  const last = phases[phases.length - 1]!;
  return first === last ? first : `${first} – ${last}`;
}

// ─── SVG Icons ──────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={Colors.outline} strokeWidth="1.5" />
      <Path d="M16.5 16.5L21 21" stroke={Colors.outline} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function ClearIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" fill="rgba(255,255,255,0.15)" />
      <Path d="M15 9l-6 6M9 9l6 6" stroke={Colors.white} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function ScienceIcon({ size = 22 }: { size?: number }) {
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
    </Svg>
  );
}

// ─── Featured entry card ─────────────────────────────────────────────

function FeaturedCard({ entry }: { entry: LexiconEntry }) {
  const activation = activationRange(entry.activationPhases);

  return (
    <GlassCard style={styles.featuredCard}>
      <View style={styles.featuredGlow} />

      {/* Header */}
      <View style={styles.featuredHeader}>
        <View style={styles.featuredHeading}>
          <Text style={styles.featuredTag} maxFontSizeMultiplier={1.3}>
            CONCEPT SCIENTIFIQUE
          </Text>
          <Text style={styles.featuredTitle} maxFontSizeMultiplier={1.3}>
            {entry.name}
          </Text>
        </View>
        <View style={styles.scienceBadge}>
          <ScienceIcon />
        </View>
      </View>

      {/* Activation phases */}
      <View style={styles.phaseSection}>
        <Text style={styles.phaseSectionLabel} maxFontSizeMultiplier={1.3}>
          PHASES D'ACTIVATION
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.phasePills}
        >
          {entry.activationPhases.map((phase) => {
            const phaseColor = PHASE_COLORS[phase] ?? Colors.secondary;
            return (
              <View
                key={phase}
                style={[
                  styles.phasePill,
                  { borderColor: `${phaseColor}60`, backgroundColor: `${phaseColor}12` },
                ]}
              >
                <Text
                  style={[styles.phasePillText, { color: phaseColor }]}
                  maxFontSizeMultiplier={1.3}
                >
                  {phase}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Definition */}
      <View style={styles.defSection}>
        <Text style={styles.sectionLabel} maxFontSizeMultiplier={1.3}>
          Définition
        </Text>
        <Text style={styles.featuredDef} maxFontSizeMultiplier={1.3}>
          {entry.definition}
        </Text>
      </View>

      {/* Impact grid */}
      <View style={styles.impactGrid}>
        <View style={styles.impactCell}>
          <Text style={styles.impactLabel} maxFontSizeMultiplier={1.3}>
            IMPACT CORPS
          </Text>
          <Text style={styles.impactBody} maxFontSizeMultiplier={1.3}>
            {entry.bodyImpact}
          </Text>
        </View>
        <View style={styles.impactCell}>
          <Text
            style={[styles.impactLabel, { color: Colors.tertiary }]}
            maxFontSizeMultiplier={1.3}
          >
            IMPACT MENTAL
          </Text>
          <Text style={styles.impactBody} maxFontSizeMultiplier={1.3}>
            {entry.mindImpact}
          </Text>
        </View>
      </View>

      {/* Stats cells */}
      <View style={styles.statsRow}>
        <View style={styles.statCell}>
          <Text style={styles.statLabel} maxFontSizeMultiplier={1.3}>
            ACTIVATION
          </Text>
          <Text style={styles.statValue} maxFontSizeMultiplier={1.3}>
            {activation}
          </Text>
        </View>
        <View style={styles.statCell}>
          <Text style={styles.statLabel} maxFontSizeMultiplier={1.3}>
            IMPACT VITAL
          </Text>
          <Text style={styles.statValue} maxFontSizeMultiplier={1.3}>
            Longévité
          </Text>
        </View>
      </View>
    </GlassCard>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────

export default function LearnScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<PhaseFilter>('all');
  const [featuredId, setFeaturedId] = useState<string>(lexicon[1]?.id ?? lexicon[0]?.id ?? '');

  const filtered = useMemo(() => {
    let result = lexicon;
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (e) => e.name.toLowerCase().includes(q) || e.definition.toLowerCase().includes(q)
      );
    }
    if (timeFilter !== 'all') {
      result = result.filter((e) => matchesFilter(e, timeFilter));
    }
    return result;
  }, [query, timeFilter]);

  const featuredEntry = filtered.find((e) => e.id === featuredId) ?? filtered[0];

  function clearSearch() {
    setQuery('');
    setTimeFilter('all');
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader
        brand
        right={
          <Text style={styles.appBarTitle} maxFontSizeMultiplier={1.3}>
            Apprendre
          </Text>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search bar */}
        <View style={styles.searchWrapper}>
          <SearchIcon />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un concept..."
            placeholderTextColor={Colors.outline}
            value={query}
            onChangeText={setQuery}
            keyboardAppearance="dark"
            autoCorrect={false}
            autoCapitalize="none"
            maxFontSizeMultiplier={1.3}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Effacer">
              <ClearIcon />
            </Pressable>
          )}
        </View>

        {/* Timeline entry card */}
        <PressableScale
          onPress={() => router.push('/learn/timeline')}
          haptic="selection"
          accessibilityLabel="Ouvrir la timeline biochimique"
        >
          <GlassCard deep style={styles.timelineCard}>
            <View style={styles.timelineCardText}>
              <Text style={styles.timelineCardTitle} maxFontSizeMultiplier={1.3}>
                Timeline biochimique
              </Text>
              <Text style={styles.timelineCardSub} maxFontSizeMultiplier={1.3}>
                Le voyage métabolique heure par heure, de 12h à 96h
              </Text>
            </View>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M9 18l6-6-6-6"
                stroke={Colors.secondary}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </Svg>
          </GlassCard>
        </PressableScale>

        {/* Phase filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {PHASE_FILTERS.map((f) => {
            const phaseColor =
              f.id !== 'all' ? (PHASE_COLORS[f.id] ?? Colors.secondary) : Colors.secondaryContainer;
            return (
              <Chip
                key={f.id}
                label={f.label}
                selected={timeFilter === f.id}
                onPress={() => setTimeFilter(f.id)}
                color={phaseColor}
                icon={
                  f.id !== 'all' ? (
                    <View style={[styles.phaseDotSmall, { backgroundColor: phaseColor }]} />
                  ) : undefined
                }
              />
            );
          })}
        </ScrollView>

        {/* Status bar */}
        {(query || timeFilter !== 'all') && (
          <View style={styles.statusBar}>
            <Text style={styles.statusCount} maxFontSizeMultiplier={1.3}>
              {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
            </Text>
            <Pressable onPress={clearSearch} hitSlop={12}>
              <Text style={styles.clearAll} maxFontSizeMultiplier={1.3}>
                Effacer les filtres
              </Text>
            </Pressable>
          </View>
        )}

        <SectionTitle title="Lexique scientifique" />

        {/* Entry selector chips + featured card */}
        {featuredEntry ? (
          <View style={styles.lexiconBlock}>
            {filtered.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.entryChipsRow}
              >
                {filtered.map((e) => (
                  <Chip
                    key={e.id}
                    label={e.name}
                    selected={featuredEntry.id === e.id}
                    onPress={() => setFeaturedId(e.id)}
                  />
                ))}
              </ScrollView>
            )}
            {[featuredEntry].map((entry, i) => (
              <Animated.View key={entry.id} entering={FadeInDown.duration(250).delay(i * 40)}>
                <FeaturedCard entry={entry} />
              </Animated.View>
            ))}
          </View>
        ) : (
          <GlassCard padded={false}>
            <EmptyState
              icon={<ScienceIcon size={40} />}
              title="Aucun terme trouvé"
              body="Essayez un autre terme ou effacez vos filtres pour explorer tous les concepts."
              cta={{ label: 'Effacer les filtres', onPress: clearSearch }}
            />
          </GlassCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },

  appBarTitle: {
    fontFamily: Fonts.semibold,
    fontSize: Typography.bodySmall,
    color: Colors.onSurfaceVariant,
  },

  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.tabBar,
    gap: Spacing.md,
  },

  // Search
  timelineCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  timelineCardText: { flex: 1, gap: 3 },
  timelineCardTitle: {
    color: Colors.white,
    fontFamily: Fonts.semibold,
    fontSize: Typography.body,
  },
  timelineCardSub: {
    color: Colors.mutedText,
    fontFamily: Fonts.regular,
    fontSize: Typography.bodySmall,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.deepBlue}B3`,
    borderWidth: 1,
    borderColor: Header.borderColor,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: Typography.body,
    color: Colors.onSurface,
  },

  // Filters
  filterRow: { gap: Spacing.sm, paddingBottom: 2 },
  phaseDotSmall: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },

  // Status bar
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -4,
  },
  statusCount: {
    fontFamily: Fonts.regular,
    fontSize: Typography.label + 1,
    color: Colors.onSurfaceVariant,
  },
  clearAll: {
    fontFamily: Fonts.semibold,
    fontSize: Typography.label + 1,
    color: Colors.secondary,
  },

  // Lexicon block
  lexiconBlock: { gap: 10 },
  entryChipsRow: { gap: Spacing.sm, paddingBottom: 2 },

  // Featured card
  featuredCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
    overflow: 'hidden',
  },
  featuredGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: `${Colors.secondary}12`,
  },
  featuredHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  featuredHeading: { gap: 3, flex: 1 },
  featuredTag: {
    fontFamily: Fonts.bold,
    fontSize: 9,
    letterSpacing: 2,
    color: Colors.secondary,
    textTransform: 'uppercase',
  },
  featuredTitle: {
    fontFamily: Fonts.bold,
    fontSize: 26,
    letterSpacing: -0.5,
    color: Colors.white,
    lineHeight: 32,
  },
  scienceBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: `${Colors.secondaryContainer}26`,
    borderWidth: 1,
    borderColor: `${Colors.secondary}30`,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // Phase pills
  phaseSection: { gap: 6 },
  phaseSectionLabel: {
    fontFamily: Fonts.bold,
    fontSize: 9,
    letterSpacing: 1.5,
    color: Colors.outline,
    textTransform: 'uppercase',
  },
  phasePills: { gap: 6 },
  phasePill: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  phasePillText: { fontFamily: Fonts.bold, fontSize: Typography.label },

  // Definition
  defSection: { gap: 6 },
  sectionLabel: {
    fontFamily: Fonts.bold,
    fontSize: 9,
    letterSpacing: 1.5,
    color: Colors.secondary,
    textTransform: 'uppercase',
  },
  featuredDef: {
    fontFamily: Fonts.regular,
    fontSize: Typography.bodySmall,
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
  },

  // Impact grid
  impactGrid: { flexDirection: 'row', gap: 10 },
  impactCell: {
    flex: 1,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: Colors.glassBorderDim,
    borderRadius: 14,
    gap: 6,
  },
  impactLabel: {
    fontFamily: Fonts.bold,
    fontSize: 8,
    letterSpacing: 1.5,
    color: Colors.secondary,
    textTransform: 'uppercase',
  },
  impactBody: {
    fontFamily: Fonts.regular,
    fontSize: Typography.label,
    color: Colors.onSurfaceVariant,
    lineHeight: 16,
  },

  // Stats row
  statsRow: { flexDirection: 'row', gap: 10 },
  statCell: {
    flex: 1,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: Colors.glassBorderDim,
    borderRadius: 14,
    gap: 4,
  },
  statLabel: {
    fontFamily: Fonts.bold,
    fontSize: 8,
    letterSpacing: 1.5,
    color: Colors.outline,
    textTransform: 'uppercase',
  },
  statValue: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
    color: Colors.white,
  },
});
