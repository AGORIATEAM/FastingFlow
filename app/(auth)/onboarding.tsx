import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { PrimaryButton } from '@/components/ui';
import { Colors, Fonts, Radius, Spacing } from '@/lib/theme';

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
          stroke={`${Colors.secondary}33`}
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
      <Circle cx="12" cy="13" r="8" stroke={Colors.secondary} strokeWidth="1.5" />
      <Path
        d="M12 9v4l2.5 2.5"
        stroke={Colors.secondary}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M10 3h4M12 3v2" stroke={Colors.secondary} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function BiotechIcon() {
  return (
    <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 2v4M7 6l2 2M7 6l-2 2M9 8l1 1M8 9l-1 3 3 3 3-1M10 15l2 5M12 20h3"
        stroke={Colors.tertiary}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="16" cy="10" r="4" stroke={Colors.tertiary} strokeWidth="1.5" />
    </Svg>
  );
}

function PeopleIcon() {
  return (
    <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="7" r="3" stroke={Colors.secondary} strokeWidth="1.5" />
      <Circle cx="16" cy="8" r="2.5" stroke={Colors.tertiary} strokeWidth="1.5" />
      <Path
        d="M3 19c0-3.314 2.686-6 6-6s6 2.686 6 6"
        stroke={Colors.secondary}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M16 13c2.21 0 4 1.79 4 4"
        stroke={Colors.tertiary}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function BoltIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Path d="M13 2L4.5 13.5H11L10.5 22L20 10.5H13.5L13 2z" fill={Colors.tertiary} />
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
        <Text style={styles.timerLabel} maxFontSizeMultiplier={1.3}>
          Heures de jeûne
        </Text>
      </View>
      <View style={styles.floatingBadge}>
        <BoltIcon />
        <Text style={styles.badgeText} maxFontSizeMultiplier={1.3}>
          Cétose
        </Text>
      </View>
    </View>
  );
}

function Slide2Illustration() {
  return (
    <View style={styles.illustrationContainer}>
      <SpinningDashedRing size={ILLUSTRATION_SIZE - 16} />
      <View style={[styles.glassCircle, styles.gapMd]}>
        <BiotechIcon />
        <View style={styles.glassCard}>
          <Text style={styles.cardTitle} maxFontSizeMultiplier={1.3}>
            Autophagie
          </Text>
          <Text style={styles.cardBody} maxFontSizeMultiplier={1.3}>
            Régénération cellulaire active
          </Text>
        </View>
      </View>
    </View>
  );
}

function Slide3Illustration() {
  const avatarColors = [Colors.primaryContainer, Colors.deepBlue, Colors.ring];
  return (
    <View style={styles.illustrationContainer}>
      <SpinningDashedRing size={ILLUSTRATION_SIZE - 16} />
      <View style={[styles.glassCircle, styles.gapLg]}>
        <PeopleIcon />
        <View style={styles.avatarRow}>
          {avatarColors.map((bg, i) => (
            <View
              key={i}
              style={[
                styles.avatar,
                { backgroundColor: bg, marginLeft: i === 0 ? 0 : -12, zIndex: 3 - i },
              ]}
            />
          ))}
          <View style={[styles.avatar, styles.avatarCount, styles.avatarOverlap]}>
            <Text style={styles.avatarCountText} maxFontSizeMultiplier={1.3}>
              +12k
            </Text>
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
      style={[styles.dot, { width, backgroundColor: active ? Colors.secondary : Colors.ring }]}
    />
  );
}

// ─── Main screen ──────────────────────────────────────────────────

export default function OnboardingScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
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

  function handleMomentumEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
    setCurrentIndex(Math.min(Math.max(index, 0), SLIDES.length - 1));
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.blob, styles.blobBottom]} />
      <View style={[styles.blob, styles.blobTop]} />

      {/* Skip */}
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/(tabs)')} hitSlop={16}>
          <Text style={styles.skipText} maxFontSizeMultiplier={1.3}>
            Passer
          </Text>
        </Pressable>
      </View>

      {/* Carousel */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(s) => s.id}
        horizontal
        pagingEnabled
        scrollEnabled={true}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        getItemLayout={(_, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
        style={styles.flex}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: screenWidth }]}>
            <item.Illustration />
            <View style={styles.textBlock}>
              <Text style={styles.title} maxFontSizeMultiplier={1.3}>
                {item.title}
              </Text>
              <Text style={styles.body} maxFontSizeMultiplier={1.3}>
                {item.body}
              </Text>
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

        <PrimaryButton
          label={currentIndex === SLIDES.length - 1 ? 'Commencer →' : 'Suivant →'}
          onPress={goNext}
          style={styles.ctaButton}
        />

        <Text style={styles.stepLabel} maxFontSizeMultiplier={1.3}>
          Étape {currentIndex + 1} sur {SLIDES.length}
        </Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg, overflow: 'hidden' },
  flex: { flex: 1 },
  gapMd: { gap: 12 },
  gapLg: { gap: 16 },

  blob: { position: 'absolute', borderRadius: Radius.full },
  blobBottom: {
    bottom: -96,
    left: -96,
    width: 256,
    height: 256,
    backgroundColor: `${Colors.secondary}1A`,
  },
  blobTop: {
    top: -96,
    right: -96,
    width: 320,
    height: 320,
    backgroundColor: `${Colors.tertiary}0D`,
  },

  header: { paddingTop: 56, paddingHorizontal: Spacing.lg, alignItems: 'flex-end' },
  skipText: {
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.semibold,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },

  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xxl,
  },

  illustrationContainer: {
    width: ILLUSTRATION_SIZE,
    height: ILLUSTRATION_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    position: 'absolute',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: `${Colors.secondary}0D`,
    backgroundColor: `${Colors.secondary}0D`,
  },
  glassCircle: {
    width: 224,
    height: 224,
    borderRadius: Radius.full,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    elevation: 10,
  },

  timerDisplay: {
    fontFamily: Fonts.bold,
    fontSize: 32,
    letterSpacing: -1.5,
    color: Colors.secondary,
  },
  timerLabel: {
    fontFamily: Fonts.semibold,
    fontSize: 11,
    letterSpacing: 1.5,
    color: `${Colors.secondary}99`,
    textTransform: 'uppercase',
  },

  floatingBadge: {
    position: 'absolute',
    top: 12,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
  },
  badgeText: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.onSurface },

  glassCard: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: 12,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
  },
  cardTitle: { fontFamily: Fonts.semibold, fontSize: 18, color: Colors.onSurface },
  cardBody: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },

  avatarRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: Colors.bg },
  avatarOverlap: { marginLeft: -12 },
  avatarCount: {
    backgroundColor: Colors.deepBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCountText: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.secondary },

  textBlock: { alignItems: 'center', gap: 12, paddingHorizontal: Spacing.sm },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 28,
    letterSpacing: -0.5,
    color: Colors.onSurface,
    textAlign: 'center',
    lineHeight: 36,
  },
  body: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },

  footer: {
    paddingBottom: 48,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
  },
  dots: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', marginBottom: 4 },
  dot: { height: 6, borderRadius: Radius.full },

  ctaButton: { alignSelf: 'stretch' },
  stepLabel: { fontFamily: Fonts.semibold, fontSize: 12, color: Colors.mutedText },
});
