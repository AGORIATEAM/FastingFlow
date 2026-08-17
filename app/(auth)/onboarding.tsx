import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Design tokens ────────────────────────────────────────────────
const C = {
  surface: '#131316',
  surfaceContainer: '#1f1f22',
  surfaceVariant: '#343537',
  secondary: '#84cfff',
  tertiary: '#45dfa4',
  onSurface: '#e4e2e5',
  onSurfaceVariant: '#c5c6ce',
  primaryContainer: '#0a1f3d',
  glass: 'rgba(13, 37, 71, 0.55)',
  glassBorder: 'rgba(255,255,255,0.10)',
};

// ─── Spinning ring (RN Animated, no Reanimated) ───────────────────

function SpinningDashedRing({ size }: { size: number }) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  }, [rotation]);

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const r = size / 2 - 8;

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ rotate: spin }] }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`${C.secondary}33`}
          strokeWidth={2}
          strokeDasharray="8 8"
        />
      </Svg>
    </Animated.View>
  );
}

// ─── SVG icons ────────────────────────────────────────────────────

function TimerIcon() {
  return (
    <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="13" r="8" stroke={C.secondary} strokeWidth="1.5" />
      <Path
        d="M12 9v4l2.5 2.5"
        stroke={C.secondary}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M10 3h4M12 3v2" stroke={C.secondary} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function BiotechIcon() {
  return (
    <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 2v4M7 6l2 2M7 6l-2 2M9 8l1 1M8 9l-1 3 3 3 3-1M10 15l2 5M12 20h3"
        stroke={C.tertiary}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="16" cy="10" r="4" stroke={C.tertiary} strokeWidth="1.5" />
    </Svg>
  );
}

function PeopleIcon() {
  return (
    <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="7" r="3" stroke={C.secondary} strokeWidth="1.5" />
      <Circle cx="16" cy="8" r="2.5" stroke={C.tertiary} strokeWidth="1.5" />
      <Path
        d="M3 19c0-3.314 2.686-6 6-6s6 2.686 6 6"
        stroke={C.secondary}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M16 13c2.21 0 4 1.79 4 4"
        stroke={C.tertiary}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── Slide illustrations ──────────────────────────────────────────

const ILLUSTRATION_SIZE = 288;

function Slide1Illustration() {
  return (
    <View style={styles.illustrationContainer}>
      <View style={[styles.outerRing, { width: ILLUSTRATION_SIZE, height: ILLUSTRATION_SIZE }]} />
      <SpinningDashedRing size={ILLUSTRATION_SIZE - 16} />
      <View style={styles.glassCircle}>
        <TimerIcon />
        <Text style={styles.timerDisplay}>16:00</Text>
        <Text style={styles.timerLabel}>Heures de jeûne</Text>
      </View>
      <View style={styles.floatingBadge}>
        <Text style={styles.badgeIcon}>⚡</Text>
        <Text style={styles.badgeText}>Cétose</Text>
      </View>
    </View>
  );
}

function Slide2Illustration() {
  return (
    <View style={styles.illustrationContainer}>
      <SpinningDashedRing size={ILLUSTRATION_SIZE - 16} />
      <View style={[styles.glassCircle, { gap: 12 }]}>
        <BiotechIcon />
        <View style={styles.glassCard}>
          <Text style={styles.cardTitle}>Autophagie</Text>
          <Text style={styles.cardBody}>Régénération cellulaire active</Text>
        </View>
      </View>
    </View>
  );
}

function Slide3Illustration() {
  const avatarColors = [C.primaryContainer, C.surfaceVariant, C.surfaceContainer];
  return (
    <View style={styles.illustrationContainer}>
      <SpinningDashedRing size={ILLUSTRATION_SIZE - 16} />
      <View style={[styles.glassCircle, { gap: 16 }]}>
        <PeopleIcon />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {avatarColors.map((bg, i) => (
            <View
              key={i}
              style={[
                styles.avatar,
                { backgroundColor: bg, marginLeft: i === 0 ? 0 : -12, zIndex: 3 - i },
              ]}
            />
          ))}
          <View style={[styles.avatar, styles.avatarCount, { marginLeft: -12 }]}>
            <Text style={styles.avatarCountText}>+12k</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Slide data ───────────────────────────────────────────────────

const SLIDES = [
  {
    id: 'timer',
    title: 'Suis ton jeûne\nen temps réel',
    body: 'Visualisez chaque étape de votre métabolisme avec une précision médicale.',
    Illustration: Slide1Illustration,
  },
  {
    id: 'science',
    title: 'Comprends ce qui se\npasse dans ton corps',
    body: 'Des données scientifiques sur votre métabolisme, expliquées simplement.',
    Illustration: Slide2Illustration,
  },
  {
    id: 'community',
    title: 'Rejoins une communauté\nmotivante',
    body: 'Plus de 12 000 personnes transforment leur santé avec FastLife.',
    Illustration: Slide3Illustration,
  },
];

// ─── Dot indicator (RN Animated) ─────────────────────────────────

function Dot({ active }: { active: boolean }) {
  const width = useRef(new Animated.Value(active ? 32 : 8)).current;

  useEffect(() => {
    Animated.spring(width, {
      toValue: active ? 32 : 8,
      damping: 16,
      stiffness: 160,
      useNativeDriver: false, // width is not supported by native driver
    }).start();
  }, [active, width]);

  return (
    <Animated.View
      style={[styles.dot, { width, backgroundColor: active ? C.secondary : C.surfaceVariant }]}
    />
  );
}

// ─── Main screen ──────────────────────────────────────────────────

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<(typeof SLIDES)[number]>>(null);

  function goNext() {
    if (currentIndex < SLIDES.length - 1) {
      const next = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setCurrentIndex(next);
    } else {
      router.replace('/(tabs)');
    }
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.blob, styles.blobBottom]} />
      <View style={[styles.blob, styles.blobTop]} />

      {/* Skip */}
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/(tabs)')} hitSlop={16}>
          <Text style={styles.skipText}>Passer</Text>
        </Pressable>
      </View>

      {/* Carousel */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(s) => s.id}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <item.Illustration />
            <View style={styles.textBlock}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
            </View>
          </View>
        )}
      />

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <Dot key={i} active={i === currentIndex} />
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [styles.ctaButton, pressed && { transform: [{ scale: 0.97 }] }]}
          onPress={goNext}
        >
          <Text style={styles.ctaText}>
            {currentIndex === SLIDES.length - 1 ? 'Commencer' : 'Suivant'} →
          </Text>
        </Pressable>

        <Text style={styles.stepLabel}>
          Étape {currentIndex + 1} sur {SLIDES.length}
        </Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.surface, overflow: 'hidden' },
  blob: { position: 'absolute', borderRadius: 999 },
  blobBottom: {
    bottom: -96,
    left: -96,
    width: 256,
    height: 256,
    backgroundColor: `${C.secondary}1A`,
  },
  blobTop: { top: -96, right: -96, width: 320, height: 320, backgroundColor: `${C.tertiary}0D` },

  header: { paddingTop: 56, paddingHorizontal: 20, alignItems: 'flex-end' },
  skipText: {
    color: C.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 32,
  },

  illustrationContainer: {
    width: ILLUSTRATION_SIZE,
    height: ILLUSTRATION_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: `${C.secondary}0D`,
    backgroundColor: `${C.secondary}0D`,
  },
  glassCircle: {
    width: 224,
    height: 224,
    borderRadius: 999,
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: C.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    elevation: 10,
  },

  timerDisplay: { fontSize: 32, fontWeight: '700', letterSpacing: -1.5, color: C.secondary },
  timerLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: `${C.secondary}99`,
    textTransform: 'uppercase',
  },

  floatingBadge: {
    position: 'absolute',
    top: 12,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.glassBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeIcon: { fontSize: 11, color: C.tertiary },
  badgeText: { fontSize: 10, fontWeight: '700', color: C.onSurface },

  glassCard: {
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.glassBorder,
    borderRadius: 12,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  cardTitle: { fontSize: 18, fontWeight: '600', color: C.onSurface },
  cardBody: { fontSize: 13, color: C.onSurfaceVariant, marginTop: 2 },

  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: C.surface },
  avatarCount: {
    backgroundColor: C.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCountText: { fontSize: 10, fontWeight: '700', color: C.secondary },

  textBlock: { alignItems: 'center', gap: 12, paddingHorizontal: 8 },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: C.onSurface,
    textAlign: 'center',
    lineHeight: 36,
  },
  body: {
    fontSize: 16,
    color: C.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },

  footer: { paddingBottom: 48, paddingHorizontal: 20, alignItems: 'center', gap: 16 },
  dots: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 4 },
  dot: { height: 6, borderRadius: 99 },

  ctaButton: {
    width: '100%',
    backgroundColor: '#009ad7',
    paddingVertical: 18,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#009ad7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  ctaText: { fontSize: 18, fontWeight: '600', color: '#001e2e' },
  stepLabel: { fontSize: 12, fontWeight: '600', color: `${C.onSurfaceVariant}99` },
});
