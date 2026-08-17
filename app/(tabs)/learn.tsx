import { useMemo, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Svg, Path, Circle } from 'react-native-svg';

import lexiconRaw from '@/content/lexicon.json';
import type { LexiconEntry } from '@/lib/schemas';

const lexicon = lexiconRaw as LexiconEntry[];
const { width: SW } = Dimensions.get('window');

// ─── Design tokens ──────────────────────────────────────────────────
const C = {
  bg: '#050F1D',
  surface: '#131316',
  deepBlue: '#0D2547',
  glass: 'rgba(13, 37, 71, 0.55)',
  glassBorder: 'rgba(245, 247, 250, 0.10)',
  glassBorderDim: 'rgba(255, 255, 255, 0.06)',
  inputBg: 'rgba(13, 37, 71, 0.7)',
  cyan: '#3DB4F2',
  secondary: '#84cfff',
  tertiary: '#45dfa4',
  secondaryContainer: '#009ad7',
  onSurface: '#e4e2e5',
  onSurfaceVariant: '#c5c6ce',
  outline: '#8e9098',
  primaryContainer: '#0a1f3d',
  white: '#ffffff',
};

// ─── Phase color map ─────────────────────────────────────────────────
const PHASE_COLORS: Record<string, string> = {
  '12h': '#84cfff',
  '16h': '#84cfff',
  '18h': '#45dfa4',
  '24h': '#45dfa4',
  '36h': '#45dfa4',
  '48h': '#68fcbf',
  '56h': '#68fcbf',
  '72h': '#68fcbf',
  '96h': '#68fcbf',
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
      <Circle cx="11" cy="11" r="7" stroke={C.outline} strokeWidth="1.5" />
      <Path d="M16.5 16.5L21 21" stroke={C.outline} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function ClearIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" fill="rgba(255,255,255,0.15)" />
      <Path d="M15 9l-6 6M9 9l6 6" stroke={C.white} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function ScienceIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 3h6M9 3v6l-5 9a1 1 0 00.9 1.45h14.2A1 1 0 0020 18l-5-9V3M9 3h6"
        stroke={C.secondary}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M7.5 15.5h9" stroke={C.secondary} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function ClockIcon({ color }: { color: string }) {
  return (
    <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 7v5l3 2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function EyeIcon({ color }: { color: string }) {
  return (
    <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

// ─── Featured entry card ─────────────────────────────────────────────

function FeaturedCard({ entry }: { entry: LexiconEntry }) {
  const [deepenPressed, setDeepenPressed] = useState(false);
  const activation = activationRange(entry.activationPhases);

  return (
    <View style={styles.featuredCard}>
      <View style={styles.featuredGlow} />

      {/* Header */}
      <View style={styles.featuredHeader}>
        <View style={{ gap: 3, flex: 1 }}>
          <Text style={styles.featuredTag}>CONCEPT SCIENTIFIQUE</Text>
          <Text style={styles.featuredTitle}>{entry.name}</Text>
        </View>
        <View style={styles.scienceBadge}>
          <ScienceIcon />
        </View>
      </View>

      {/* Activation phases */}
      <View style={styles.phaseSection}>
        <Text style={styles.phaseSectionLabel}>PHASES D'ACTIVATION</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.phasePills}
        >
          {entry.activationPhases.map((phase) => (
            <View
              key={phase}
              style={[
                styles.phasePill,
                {
                  borderColor: `${PHASE_COLORS[phase] ?? C.secondary}60`,
                  backgroundColor: `${PHASE_COLORS[phase] ?? C.secondary}12`,
                },
              ]}
            >
              <Text style={[styles.phasePillText, { color: PHASE_COLORS[phase] ?? C.secondary }]}>
                {phase}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Definition */}
      <View style={styles.defSection}>
        <Text style={styles.sectionLabel}>Définition</Text>
        <Text style={styles.featuredDef}>{entry.definition}</Text>
      </View>

      {/* Impact grid */}
      <View style={styles.impactGrid}>
        <View style={styles.impactCell}>
          <Text style={styles.impactLabel}>IMPACT CORPS</Text>
          <Text style={styles.impactBody}>{entry.bodyImpact}</Text>
        </View>
        <View style={styles.impactCell}>
          <Text style={[styles.impactLabel, { color: C.tertiary }]}>IMPACT MENTAL</Text>
          <Text style={styles.impactBody}>{entry.mindImpact}</Text>
        </View>
      </View>

      {/* Stats cells */}
      <View style={styles.statsRow}>
        <View style={styles.statCell}>
          <Text style={styles.statLabel}>ACTIVATION</Text>
          <Text style={styles.statValue}>{activation}</Text>
        </View>
        <View style={styles.statCell}>
          <Text style={styles.statLabel}>IMPACT VITAL</Text>
          <Text style={styles.statValue}>Longévité</Text>
        </View>
      </View>

      {/* CTA */}
      <Pressable
        style={[styles.deepenBtn, deepenPressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
        onPressIn={() => setDeepenPressed(true)}
        onPressOut={() => setDeepenPressed(false)}
      >
        <Text style={styles.deepenBtnText}>Approfondir le sujet</Text>
      </Pressable>
    </View>
  );
}

// ─── Resource card ───────────────────────────────────────────────────

interface Resource {
  id: string;
  tag: string;
  tagColor: string;
  tagBg: string;
  title: string;
  meta: string;
  views: string;
  bgColor: string;
  accentColor: string;
}

const RESOURCES: Resource[] = [
  {
    id: 'guide',
    tag: 'ARTICLE',
    tagColor: '#001e2e',
    tagBg: C.secondary,
    title: 'Le jeûne intermittent : Guide du débutant',
    meta: '8 min',
    views: '12k',
    bgColor: 'rgba(0,154,215,0.15)',
    accentColor: C.secondary,
  },
  {
    id: 'timeline',
    tag: 'TIMELINE',
    tagColor: '#002114',
    tagBg: C.tertiary,
    title: 'Évolution métabolique — Timeline Biochimique',
    meta: '9 phases',
    views: '8k',
    bgColor: 'rgba(69,223,164,0.12)',
    accentColor: C.tertiary,
  },
  {
    id: 'video',
    tag: 'VIDÉO',
    tagColor: '#002114',
    tagBg: C.tertiary,
    title: 'Comprendre le métabolisme en 5 minutes',
    meta: '5:12',
    views: '45k',
    bgColor: 'rgba(69,223,164,0.08)',
    accentColor: C.tertiary,
  },
];

function ResourceCard({ resource }: { resource: Resource }) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      style={[styles.resourceCard, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      <View style={[styles.resourceImg, { backgroundColor: resource.bgColor }]}>
        {/* Gradient overlay top right */}
        <View style={[styles.resourceGlow, { backgroundColor: `${resource.accentColor}15` }]} />
        <View style={[styles.resourceTag, { backgroundColor: resource.tagBg }]}>
          <Text style={[styles.resourceTagText, { color: resource.tagColor }]}>{resource.tag}</Text>
        </View>
      </View>
      <View style={styles.resourceBody}>
        <Text style={styles.resourceTitle} numberOfLines={2}>
          {resource.title}
        </Text>
        <View style={styles.resourceMeta}>
          <View style={styles.resourceMetaItem}>
            <ClockIcon color={C.outline} />
            <Text style={styles.resourceMetaText}>{resource.meta}</Text>
          </View>
          <View style={styles.resourceMetaItem}>
            <EyeIcon color={C.outline} />
            <Text style={styles.resourceMetaText}>{resource.views}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────

export default function LearnScreen() {
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

  // Count per phase filter
  const filterCounts = useMemo(() => {
    const phases: Exclude<PhaseFilter, 'all'>[] = [
      '12h',
      '16h',
      '18h',
      '24h',
      '36h',
      '48h',
      '72h',
      '96h',
    ];
    const counts: Partial<Record<PhaseFilter, number>> = { all: lexicon.length };
    for (const phase of phases) {
      counts[phase] = lexicon.filter((e) => e.activationPhases.includes(phase)).length;
    }
    return counts;
  }, []);

  const featuredEntry = filtered.find((e) => e.id === featuredId) ?? filtered[0];

  function clearSearch() {
    setQuery('');
    setTimeFilter('all');
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* App bar */}
      <View style={styles.appBar}>
        <Text style={styles.appBarBrand}>FastLife</Text>
        <Text style={styles.appBarTitle}>Apprendre</Text>
      </View>

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
            placeholderTextColor={C.outline}
            value={query}
            onChangeText={setQuery}
            keyboardAppearance="dark"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={10}>
              <ClearIcon />
            </Pressable>
          )}
        </View>

        {/* Phase filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {PHASE_FILTERS.map((f) => {
            const active = timeFilter === f.id;
            const phaseColor =
              f.id !== 'all' ? (PHASE_COLORS[f.id] ?? C.secondary) : C.secondaryContainer;
            const count = filterCounts[f.id];
            return (
              <Pressable
                key={f.id}
                style={[
                  styles.filterChip,
                  active && { backgroundColor: `${phaseColor}25`, borderColor: `${phaseColor}70` },
                ]}
                onPress={() => setTimeFilter(f.id)}
              >
                {f.id !== 'all' && (
                  <View style={[styles.phaseDotSmall, { backgroundColor: phaseColor }]} />
                )}
                <Text style={[styles.filterText, active && { color: phaseColor }]}>{f.label}</Text>
                {!active && count !== undefined && count < lexicon.length && (
                  <View style={styles.filterCount}>
                    <Text style={styles.filterCountText}>{count}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Status bar */}
        {(query || timeFilter !== 'all') && (
          <View style={styles.statusBar}>
            <Text style={styles.statusCount}>
              {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
            </Text>
            <Pressable onPress={clearSearch} hitSlop={12}>
              <Text style={styles.clearAll}>Effacer les filtres</Text>
            </Pressable>
          </View>
        )}

        {/* Entry selector chips + featured card */}
        {featuredEntry ? (
          <View style={{ gap: 10 }}>
            {filtered.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.entryChipsRow}
              >
                {filtered.map((e) => (
                  <Pressable
                    key={e.id}
                    style={[styles.entryChip, featuredEntry.id === e.id && styles.entryChipActive]}
                    onPress={() => setFeaturedId(e.id)}
                  >
                    <Text
                      style={[
                        styles.entryChipText,
                        featuredEntry.id === e.id && styles.entryChipTextActive,
                      ]}
                    >
                      {e.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
            <FeaturedCard entry={featuredEntry} />
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🔬</Text>
            <Text style={styles.emptyTitle}>Aucun terme trouvé</Text>
            <Text style={styles.emptyBody}>
              Essayez un autre terme ou effacez vos filtres pour explorer tous les concepts.
            </Text>
            <Pressable style={styles.emptyBtn} onPress={clearSearch}>
              <Text style={styles.emptyBtnText}>Effacer les filtres</Text>
            </Pressable>
          </View>
        )}

        {/* Resources section */}
        <View style={styles.resourcesHeader}>
          <Text style={styles.resourcesTitle}>Ressources</Text>
          <Pressable hitSlop={12}>
            <Text style={styles.resourcesAll}>Voir tout</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.resourcesRow}
          style={{ marginHorizontal: -20 }}
        >
          {RESOURCES.map((r) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
        </ScrollView>
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
  appBarTitle: { fontSize: 13, fontWeight: '600', color: C.onSurfaceVariant },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100, gap: 16 },

  // Search
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: C.onSurface },

  // Filters
  filterRow: { gap: 8, paddingBottom: 2 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.glassBorderDim,
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  filterChipActive: { backgroundColor: C.secondaryContainer, borderColor: C.secondaryContainer },
  filterText: { fontSize: 12, fontWeight: '600', color: C.onSurfaceVariant },
  filterTextActive: { color: '#001e2e' },
  filterCount: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 99,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  filterCountText: { fontSize: 9, fontWeight: '700', color: C.onSurfaceVariant },
  phaseDotSmall: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },

  // Status bar
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -4,
  },
  statusCount: { fontSize: 12, color: C.onSurfaceVariant },
  clearAll: { fontSize: 12, fontWeight: '600', color: C.secondary },

  // Entry chips
  entryChipsRow: { gap: 8, paddingBottom: 2 },
  entryChip: {
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.glassBorderDim,
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  entryChipActive: { borderColor: `${C.secondary}60`, backgroundColor: `${C.secondary}12` },
  entryChipText: { fontSize: 12, fontWeight: '600', color: C.onSurfaceVariant },
  entryChipTextActive: { color: C.secondary },

  // Featured card
  featuredCard: {
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.glassBorder,
    borderRadius: 24,
    padding: 20,
    gap: 16,
    overflow: 'hidden',
  },
  featuredGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(132,207,255,0.07)',
  },
  featuredHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  featuredTag: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    color: C.secondary,
    textTransform: 'uppercase',
  },
  featuredTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: C.white,
    lineHeight: 32,
  },
  scienceBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0,154,215,0.15)',
    borderWidth: 1,
    borderColor: `${C.secondary}30`,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // Phase pills
  phaseSection: { gap: 6 },
  phaseSectionLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: C.outline,
    textTransform: 'uppercase',
  },
  phasePills: { gap: 6 },
  phasePill: {
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  phasePillText: { fontSize: 11, fontWeight: '700' },

  // Definition
  defSection: { gap: 6 },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: C.secondary,
    textTransform: 'uppercase',
  },
  featuredDef: { fontSize: 13, color: C.onSurfaceVariant, lineHeight: 20 },

  // Impact grid
  impactGrid: { flexDirection: 'row', gap: 10 },
  impactCell: {
    flex: 1,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    gap: 6,
  },
  impactLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: C.secondary,
    textTransform: 'uppercase',
  },
  impactBody: { fontSize: 11, color: C.onSurfaceVariant, lineHeight: 16 },

  // Stats row
  statsRow: { flexDirection: 'row', gap: 10 },
  statCell: {
    flex: 1,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    gap: 4,
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: C.outline,
    textTransform: 'uppercase',
  },
  statValue: { fontSize: 14, fontWeight: '600', color: C.white },

  deepenBtn: {
    backgroundColor: C.secondaryContainer,
    paddingVertical: 14,
    borderRadius: 99,
    alignItems: 'center',
    shadowColor: C.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  deepenBtnText: { fontSize: 14, fontWeight: '700', color: C.white },

  // Empty state
  emptyCard: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 36,
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.glassBorder,
    borderRadius: 20,
  },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: C.white },
  emptyBody: {
    fontSize: 13,
    color: C.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: 28,
    lineHeight: 20,
  },
  emptyBtn: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 9,
    backgroundColor: 'rgba(132,207,255,0.12)',
    borderWidth: 1,
    borderColor: `${C.secondary}40`,
    borderRadius: 99,
  },
  emptyBtnText: { fontSize: 13, fontWeight: '600', color: C.secondary },

  // Resources
  resourcesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resourcesTitle: { fontSize: 17, fontWeight: '600', color: C.white },
  resourcesAll: { fontSize: 12, fontWeight: '600', color: C.secondary },
  resourcesRow: { gap: 12, paddingHorizontal: 20 },

  resourceCard: {
    width: SW * 0.62,
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.glassBorder,
    borderRadius: 20,
    overflow: 'hidden',
  },
  resourceImg: { height: 110, justifyContent: 'flex-end', padding: 10, overflow: 'hidden' },
  resourceGlow: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  resourceTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  resourceTagText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  resourceBody: { padding: 14, gap: 8 },
  resourceTitle: { fontSize: 13, fontWeight: '700', color: C.white, lineHeight: 19 },
  resourceMeta: { flexDirection: 'row', gap: 12 },
  resourceMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resourceMetaText: { fontSize: 10, color: C.outline },
});
